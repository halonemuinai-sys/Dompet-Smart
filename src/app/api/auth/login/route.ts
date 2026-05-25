import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { username, pin } = await request.json();

    if (!username || !pin) {
      return NextResponse.json(
        { status: "error", message: "Username dan PIN wajib diisi!" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        username,
        pin,
      },
    });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Username atau PIN salah!" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      status: "success",
      username: user.username,
      role: user.role,
    });

    // Set HTTP-only session cookie (expired in 30 days)
    response.cookies.set("wallet_session", user.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
