import { agenda } from "../agenda.js";
import Cart from "../../models/Cart.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import Agent from "../../models/Agent.js";
import { logBusinessEvent, logApiError, logDbOperation } from "../apiLogger.js";
import { scheduleCall } from "../agenda.js";
import { generateCorrelationId } from "../../utils/correlationUtils.js";

// Job: Check if cart should be marked as abandoned
agenda.define("check-abandoned-cart", async (job) => {
  const { cartId, shopifyCheckoutId, userId, correlationId } = job.attrs.data;

  try {
    logBusinessEvent("job_started", correlationId, {
      jobType: "check-abandoned-cart",
      cartId,
      shopifyCheckoutId,
    });

    // Find the cart
    const cart = await Cart.findById(cartId);
    if (!cart) {
      logApiError(
        "JOB",
        "check-abandoned-cart",
        404,
        new Error("Cart not found"),
        correlationId,
        { cartId }
      );
      return;
    }

    // Check if cart was already purchased
    if (cart.status === "purchased") {
      logBusinessEvent("cart_already_purchased", correlationId, {
        cartId,
        shopifyCheckoutId,
      });
      return;
    }

    // Check if cart should be considered abandoned (20+ minutes of inactivity)
    if (!cart.shouldBeAbandoned()) {
      logBusinessEvent("cart_not_yet_abandoned", correlationId, {
        cartId,
        lastActivityAt: cart.lastActivityAt,
        minutesInactive: Math.floor(
          (Date.now() - cart.lastActivityAt.getTime()) / (1000 * 60)
        ),
      });
      return;
    }

    // Mark cart as abandoned
    await Cart.markAsAbandoned(shopifyCheckoutId);

    logDbOperation("update", "Cart", correlationId, {
      cartId,
      action: "mark_as_abandoned",
    });

    // Find active abandoned cart agent for this user
    const agent = await Agent.findOne({
      userId: userId,
      type: "abandoned-cart",
      status: "active",
    });

    if (!agent) {
      logApiError(
        "JOB",
        "check-abandoned-cart",
        404,
        new Error("No active abandoned cart agent found"),
        correlationId,
        {
          userId,
          cartId,
        }
      );
      return;
    }

    // Create new correlation ID for abandoned cart processing
    const abandonedCartCorrelationId = generateCorrelationId(
      "abandoned",
      shopifyCheckoutId
    );

    // Create abandoned cart record
    const abandonedCart = new AbandonedCart({
      cartId: cart._id,
      userId: userId,
      agentId: agent._id,
      shopifyCheckoutId: shopifyCheckoutId,
      shopDomain: cart.shopDomain,
      customerEmail: cart.customerEmail,
      customerPhone: cart.customerPhone,
      customerFirstName: cart.customerFirstName,
      customerLastName: cart.customerLastName,
      customerId: cart.customerId,
      totalPrice: cart.totalPrice,
      currency: cart.currency,
      abandonedCheckoutUrl: cart.abandonedCheckoutUrl,
      lineItems: cart.lineItems.map((item) => ({
        key: item.key,
        title: item.title,
        presentmentTitle: item.presentmentTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        price: item.price,
        linePrice: item.linePrice,
        variantId: item.variantId,
        productId: item.productId,
        sku: item.sku,
        vendor: item.vendor,
      })),
      abandonedAt: new Date(),
      correlationId: abandonedCartCorrelationId,
    });

    // Perform qualification checks
    const qualificationResult = await performQualificationChecks(
      cart,
      agent,
      abandonedCartCorrelationId
    );
    abandonedCart.qualificationChecks = qualificationResult;

    await abandonedCart.save();

    logDbOperation("create", "AbandonedCart", abandonedCartCorrelationId, {
      abandonedCartId: abandonedCart._id,
      cartId,
      qualified: qualificationResult.overallQualified,
    });

    // If qualified, schedule the first call
    if (qualificationResult.overallQualified) {
      const callTime = calculateCallTime(agent);

      // Add first call attempt
      await abandonedCart.addCallAttempt(
        callTime,
        generateCorrelationId("call", shopifyCheckoutId, 1)
      );

      // Schedule the call
      await scheduleCall(
        {
          abandonedCartId: abandonedCart._id,
          userId: userId,
          agentId: agent._id,
          attemptNumber: 1,
          correlationId: generateCorrelationId("call", shopifyCheckoutId, 1),
        },
        callTime
      );

      logBusinessEvent("call_scheduled", abandonedCartCorrelationId, {
        abandonedCartId: abandonedCart._id,
        callTime,
        attemptNumber: 1,
      });
    } else {
      logBusinessEvent(
        "cart_not_qualified_for_calling",
        abandonedCartCorrelationId,
        {
          abandonedCartId: abandonedCart._id,
          qualificationDetails: qualificationResult.qualificationDetails,
        }
      );
    }

    logBusinessEvent("job_completed", correlationId, {
      jobType: "check-abandoned-cart",
      abandonedCartId: abandonedCart._id,
      qualified: qualificationResult.overallQualified,
    });
  } catch (error) {
    logApiError("JOB", "check-abandoned-cart", 500, error, correlationId, {
      cartId,
      shopifyCheckoutId,
      userId,
    });
    throw error;
  }
});

