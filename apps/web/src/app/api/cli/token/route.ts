import { NextRequest, NextResponse } from "next/server"
import { auth } from "@better-env/auth/server"
import { db, cliToken } from "@better-env/db"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Token name is required" }, { status: 400 })
    }

    const token = `cli_${nanoid(32)}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const [newToken] = await db
      .insert(cliToken)
      .values({
        id: nanoid(),
        userId: session.user.id,
        name,
        token,
        expiresAt,
        createdAt: new Date(),
        lastUsedAt: null,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: {
        id: newToken.id,
        name: newToken.name,
        token: newToken.token,
        expiresAt: newToken.expiresAt,
      },
    })
  } catch (error) {
    console.error("Failed to create CLI token:", error)
    return NextResponse.json(
      { error: "Failed to create CLI token" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tokens = await db
      .select({
        id: cliToken.id,
        name: cliToken.name,
        createdAt: cliToken.createdAt,
        lastUsedAt: cliToken.lastUsedAt,
        expiresAt: cliToken.expiresAt,
      })
      .from(cliToken)
      .where(eq(cliToken.userId, session.user.id))
      .orderBy(cliToken.createdAt)

    return NextResponse.json({
      success: true,
      data: tokens,
    })
  } catch (error) {
    console.error("Failed to fetch CLI tokens:", error)
    return NextResponse.json(
      { error: "Failed to fetch CLI tokens" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get("id")

    if (!tokenId) {
      return NextResponse.json({ error: "Token ID is required" }, { status: 400 })
    }

    await db
      .delete(cliToken)
      .where(and(eq(cliToken.id, tokenId), eq(cliToken.userId, session.user.id)))

    return NextResponse.json({
      success: true,
      message: "Token deleted successfully",
    })
  } catch (error) {
    console.error("Failed to delete CLI token:", error)
    return NextResponse.json(
      { error: "Failed to delete CLI token" },
      { status: 500 }
    )
  }
}
