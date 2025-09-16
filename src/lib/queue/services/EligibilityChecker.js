/**
 * Eligibility Checker Service
 * Handles all call eligibility logic based on agent conditions
 */
class EligibilityChecker {
  /**
   * Check if a call is eligible based on agent conditions
   */
  async checkCallEligibility(agent, cart, abandonedCart) {
    console.log(
      `🔍 checkCallEligibility method called with agent: ${agent._id}, cart: ${cart._id}`
    );
    
    const reasons = [];
    const conditions = agent.callLogic?.conditions || [];

    console.log(
      `🔍 Checking eligibility for cart ${cart._id} against ${conditions.length} conditions`
    );

    for (const condition of conditions) {
      console.log(
        `🔍 Processing condition: ${condition.type}, enabled: ${
          condition.enabled
        }, operator: ${condition.operator}, value: ${JSON.stringify(
          condition.value
        )}`
      );

      if (!condition.enabled) {
        console.log(`⏭️ Skipping disabled condition: ${condition.type}`);
        continue;
      }

      console.log(
        `🔍 Checking condition: ${condition.type} (${condition.operator} ${condition.value})`
      );

      const conditionResult = await this.checkCondition(condition, cart, abandonedCart);
      
      if (!conditionResult.passed) {
        reasons.push(conditionResult.reason);
      }
    }

    const isEligible = reasons.length === 0;
    console.log(
      `📊 Eligibility result: ${isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}${
        reasons.length > 0 ? ` (${reasons.length} reasons)` : ""
      }`
    );

    if (reasons.length > 0) {
      console.log(`❌ Reasons for not being eligible:`, reasons);
    }

    return {
      isEligible,
      reasons,
    };
  }

  /**
   * Check a single condition
   */
  async checkCondition(condition, cart, abandonedCart) {
    switch (condition.type) {
      case "cart-value":
        return this.checkCartValueCondition(cart, condition);

      case "customer-type":
        return this.checkCustomerTypeCondition(cart, condition);

      case "products":
        return this.checkProductsCondition(cart, condition);

      case "previous-orders":
        return this.checkPreviousOrdersCondition(cart, condition);

      case "location":
        return this.checkLocationCondition(cart, condition);

      case "coupon-code":
        return this.checkCouponCodeCondition(cart, condition);

      case "payment-method":
        return this.checkPaymentMethodCondition(cart, condition);

      default:
        console.log(`⚠️ Unknown condition type: ${condition.type}`);
        return { passed: true, reason: "" };
    }
  }

  /**
   * Check cart value condition
   */
  checkCartValueCondition(cart, condition) {
    const cartValue = parseFloat(cart.totalPrice) || 0;
    const conditionValue = parseFloat(condition.value) || 0;

    console.log(
      `💰 Cart value check: ${cartValue} ${condition.operator} ${conditionValue}`
    );

    let passed = false;
    switch (condition.operator) {
      case ">=":
        passed = cartValue >= conditionValue;
        break;
      case ">":
        passed = cartValue > conditionValue;
        break;
      case "<=":
        passed = cartValue <= conditionValue;
        break;
      case "<":
        passed = cartValue < conditionValue;
        break;
      case "==":
        passed = cartValue === conditionValue;
        break;
      default:
        console.log(`⚠️ Unknown cart value operator: ${condition.operator}`);
        passed = true;
    }

    console.log(`💰 Cart value ${condition.operator} result: ${passed}`);

    return {
      passed,
      reason: passed ? "" : `Cart value ${cartValue} does not meet condition: ${condition.operator} ${conditionValue}`
    };
  }

  /**
   * Check customer type condition
   */
  checkCustomerTypeCondition(cart, condition) {
    // For now, we'll determine customer type based on whether they have a customerId
    const customerType = cart.customerId ? "Returning" : "New";
    const allowedTypes = condition.value || [];

    let passed = false;
    switch (condition.operator) {
      case "includes":
        passed = allowedTypes.includes(customerType);
        break;
      case "excludes":
        passed = !allowedTypes.includes(customerType);
        break;
      default:
        console.log(`⚠️ Unknown customer type operator: ${condition.operator}`);
        passed = true;
    }

    return {
      passed,
      reason: passed ? "" : `Customer type ${customerType} does not match condition: ${condition.operator} ${allowedTypes.join(", ")}`
    };
  }

