import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // Find cookie
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

    const user = await prisma.user.findUnique({
      where: { username: walletSession },
    });

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User tidak valid" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: "success",
      username: user.username,
      role: user.role,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
