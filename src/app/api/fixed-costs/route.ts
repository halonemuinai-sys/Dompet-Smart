import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const fixedCosts = await prisma.fixedCost.findMany({
      include: {
        category: true,
        subCategory: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const formatted = fixedCosts.map((fc) => ({
      id: fc.id,
      name: fc.name,
      amount: Number(fc.amount),
      category_id: fc.category.name, // To match the old frontend attribute naming
      sub_category_id: fc.subCategory?.name || "",
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
    const { name, amount, categoryName } = await request.json();

    if (!name || !amount || !categoryName) {
      return NextResponse.json(
        { status: "error", message: "Data template tidak lengkap!" },
        { status: 400 }
      );
    }

    // Resolve Category ID
    let category = await prisma.category.findFirst({
      where: { name: categoryName, type: "expense" },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, type: "expense" },
      });
    }

    const fixedCost = await prisma.fixedCost.create({
      data: {
        name,
        amount: parseFloat(amount),
        categoryId: category.id,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Template pengeluaran rutin berhasil disimpan",
      data: {
        id: fixedCost.id,
        name: fixedCost.name,
        amount: Number(fixedCost.amount),
        category_id: category.name,
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
        { status: "error", message: "ID Template wajib dicantumkan!" },
        { status: 400 }
      );
    }

    await prisma.fixedCost.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Template berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
