"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CompetitionSetup from "./competition-setup"
import ParticipantManager from "./participant-manager"
import ManualPricesManager from "./manual-prices-manager"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("competition")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage stock competition configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="competition">Competition Setup</TabsTrigger>
          <TabsTrigger value="participants">Manage Participants</TabsTrigger>
          <TabsTrigger value="prices">Manual Entry Prices</TabsTrigger>
        </TabsList>

        <TabsContent value="competition" className="mt-6">
          <CompetitionSetup />
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <ParticipantManager />
        </TabsContent>

        <TabsContent value="prices" className="mt-6">
          <ManualPricesManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
