import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Heart, Users, ArrowLeft, Tag, Pencil } from "lucide-react"
import { formatNumber, formatDate } from "@/lib/utils"
import LikeButton from "@/components/character/LikeButton"

interface CharacterDetailProps {
  params: Promise<{ id: string }>
}

export default async function CharacterDetailPage({ params }: CharacterDetailProps) {
  const { id } = await params

  const character = await db.character.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, avatar: true, username: true } },
      _count: { select: { likes: true, conversations: true } },
    },
  })

  const demoUser = await db.user.findFirst({ where: { email: "demo@persona.ai" } })
  const isOwner = demoUser?.id === character?.creatorId

  if (!character) notFound()

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Back */}
      <Link href="/home">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      {/* Banner + Avatar */}
      <div className="relative">
        <div className="h-40 rounded-2xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-orange-500/30 overflow-hidden">
          {character.banner && (
            <Image src={character.banner} alt="banner" fill className="object-cover" />
          )}
        </div>
        <div className="absolute -bottom-10 left-6">
          <Avatar className="h-20 w-20 border-4 border-background">
            <AvatarImage src={character.avatar ?? ""} alt={character.name} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
              {character.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Info */}
      <div className="pt-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{character.name}</h1>
              <Badge variant="outline">{character.category}</Badge>
              {character.isNSFW && <Badge variant="destructive">18+</Badge>}
              {character.isFeatured && (
                <Badge className="bg-yellow-500 text-black">Featured</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">{character.description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <LikeButton characterId={character.id} likeCount={character._count.likes} />
            {isOwner && (
              <Link href={`/character/${character.id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
            <Link href={`/chat/${character.id}`}>
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            {formatNumber(character.interactionCount)} chats
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            {formatNumber(character._count.likes)} likes
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {formatNumber(character._count.conversations)} users
          </span>
        </div>
      </div>

      {/* Greeting */}
      <div className="bg-muted rounded-xl p-4">
        <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">
          Opening Greeting
        </p>
        <p className="text-sm leading-relaxed">"{character.greeting}"</p>
      </div>

      {/* Personality */}
      <div>
        <h2 className="font-semibold mb-2">Personality</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{character.personality}</p>
      </div>

      {/* Backstory */}
      {character.backstory && (
        <div>
          <h2 className="font-semibold mb-2">Backstory</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{character.backstory}</p>
        </div>
      )}

      {/* Tags */}
      {character.tags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4" />
            <h2 className="font-semibold">Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {character.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Creator */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">
          Created by
        </p>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={character.creator.avatar ?? ""} />
            <AvatarFallback>{character.creator.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{character.creator.name}</p>
            {character.creator.username && (
              <p className="text-xs text-muted-foreground">@{character.creator.username}</p>
            )}
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDate(character.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )
}
