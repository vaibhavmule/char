import { db } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CharacterCard from "@/components/character/CharacterCard"
import { Crown, MessageSquare, Heart, Users, Edit } from "lucide-react"
import { formatNumber, formatDate } from "@/lib/utils"

async function getProfile() {
  const demoUser = await db.user.findFirst({
    where: { email: "demo@persona.ai" },
    include: {
      _count: {
        select: {
          characters: true,
          conversations: true,
          likes: true,
          followers: true,
          following: true,
        },
      },
    },
  })
  return demoUser
}

async function getUserCharacters(userId: string) {
  return db.character.findMany({
    where: { creatorId: userId },
    include: {
      creator: true,
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

async function getLikedCharacters(userId: string) {
  const likes = await db.characterLike.findMany({
    where: { userId },
    include: {
      character: {
        include: {
          creator: true,
          _count: { select: { likes: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return likes.map((l) => l.character)
}

export default async function ProfilePage() {
  const user = await getProfile()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No profile found. Start chatting first!</p>
      </div>
    )
  }

  const [characters, likedCharacters] = await Promise.all([
    getUserCharacters(user.id),
    getLikedCharacters(user.id),
  ])

  const planColors = {
    FREE: "secondary",
    PRO: "default",
    ULTRA: "destructive",
  } as const

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar ?? ""} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{user.name}</h1>
              <Badge variant={planColors[user.plan]}>
                {user.plan === "FREE" ? null : <Crown className="h-3 w-3 mr-1" />}
                {user.plan}
              </Badge>
            </div>
            {user.username && (
              <p className="text-muted-foreground text-sm">@{user.username}</p>
            )}
            {user.bio && (
              <p className="text-sm mt-1">{user.bio}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Joined {formatDate(user.createdAt)}
            </p>
          </div>

          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-xl font-bold">{formatNumber(user._count.characters)}</p>
            <p className="text-xs text-muted-foreground">Characters</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{formatNumber(user._count.conversations)}</p>
            <p className="text-xs text-muted-foreground">Chats</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{formatNumber(user._count.followers)}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{formatNumber(user._count.following)}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-4 flex items-center justify-between bg-muted rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{user.credits} credits remaining</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <Crown className="h-3 w-3" />
            Upgrade
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="characters">
        <TabsList className="w-full">
          <TabsTrigger value="characters" className="flex-1 gap-2">
            <Users className="h-4 w-4" />
            My Characters ({characters.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 gap-2">
            <Heart className="h-4 w-4" />
            Liked ({likedCharacters.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="mt-4">
          {characters.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="mb-2">No characters created yet</p>
              <a href="/character/create" className="text-primary text-sm hover:underline">
                Create your first character →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {characters.map((char) => (
                <CharacterCard key={char.id} character={char as any} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked" className="mt-4">
          {likedCharacters.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="mb-2">No liked characters yet</p>
              <a href="/discover" className="text-primary text-sm hover:underline">
                Discover characters →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {likedCharacters.map((char) => (
                <CharacterCard key={char.id} character={char as any} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
