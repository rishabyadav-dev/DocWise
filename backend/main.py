from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pdfplumber
from jwt import InvalidTokenError
from optimum.onnxruntime import ORTModelForFeatureExtraction
from transformers import AutoTokenizer
import torch
import numpy as np
import json
import os
from datetime import datetime
import jwt
import psutil
import google.generativeai as genai
import re

load_dotenv()
origins = os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("BACKEND_JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("BACKEND_JWT_SECRET environment variable not set.")
ALGORITHM = "HS256"

security = HTTPBearer()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

genai.configure(api_key=GEMINI_API_KEY)
GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-2.5-pro"
]

current_gemini_index = 0


def get_gemini_model():
    model_name = GEMINI_MODELS[current_gemini_index]
    print(f"Using Gemini model: {model_name}")

    return genai.GenerativeModel(GEMINI_MODELS[current_gemini_index])


embedder_model = ORTModelForFeatureExtraction.from_pretrained(
    "./onnx_model",
    provider="CPUExecutionProvider"
)
embedder_tokenizer = AutoTokenizer.from_pretrained("./onnx_model")

pdf_chunks = []
pdf_embeddings = []


def log_memory_usage():
    process = psutil.Process(os.getpid())
    print(f"Memory usage: {process.memory_info().rss / 1024 ** 2:.2f} MB")


def encode_texts(texts, batch_size=64):
    if isinstance(texts, str):
        texts = [texts]
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        inputs = embedder_tokenizer(
            batch,
            padding=True,
            truncation=True,
            return_tensors="pt",
            max_length=512
        )
        with torch.no_grad():
            outputs = embedder_model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1)
        all_embeddings.append(embeddings.detach().cpu().numpy())
    log_memory_usage()
    return np.vstack(all_embeddings)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        if not credentials.credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No token provided",
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def ensure_code_block_spacing(text: str) -> str:
    text = re.sub(r'[ \t]*```', r'\n```\n', text)
    text = re.sub(r'\n{3,}', r'\n\n', text)
    text = re.sub(r'([^\n])\n```', r'\1\n\n```', text)
    text = re.sub(r'```\n([^\n])', r'```\n\n\1', text)
    return text


def stream_gemini_response(prompt):
    global current_gemini_index
    for attempt in range(len(GEMINI_MODELS)):
        model = get_gemini_model()
        try:
            response = model.generate_content(
                prompt,
                stream=True,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=2000,
                )
            )
            for chunk in response:
                finish_reason = getattr(chunk, "finish_reason", None)
                if finish_reason == 2:
                    current_gemini_index = (
                        current_gemini_index + 1) % len(GEMINI_MODELS)
                    break
                if hasattr(chunk, "text") and chunk.text:
                    # Don't apply code block spacing to individual chunks as it breaks code blocks
                    yield f"data: {json.dumps({'content': chunk.text})}\n\n"
            else:
                yield f"data: [DONE]\n\n"
                return
        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                current_gemini_index = (
                    current_gemini_index + 1) % len(GEMINI_MODELS)
                continue
            else:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield f"data: [DONE]\n\n"
                return
    yield f"data: {json.dumps({'error': 'All Gemini models are rate-limited or unavailable.'})}\n\n"
    yield f"data: [DONE]\n\n"


def generate_gemini_text(prompt, max_tokens=2000):
    global current_gemini_index
    for attempt in range(len(GEMINI_MODELS)):
        model = get_gemini_model()
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=max_tokens,
                )
            )
            finish_reason = None
            if hasattr(response, "candidates") and response.candidates:
                finish_reason = getattr(
                    response.candidates[0], "finish_reason", None)
            if finish_reason == 2:
                current_gemini_index = (
                    current_gemini_index + 1) % len(GEMINI_MODELS)
                continue
            if hasattr(response, "text") and response.text:
                return ensure_code_block_spacing(response.text.strip())
            return f"Error: No valid response from Gemini. Finish reason: {finish_reason}"
        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                current_gemini_index = (
                    current_gemini_index + 1) % len(GEMINI_MODELS)
                continue
            else:
                return f"Error generating response: {str(e)}"
    return "All Gemini models are currently rate-limited or unavailable."


def chunk_text(text, max_length=2000, overlap=100):
    chunks = []
    start = 0

    while start < len(text):
        end = start + max_length

        if end < len(text):
            for i in range(end - 200, end):
                if i > start and text[i] in '.!?':
                    end = i + 1
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap

    return chunks


