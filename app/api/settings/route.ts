import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PressProfile from "@/lib/models/PressProfile";

const DEFAULT_PROFILE = {
  name: "Creative Line Graphics",
  tagline: "OFFSET PRINTING PRESS",
  address:
    "2/412 72, Thirumalai Nagar, Ganapathypalayam, Veerapandi (P.O), Palladam (T.K), Tiruppur - 641 605, Tamil Nadu.",
  phone: "+91 90479 02902",
  email: "creativetpr@gmail.com",
  gstin: "33DDIPG2441F1Z0",
  state: "Tamil Nadu",
  stateCode: "33",
  bankName: "Federal Bank",
  accountNo: "13590200065469",
  ifscCode: "FDRL0001359",
  branchName: "Industrial Branch, Tiruppur",
  terms:
    "Labour bill for printing work rendered. Payment due within 15 days of invoice date.",
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
      { status: 500 },
    );
  }
}
