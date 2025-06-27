import { auth } from "@/auth";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.BACKEND_JWT_SECRET) {
      console.error("BACKEND_JWT_SECRET is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        sub: String(session.user.id || session.user.email),
        email: session.user.email,
        name: session.user.name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      },
      process.env.BACKEND_JWT_SECRET,
      { algorithm: "HS256" }
    );
    console.log("token in server:", token);

    return new Response(token, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("JWT generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
