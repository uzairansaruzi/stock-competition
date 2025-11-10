"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ManualPrice {
  id: string
  ticker: string
  price: number
}

export default function ManualPricesManager() {
  const supabase = createClient()
  const [prices, setPrices] = useState<ManualPrice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [competitionId, setCompetitionId] = useState<string>("")
  const [formData, setFormData] = useState({
    ticker: "",
    price: "",
  })

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      const { data: competition } = await supabase.from("competitions").select("id").single()

      if (competition) {
        setCompetitionId(competition.id)
        const { data, error } = await supabase
          .from("manual_entry_prices")
          .select("*")
          .eq("competition_id", competition.id)
          .order("ticker")

        if (error) throw error
        setPrices(data || [])
      }
    } catch (error) {
      console.error("Error fetching manual prices:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!competitionId || !formData.ticker || !formData.price) {
      alert("Please fill in all fields")
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase.from("manual_entry_prices").insert([
        {
          competition_id: competitionId,
          ticker: formData.ticker.toUpperCase(),
          price: Number.parseFloat(formData.price),
        },
      ])

      if (error) {
        if (error.code === "23505") {
          alert(`Price for ${formData.ticker.toUpperCase()} already exists. Use update to modify.`)
        } else {
          throw error
        }
      } else {
        setFormData({ ticker: "", price: "" })
        await fetchPrices()
        alert("Price added successfully!")
      }
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error adding price")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePrice = async (id: string, newPrice: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase
        .from("manual_entry_prices")
        .update({ price: Number.parseFloat(newPrice), updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      await fetchPrices()
      alert("Price updated successfully!")
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error updating price")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePrice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this price?")) return

    try {
      setIsLoading(true)
      const { error } = await supabase.from("manual_entry_prices").delete().eq("id", id)

      if (error) throw error
      await fetchPrices()
      alert("Price deleted successfully!")
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error deleting price")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Manual Entry Price</CardTitle>
          <CardDescription>
            Set entry prices for stocks manually. Use this when API fails or you want specific prices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPrice} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ticker">Ticker Symbol</Label>
              <Input
                id="ticker"
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                placeholder="AAPL"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Entry Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="150.50"
                required
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Price"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Entry Prices</CardTitle>
          <CardDescription>Manage manually set entry prices for the competition</CardDescription>
        </CardHeader>
        <CardContent>
          {prices.length === 0 ? (
            <p className="text-muted-foreground">No manual prices set yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-semibold">{price.ticker}</TableCell>
                    <TableCell>${price.price.toFixed(2)}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPrice = prompt("Enter new price:", price.price.toString())
                          if (newPrice !== null) {
                            handleUpdatePrice(price.id, newPrice)
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeletePrice(price.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
