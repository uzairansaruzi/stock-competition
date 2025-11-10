"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import PortfolioOverview from "./portfolio-overview"
import Leaderboard from "./leaderboard"

interface DashboardProps {
  userId: string
}

export default function Dashboard({ userId }: DashboardProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("overview")
  const [userInfo, setUserInfo] = useState<any>(null)
  const [refreshInterval, setRefreshInterval] = useState(60) // default 60 seconds
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchUserInfo()
    fetchRefreshInterval()

    // Set up auto-refresh based on admin-configured interval
    const interval = setInterval(fetchUserInfo, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const fetchRefreshInterval = async () => {
    try {
      const { data } = await supabase.from("competitions").select("refresh_interval").single()
      if (data?.refresh_interval) {
        setRefreshInterval(data.refresh_interval)
      }
    } catch (error) {
      console.error("Error fetching refresh interval:", error)
    }
  }

  const fetchUserInfo = async () => {
    try {
      const { data } = await supabase.from("participants").select("*").eq("id", userId).single()
      setUserInfo(data)
    } catch (error) {
      console.error("Error fetching user info:", error)
    }
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await fetchUserInfo()
    setIsRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{userInfo?.display_name || "Dashboard"}</h1>
              <p className="text-muted-foreground mt-1">Stock Competition 2026</p>
            </div>
            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="outline">Settings</Button>
              </Link>
              <Link href="/stock-picks">
                <Button variant="outline">Edit Picks</Button>
              </Link>
              <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="overview">My Portfolio</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Auto-refresh every {refreshInterval}s</span>
              <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing}>
                {isRefreshing ? "Refreshing..." : "Refresh Now"}
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="mt-0">
            <PortfolioOverview userId={userId} />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-0">
            <Leaderboard userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
