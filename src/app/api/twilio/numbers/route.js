import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "../../../../lib/mongodb";
import TwilioNumber from "../../../../models/TwilioNumber";
import User from "../../../../models/User";

export async function GET(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all active Twilio numbers for the user
    const numbers = await TwilioNumber.find({
      userId: user._id,
      isActive: true,
    }).select("phoneNumber type vapiNumberId vapiStatus createdAt");

    return NextResponse.json({
      success: true,
      numbers: numbers,
      hasNumbers: numbers.length > 0,
    });
  } catch (error) {
    console.error("Error fetching Twilio numbers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch numbers" },
      { status: 500 }
    );
  }
}
