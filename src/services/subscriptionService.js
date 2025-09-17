import User from "../models/User.js";
import UserPlan from "../models/UserPlan.js";
import UsageLog from "../models/UsageLog.js";
import Agent from "../models/Agent.js";
import ShopifyShop from "../models/ShopifyShop.js";
import AbandonedCart from "../models/AbandonedCart.js";
import Cart from "../models/Cart.js";
import { PLAN_CONFIGS, SUBSCRIPTION_STATUS } from "../constants/plans.js";
import { ORDER_QUEUE_STATUS } from "../constants/callConstants.js";

/**
 * Subscription Service
 * Manages user subscriptions, plan upgrades, usage tracking, and limit enforcement
 */
class SubscriptionService {
  /**
   * Initialize trial plan for new user
   */
  async initializeTrialPlan(userId) {
    try {
      // Create trial plan in UserPlan collection
      const userPlan = await UserPlan.createTrialPlan(userId);

      // Update User document with trial info
      const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await User.findByIdAndUpdate(userId, {
        "subscription.plan": "free_trial",
        "subscription.status": "trialing",
        "subscription.limits": PLAN_CONFIGS.free_trial,
        "subscription.currentBillingPeriod": {
          startDate: new Date(),
          endDate: trialEndDate,
          isTrial: true,
          maxAbandonedCalls: PLAN_CONFIGS.free_trial.abandonedCalls,
          maxAbandonedSms: PLAN_CONFIGS.free_trial.abandonedSms,
        },
        "subscription.currentPeriodUsage": {
          abandonedCallsUsed: 0,
          abandonedSmsUsed: 0,
          lastUpdated: new Date(),
        },
        "subscription.userPlanId": userPlan._id,
        "subscription.trialEndDate": trialEndDate,
        "subscription.isTrialActive": true,
        "subscription.monthlyPrice": 0,
      });

      return userPlan;
    } catch (error) {
      console.error("Error initializing trial plan:", error);
      throw error;
    }
  }

  /**
   * Upgrade user to a paid plan
   */
  async upgradePlan(userId, newPlan, upgradeReason = "upgrade") {
    try {
      // Validate plan
      if (!PLAN_CONFIGS[newPlan]) {
        throw new Error(`Invalid plan: ${newPlan}`);
      }

      // Upgrade plan in UserPlan collection
      const userPlan = await UserPlan.upgradePlan(
        userId,
        newPlan,
        upgradeReason
      );

      // Update User document
      const planConfig = PLAN_CONFIGS[newPlan];
      const newPeriodStart = new Date();
      const newPeriodEnd = new Date(
        newPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000
      ); // 30 days

      await User.findByIdAndUpdate(userId, {
        "subscription.plan": newPlan,
        "subscription.status": "active",
        "subscription.limits": planConfig,
        "subscription.currentBillingPeriod": {
          startDate: newPeriodStart,
          endDate: newPeriodEnd,
          isTrial: false,
          maxAbandonedCalls: planConfig.abandonedCalls,
          maxAbandonedSms: planConfig.abandonedSms,
        },
        "subscription.currentPeriodUsage": {
          abandonedCallsUsed: 0,
          abandonedSmsUsed: 0,
          lastUpdated: new Date(),
        },
        "subscription.userPlanId": userPlan._id,
        "subscription.isTrialActive": false,
        "subscription.monthlyPrice": planConfig.monthlyPrice,
        "subscription.nextBillingDate": newPeriodEnd,
      });

      return userPlan;
    } catch (error) {
      console.error("Error upgrading plan:", error);
      throw error;
    }
  }

  /**
   * Check if user can make a call
   */
  async canMakeCall(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { canCall: false, reason: "user_not_found" };
      }

      // Check trial status
      if (user.subscription.plan === "free_trial") {
        if (
          !user.subscription.isTrialActive ||
          new Date() > user.subscription.trialEndDate
        ) {
          return { canCall: false, reason: "trial_expired" };
        }
      }

      // Check billing period limits
      const now = new Date();
      const periodStart = user.subscription.currentBillingPeriod.startDate;
      const periodEnd = user.subscription.currentBillingPeriod.endDate;

