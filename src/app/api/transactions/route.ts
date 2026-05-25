import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const limitParam = searchParams.get("limit");

    let whereClause: any = {};

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr);
      const mVal = parseInt(monthStr);

      const startDate = new Date(year, mVal - 1, 1);
      const endDate = new Date(year, mVal, 0, 23, 59, 59, 999);

      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const take = limitParam ? parseInt(limitParam) : undefined;

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        subCategory: true,
        bank: true,
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
      take,
    });

    // Format output
    const formatted = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      categoryId: t.categoryId,
      categoryName: t.category.name,
      subCategoryId: t.subCategoryId,
      subCategoryName: t.subCategory?.name || null,
      amount: Number(t.amount),
      date: t.date.toISOString().split("T")[0],
      description: t.description || "",
      bankId: t.bankId,
      bankName: t.bank.name,
      discount: Number(t.discount),
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
    const { type, amount, date, description, bankId, categoryName, subCategoryName, discount, transferToBankId } = body;

    if (!type || !amount || !date || !bankId) {
      return NextResponse.json(
        { status: "error", message: "Data transaksi tidak lengkap!" },
        { status: 400 }
      );
    }

    const txDate = new Date(date);
    const amountVal = parseFloat(amount);
    const discountVal = parseFloat(discount || 0);

    // 1. Handle Account Transfer
    if (type === "transfer") {
      if (!transferToBankId) {
        return NextResponse.json(
          { status: "error", message: "Akun tujuan transfer wajib ditentukan!" },
          { status: 400 }
        );
      }

      // Check source and dest banks exist
      const sourceBank = await prisma.bank.findUnique({ where: { id: bankId } });
      const destBank = await prisma.bank.findUnique({ where: { id: transferToBankId } });

      if (!sourceBank || !destBank) {
        return NextResponse.json(
          { status: "error", message: "Akun bank asal atau tujuan tidak ditemukan!" },
          { status: 404 }
        );
      }

      // Retrieve or create Transfer categories
      let catTransferOut = await prisma.category.findFirst({
        where: { name: "Transfer Keluar", type: "expense" },
      });
      if (!catTransferOut) {
        catTransferOut = await prisma.category.create({
          data: { name: "Transfer Keluar", type: "expense" },
        });
      }

      let catTransferIn = await prisma.category.findFirst({
        where: { name: "Transfer Masuk", type: "income" },
      });
      if (!catTransferIn) {
        catTransferIn = await prisma.category.create({
          data: { name: "Transfer Masuk", type: "income" },
        });
      }

      const desc = description || `Transfer dari ${sourceBank.name} ke ${destBank.name}`;

      // Create linked transactions atomically
      const result = await prisma.$transaction(async (tx) => {
        const outTx = await tx.transaction.create({
          data: {
            type: "expense",
            categoryId: catTransferOut!.id,
            amount: amountVal,
            date: txDate,
            description: desc,
            bankId: bankId,
          },
        });

        const inTx = await tx.transaction.create({
          data: {
            type: "income",
            categoryId: catTransferIn!.id,
            amount: amountVal,
            date: txDate,
            description: desc,
            bankId: transferToBankId,
          },
        });

        return { outTx, inTx };
      });

      return NextResponse.json({
        status: "success",
        message: "Transfer berhasil dicatat",
        data: result,
      });
    }

    // 2. Handle Regular Income / Expense Transaction
    if (!categoryName) {
      return NextResponse.json(
        { status: "error", message: "Kategori wajib diisi!" },
        { status: 400 }
      );
    }

    // Resolve Category ID
    let category = await prisma.category.findFirst({
      where: { name: categoryName, type },
    });

    // Fallback: If not found, let's create a root category
    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, type },
      });
    }

    let subCategoryId: string | null = null;
    if (subCategoryName) {
      let subCategory = await prisma.category.findFirst({
        where: { name: subCategoryName, type, parentId: category.id },
      });
      if (!subCategory) {
        subCategory = await prisma.category.create({
          data: { name: subCategoryName, type, parentId: category.id },
        });
      }
      subCategoryId = subCategory.id;
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        categoryId: category.id,
        subCategoryId,
        amount: amountVal,
        date: txDate,
        description: description || "",
        bankId,
        discount: discountVal,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Transaksi berhasil dicatat",
      data: transaction,
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
    const { id, type, amount, date, description, bankId, categoryName, subCategoryName, discount } = body;

    if (!id || !type || !amount || !date || !bankId) {
      return NextResponse.json(
        { status: "error", message: "Data edit tidak lengkap!" },
        { status: 400 }
      );
    }

    const txDate = new Date(date);
    const amountVal = parseFloat(amount);
    const discountVal = parseFloat(discount || 0);

    // Resolve Category ID
    let category = await prisma.category.findFirst({
      where: { name: categoryName, type },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, type },
      });
    }

    let subCategoryId: string | null = null;
    if (subCategoryName) {
      let subCategory = await prisma.category.findFirst({
        where: { name: subCategoryName, type, parentId: category.id },
      });
      if (!subCategory) {
        subCategory = await prisma.category.create({
          data: { name: subCategoryName, type, parentId: category.id },
        });
      }
      subCategoryId = subCategory.id;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        categoryId: category.id,
        subCategoryId,
        amount: amountVal,
        date: txDate,
        description: description || "",
        bankId,
        discount: discountVal,
      },
    });

    return NextResponse.json({
      status: "success",
      message: "Transaksi berhasil diperbarui",
      data: updated,
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
        { status: "error", message: "ID Transaksi wajib dicantumkan!" },
        { status: 400 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Transaksi berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
