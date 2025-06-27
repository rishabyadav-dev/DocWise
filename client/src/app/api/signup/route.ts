import { HashPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const UserCreateSchema = z.object({
  name: z.string().min(3, "Name must be at least 2 characters"),
  email: z.string().min(6, "Invalid email!"),
  password: z.string().min(6, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const {
    email,
    password,
    name,
  }: { email: string; password: string; name: string } = await req.json();
  const normalizedEmail = email.trim().toLowerCase();
  const zodCheck = UserCreateSchema.safeParse({
    email: normalizedEmail,
    password: password.trim(),
    name: name.trim(),
  });

  if (zodCheck.error) {
    console.log("zod error:", zodCheck.error);
    return NextResponse.json(
      {
        message: `${zodCheck.error}`,
      },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser)
      return NextResponse.json(
        { message: "User already exists!,try logging in." },
        { status: 409 }
      );
    const hashedPassword = await HashPassword(password);
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
      },
    });

    return NextResponse.json({ message: "Registration successfull✅" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        console.log("error:", error.code);

        return NextResponse.json(
          {
            error: "AccountConflict",
            message: "User already exists!,try logging in.",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Registration failed. Please try again later.",
        error: "InternalError",
      },
      { status: 500 }
    );
  }
}
