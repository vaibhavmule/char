import { db } from "@/lib/db"
import CharacterCard from "@/components/character/CharacterCard"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Category } from "@/types"

const categories: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Anime", value: "ANIME" },
  { label: "Game", value: "GAME" },
  { label: "Movie", value: "MOVIE" },
  { label: "Book", value: "BOOK" },
  { label: "Celebrity", value: "CELEBRITY" },
  { label: "Historical", value: "HISTORICAL" },
  { label: "Assistant", value: "ASSISTANT" },
  { label: "Roleplay", value: "ROLEPLAY" },
  { label: "Other", value: "OTHER" },
]

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string; category?: string }>
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const { q, category } = await searchParams

  const characters = await db.character.findMany({
    where: {
      isPublic: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { has: q } },
        ],
      }),
      ...(category && { category: category as Category }),
    },
    include: { creator: true, _count: { select: { likes: true } } },
    orderBy: { interactionCount: "desc" },
  })

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Discover Characters</h1>
        <p className="text-muted-foreground text-sm">Find your perfect AI companion</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <form>
          {category && <input type="hidden" name="category" value={category} />}
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search characters..."
            className="pl-10"
          />
        </form>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <a key={cat.value} href={
            cat.value
              ? `/discover?category=${cat.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`
              : q ? `/discover?q=${encodeURIComponent(q)}` : "/discover"
          }>
            <Badge
              variant={category === cat.value || (!category && !cat.value) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {cat.label}
            </Badge>
          </a>
        ))}
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {characters.length} character{characters.length !== 1 ? "s" : ""} found
        </p>
        {characters.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">No characters found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
