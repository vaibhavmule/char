"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Pencil, Upload, X, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const schema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  personality: z.string().min(10).max(1000),
  backstory: z.string().max(2000).optional(),
  greeting: z.string().min(5).max(500),
  category: z.string(),
  isPublic: z.boolean(),
  isNSFW: z.boolean(),
})

type FormData = z.infer<typeof schema>

const categories = [
  "ANIME", "GAME", "MOVIE", "BOOK",
  "CELEBRITY", "HISTORICAL", "ASSISTANT", "ROLEPLAY", "OTHER",
]

export default function EditCharacterPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "OTHER", isPublic: true, isNSFW: false },
  })

  const isPublic = watch("isPublic")
  const isNSFW = watch("isNSFW")
  const selectedCategory = watch("category")

  // Load existing character data
  useEffect(() => {
    fetch(`/api/characters/${id}`)
      .then((res) => res.json())
      .then((data) => {
        reset({
          name: data.name,
          description: data.description,
          personality: data.personality,
          backstory: data.backstory ?? "",
          greeting: data.greeting,
          category: data.category,
          isPublic: data.isPublic,
          isNSFW: data.isNSFW,
        })
        setTags(data.tags ?? [])
        setAvatar(data.avatar ?? null)
      })
      .catch(() => toast.error("Failed to load character"))
      .finally(() => setFetching(false))
  }, [id, reset])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setAvatar(data.url)
      toast.success("Avatar updated!")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tags, avatar }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update character")
      }

      toast.success("Character updated!")
      router.push(`/character/${id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Pencil className="h-6 w-6 text-primary" />
          Edit Character
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your character's details
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <Card className="p-4">
          <Label className="text-sm font-semibold mb-3 block">Avatar</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                "?"
              )}
            </div>
            <div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading}
                onClick={() => document.getElementById("avatar-upload")?.click()}
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : avatar ? "Change Image" : "Upload Image"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </Card>

        {/* Basic Info */}
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div>
            <Label htmlFor="name">Character Name *</Label>
            <Input id="name" {...register("name")} className="mt-1" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Short Description *</Label>
            <Textarea id="description" {...register("description")} className="mt-1 h-20 resize-none" />
            {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <Label htmlFor="greeting">Opening Greeting *</Label>
            <Textarea id="greeting" {...register("greeting")} className="mt-1 h-20 resize-none" />
            {errors.greeting && <p className="text-destructive text-xs mt-1">{errors.greeting.message}</p>}
          </div>
        </Card>

        {/* Personality */}
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold">Personality & Backstory</h2>

          <div>
            <Label htmlFor="personality">Personality *</Label>
            <Textarea id="personality" {...register("personality")} className="mt-1 h-28 resize-none" />
            {errors.personality && <p className="text-destructive text-xs mt-1">{errors.personality.message}</p>}
          </div>

          <div>
            <Label htmlFor="backstory">Backstory (Optional)</Label>
            <Textarea id="backstory" {...register("backstory")} className="mt-1 h-28 resize-none" />
          </div>
        </Card>

        {/* Category & Tags */}
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold">Category & Tags</h2>

          <div>
            <Label className="mb-2 block">Category *</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setValue("category", cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Tags (up to 10)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold">Settings</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Public Character</p>
              <p className="text-xs text-muted-foreground">Allow others to discover and chat</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={(val) => setValue("isPublic", val)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">NSFW Content</p>
              <p className="text-xs text-muted-foreground">This character contains mature content (18+)</p>
            </div>
            <Switch checked={isNSFW} onCheckedChange={(val) => setValue("isNSFW", val)} />
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pb-6">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
