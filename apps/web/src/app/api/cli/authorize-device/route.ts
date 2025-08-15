import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { auth } from "@better-env/auth/server";

// Use the shared device codes from global storage
// @ts-ignore
const deviceCodes = global._deviceCodes || new Map<string, {
  userCode: string;
  deviceCode: string;
  expiresAt: Date;
  userId?: string;
  used?: boolean;
}>();

// Ensure global storage is set
if (typeof global !== 'undefined') {
  // @ts-ignore
  global._deviceCodes = deviceCodes;
}

const inputSchema = z.object({
  userCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const input = inputSchema.parse(body);

    // Manual session validation without consuming request body multiple times
    const cookies = req.headers.get('cookie');
    if (!cookies) {
      return NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Extract session token from cookies
    const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);
    if (!sessionTokenMatch) {
      return NextResponse.json(
        { error: { message: "No session token found" } },
        { status: 401 }
      );
    }

    // Validate session token using a clean request
    let sessionUser;
    try {
      const cleanHeaders = new Headers();
      cleanHeaders.set('cookie', `better-auth.session_token=${sessionTokenMatch[1]}`);
      
      const session = await auth.api.getSession({
        headers: cleanHeaders,
      });

      if (!session || !session.user) {
        return NextResponse.json(
          { error: { message: "Invalid session" } },
          { status: 401 }
        );
      }
      
      sessionUser = session.user;
    } catch (error) {
      return NextResponse.json(
        { error: { message: "Session validation failed" } },
        { status: 401 }
      );
    }
    
    const userId = sessionUser.id;
    
    // Find device code by user code
    let deviceAuth: any = null;
    let deviceCodeKey: string | null = null;
    
    for (const [key, value] of deviceCodes.entries()) {
      if (value.userCode === input.userCode && new Date() < value.expiresAt) {
        deviceAuth = value;
        deviceCodeKey = key;
        break;
      }
    }

    if (!deviceAuth || !deviceCodeKey) {
      return NextResponse.json(
        { error: { message: "Invalid or expired user code" } },
        { status: 404 }
      );
    }

    if (deviceAuth.userId) {
      return NextResponse.json(
        { error: { message: "Device already authorized" } },
        { status: 400 }
      );
    }

    // Authorize the device
    deviceAuth.userId = userId;
    deviceCodes.set(deviceCodeKey, deviceAuth);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { message: "Invalid input", details: error.errors } },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}