      // Check if billing period is still active
      if (now < periodStart || now > periodEnd) {
        return { canCall: false, reason: "billing_period_expired" };
      }

      // Check abandoned call limits
      if (
        user.subscription.currentBillingPeriod.maxAbandonedCalls !== -1 &&
        user.subscription.currentPeriodUsage.abandonedCallsUsed >=
          user.subscription.currentBillingPeriod.maxAbandonedCalls
      ) {
        return { canCall: false, reason: "abandoned_call_limit_reached" };
      }

      return { canCall: true };
    } catch (error) {
      console.error("Error checking call permission:", error);
      return { canCall: false, reason: "error_checking_permissions" };
    }
  }

  /**
   * Track call usage
   */
  async trackCall(userId, callData) {
    try {
      const user = await User.findById(userId);
      const userPlan = await UserPlan.findOne({
        userId,
        status: { $in: ["active", "trialing"] },
      });

      if (!userPlan) {
        throw new Error("No active plan found for user");
      }

      // Update User document usage
      await User.findByIdAndUpdate(userId, {
        $inc: { "subscription.currentPeriodUsage.abandonedCallsUsed": 1 },
        "subscription.currentPeriodUsage.lastUpdated": new Date(),
      });

      // Log detailed usage
      await UsageLog.trackCall(userId, userPlan._id, callData);

      return true;
    } catch (error) {
      console.error("Error tracking call usage:", error);
      throw error;
    }
  }

  /**
   * Check if user can create an agent
   */
  async canCreateAgent(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { canCreate: false, reason: "user_not_found" };
      }

      // Check if user has active subscription
      if (
        user.subscription.status === "canceled" ||
        user.subscription.status === "paused"
      ) {
        return { canCreate: false, reason: "subscription_inactive" };
      }

      // Check agent limit
      const currentAgents = await Agent.countDocuments({ userId });
      if (
        user.subscription.limits.maxAgents !== -1 &&
        currentAgents >= user.subscription.limits.maxAgents
      ) {
        return { canCreate: false, reason: "max_agents_limit_reached" };
      }

      return { canCreate: true };
    } catch (error) {
      console.error("Error checking agent creation permission:", error);
      return { canCreate: false, reason: "error_checking_permissions" };
    }
  }

  /**
   * Track agent creation
   */
  async trackAgentCreation(userId, agentData) {
    try {
      const userPlan = await UserPlan.findOne({
        userId,
        status: { $in: ["active", "trialing"] },
      });

      if (!userPlan) {
        throw new Error("No active plan found for user");
      }

      // Log agent creation
      await UsageLog.trackAgentCreation(userId, userPlan._id, agentData);

      return true;
    } catch (error) {
      console.error("Error tracking agent creation:", error);
      throw error;
    }
  }

  /**
   * Check if user can connect a store
   */
  async canConnectStore(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { canConnect: false, reason: "user_not_found" };
      }

      // Check if user has active subscription
      if (
        user.subscription.status === "canceled" ||
        user.subscription.status === "paused"
      ) {
        return { canConnect: false, reason: "subscription_inactive" };
      }

      // Check store limit
      const currentStores = await ShopifyShop.countDocuments({ userId });
      if (
        user.subscription.limits.maxStores !== -1 &&
        currentStores >= user.subscription.limits.maxStores
      ) {
        return { canConnect: false, reason: "max_stores_limit_reached" };
      }

      return { canConnect: true };
    } catch (error) {
      console.error("Error checking store connection permission:", error);
      return { canConnect: false, reason: "error_checking_permissions" };
    }
  }

  /**
   * Track store connection
   */
  async trackStoreConnection(userId, storeData) {
    try {
      const userPlan = await UserPlan.findOne({
        userId,
        status: { $in: ["active", "trialing"] },
      });

      if (!userPlan) {
        throw new Error("No active plan found for user");
      }

      // Log store connection
      await UsageLog.trackStoreConnection(userId, userPlan._id, storeData);

      return true;
    } catch (error) {
      console.error("Error tracking store connection:", error);
      throw error;
    }
  }

  /**
   * Get user's current usage summary
   */
  async getUserUsageSummary(userId, billingPeriod = null) {
    try {
      const summary = await UsageLog.getUsageSummary(userId, billingPeriod);
      return summary;
    } catch (error) {
      console.error("Error getting usage summary:", error);
      throw error;
    }
  }

  /**
   * Get user's subscription details
   */
  async getUserSubscription(userId) {
    try {
      const user = await User.findById(userId);
      const userPlan = await UserPlan.findOne({
        userId,
        status: { $in: ["active", "trialing"] },
      });

      return {
        user: {
          plan: user.subscription.plan,
          status: user.subscription.status,
          limits: user.subscription.limits,
          currentBillingPeriod: user.subscription.currentBillingPeriod,
          currentPeriodUsage: user.subscription.currentPeriodUsage,
          trialEndDate: user.subscription.trialEndDate,
          isTrialActive: user.subscription.isTrialActive,
          monthlyPrice: user.subscription.monthlyPrice,
        },
        plan: userPlan,
      };
    } catch (error) {
      console.error("Error getting user subscription:", error);
      throw error;
    }
  }

  /**
   * Reset monthly usage (called by cron job)
   */
  async resetMonthlyUsage() {
    try {
      // Reset usage in User documents
      await User.updateMany(
        {},
        {
          $set: {
            "subscription.currentPeriodUsage.abandonedCallsUsed": 0,
            "subscription.currentPeriodUsage.abandonedSmsUsed": 0,
            "subscription.currentPeriodUsage.lastUpdated": new Date(),
          },
        }
      );

      console.log("Monthly usage reset completed");
      return true;
    } catch (error) {
      console.error("Error resetting monthly usage:", error);
      throw error;
    }
  }

  /**
   * Check and handle expired trials
   */
  async handleExpiredTrials() {
    try {
      const expiredTrials = await User.find({
        "subscription.plan": "free_trial",
        "subscription.trialEndDate": { $lt: new Date() },
        "subscription.isTrialActive": true,
      });

      for (const user of expiredTrials) {
        // Update user status
        await User.findByIdAndUpdate(user._id, {
          "subscription.isTrialActive": false,
          "subscription.status": "canceled",
        });

        // Update user plan
        await UserPlan.findOneAndUpdate(
          { userId: user._id, status: "trialing" },
          { status: "expired" }
        );

        console.log(`Trial expired for user: ${user._id}`);
      }

      return expiredTrials.length;
    } catch (error) {
      console.error("Error handling expired trials:", error);
      throw error;
    }
  }

  /**
   * Reactivate limit-reached carts after plan upgrade
   */
  async reactivateLimitReachedCarts(userId) {
    try {
      // Find carts that were marked with limit-related statuses
      const limitReachedCarts = await Cart.find({
        userId: userId,
        status: {
          $in: [
            "subscription_inactive",
            "billing_period_expired",
            "abandoned_call_limit_reached",
          ],
        },
      });

      console.log(
        `🔄 Found ${limitReachedCarts.length} limit-reached carts to reactivate for user ${userId}`
      );

      for (const cart of limitReachedCarts) {
        // Reset cart status to inCheckout so it can be processed again
        await Cart.findByIdAndUpdate(
          cart._id,
          {
            status: "inCheckout",
            statusReason: null,
            lastActivityAt: new Date(),
          },
          { new: true }
        );

        console.log(
          `✅ Reactivated cart ${cart._id} - status reset to inCheckout`
        );
      }

      return { reactivated: limitReachedCarts.length };
    } catch (error) {
      console.error("Error reactivating limit-reached carts:", error);
      throw error;
    }
  }

  /**
   * Get plan comparison data
   */
  getPlanComparison() {
    return Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
      id: key,
      name: config.name,
      monthlyPrice: config.monthlyPrice,
      abandonedCalls: config.abandonedCalls,
      abandonedSms: config.abandonedSms,
      maxAgents: config.maxAgents,
      maxStores: config.maxStores,
      hasDedicatedNumber: config.hasDedicatedNumber,
      hasApiAccess: config.hasApiAccess,
      hasMultiAgent: config.hasMultiAgent,
      billingType: config.billingType,
    }));
  }
}

// Export singleton instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;
