import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json({ status: "success", data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, type, parentId } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { status: "error", message: "Nama dan Tipe Kategori wajib diisi!" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        parentId: parentId || null,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Kategori berhasil ditambahkan",
      data: category,
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
        { status: "error", message: "ID Kategori wajib dicantumkan!" },
        { status: 400 }
      );
    }

    // Delete category. Cascade onDelete will handle subcategories because of our schema setup
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Kategori berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
