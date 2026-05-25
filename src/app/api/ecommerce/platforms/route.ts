import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const platforms = await prisma.ecommercePlatform.findMany({
      orderBy: {
        platform: "asc",
      },
    });

    const formatted = platforms.map((p) => ({
      id: p.id,
      platform: p.platform,
      store_name: p.storeName || "",
    }));

    return NextResponse.json({ status: "success", data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { platform, storeName } = await request.json();

    if (!platform) {
      return NextResponse.json(
        { status: "error", message: "Nama Platform wajib diisi!" },
        { status: 400 }
      );
    }

    const platformRecord = await prisma.ecommercePlatform.create({
      data: {
        platform,
        storeName: storeName || "",
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Platform e-commerce berhasil ditambahkan",
      data: {
        id: platformRecord.id,
        platform: platformRecord.platform,
        store_name: platformRecord.storeName,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "ID Platform wajib dicantumkan!" },
        { status: 400 }
      );
    }

    await prisma.ecommercePlatform.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Platform e-commerce berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
