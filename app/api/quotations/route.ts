import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Quotation from "@/lib/models/Quotation";
import Company from "@/lib/models/Company";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { number: { $regex: search, $options: "i" } },
        { "companySnapshot.name": { $regex: search, $options: "i" } },
        { "items.description": { $regex: search, $options: "i" } },
      ];
    }

    const quotations = await Quotation.find(query).sort({ date: -1, createdAt: -1 });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Check company existence & get snapshot if needed
    const company = await Company.findById(body.companyId).lean();
    if (!company) {
      return NextResponse.json({ error: "Client company not found" }, { status: 400 });
    }

    const companySnapshot = {
      name: company.name,
      address: company.address,
      phone: company.phone,
      gstin: company.gstin || "",
      recipientTitle: body.recipientTitle || "The Purchase Manager",
    };

    // Generate quotation number if omitted
    let number = body.number;
    if (!number || number.trim() === "") {
      const dateObj = body.date ? new Date(body.date) : new Date();
      const yr = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const startYear = month >= 4 ? yr : yr - 1;
      const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;

      const count = await Quotation.countDocuments({
        number: { $regex: `^QT/${fyStr}/` },
      });
      number = `QT/${fyStr}/${String(count + 1).padStart(4, "0")}`;
    }

    const quotation = await Quotation.create({
      ...body,
      number,
      companySnapshot,
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create quotation" },
      { status: 500 }
    );
  }
}
