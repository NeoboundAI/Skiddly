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

export async function GET(request) {
  let session;

  try {
    // Get user session
    session = await auth();

    if (!session?.user?.email) {
      logAuthFailure("GET", "/api/orders", null, "No session or user email");
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
        "/api/orders",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const search = searchParams.get("search") || "";
    const customerType = searchParams.get("customerType") || "";
    const sortBy = searchParams.get("sortBy") || "abandonedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query for abandoned carts
    let query = { userId: user._id };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { shopifyCheckoutId: { $regex: search, $options: "i" } },
        { correlationId: { $regex: search, $options: "i" } },
      ];
    }

    // Add customer type filter if provided
    if (customerType && customerType !== "All Customers") {
      // This would need to be implemented based on your customer type logic
      // For now, we'll skip this filter
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Fetch abandoned carts with pagination
    const abandonedCarts = await AbandonedCart.find(query)
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("cartId")
      .populate("agentId", "name")
      .lean();

    // Get total count for pagination
    const total = await AbandonedCart.countDocuments(query);

    // Transform data to match frontend expectations
    const orders = await Promise.all(
      abandonedCarts.map(async (abandonedCart) => {
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
        }));

        // Get the latest call for summary data
        const latestCall = calls[0];

        return {
          id: `ACO_${abandonedCart._id.toString().slice(-6).toUpperCase()}`,
          abandonedCartId: abandonedCart._id,
          customer: {
            name:
              cart?.customerFirstName && cart?.customerLastName
                ? `${cart.customerFirstName} ${cart.customerLastName}`
                : "Unknown Customer",
            email: cart?.customerEmail || "unknown@email.com",
            phone: cart?.customerPhone || call?.customerNumber || "+0000000000",
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
            ? `${Math.floor(latestCall.duration / 60)}:${(
                latestCall.duration % 60
              )
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
          // Merged cart data
          cart: {
            _id: cart?._id,
            shopifyCheckoutId: cart?.shopifyCheckoutId,
            token: cart?.token,
            cartToken: cart?.cartToken,
            shopDomain: cart?.shopDomain,
            customerEmail: cart?.customerEmail,
            customerPhone: cart?.customerPhone,
            customerFirstName: cart?.customerFirstName,
            customerLastName: cart?.customerLastName,
            customerId: cart?.customerId,
            totalPrice: cart?.totalPrice,
            subtotalPrice: cart?.subtotalPrice,
            totalTax: cart?.totalTax,
            totalDiscounts: cart?.totalDiscounts,
            currency: cart?.currency,
            presentmentCurrency: cart?.presentmentCurrency,
            lineItems: cart?.lineItems,
            abandonedCheckoutUrl: cart?.abandonedCheckoutUrl,
            status: cart?.status,
            statusReason: cart?.statusReason,
            shopifyCreatedAt: cart?.shopifyCreatedAt,
            shopifyUpdatedAt: cart?.shopifyUpdatedAt,
            completedAt: cart?.completedAt,
            shippingAddress: cart?.shippingAddress,
            buyerAcceptsMarketing: cart?.buyerAcceptsMarketing,
            buyerAcceptsSmsMarketing: cart?.buyerAcceptsSmsMarketing,
            smsMarketingPhone: cart?.smsMarketingPhone,
            customerLocale: cart?.customerLocale,
            sourceName: cart?.sourceName,
            landingSite: cart?.landingSite,
            referringSite: cart?.referringSite,
            note: cart?.note,
            noteAttributes: cart?.noteAttributes,
            discountCodes: cart?.discountCodes,
            taxLines: cart?.taxLines,
            shippingLines: cart?.shippingLines,
            gateway: cart?.gateway,
            deviceId: cart?.deviceId,
            locationId: cart?.locationId,
            metadata: cart?.metadata,
            lastActivityAt: cart?.lastActivityAt,
            createdAt: cart?.createdAt,
            updatedAt: cart?.updatedAt,
          },
          // Full abandoned cart data
          abandonedCart: {
            _id: abandonedCart._id,
            cartId: abandonedCart.cartId,
            userId: abandonedCart.userId,
            agentId: abandonedCart.agentId,
            shopifyCheckoutId: abandonedCart.shopifyCheckoutId,
            abandonedAt: abandonedCart.abandonedAt,
            isDNP: abandonedCart.isDNP,
            totalAttempts: abandonedCart.totalAttempts,
            nextCallTime: abandonedCart.nextCallTime,
            lastAttemptTime: abandonedCart.lastAttemptTime,
            orderStage: abandonedCart.orderStage,
            lastCallStatus: abandonedCart.lastCallStatus,
            lastCallOutcome: abandonedCart.lastCallOutcome,
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
          },
        };
      })
    );

    // Calculate summary statistics
    const totalValue = orders.reduce((sum, order) => sum + order.cartValue, 0);
    const avgCartValue = orders.length > 0 ? totalValue / orders.length : 0;

    logDbOperation("read", "AbandonedCart", session.user, {
      operation: "fetch_orders_with_calls",
      count: orders.length,
      total: total,
      page: page,
      limit: limit,
      search: search,
      customerType: customerType,
    });

    logApiSuccess("GET", "/api/orders", 200, session.user, {
      orderCount: orders.length,
      total: total,
      totalValue: totalValue,
      avgCartValue: avgCartValue,
      page: page,
      limit: limit,
    });

    return NextResponse.json({
      success: true,
      orders: orders,
      summary: {
        totalAbandoned: total,
        totalValue: totalValue,
        avgCartValue: avgCartValue,
      },
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);

    logApiError("GET", "/api/orders", 500, error, session?.user, {
      page: new URL(request.url).searchParams.get("page"),
      limit: new URL(request.url).searchParams.get("limit"),
      search: new URL(request.url).searchParams.get("search"),
      customerType: new URL(request.url).searchParams.get("customerType"),
      sortBy: new URL(request.url).searchParams.get("sortBy"),
      sortOrder: new URL(request.url).searchParams.get("sortOrder"),
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
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
