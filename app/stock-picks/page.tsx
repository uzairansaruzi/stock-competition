import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StockSelectionInterface from "@/components/stock-picks/stock-selection"

export default async function StockPicksPage() {
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
      <StockSelectionInterface userId={user.id} />
    </div>
  )
}
