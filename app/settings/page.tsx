import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DisplayNameSettings from "@/components/settings/display-name-settings"

export default async function SettingsPage() {
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
      <DisplayNameSettings userId={user.id} />
    </div>
  )
}
