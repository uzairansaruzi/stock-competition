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

  try {
    const { data: competition } = await supabase.from("competitions").select("id").single()

    if (competition?.id) {
      const {
        data: existingParticipant,
        error: participantFetchError,
      } = await supabase
        .from("participants")
        .select("id")
        .eq("id", user.id)
        .eq("competition_id", competition.id)
        .maybeSingle()

      if (!existingParticipant && !participantFetchError) {
        const defaultDisplayName =
          (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
          user.email?.split("@")[0] ||
          "Participant"

        await supabase.from("participants").insert({
          id: user.id,
          competition_id: competition.id,
          display_name: defaultDisplayName,
          email: user.email ?? "",
        })
      }
    }
  } catch (ensureError) {
    console.error("Failed to ensure participant record", ensureError)
  }

  return (
    <div className="min-h-screen bg-background">
      <Dashboard userId={user.id} />
    </div>
  )
}
