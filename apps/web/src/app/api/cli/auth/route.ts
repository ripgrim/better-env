import { NextRequest, NextResponse } from "next/server"
import { db, cliToken, user } from "@better-env/db"
import { eq, and, gt } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    if (!token.startsWith("cli_")) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
    }

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
      .limit(1)

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    await db
      .update(cliToken)
      .set({ lastUsedAt: new Date() })
      .where(eq(cliToken.id, tokenRecord.id))

    return NextResponse.json({
      success: true,
      data: {
        user: tokenRecord.user,
        token: {
          id: tokenRecord.id,
          name: tokenRecord.name,
          expiresAt: tokenRecord.expiresAt,
        },
      },
    })
  } catch (error) {
    console.error("Failed to authenticate CLI token:", error)
    return NextResponse.json(
      { error: "Failed to authenticate CLI token" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: "CLI Auth endpoint" })
}
