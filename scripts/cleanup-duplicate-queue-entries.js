/**
 * Script to clean up duplicate CallQueue entries
 * This will remove all pending entries for carts that have multiple queue entries
 */

import connectDB from "../src/lib/mongodb.js";
import CallQueue from "../src/models/CallQueue.js";
import AbandonedCart from "../src/models/AbandonedCart.js";

async function cleanupDuplicateQueueEntries() {
  try {
    await connectDB();
    console.log("🧹 Starting cleanup of duplicate CallQueue entries...");

    // Find all pending queue entries
    const pendingEntries = await CallQueue.find({ status: "pending" });
    console.log(`📊 Found ${pendingEntries.length} pending queue entries`);

    // Group by cartId to find duplicates
    const cartGroups = {};
    pendingEntries.forEach((entry) => {
      const cartId = entry.cartId.toString();
      if (!cartGroups[cartId]) {
        cartGroups[cartId] = [];
      }
      cartGroups[cartId].push(entry);
    });

    // Find carts with multiple entries
    const duplicateCarts = Object.entries(cartGroups).filter(
      ([cartId, entries]) => entries.length > 1
    );

    console.log(
      `🔍 Found ${duplicateCarts.length} carts with duplicate queue entries`
    );

    let totalDeleted = 0;

    for (const [cartId, entries] of duplicateCarts) {
      console.log(`\n📦 Cart ${cartId} has ${entries.length} queue entries:`);

      // Sort by creation time (keep the newest one)
      entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Keep the first (newest) entry, delete the rest
      const toKeep = entries[0];
      const toDelete = entries.slice(1);

      console.log(`  ✅ Keeping: ${toKeep._id} (created: ${toKeep.createdAt})`);

      for (const entry of toDelete) {
        console.log(
          `  🗑️ Deleting: ${entry._id} (created: ${entry.createdAt})`
        );
        await CallQueue.findByIdAndDelete(entry._id);
        totalDeleted++;
      }
    }

    // Also clean up any queue entries for carts that don't have corresponding AbandonedCart records
    console.log("\n🔍 Checking for orphaned queue entries...");

    const allQueueEntries = await CallQueue.find({ status: "pending" });
    let orphanedDeleted = 0;

    for (const entry of allQueueEntries) {
      const abandonedCart = await AbandonedCart.findById(entry.abandonedCartId);
      if (!abandonedCart) {
        console.log(
          `🗑️ Deleting orphaned queue entry: ${entry._id} (no AbandonedCart found)`
        );
        await CallQueue.findByIdAndDelete(entry._id);
        orphanedDeleted++;
      }
    }

    console.log(`\n✅ Cleanup completed:`);
    console.log(`  - Duplicate entries deleted: ${totalDeleted}`);
    console.log(`  - Orphaned entries deleted: ${orphanedDeleted}`);
    console.log(`  - Total deleted: ${totalDeleted + orphanedDeleted}`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }

  process.exit(0);
}

cleanupDuplicateQueueEntries();
