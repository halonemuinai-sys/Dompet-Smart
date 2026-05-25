import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM

    if (!month) {
      return NextResponse.json(
        { status: "error", message: "Parameter bulan (month) wajib diisi!" },
        { status: 400 }
      );
    }

    const budgets = await prisma.budget.findMany({
      where: { month },
      include: {
        category: true,
      },
    });

    const formatted = budgets.map((b) => ({
      id: b.id,
      month: b.month,
      categoryId: b.categoryId,
      category: b.category.name, // Return name directly to match old code
      limit: Number(b.limit),
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
    const { month, categoryName, limit } = await request.json();

    if (!month || !categoryName || !limit) {
      return NextResponse.json(
        { status: "error", message: "Data budget tidak lengkap!" },
        { status: 400 }
      );
    }

    const limitVal = parseFloat(limit);

    // Resolve Category ID
    const category = await prisma.category.findFirst({
      where: { name: categoryName, type: "expense" },
    });

    if (!category) {
      return NextResponse.json(
        { status: "error", message: `Kategori "${categoryName}" tidak ditemukan!` },
        { status: 404 }
      );
    }

    // Upsert budget using @@unique([month, categoryId])
    const budget = await prisma.budget.upsert({
      where: {
        month_categoryId: {
          month,
          categoryId: category.id,
        },
      },
      update: {
        limit: limitVal,
      },
      create: {
        month,
        categoryId: category.id,
        limit: limitVal,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Budget berhasil disimpan",
      data: {
        id: budget.id,
        month: budget.month,
        categoryId: budget.categoryId,
        category: category.name,
        limit: Number(budget.limit),
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
        { status: "error", message: "ID Budget wajib dicantumkan!" },
        { status: 400 }
      );
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Budget berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
