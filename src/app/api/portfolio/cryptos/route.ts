import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const cryptos = await prisma.crypto.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const formatted = cryptos.map((c) => ({
      id: c.id,
      name: c.name,
      quantity: Number(c.quantity),
      value_idr: Number(c.valueIdr),
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
    const { name, quantity, valueIdr } = await request.json();

    if (!name || quantity === undefined || valueIdr === undefined) {
      return NextResponse.json(
        { status: "error", message: "Data kripto tidak lengkap!" },
        { status: 400 }
      );
    }

    const crypto = await prisma.crypto.create({
      data: {
        name,
        quantity: parseFloat(quantity),
        valueIdr: parseFloat(valueIdr),
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Aset kripto berhasil ditambahkan",
      data: crypto,
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
    const { id, name, quantity, valueIdr } = await request.json();

    if (!id || !name || quantity === undefined || valueIdr === undefined) {
      return NextResponse.json(
        { status: "error", message: "ID dan data lengkap wajib disertakan!" },
        { status: 400 }
      );
    }

    const crypto = await prisma.crypto.update({
      where: { id },
      data: {
        name,
        quantity: parseFloat(quantity),
        valueIdr: parseFloat(valueIdr),
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Aset kripto berhasil diperbarui",
      data: crypto,
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
        { status: "error", message: "ID Kripto wajib dicantumkan!" },
        { status: 400 }
      );
    }

    await prisma.crypto.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Aset kripto berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
