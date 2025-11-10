import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import ParticipantPortfolio from "@/components/portfolio/participant-portfolio"

export default async function PortfolioViewPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Verify participant exists
  const { data: participant } = await supabase.from("participants").select("*").eq("id", params.id).single()

  if (!participant) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <ParticipantPortfolio participantId={params.id} participantName={participant.display_name} />
      </div>
    </div>
  )
}
