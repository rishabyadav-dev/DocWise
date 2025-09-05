import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "PDF Chat API is running with ONNX optimization and Gemini Flash!"
  });
}
