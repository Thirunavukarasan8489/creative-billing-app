import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PressProfile from "@/lib/models/PressProfile";

const DEFAULT_PROFILE = {
  name: "CREATIVE LINE GRAPHICS",
  tagline: "OFFSET & DIGITAL PRINTING PRESS",
  address: "12, Printing Press Colony, Main Road, Tiruppur - 641601, Tamil Nadu.",
  phone: "+91 98421 00000",
  email: "creativeline.tpr@gmail.com",
  gstin: "33AAAAA0000A1Z5",
  state: "Tamil Nadu",
  stateCode: "33",
  bankName: "Union Bank of India",
  accountNo: "510101001234567",
  ifscCode: "UBIN0551015",
  branchName: "Main Branch, Tiruppur",
  terms: "Labour bill for printing work rendered. Payment due within 15 days of invoice date.",
};

export async function GET() {
  try {
    await dbConnect();
    let profile = await PressProfile.findOne();

    if (!profile) {
      profile = await PressProfile.create(DEFAULT_PROFILE);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching press profile settings:", error);
    return NextResponse.json(DEFAULT_PROFILE);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    let profile = await PressProfile.findOne();
    if (profile) {
      profile = await PressProfile.findByIdAndUpdate(profile._id, body, {
        new: true,
        runValidators: true,
      });
    } else {
      profile = await PressProfile.create(body);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating press profile settings:", error);
    return NextResponse.json(
      { error: "Failed to update press profile settings" },
      { status: 500 }
    );
  }
}
