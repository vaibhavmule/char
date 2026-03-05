import { db } from "@/lib/db"
import CharacterCard from "@/components/character/CharacterCard"
import { Flame, Sparkles, Clock } from "lucide-react"

async function getFeaturedCharacters() {
  return db.character.findMany({
    where: { isPublic: true, isFeatured: true },
    include: { creator: true, _count: { select: { likes: true } } },
    orderBy: { interactionCount: "desc" },
    take: 8,
  })
}

async function getTrendingCharacters() {
  return db.character.findMany({
    where: { isPublic: true },
    include: { creator: true, _count: { select: { likes: true } } },
    orderBy: { interactionCount: "desc" },
    take: 12,
  })
}

async function getNewCharacters() {
  return db.character.findMany({
    where: { isPublic: true },
    include: { creator: true, _count: { select: { likes: true } } },
    orderBy: { createdAt: "desc" },
    take: 12,
  })
}

export default async function HomePage() {
  const [featured, trending, newChars] = await Promise.all([
    getFeaturedCharacters(),
    getTrendingCharacters(),
    getNewCharacters(),
  ])

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 md:space-y-10">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome to Persona</h1>
        <p className="text-white/80 text-base md:text-lg mb-4">
          Chat with thousands of AI characters. Create your own. Experience endless conversations.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <a
            href="/discover"
            className="bg-white text-purple-600 font-semibold px-5 py-2 rounded-lg hover:bg-white/90 transition-colors text-sm text-center"
          >
            Explore Characters
          </a>
          <a
            href="/character/create"
            className="bg-white/20 text-white font-semibold px-5 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm border border-white/30 text-center"
          >
            Create Character
          </a>
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold">Featured</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {featured.map((character) => (
              <CharacterCard key={character.id} character={character as any} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold">Trending</h2>
        </div>
        {trending.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No characters yet</p>
            <p className="text-sm">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {trending.map((character) => (
              <CharacterCard key={character.id} character={character as any} />
            ))}
          </div>
        )}
      </section>

      {/* New */}
      {newChars.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold">Recently Added</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {newChars.map((character) => (
              <CharacterCard key={character.id} character={character as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
