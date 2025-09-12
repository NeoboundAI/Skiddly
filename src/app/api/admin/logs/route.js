import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs";
import path from "path";
import logger from "@/lib/logger";

export async function GET(request) {
  try {
    // Security check - verify admin authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      logger.warn("Unauthenticated access attempt to admin logs API");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !session.user.role ||
      !["admin", "super_admin"].includes(session.user.role)
    ) {
      logger.warn("Non-admin access attempt to admin logs API", {
        email: session.user.email,
        role: session.user.role,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!session.user.permissions?.viewLogs) {
      logger.warn("User without log permissions attempted to access logs", {
        email: session.user.email,
        role: session.user.role,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const userId = searchParams.get("userId");
    const level = searchParams.get("level");
    const date = searchParams.get("date");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit")) || 100;
    const page = parseInt(searchParams.get("page")) || 1;

    const logsDir = path.join(process.cwd(), "logs");

    // Check if logs directory exists
    if (!fs.existsSync(logsDir)) {
      logger.info("Logs directory does not exist, creating it");
      fs.mkdirSync(logsDir, { recursive: true });
      return NextResponse.json({
        logs: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        filters: { userEmail, userId, level, date, search },
      });
    }

    // Get all log files
    const files = fs.readdirSync(logsDir);
    const logFiles = files.filter(
      (file) => file.startsWith("combined-") && file.endsWith(".log")
    );

    if (logFiles.length === 0) {
      return NextResponse.json({
        logs: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        filters: { userEmail, userId, level, date, search },
      });
    }

    // Determine which log files to read based on date filter
    let filesToRead = [];

    if (date) {
      // If specific date is requested, read that file
      const targetFile = `combined-${date}.log`;
      if (logFiles.includes(targetFile)) {
        filesToRead = [targetFile];
      }
    } else {
      // If no date filter, read all files (most recent first)
      filesToRead = logFiles
        .map((file) => ({
          name: file,
          date: file.replace("combined-", "").replace(".log", ""),
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((file) => file.name);
    }

    // Read and parse all relevant log files
    const allLogs = [];

    for (const fileName of filesToRead) {
      const logFilePath = path.join(logsDir, fileName);

      try {
        const logContent = fs.readFileSync(logFilePath, "utf8");
        const lines = logContent
          .trim()
          .split("\n")
          .filter((line) => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);

            // Extract additional fields from the log entry
            const logEntry = {
              timestamp: parsed.timestamp,
              level: parsed.level,
              message: parsed.message,
              service: parsed.service,
              userId: parsed.userId || null,
              userEmail: parsed.userEmail || null,
              method: parsed.method || null,
              path: parsed.path || null,
              statusCode: parsed.statusCode || null,
              error: parsed.error || null,
              stack: parsed.stack || null,
              event: parsed.event || null,
              operation: parsed.operation || null,
              model: parsed.model || null,
              service: parsed.service || null,
              reason: parsed.reason || null,
              duration: parsed.duration || null,
              hasNumbers: parsed.hasNumbers || null,
              numberCount: parsed.numberCount || null,
              shop: parsed.shop || null,
              topic: parsed.topic || null,
              webhookId: parsed.webhookId || null,
              successCount: parsed.successCount || null,
              totalCount: parsed.totalCount || null,
              adminEmail: parsed.adminEmail || null,
              filesRead: parsed.filesRead || null,
              filteredEntries: parsed.filteredEntries || null,
              totalEntries: parsed.totalEntries || null,
              pagination: parsed.pagination || null,
              filters: parsed.filters || null,
            };

            // Apply filters
            let shouldInclude = true;

            // Filter by user email
            if (userEmail && logEntry.userEmail !== userEmail) {
              shouldInclude = false;
            }

            // Filter by user ID
            if (userId && logEntry.userId !== userId) {
              shouldInclude = false;
            }

            // Filter by log level
            if (level && logEntry.level !== level) {
              shouldInclude = false;
            }

            // Filter by search term (case-insensitive)
            if (
              search &&
              !logEntry.message.toLowerCase().includes(search.toLowerCase())
            ) {
              shouldInclude = false;
            }

            if (shouldInclude) {
              allLogs.push({
                timestamp: logEntry.timestamp,
                level: logEntry.level,
                message: logEntry.message,
                service: logEntry.service,
                userId: logEntry.userId || null,
                userEmail: logEntry.userEmail || null,
                method: logEntry.method || null,
                path: logEntry.path || null,
                statusCode: logEntry.statusCode || null,
                error: logEntry.error || null,
                stack: logEntry.stack || null,
                event: logEntry.event || null,
                operation: logEntry.operation || null,
                model: logEntry.model || null,
                service: logEntry.service || null,
                reason: logEntry.reason || null,
                duration: logEntry.duration || null,
                hasNumbers: logEntry.hasNumbers || null,
                numberCount: logEntry.numberCount || null,
                shop: logEntry.shop || null,
                topic: logEntry.topic || null,
                webhookId: logEntry.webhookId || null,
                successCount: logEntry.successCount || null,
                totalCount: logEntry.totalCount || null,
                adminEmail: logEntry.adminEmail || null,
                filesRead: logEntry.filesRead || null,
                filteredEntries: logEntry.filteredEntries || null,
                totalEntries: logEntry.totalEntries || null,
                pagination: logEntry.pagination || null,
                filters: logEntry.filters || null,
              });
            }
          } catch (parseError) {
            logger.warn("Failed to parse log line", {
              line,
              error: parseError.message,
            });
          }
        }
      } catch (readError) {
        logger.warn("Failed to read log file", {
          file: fileName,
          error: readError.message,
        });
      }
    }

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const total = allLogs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = allLogs.slice(startIndex, endIndex);

    // logger.info("Admin logs accessed", {
    //   adminEmail: session.user.email,
    //   filesRead: filesToRead.length,
    //   totalEntries: total,
    //   filteredEntries: paginatedLogs.length,
    //   filters: { userEmail, userId, level, date, search },
    //   pagination: { page, limit, totalPages },
    // });

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        userEmail,
        userId,
        level,
        date,
        search,
      },
      summary: {
        totalFiles: filesToRead.length,
        totalEntries: total,
        filteredEntries: paginatedLogs.length,
      },
    });
  } catch (error) {
    logger.error("Error accessing admin logs", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to retrieve logs" },
      { status: 500 }
    );
  }
}
