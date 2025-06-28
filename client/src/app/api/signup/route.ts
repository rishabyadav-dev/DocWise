import { HashPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";
import { UserCreateSchema } from "@/lib/Zodschema/user";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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

  if (!zodCheck.success) {
    return NextResponse.json(
      {
        message: zodCheck.error.errors.map((e) => e.message).join(", "),
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
    const hashedPassword = await HashPassword(password.trim());
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
