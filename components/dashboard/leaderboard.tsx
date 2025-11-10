"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatNumber } from "@/lib/format-currency"

interface LeaderboardProps {
  userId: string
}

interface ParticipantScore {
  id: string
  display_name: string
  totalInvested: number
  totalCurrent: number
  totalGain: number
  percentGain: number
  rank: number
}

export default function Leaderboard({ userId }: LeaderboardProps) {
  const supabase = createClient()
  const [leaderboard, setLeaderboard] = useState<ParticipantScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRank, setUserRank] = useState<ParticipantScore | null>(null)

  useEffect(() => {
    refreshLeaderboard()
    const interval = setInterval(refreshLeaderboard, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const refreshLeaderboard = async () => {
    try {
      // Get all participants in current competition
      const { data: competition } = await supabase.from("competitions").select("id").single()

      if (!competition) return

      const { data: participants } = await supabase
        .from("participants")
        .select("*")
        .eq("competition_id", competition.id)

      if (!participants) {
        setIsLoading(false)
        return
      }

      // Calculate scores for each participant
      const scores: ParticipantScore[] = []

      for (const participant of participants) {
        const { data: picks } = await supabase.from("stock_picks").select("*").eq("participant_id", participant.id)

        let totalInvested = 0
        let totalCurrent = 0

        if (picks) {
          for (const pick of picks) {
            try {
              const response = await fetch(`/api/current-price?ticker=${pick.ticker}`)
              const data = await response.json()

              if (data.price) {
                const entryValue = (pick.entry_price || 0) * (pick.quantity || 0)
                const currentValue = data.price * (pick.quantity || 0)

                totalInvested += entryValue
                totalCurrent += currentValue
              }
            } catch (error) {
              console.error(`Error fetching price for ${pick.ticker}:`, error)
            }
          }
        }

        const totalGain = totalCurrent - totalInvested
        const percentGain = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

        scores.push({
          id: participant.id,
          display_name: participant.display_name,
          totalInvested,
          totalCurrent,
          totalGain,
          percentGain,
          rank: 0, // Will be set after sorting
        })
      }

      // Sort by percentage gain (descending)
      scores.sort((a, b) => b.percentGain - a.percentGain)

      // Add ranks
      scores.forEach((score, index) => {
        score.rank = index + 1
      })

      // Find current user's rank
      const currentUser = scores.find((s) => s.id === userId)
      if (currentUser) {
        setUserRank(currentUser)
      }

      setLeaderboard(scores)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
          <CardDescription>All participants ranked by percentage return</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-muted-foreground">No participants yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.id === userId
                const isPositive = entry.percentGain >= 0

                return (
                  <Link key={entry.id} href={`/portfolio/${entry.id}`}>
                    <div
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted ${
                        isCurrentUser ? "bg-blue-50 border-blue-200" : "hover:border-primary"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            entry.rank === 1
                              ? "bg-yellow-500"
                              : entry.rank === 2
                                ? "bg-gray-400"
                                : entry.rank === 3
                                  ? "bg-orange-600"
                                  : "bg-slate-400"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {entry.display_name}
                            {isCurrentUser && " (You)"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(entry.totalInvested)} invested
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}
                          {formatNumber(entry.percentGain, 2)}%
                        </p>
                        <p className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}
                          {formatCurrency(entry.totalGain)}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current User Rank */}
      {userRank && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">#{userRank.rank}</p>
                <p className="text-muted-foreground">out of {leaderboard.length || "..."}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {userRank.percentGain >= 0 ? "+" : ""}
                  {formatNumber(userRank.percentGain, 2)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {userRank.percentGain >= 0 ? "+" : ""}
                  {formatCurrency(userRank.totalGain)} gain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
