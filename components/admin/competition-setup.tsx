"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Competition {
  id: string
  name: string
  start_date: string
  end_date: string
  entry_price_date: string
  price_provider: string
  refresh_interval: number
}

export default function CompetitionSetup() {
  const supabase = createClient()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    entry_price_date: "2026-01-01",
    price_provider: "alpha_vantage",
    refresh_interval: 60,
  })

  useEffect(() => {
    fetchCompetition()
  }, [])

  const fetchCompetition = async () => {
    try {
      const { data, error } = await supabase.from("competitions").select("*").single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setCompetition(data)
        setFormData(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (competition?.id) {
        // Update existing
        const { error } = await supabase.from("competitions").update(formData).eq("id", competition.id)
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase.from("competitions").insert([formData])
        if (error) throw error
      }
      await fetchCompetition()
      alert("Competition configuration saved!")
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error saving competition")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition Configuration</CardTitle>
        <CardDescription>Set up the stock competition parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Competition Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="2026 Stock Competition"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="entry_price_date">Entry Price Date</Label>
              <Input
                id="entry_price_date"
                type="date"
                value={formData.entry_price_date}
                onChange={(e) => setFormData({ ...formData, entry_price_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="price_provider">Stock Price Provider</Label>
            <select
              id="price_provider"
              value={formData.price_provider}
              onChange={(e) => setFormData({ ...formData, price_provider: e.target.value })}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="alpha_vantage">Alpha Vantage (Free, 5 calls/min)</option>
              <option value="yahoo_finance">Yahoo Finance (Better for historical data)</option>
            </select>
            <p className="text-sm text-muted-foreground">
              {formData.price_provider === "alpha_vantage"
                ? "Limited to 5 API calls per minute"
                : "Yahoo Finance provides more reliable historical data"}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="refresh_interval">Dashboard Refresh Interval (seconds)</Label>
            <Input
              id="refresh_interval"
              type="number"
              min="5"
              max="300"
              value={formData.refresh_interval}
              onChange={(e) => setFormData({ ...formData, refresh_interval: Number(e.target.value) })}
              placeholder="60"
            />
            <p className="text-sm text-muted-foreground">
              How often the dashboard automatically refreshes (between 5 and 300 seconds)
            </p>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
