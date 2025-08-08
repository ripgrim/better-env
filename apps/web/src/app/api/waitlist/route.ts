import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { grim } from "@better-env/dev-logger";
import { db } from "@better-env/db";
import { waitlist } from "@better-env/db";

const { log, error, warn } = grim();

const requestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.errors[0]?.message || "Invalid request data",
          success: false,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    log("[Waitlist] Processing request for email:", email);



    try {
      log("[Waitlist] Adding email to waitlist:", email);

      await db.insert(waitlist).values({
        email,
        hasAccess: false,
        createdAt: new Date(),
      });

      log("[Waitlist] Successfully added email to waitlist:", email);
      return NextResponse.json({
        success: true,
        message: "Successfully added to waitlist!",
      });
    } catch (dbConnectionError) {
      error("[Waitlist] Database connection error:", dbConnectionError);
      return NextResponse.json(
        {
          error: "Database temporarily unavailable",
          success: false,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    warn("[Waitlist] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}
