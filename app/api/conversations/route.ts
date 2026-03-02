import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET all conversations for demo user
export async function GET(req: NextRequest) {
  try {
    const demoUser = await db.user.findFirst({ where: { email: "demo@persona.ai" } })

    if (!demoUser) {
      return NextResponse.json([])
    }

    const conversations = await db.conversation.findMany({
      where: { userId: demoUser.id },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatar: true,
            description: true,
            category: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}
