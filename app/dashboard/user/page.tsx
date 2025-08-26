import SiteHeader from "@/components/site-header"
import UserDashboard from "@/components/user-dashboard"

export default function UserDashboardPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{"User Dashboard"}</h1>
        <UserDashboard />
      </main>
    </div>
  )
}