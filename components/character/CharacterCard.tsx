"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Heart, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNumber, truncate } from "@/lib/utils"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Character } from "@/types"

interface CharacterCardProps {
  character: Character
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(character._count?.likes ?? 0)
  const [likeLoading, setLikeLoading] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLikeLoading(true)
    try {
      const res = await fetch(`/api/characters/${character.id}/like`, { method: "POST" })
      const data = await res.json()
      setLiked(data.liked)
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1))
      toast.success(data.liked ? "Added to favorites!" : "Removed from favorites")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLikeLoading(false)
    }
  }

  return (
    <div className="group rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Avatar — click goes to chat */}
      <Link href={`/chat/${character.id}`}>
        <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 cursor-pointer">
          {character.avatar ? (
            <Image
              src={character.avatar}
              alt={character.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-5xl">
              {character.name.charAt(0)}
            </div>
          )}
          {character.isNSFW && (
            <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
              18+
            </Badge>
          )}
          {character.isFeatured && (
            <Badge className="absolute top-2 left-2 text-xs bg-yellow-500 text-black">
              Featured
            </Badge>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/chat/${character.id}`}>
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1 cursor-pointer">
              {character.name}
            </h3>
          </Link>
          <Badge variant="outline" className="text-xs shrink-0">
            {character.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {truncate(character.description, 80)}
        </p>

        {/* Stats + Actions */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 mr-1">
            <MessageSquare className="h-3 w-3" />
            {formatNumber(character.interactionCount)}
          </span>

          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors",
              liked
                ? "text-pink-500"
                : "hover:text-pink-500"
            )}
          >
            <Heart className={cn("h-3 w-3", liked && "fill-pink-500")} />
            {formatNumber(likeCount)}
          </button>

          {character.creator && (
            <span className="ml-auto truncate">by {character.creator.name}</span>
          )}

          {/* Detail page link */}
          <Link href={`/character/${character.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
              <Info className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
