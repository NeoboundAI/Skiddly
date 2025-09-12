export async function register() {
  // This runs when a new Next.js server instance is initiated
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log(
      "🚀 Server starting - initializing Queue Services via instrumentation..."
    );

    try {
      // Dynamic import to ensure this only runs on server
      const { initializeAllQueues } = await import("./src/lib/queue/index.js");
      await initializeAllQueues();
      console.log(
        "✅ All Queue Services initialized successfully via instrumentation"
      );
    } catch (error) {
      console.error(
        "❌ Failed to initialize Queue Services via instrumentation:",
        error
      );
    }
  }
}
