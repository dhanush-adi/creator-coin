import SiteHeader from "@/components/site-header"
import { Button, Card } from "@/components/ui-kit"
import { Badge } from "@/components/ui/badge"
import CreatorCard from "@/components/creator-card"
import { CREATORS } from "@/lib/mock-data"
import Link from "next/link"

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full">
          <div className="container mx-auto px-4 py-12 sm:py-20">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {"Web3 Creators"}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {"Mint influence. Unlock premium content."}
                </h1>
                <p className="text-muted-foreground text-lg max-w-prose">
                  {"Buy creator tokens to access exclusive drops, book sessions, and support your favorite creators."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/dashboard">
                    <Button className="rounded-xl">{"Sign In (Mock Wallet)"}</Button>
                  </Link>
                  <a href="#featured">
                    <Button variant="outline" className="rounded-xl bg-transparent">
                      {"Explore Creators"}
                    </Button>
                  </a>
                </div>
              </div>
              <Card className="rounded-2xl overflow-hidden shadow-sm">
                <img
                  src="https://picsum.photos/seed/hero-visual/1200/700"
                  alt="Hero visual"
                  className="w-full h-full object-cover"
                />
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Creators */}
        <section id="featured" className="w-full border-t bg-muted/30">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-semibold">{"Featured Creators"}</h2>
              <Link href="#featured" className="text-sm text-muted-foreground hover:text-foreground">
                {"View all"}
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CREATORS.map((c) => (
                <CreatorCard key={c.id} creator={c} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground">
          {"© "}
          {new Date().getFullYear()}
          {" CreatorTokens — UI demo only."}
        </div>
      </footer>
    </div>
  )
}
