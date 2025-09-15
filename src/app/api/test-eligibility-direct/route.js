import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import callQueueProcessor from "@/lib/queue/CallQueueProcessor";

export async function GET(request) {
  try {
    await connectDB();

    // Test data based on your example
    const testCart = {
      _id: "68c7f19ca34daa22cd89e1f3",
      totalPrice: "94.40",
      customerId: "8515951689987",
      lineItems: [
        {
          title: "Pant",
        },
      ],
      discountCodes: [
        {
          code: "cxxx",
        },
      ],
      shippingAddress: {
        country: "India",
        province: "Delhi",
      },
    };

    const testAgent = {
      _id: "68c7c4a4a195314306fe6fa1",
      callLogic: {
        conditions: [
          {
            type: "cart-value",
            operator: ">=",
            value: "200",
            enabled: true,
          },
          {
            type: "customer-type",
            operator: "includes",
            value: ["New", "Returning"],
            enabled: false,
          },
          {
            type: "products",
            operator: "includes",
            value: ["Pant"],
            enabled: true,
          },
          {
            type: "coupon-code",
            operator: "includes",
            value: ["cxxx"],
            enabled: true,
          },
        ],
      },
    };

    const testAbandonedCart = {
      _id: "test-abandoned-cart",
    };

    console.log("🧪 Testing eligibility with sample data...");
    console.log("🧪 Cart value:", testCart.totalPrice);
    console.log(
      "🧪 Agent conditions:",
      testAgent.callLogic.conditions.filter((c) => c.enabled)
    );

    const result = await callQueueProcessor.checkCallEligibility(
      testAgent,
      testCart,
      testAbandonedCart
    );

    return NextResponse.json({
      success: true,
      testData: {
        cartValue: testCart.totalPrice,
        agentConditions: testAgent.callLogic.conditions.filter(
          (c) => c.enabled
        ),
      },
      result,
    });
  } catch (error) {
    console.error("Error in test eligibility endpoint:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
