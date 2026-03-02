import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Toggle like
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: characterId } = await params

    // Get demo user (replace with real auth later)
    let demoUser = await db.user.findFirst({ where: { email: "demo@persona.ai" } })
    if (!demoUser) {
      demoUser = await db.user.create({
        data: { name: "Demo User", email: "demo@persona.ai", username: "demo_user" },
      })
    }

    // Check if already liked
    const existing = await db.characterLike.findUnique({
      where: { userId_characterId: { userId: demoUser.id, characterId } },
    })

    if (existing) {
      // Unlike
      await db.characterLike.delete({ where: { id: existing.id } })
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await db.characterLike.create({
        data: { userId: demoUser.id, characterId },
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