@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...), token_data: dict = Depends(verify_token)):
    global pdf_chunks, pdf_embeddings
    try:
        with pdfplumber.open(file.file) as pdf:
            all_text = "\n".join(page.extract_text()
                                 for page in pdf.pages if page.extract_text())

        if not all_text.strip():
            return JSONResponse({"num_chunks": 0, "error": "No text found in PDF."})

        pdf_chunks = []
        paragraphs = all_text.split('\n\n')

        current_chunk = ""
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            if len(current_chunk) + len(paragraph) > 2000 and current_chunk:
                pdf_chunks.extend(chunk_text(
                    current_chunk, max_length=2000, overlap=100))
                current_chunk = paragraph
            else:
                current_chunk += "\n\n" + paragraph if current_chunk else paragraph

        if current_chunk:
            pdf_chunks.extend(chunk_text(
                current_chunk, max_length=2000, overlap=100))

        pdf_embeddings = encode_texts(pdf_chunks)

        context = "\n".join(pdf_chunks[:5])

        summary_prompt = f"Provide a clear, concise 2 sentence summary of this document:\n\n{context}"
        summary = generate_gemini_text(summary_prompt, max_tokens=150)

        questions_prompt = (
            f"Generate exactly 5 simple questions about this document. "
            f"Return only the questions as plain text, one per line, no formatting, no numbers:\n\n{context}"
        )
        questions_text = generate_gemini_text(questions_prompt, max_tokens=200)
        questions_list = [q.strip() for q in questions_text.split(
            '\n') if q.strip() and '?' in q][:5]

        return JSONResponse({
            "num_chunks": len(pdf_chunks),
            "summary": summary,
            "suggested_questions": questions_list
        })

    except Exception as e:
        return JSONResponse({"num_chunks": 0, "error": str(e)})


@app.post("/ask/")
async def ask_question_stream(question: str = Form(...), token_data: dict = Depends(verify_token)):
    def create_error_stream(message):
        yield f"data: {json.dumps({'content': message})}\n\n"
        yield f"data: [DONE]\n\n"

    if not pdf_chunks:
        return StreamingResponse(
            create_error_stream(
                "No PDF uploaded yet. Please upload a PDF first."),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/plain; charset=utf-8"
            }
        )

    question_embedding = encode_texts([question])[0]
    similarities = np.dot(pdf_embeddings, question_embedding)
    top_k = 7
    best_indices = similarities.argsort()[-top_k:][::-1]
    context = "\n".join([pdf_chunks[i] for i in best_indices])
    today = datetime.now().strftime("%Y-%m-%d")

    prompt = (
        f"# 📝 Expert Document Analyst\n\n"
        f"➡️ **Answer the user's question strictly using only the provided PDF context.**\n"
        f"🚫 *Do NOT include any information not present in the context.*\n\n"
        f"---\n"
        f"## ✨ Formatting Guidelines\n"
        f"- Write concisely and get straight to the point\n"
        f"- Use markdown headings (## for main sections, ### for subsections)\n"
        f"- Use **bold** for key terms and emphasis\n"
        f"- Keep your response focused, maximum 2000 tokens\n"
        f"- Use bullet points (•) for lists - keep them short and impactful\n"
        f"- Use numbered lists (1., 2., 3.) for step-by-step processes\n"
        f"- For math, use LaTeX: inline as $...$ or display as $$...$$\n"
        f"- Include relevant examples from the context when helpful\n"
        f"- Write in clear, professional paragraphs without excessive spacing\n"
        f"- For code blocks: Start with ``` on its own line, add language, then code, then ``` on its own line\n"
        f"- Avoid redundant information and filler text\n"
        f"- Use section breaks strategically, not excessively\n"
        f"- Add relevant emojis sparingly to highlight key points\n\n"
        f"---\n"
        f"## 📄 Context\n"
        f"{context}\n\n"
        f"## ❓ Question\n"
        f"{question}\n\n"
        f"---\n"
        f"💡 *Provide a well-structured, concise answer that maximizes information density while remaining clear and professional.*"
    )

    return StreamingResponse(
        stream_gemini_response(prompt),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/plain; charset=utf-8"
        }
    )


@app.get("/")
async def root():
    """Health check endpoint - no authentication required"""
    return {"message": "PDF Chat API is running with ONNX optimization and Gemini Flash!"}
