import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Simple admin check - in production, you'd verify against an admin table
  const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || []

  if (error || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard />
    </div>
  )
}
