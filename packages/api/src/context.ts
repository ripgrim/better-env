import type { NextRequest } from "next/server";
import { auth } from "@better-env/auth/server";
import { db, cliToken, user } from "@better-env/db";
import { eq, and, gt } from "drizzle-orm";

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");

  let clientIP = forwarded || realIP || cfConnectingIP || "unknown";

  if (clientIP && clientIP.includes(",")) {
    clientIP = clientIP.split(",")[0].trim();
  }

  return clientIP;
}

async function validateCliToken(token: string) {
  if (!token || !token.startsWith("cli_")) {
    return null;
  }

  try {
    const [tokenRecord] = await db
      .select({
        id: cliToken.id,
        userId: cliToken.userId,
        name: cliToken.name,
        expiresAt: cliToken.expiresAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(cliToken)
      .innerJoin(user, eq(cliToken.userId, user.id))
      .where(
        and(
          eq(cliToken.token, token),
          gt(cliToken.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return null;
    }

    // Update last used timestamp
    await db
      .update(cliToken)
      .set({ lastUsedAt: new Date() })
      .where(eq(cliToken.id, tokenRecord.id));

    return {
      token: {
        id: tokenRecord.id,
        name: tokenRecord.name,
        expiresAt: tokenRecord.expiresAt,
      },
      user: tokenRecord.user,
    };
  } catch (error) {
    return null;
  }
}

export async function createContext(req: NextRequest) {
  const clientIP = getClientIP(req);
  
  // Try to get CLI token (for CLI auth)
  const authHeader = req.headers.get("authorization");
  const cliTokenString = authHeader?.replace("Bearer ", "");
  const cliAuth = cliTokenString ? await validateCliToken(cliTokenString) : null;

  // Check if this is a CLI-only endpoint to avoid consuming request body
  let session = null;
  const isCLIOnlyEndpoint = req.url.includes('/api/trpc/cli.') &&
                            !req.url.includes('/api/trpc/cli.authorizeDevice');
  
  // Only get session for endpoints that need web authentication
  // Skip CLI-only endpoints to prevent request body consumption issues
  if (!isCLIOnlyEndpoint) {
    try {
      session = await auth.api.getSession({
        headers: req.headers,
      });
    } catch (error) {
      // Session retrieval failed, continue without session
    }
  }

  return {
    session,
    cliAuth,
    clientIP,
    req,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
