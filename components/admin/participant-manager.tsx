"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Participant {
  id: string
  display_name: string
  email: string
  created_at: string
  is_admin?: boolean
}

export default function ParticipantManager() {
  const supabase = createClient()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    getCurrentUser()
    fetchParticipants()
  }, [])

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser({ id: user.id, email: user.email || "" })
    }
  }

  const fetchParticipants = async () => {
    try {
      const { data: competition } = await supabase.from("competitions").select("id").single()

      if (competition) {
        const { data, error } = await supabase.from("participants").select("*").eq("competition_id", competition.id)

        if (error) throw error
        setParticipants(data || [])
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAdminAsParticipant = async () => {
    if (!currentUser) {
      alert("Could not identify current user")
      return
    }

    setIsLoading(true)

    try {
      // Get competition
      const { data: competition } = await supabase.from("competitions").select("id").single()

      if (!competition) throw new Error("No competition found")

      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("*")
        .eq("id", currentUser.id)
        .eq("competition_id", competition.id)
        .single()

      if (existingParticipant) {
        alert("You are already registered as a participant!")
        return
      }

      // Create admin as participant with a default display name
      const adminDisplayName = currentUser.email.split("@")[0] || "Admin"

      const { error: participantError } = await supabase.from("participants").insert([
        {
          id: currentUser.id,
          competition_id: competition.id,
          display_name: adminDisplayName,
          email: currentUser.email,
        },
      ])

      if (participantError) throw participantError

      await fetchParticipants()
      alert("You have been added as a participant! You can now select stocks.")
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error adding admin as participant")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
      })

      if (authError) throw authError

      // Get competition
      const { data: competition } = await supabase.from("competitions").select("id").single()

      if (!competition) throw new Error("No competition found")

      // Create participant record
      const { error: participantError } = await supabase.from("participants").insert([
        {
          id: authData.user.id,
          competition_id: competition.id,
          display_name: formData.display_name,
          email: formData.email,
        },
      ])

      if (participantError) throw participantError

      setFormData({ display_name: "", email: "", password: "" })
      await fetchParticipants()
      alert("Participant added successfully!")
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error adding participant")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveParticipant = async (id: string) => {
    if (!confirm("Are you sure you want to remove this participant?")) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(id)
      if (error) throw error
      await fetchParticipants()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error removing participant")
    }
  }

  const adminIsParticipant = participants.some((p) => p.id === currentUser?.id)

  return (
    <div className="space-y-6">
      {!adminIsParticipant && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>You are not yet registered as a participant in this competition.</span>
            <Button onClick={handleAddAdminAsParticipant} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Yourself as Participant"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {adminIsParticipant && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription>
            ✓ You are registered as a participant:{" "}
            <strong>{participants.find((p) => p.id === currentUser?.id)?.display_name}</strong>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Participant</CardTitle>
          <CardDescription>Create a new participant account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddParticipant} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Participant"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>Manage existing participants</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    {participant.display_name}
                    {participant.id === currentUser?.id && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
                    )}
                  </TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{new Date(participant.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveParticipant(participant.id)}>
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
