import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        category: true,
        bank: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const formatted = subscriptions.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email || "",
      amount: Number(s.amount),
      billing_cycle: s.billingCycle,
      due_date: s.dueDate.toISOString().split("T")[0],
      category: s.category.name,
      bank_id: s.bankId,
      bank_name: s.bank.name,
      status: s.status,
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
    const body = await request.json();
    const { name, email, amount, billingCycle, dueDate, categoryName, bankId } = body;

    if (!name || !amount || !billingCycle || !dueDate || !categoryName || !bankId) {
      return NextResponse.json(
        { status: "error", message: "Data langganan tidak lengkap!" },
        { status: 400 }
      );
    }

    // Resolve Category
    let category = await prisma.category.findFirst({
      where: { name: categoryName, type: "expense" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, type: "expense" },
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        name,
        email: email || "",
        amount: parseFloat(amount),
        billingCycle,
        dueDate: new Date(dueDate),
        categoryId: category.id,
        bankId,
        status: "active",
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Tagihan langganan berhasil disimpan",
      data: subscription,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, amount, billingCycle, dueDate, categoryName, bankId, status } = body;

    if (!id || !name || !amount || !billingCycle || !dueDate || !categoryName || !bankId) {
      return NextResponse.json(
        { status: "error", message: "Data lengkap wajib disertakan!" },
        { status: 400 }
      );
    }

    // Resolve Category
    let category = await prisma.category.findFirst({
      where: { name: categoryName, type: "expense" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, type: "expense" },
      });
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        name,
        email: email || "",
        amount: parseFloat(amount),
        billingCycle,
        dueDate: new Date(dueDate),
        categoryId: category.id,
        bankId,
        status: status || "active",
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Tagihan langganan berhasil diperbarui",
      data: subscription,
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
        { status: "error", message: "ID Tagihan wajib dicantumkan!" },
        { status: 400 }
      );
    }

    await prisma.subscription.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Tagihan langganan berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
