import Link from "next/link"
import { Card } from "@/components/ui-kit"
import { Badge } from "@/components/ui/badge"
import type { Creator } from "@/lib/types"

export default function CreatorCard({
  creator,
}: {
  creator: Creator
}) {
  return (
    <Link href={`/creators/${creator.id}`} className="block group">
      <Card className="overflow-hidden rounded-2xl hover:shadow-lg transition-shadow">
        <div className="aspect-[3/2] w-full overflow-hidden">
          <img
            src={creator.bannerUrl || "/placeholder.svg"}
            alt={`${creator.name} banner`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4 flex items-start gap-3">
          <img
            src={creator.avatarUrl || "/placeholder.svg"}
            alt={`${creator.name} avatar`}
            className="h-12 w-12 rounded-full border"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{creator.name}</h3>
              <Badge variant="secondary">{creator.symbol}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{creator.bio}</p>
            <div className="mt-2 text-sm">
              <span className="font-medium">
                {creator.tokenPrice.toFixed(2)}
                {" USDC"}
              </span>
              <span className="text-muted-foreground">{" / token"}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
