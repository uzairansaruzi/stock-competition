import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Dashboard from "@/components/dashboard/dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Dashboard userId={user.id} />
    </div>
  )
}
