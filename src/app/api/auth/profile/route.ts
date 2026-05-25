import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const cookiesHeader = request.headers.get("cookie") || "";
    const walletSession = cookiesHeader
      .split(";")
      .find((c) => c.trim().startsWith("wallet_session="))
      ?.split("=")[1];

    if (!walletSession) {
      return NextResponse.json(
        { status: "error", message: "Sesi tidak ditemukan" },
        { status: 401 }
      );
    }

    const { username, pin } = await request.json();

    if (!username && !pin) {
      return NextResponse.json(
        { status: "error", message: "Data update tidak boleh kosong!" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: walletSession },
    });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const updatedData: { username?: string; pin?: string } = {};
    if (username) updatedData.username = username;
    if (pin) updatedData.pin = pin;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updatedData,
    });

    const response = NextResponse.json({
      status: "success",
      message: "Profil berhasil diperbarui",
      username: updatedUser.username,
    });

    // If username changed, update the session cookie
    if (username && username !== walletSession) {
      response.cookies.set("wallet_session", updatedUser.username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
