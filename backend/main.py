import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pdfplumber
from sentence_transformers import SentenceTransformer
import numpy as np
import requests
import json
import os
from datetime import datetime
load_dotenv()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


embedder = SentenceTransformer('all-MiniLM-L6-v2')


pdf_chunks = []
pdf_embeddings = []


MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY environment variable not set.")


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


def chunk_text(text, max_length=1000):
    """Split text into smaller chunks"""
    return [text[i:i + max_length] for i in range(0, len(text), max_length)]


@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process a PDF file"""
    global pdf_chunks, pdf_embeddings
    try:
        with pdfplumber.open(file.file) as pdf:
            all_text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())

        if not all_text.strip():
            return {"num_chunks": 0, "error": "No text found in PDF."}


        pdf_chunks = []
        for chunk in all_text.split('\n\n'):
            if chunk.strip():
                pdf_chunks.extend(chunk_text(chunk, max_length=1000))


        pdf_embeddings = embedder.encode(pdf_chunks)
        return {"num_chunks": len(pdf_chunks)}

    except Exception as e:
        return {"num_chunks": 0, "error": str(e)}


@app.post("/ask/")
async def ask_question_stream(question: str = Form(...)):
    """Ask a question about the uploaded PDF with streaming response"""

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


    question_embedding = embedder.encode([question])[0]
    similarities = np.dot(pdf_embeddings, question_embedding)
    top_k = 7
    best_indices = similarities.argsort()[-top_k:][::-1]
    context = "\n".join([pdf_chunks[i] for i in best_indices])
    today = datetime.now().strftime("%Y-%m-%d")


    prompt = (
        f"You are an expert document analyst. Based on the following context from a PDF document, "
        f"provide a well-structured, concise answer to the user's question.\n\n"

        f"FORMATTING REQUIREMENTS:\n"
        f"- Use proper markdown formatting\n"
        f"- For mathematical expressions, use LaTeX syntax:\n"
        f"  * Inline math: $expression$ (e.g., $x^2 + y^2$)\n"
        f"  * Display math: $$expression$$ (e.g., $$\\frac{{a!}}{{b! \\cdot c!}}$$)\n"
        f"- Use **bold text** for emphasis\n"
        f"- Use bullet points for lists\n"
        f"- Use numbered lists for sequential steps\n"
        f"- give proper space between lines for good user view\n"
        f"- Include relevant examples from the context\n"
        f"- Structure with clear headings when appropriate\n\n"


        f"MATH FORMATTING EXAMPLES:\n"
        f"- Factorials: $13!$, $3!$, $4!$\n"
        f"- Fractions: $\\frac{{13!}}{{3! \\cdot 2! \\cdot 4!}}$\n"
        f"- Display formulas: $$\\frac{{13!}}{{3! \\cdot 2! \\cdot 4!}} = 2880$$\n\n"
         f"display formulas in center of screen to make its visibility good"

        f"Today is: {today}\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\n"
        f"Provide a detailed, comprehensive answer following the formatting requirements above:"
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
    """Health check endpoint"""
    return {"message": "PDF Chat API is running with streaming!"}