  /**
   * Check products condition
   */
  checkProductsCondition(cart, condition) {
    const cartProducts = cart.lineItems?.map((item) => item.title) || [];
    const requiredProducts = condition.value || [];

    let passed = false;
    switch (condition.operator) {
      case "includes":
        passed = requiredProducts.some((product) =>
          cartProducts.some((cartProduct) =>
            cartProduct.toLowerCase().includes(product.toLowerCase())
          )
        );
        break;
      case "excludes":
        passed = !requiredProducts.some((product) =>
          cartProducts.some((cartProduct) =>
            cartProduct.toLowerCase().includes(product.toLowerCase())
          )
        );
        break;
      default:
        console.log(`⚠️ Unknown products operator: ${condition.operator}`);
        passed = true;
    }

    return {
      passed,
      reason: passed ? "" : `Products do not match condition: ${condition.operator} ${requiredProducts.join(", ")}`
    };
  }

  /**
   * Check previous orders condition
   */
  checkPreviousOrdersCondition(cart, condition) {
    // This would require additional data about previous orders
    // For now, we'll return true as we don't have this data
    console.log(`⚠️ Previous orders condition not implemented yet`);
    return {
      passed: true,
      reason: ""
    };
  }

  /**
   * Check location condition
   */
  checkLocationCondition(cart, condition) {
    const cartLocation =
      cart.shippingAddress?.country || cart.shippingAddress?.province || "";
    const allowedLocations = condition.value || [];

    if (allowedLocations.length === 0) {
      return { passed: true, reason: "" }; // No location restrictions
    }

    let passed = false;
    switch (condition.operator) {
      case "includes":
        passed = allowedLocations.some((location) =>
          cartLocation.toLowerCase().includes(location.toLowerCase())
        );
        break;
      case "excludes":
        passed = !allowedLocations.some((location) =>
          cartLocation.toLowerCase().includes(location.toLowerCase())
        );
        break;
      default:
        console.log(`⚠️ Unknown location operator: ${condition.operator}`);
        passed = true;
    }

    return {
      passed,
      reason: passed ? "" : `Location ${cartLocation} does not match condition: ${condition.operator} ${allowedLocations.join(", ")}`
    };
  }

  /**
   * Check coupon code condition
   */
  checkCouponCodeCondition(cart, condition) {
    const cartCoupons = cart.discountCodes?.map((dc) => dc.code) || [];
    const requiredCoupons = condition.value || [];

    if (requiredCoupons.length === 0) {
      return { passed: true, reason: "" }; // No coupon restrictions
    }

    let passed = false;
    switch (condition.operator) {
      case "includes":
        passed = requiredCoupons.some((coupon) =>
          cartCoupons.some(
            (cartCoupon) => cartCoupon.toLowerCase() === coupon.toLowerCase()
          )
        );
        break;
      case "excludes":
        passed = !requiredCoupons.some((coupon) =>
          cartCoupons.some(
            (cartCoupon) => cartCoupon.toLowerCase() === coupon.toLowerCase()
          )
        );
        break;
      default:
        console.log(`⚠️ Unknown coupon code operator: ${condition.operator}`);
        passed = true;
    }

    return {
      passed,
      reason: passed ? "" : `Coupon code does not match condition: ${condition.operator} ${requiredCoupons.join(", ")}`
    };
  }

  /**
   * Check payment method condition
   */
  checkPaymentMethodCondition(cart, condition) {
    // This would require additional data about payment methods
    // For now, we'll return true as we don't have this data
    console.log(`⚠️ Payment method condition not implemented yet`);
    return {
      passed: true,
      reason: ""
    };
  }
}

// Export singleton instance
const eligibilityChecker = new EligibilityChecker();
export default eligibilityChecker;