// Helper function to perform qualification checks
async function performQualificationChecks(cart, agent, correlationId) {
  const checks = {
    cartValueQualified: false,
    customerTypeQualified: false,
    businessHoursQualified: false,
    phoneNumberAvailable: false,
    overallQualified: false,
    qualificationCheckedAt: new Date(),
    qualificationDetails: {},
  };

  try {
    // Check cart value against agent conditions
    const cartValue = parseFloat(cart.totalPrice);
    const cartValueConditions = agent.callLogic.conditions.filter(
      (c) => c.type === "cart-value" && c.enabled
    );

    if (cartValueConditions.length === 0) {
      checks.cartValueQualified = true;
    } else {
      checks.cartValueQualified = cartValueConditions.some((condition) => {
        const conditionValue = parseFloat(condition.value);
        switch (condition.operator) {
          case ">=":
            return cartValue >= conditionValue;
          case ">":
            return cartValue > conditionValue;
          case "<=":
            return cartValue <= conditionValue;
          case "<":
            return cartValue < conditionValue;
          case "=":
            return cartValue === conditionValue;
          default:
            return false;
        }
      });
    }
    checks.qualificationDetails.cartValue = {
      current: cartValue,
      qualified: checks.cartValueQualified,
    };

    // Check customer type (new vs returning)
    const customerTypeConditions = agent.callLogic.conditions.filter(
      (c) => c.type === "previous-orders" && c.enabled
    );

    if (customerTypeConditions.length === 0) {
      checks.customerTypeQualified = true;
    } else {
      // This would require checking Shopify API for customer order history
      // For now, we'll assume qualification based on customer data
      checks.customerTypeQualified = true;
    }
    checks.qualificationDetails.customerType = {
      qualified: checks.customerTypeQualified,
    };

    // Check if phone number is available
    checks.phoneNumberAvailable = !!(
      cart.customerPhone || cart.shippingAddress?.phone
    );
    checks.qualificationDetails.phoneNumber = {
      available: checks.phoneNumberAvailable,
      phone: cart.customerPhone || cart.shippingAddress?.phone,
    };

    // Check business hours
    const now = new Date();
    const callSchedule = agent.callLogic.callSchedule;
    checks.businessHoursQualified = isWithinBusinessHours(now, callSchedule);
    checks.qualificationDetails.businessHours = {
      qualified: checks.businessHoursQualified,
      currentTime: now,
      schedule: callSchedule,
    };

    // Overall qualification
    checks.overallQualified =
      checks.cartValueQualified &&
      checks.customerTypeQualified &&
      checks.phoneNumberAvailable;
    // Note: Business hours don't disqualify, they just delay the call

    logBusinessEvent("qualification_checks_completed", correlationId, {
      checks: {
        cartValue: checks.cartValueQualified,
        customerType: checks.customerTypeQualified,
        phoneNumber: checks.phoneNumberAvailable,
        businessHours: checks.businessHoursQualified,
        overall: checks.overallQualified,
      },
    });
  } catch (error) {
    logApiError("QUALIFICATION", "perform_checks", 500, error, correlationId, {
      cartId: cart._id,
      agentId: agent._id,
    });
    checks.qualificationDetails.error = error.message;
  }

  return checks;
}

// Helper function to check business hours
function isWithinBusinessHours(datetime, callSchedule) {
  if (!callSchedule.callTimeStart || !callSchedule.callTimeEnd) {
    return true; // No restrictions
  }

  const day = datetime.getDay(); // 0 = Sunday, 6 = Saturday

  // Check weekend calling preference
  if (!callSchedule.weekendCalling && (day === 0 || day === 6)) {
    return false;
  }

  // Check time range
  const timeString = datetime.toTimeString().substring(0, 5); // "HH:MM"
  return (
    timeString >= callSchedule.callTimeStart &&
    timeString <= callSchedule.callTimeEnd
  );
}

// Helper function to calculate when to schedule the call
function calculateCallTime(agent) {
  const now = new Date();
  const callSchedule = agent.callLogic.callSchedule;

  // If within business hours, schedule immediately
  if (isWithinBusinessHours(now, callSchedule)) {
    return new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
  }

  // Otherwise, schedule for next business day at start time
  const nextBusinessDay = new Date(now);
  nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);

  // Skip weekends if weekend calling is disabled
  if (!callSchedule.weekendCalling) {
    while (nextBusinessDay.getDay() === 0 || nextBusinessDay.getDay() === 6) {
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    }
  }

  // Set to business start time
  const [hours, minutes] = callSchedule.callTimeStart.split(":");
  nextBusinessDay.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return nextBusinessDay;
}
