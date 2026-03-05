import Sidebar from "@/components/layout/Sidebar"
import MobileNav from "@/components/layout/MobileNav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 overflow-y-auto pb-16 md:pb-0 min-h-0 overscroll-contain">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
