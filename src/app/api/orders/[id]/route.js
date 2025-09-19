import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import AbandonedCart from "@/models/AbandonedCart";
import Call from "@/models/Call";
import Cart from "@/models/Cart";
import User from "@/models/User";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
} from "@/lib/apiLogger";

export async function GET(request, { params }) {
  let session;
  let orderId;

  try {
    // Get user session
    session = await auth();

    if (!session?.user?.email) {
      logAuthFailure(
        "GET",
        "/api/orders/[id]",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      logAuthFailure(
        "GET",
        "/api/orders/[id]",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get order ID from params
    const resolvedParams = await params;
    orderId = resolvedParams.id;

    // Find abandoned cart by ID (remove ACO_ prefix if present)
    const cleanOrderId = orderId.replace(/^ACO_/, "");
    const abandonedCart = await AbandonedCart.findOne({
      _id: cleanOrderId,
      userId: user._id,
    })
      .populate("cartId")
      .populate("agentId", "name")
      .lean();

    if (!abandonedCart) {
      logApiError(
        "GET",
        "/api/orders/[id]",
        404,
        new Error("Order not found"),
        session.user,
        { orderId: orderId }
      );
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch all calls for this abandoned cart
    const calls = await Call.find({
      abandonedCartId: abandonedCart._id,
    })
      .sort({ createdAt: -1 }) // Latest first
      .lean();

    // Get cart data
    const cart = abandonedCart.cartId;

    // Determine customer type based on your business logic
    let customerType = "NEW";
    if (cart?.customerId) {
      // You could implement logic here to determine if customer is returning/VIP
      // For now, defaulting to NEW
    }

    // Format calls for the frontend
    const formattedCalls = calls.map((call, index) => ({
      id: call._id.toString(),
      callId: `Call #${calls.length - index}`, // Latest call gets highest number
      date: call.createdAt,
      duration: call.duration
        ? `${Math.floor(call.duration / 60)}:${(call.duration % 60)
            .toString()
            .padStart(2, "0")}`
        : "0:00",
      status: call.picked ? "Completed" : "Failed",
      outcome: call.callOutcome || "NO ANSWER",
      endReason: call.endedReason || call.providerEndReason || "unknown",
      picked: call.picked || false,
      transcript: call.transcript,
      recordingUrl: call.recordingUrl,
      callAnalysis: call.callAnalysis,
      cost: call.cost || 0,
      vapiCallId: call.vapiCallId,
      customerNumber: call.customerNumber,
      assistantId: call.assistantId,
      correlationId: call.correlationId,
      nextCallTime: call.nextCallTime,
      updatedAt: call.updatedAt,
      callStatus: call.callStatus,
      finalAction: call.finalAction,
      providerEndReason: call.providerEndReason,
      endedReason: call.endedReason,
    }));

    // Get the latest call for summary data
    const latestCall = calls[0];

    const order = {
      id: `ACO_${abandonedCart._id.toString().slice(-6).toUpperCase()}`,
      abandonedCartId: abandonedCart._id,
      customer: {
        name:
          cart?.customerFirstName && cart?.customerLastName
            ? `${cart.customerFirstName} ${cart.customerLastName}`
            : "Unknown Customer",
        email: cart?.customerEmail || "unknown@email.com",
        phone: cart?.customerPhone || calls[0]?.customerNumber || "+0000000000",
      },
      cartValue: parseFloat(cart?.totalPrice || 0),
      currency: cart?.currency || "USD",
      items:
        cart?.lineItems?.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: parseFloat(item.price || 0),
        })) || [],
      customerType: customerType,
      location: {
        city: cart?.shippingAddress?.city || "Unknown",
        state: cart?.shippingAddress?.province || "Unknown",
        country: cart?.shippingAddress?.country || "Unknown",
      },
      abandonedAt: abandonedCart.abandonedAt,
      orderStage: abandonedCart.orderStage || "abandoned",
      callStage:
        latestCall?.callStatus === "picked"
          ? "CALL COMPLETED"
          : latestCall?.callStatus === "not_picked"
          ? "CALL COMPLETED"
          : "NOT STARTED",
      callOutcome: latestCall?.callOutcome || "PENDING",
      callAttempts: abandonedCart.totalAttempts || 0,
      callEndReason:
        latestCall?.endedReason ||
        latestCall?.providerEndReason ||
        "No calls made",
      lastPicked: latestCall?.picked
        ? formatDate(latestCall.createdAt)
        : "Never",
      callDuration: latestCall?.duration
        ? `${Math.floor(latestCall.duration / 60)}:${(latestCall.duration % 60)
            .toString()
            .padStart(2, "0")}`
        : "0:00",
      calls: formattedCalls,
      // Additional data for the slider
      shopifyCheckoutId: abandonedCart.shopifyCheckoutId,
      agentId: abandonedCart.agentId,
      agentName: abandonedCart.agentId?.name || "Unknown Agent",
      isDNP: abandonedCart.isDNP || false,
      nextCallTime: abandonedCart.nextCallTime,
      lastAttemptTime: abandonedCart.lastAttemptTime,
      finalAction: abandonedCart.finalAction,
      callAnalysis: abandonedCart.callAnalysis,
      nextAttemptShouldBeMade: abandonedCart.nextAttemptShouldBeMade,
      orderQueueStatus: abandonedCart.orderQueueStatus,
      isQualified: abandonedCart.isQualified,
      reasonOfNotQualified: abandonedCart.reasonOfNotQualified,
      isEligibleForQueue: abandonedCart.isEligibleForQueue,
      completedAt: abandonedCart.completedAt,
      correlationId: abandonedCart.correlationId,
      createdAt: abandonedCart.createdAt,
      updatedAt: abandonedCart.updatedAt,
      callEndingReason: abandonedCart.callEndingReason,
      providerEndReason: abandonedCart.providerEndReason,
      // Full cart data
      cart: cart,
      // Full abandoned cart data
      abandonedCart: abandonedCart,
    };

    logDbOperation("read", "AbandonedCart", session.user, {
      operation: "fetch_single_order_with_calls",
      orderId: orderId,
      callCount: calls.length,
    });

    logApiSuccess("GET", "/api/orders/[id]", 200, session.user, {
      orderId: orderId,
      callCount: calls.length,
      hasCart: !!cart,
      hasCalls: calls.length > 0,
    });

    return NextResponse.json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);

    logApiError("GET", "/api/orders/[id]", 500, error, session?.user, {
      orderId: orderId,
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
