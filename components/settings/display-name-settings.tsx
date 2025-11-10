"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface DisplayNameSettingsProps {
  userId: string
}

export default function DisplayNameSettings({ userId }: DisplayNameSettingsProps) {
  const supabase = createClient()
  const [displayName, setDisplayName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase.from("participants").select("display_name").eq("id", userId).single()

      if (error) {
        setError("Failed to load user data")
        return
      }

      if (data) {
        setDisplayName(data.display_name)
      }
    } catch (err) {
      console.error("Error fetching user data:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage("")
    setError("")

    try {
      if (!displayName.trim()) {
        setError("Display name cannot be empty")
        setIsSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from("participants")
        .update({ display_name: displayName.trim() })
        .eq("id", userId)

      if (updateError) {
        setError("Failed to update display name")
        console.error("Update error:", updateError)
        return
      }

      setSaveMessage("Display name updated successfully!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (err) {
      console.error("Error saving display name:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Display Name</CardTitle>
              <CardDescription>This name will appear on the leaderboard and in competition rankings</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      maxLength={50}
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}

                  <Button type="submit" disabled={isSaving || isLoading} className="w-full">
                    {isSaving ? "Saving..." : "Save Display Name"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
