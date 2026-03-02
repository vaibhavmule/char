import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().min(10).max(500).optional(),
  personality: z.string().min(10).max(1000).optional(),
  backstory: z.string().max(2000).nullable().optional(),
  greeting: z.string().min(5).max(500).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  avatar: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  isNSFW: z.boolean().optional(),
})

// GET single character
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const character = await db.character.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatar: true, username: true } },
        _count: { select: { likes: true, conversations: true } },
      },
    })

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 })
    }

    return NextResponse.json(character)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch character" }, { status: 500 })
  }
}

// PATCH update character
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)

    const character = await db.character.update({
      where: { id },
      data: {
        ...data,
        category: data.category as any,
      },
    })

    return NextResponse.json(character)
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update character" }, { status: 500 })
  }
}

// DELETE character
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.character.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete character" }, { status: 500 })
  }
}
