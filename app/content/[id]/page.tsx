"use client";
import SiteHeader from "@/components/site-header";
import { CONTENT, CREATORS } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

const BuyContent = dynamic(() => import("@/components/buy-content"), {
  ssr: false,
});

export default function ContentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const item = CONTENT.find((c) => c.id === params.id);
  if (!item) return notFound();
  const creator = CREATORS.find((cr) => cr.id === item.creatorId);

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 grid gap-6">
        <div className="grid gap-4">
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          <div className="text-sm text-muted-foreground">
            Required Tokens: {item.requiredTokens}
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <img
            src={item.thumbnailUrl || "/placeholder.svg"}
            alt={`${item.title} thumbnail`}
            className="w-full rounded-xl object-cover"
          />
          <div className="grid gap-4">
            <div>
              <h2 className="font-semibold">Description</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            </div>
            {creator && (
              <div>
                <h3 className="font-semibold">Creator</h3>
                <div className="mt-1 text-sm">
                  {creator.name} • {creator.symbol}
                </div>
              </div>
            )}
            <BuyContent
              requiredTokens={item.requiredTokens}
              creatorName={creator?.name}
              creatorSymbol={creator?.symbol}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
