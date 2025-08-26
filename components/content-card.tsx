import Link from "next/link"
import { Card, Button } from "@/components/ui-kit"
import { Badge } from "@/components/ui/badge"
import type { Content } from "@/lib/types"

export default function ContentCard({
  content,
}: {
  content: Content
}) {
  return (
    <Card className="rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video w-full bg-muted/50">
        <img
          src={content.thumbnailUrl || "/placeholder.svg"}
          alt={`${content.title} thumbnail`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-medium truncate">{content.title}</h4>
          <Badge variant="outline">
            {content.requiredTokens}
            {" TOKENS"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{content.description}</p>
        <div className="mt-3">
          <Link href={`/content/${content.id}`}>
            <Button variant="secondary" className="w-full">
              {"View"}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
