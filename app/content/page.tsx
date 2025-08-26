import SiteHeader from "@/components/site-header";
import ContentCard from "@/components/content-card";
import { CONTENT } from "@/lib/mock-data";

export default function ContentIndexPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Content</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT.map((c) => (
            <ContentCard key={c.id} content={c} />
          ))}
        </div>
      </main>
    </div>
  );
}
