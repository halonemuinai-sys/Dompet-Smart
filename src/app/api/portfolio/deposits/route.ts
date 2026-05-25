import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const deposits = await prisma.deposit.findMany({
      include: {
        bank: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    const formatted = deposits.map((d) => ({
      id: d.id,
      name: d.name,
      bank_id: d.bankId,
      bank_name: d.bank.name,
      amount: Number(d.amount),
      rate: Number(d.rate),
      tenor: d.tenor,
      start_date: d.startDate.toISOString().split("T")[0],
      maturity_date: d.maturityDate.toISOString().split("T")[0],
      status: d.status,
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
    const { name, bankId, amount, rate, tenor, startDate, maturityDate } = body;

    if (!name || !bankId || !amount || !rate || !tenor || !startDate || !maturityDate) {
      return NextResponse.json(
        { status: "error", message: "Data deposito tidak lengkap!" },
        { status: 400 }
      );
    }

    const deposit = await prisma.deposit.create({
      data: {
        name,
        bankId,
        amount: parseFloat(amount),
        rate: parseFloat(rate),
        tenor: parseInt(tenor),
        startDate: new Date(startDate),
        maturityDate: new Date(maturityDate),
        status: "active",
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Deposito berhasil ditambahkan",
      data: deposit,
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { status: "error", message: "ID Deposito dan Status wajib disertakan!" },
        { status: 400 }
      );
    }

    const deposit = await prisma.deposit.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      status: "success",
      message: "Status deposito berhasil diperbarui",
      data: deposit,
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
        { status: "error", message: "ID Deposito wajib dicantumkan!" },
        { status: 400 }
      );
    }

    await prisma.deposit.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Deposito berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
