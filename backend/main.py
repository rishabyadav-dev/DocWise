from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pdfplumber
from jwt import InvalidTokenError
from optimum.onnxruntime import ORTModelForFeatureExtraction
from transformers import AutoTokenizer
import torch
import numpy as np
import requests
import json
import os
from datetime import datetime
import jwt
import psutil  

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

embedder_model = ORTModelForFeatureExtraction.from_pretrained(
    "./onnx_model",  
    provider="CPUExecutionProvider"
)
embedder_tokenizer = AutoTokenizer.from_pretrained("./onnx_model")

pdf_chunks = []
pdf_embeddings = []

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY environment variable not set.")

def log_memory_usage():
    process = psutil.Process(os.getpid())
    print(f"Memory usage: {process.memory_info().rss / 1024 ** 2:.2f} MB")

def encode_texts(texts, batch_size=64):  #
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

def stream_mistral_response(prompt, model="mistral-large-latest", max_tokens=2000):
    """Stream response from Mistral AI API"""
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": [
            {"role": "system",
             "content": "You are a helpful assistant that answers questions based only on the provided context from a PDF document. Provide detailed, accurate answers."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": 0.2,
        "stream": True
    }

    try:
        response = requests.post(url, headers=headers, json=data, stream=True)
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]
                    if data_str.strip() == '[DONE]':
                        break
                    try:
                        chunk_data = json.loads(data_str)
                        if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                            delta = chunk_data['choices'][0].get('delta', {})
                            if 'content' in delta:
                                yield f"data: {json.dumps({'content': delta['content']})}\n\n"
                    except json.JSONDecodeError:
                        continue

        yield f"data: [DONE]\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield f"data: [DONE]\n\n"

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
            all_text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())

        if not all_text.strip():
            return {"num_chunks": 0, "error": "No text found in PDF."}

        pdf_chunks = []
        paragraphs = all_text.split('\n\n')

        current_chunk = ""
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            if len(current_chunk) + len(paragraph) > 2000 and current_chunk:
                pdf_chunks.extend(chunk_text(current_chunk, max_length=2000, overlap=100))
                current_chunk = paragraph
            else:
                current_chunk += "\n\n" + paragraph if current_chunk else paragraph

        if current_chunk:
            pdf_chunks.extend(chunk_text(current_chunk, max_length=2000, overlap=100))

        pdf_embeddings = encode_texts(pdf_chunks)
        return {"num_chunks": len(pdf_chunks)}

    except Exception as e:
        return {"num_chunks": 0, "error": str(e)}

@app.post("/ask/")
async def ask_question_stream(question: str = Form(...), token_data: dict = Depends(verify_token)):
    def create_error_stream(message):
        yield f"data: {json.dumps({'content': message})}\n\n"
        yield f"data: [DONE]\n\n"

    if not pdf_chunks:
        return StreamingResponse(
            create_error_stream("No PDF uploaded yet. Please upload a PDF first."),
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
        f"- Use markdown headings (with **bold** for section titles)\n"
        f"- Use **bold** for emphasis\n"
        f"- Use bullet points (•) and numbered lists (1., 2., 3.)\n"
        f"- For math, use LaTeX: inline as $...$, display as $$...$$ (centered)\n"
        f"- Add relevant examples from the context\n"
        f"- Use good spacing between sections\n"
        f"- Add emojis to highlight important info\n\n"
        f"---\n"
        f"## 🧮 Math Formatting Examples\n"
        f"- Inline: $x^2 + y^2$\n"
        f"- Display: $$\\frac{{a!}}{{b! \\cdot c!}}$$\n"
        f"- Factorials: $13!$, $3!$, $4!$\n"
        f"- Fractions: $\\frac{{13!}}{{3! \\cdot 2! \\cdot 4!}}$\n"
        f"- Display: $$\\frac{{13!}}{{3! \\cdot 2! \\cdot 4!}} = 2880$$\n\n"
        f" {today}\n\n"
        f"---\n"
        f"## 📄 Context\n"
        f"{context}\n\n"
        f"## ❓ Question\n"
        f"{question}\n\n"
        f"---\n"
        f"💡 *Please provide a well-structured, concise, and visually appealing answer following the above formatting.*"
    )

    return StreamingResponse(
        stream_mistral_response(prompt),
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
    return {"message": "PDF Chat API is running with ONNX optimization!"}