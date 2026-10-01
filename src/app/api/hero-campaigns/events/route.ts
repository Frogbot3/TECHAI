import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import HeroCampaign from "@/models/HeroCampaign";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const campaignId = String(body.campaignId || "").trim();
    const event = String(body.event || "");
    const field = event === "impression" ? "impressions" : event === "product-click" ? "productClicks" : event === "click" ? "clicks" : "";
    if (!campaignId || !field) return NextResponse.json({ success: false, message: "Invalid campaign event." }, { status: 400 });
    await connectToDatabase();
    await HeroCampaign.updateOne({ campaignId }, { $inc: { [field]: 1 } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hero campaign analytics error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
