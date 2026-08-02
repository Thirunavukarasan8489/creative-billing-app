import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Quotation from "@/lib/models/Quotation";
import Company from "@/lib/models/Company";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const quotation = await Quotation.findById(id).lean();

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotation" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

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

    const updated = await Quotation.findByIdAndUpdate(
      id,
      { ...body, companySnapshot },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating quotation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update quotation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const deleted = await Quotation.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quotation deleted successfully" });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    return NextResponse.json(
      { error: "Failed to delete quotation" },
      { status: 500 }
    );
  }
}
