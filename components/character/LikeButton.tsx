"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  characterId: string
  likeCount: number
  initialLiked?: boolean
}

export default function LikeButton({ characterId, likeCount, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(likeCount)
  const [loading, setLoading] = useState(false)

  const toggleLike = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/characters/${characterId}/like`, {
        method: "POST",
      })
      const data = await res.json()
      setLiked(data.liked)
      setCount((prev) => (data.liked ? prev + 1 : prev - 1))
      toast.success(data.liked ? "Added to favorites!" : "Removed from favorites")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLike}
      disabled={loading}
      className={cn("gap-2", liked && "border-pink-500 text-pink-500 hover:text-pink-500")}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-pink-500")} />
      {formatNumber(count)}
    </Button>
  )
}
