import { NextRequest, NextResponse } from "next/server"
import { db, cliToken, user, project, environmentVariable } from "@better-env/db"
import { eq, and, gt, count } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get CLI token from Authorization header
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token || !token.startsWith("cli_")) {
      return NextResponse.json({ error: "Invalid CLI token" }, { status: 401 })
    }

    // Verify CLI token
    const [tokenRecord] = await db
      .select({
        userId: cliToken.userId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
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

    // Update last used timestamp
    await db
      .update(cliToken)
      .set({ lastUsedAt: new Date() })
      .where(eq(cliToken.token, token))

    // Await params
    const { id } = await params

    // Fetch specific project
    const [projectData] = await db
      .select({
        id: project.id,
        name: project.name,
        logoUrl: project.logoUrl,
        ownerId: project.ownerId,
        organizationId: project.organizationId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        envCount: count(environmentVariable.id).as("envCount"),
      })
      .from(project)
      .leftJoin(environmentVariable, eq(environmentVariable.projectId, project.id))
      .where(and(
        eq(project.id, id),
        eq(project.ownerId, tokenRecord.userId)
      ))
      .groupBy(project.id)
      .limit(1)

    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: projectData,
    })
  } catch (error) {
    console.error("Failed to fetch CLI project:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    )
  }
}
