"use client"

import type React from "react"
import { formatCurrency } from "@/lib/format-currency"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StockPick {
  id: string
  ticker: string
  entry_price: number
  quantity: number
}

interface StockSelection {
  userId: string
}

export default function StockSelectionInterface({ userId }: StockSelection) {
  const supabase = createClient()
  const [stocks, setStocks] = useState<StockPick[]>([])
  const [ticker, setTicker] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [competition, setCompetition] = useState<any>(null)
  const [entryPrices, setEntryPrices] = useState<Record<string, number>>({})
  const [manualPriceSources, setManualPriceSources] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get competition
      const { data: comp } = await supabase.from("competitions").select("*").single()
      setCompetition(comp)

      // Get existing stock picks
      const { data: picks } = await supabase.from("stock_picks").select("*").eq("participant_id", userId)

      setStocks(picks || [])

      // Fetch entry prices for existing stocks
      if (picks && picks.length > 0) {
        const tickers = picks.map((p) => p.ticker)
        const prices: Record<string, number> = {}
        const sources: Record<string, boolean> = {}
        for (const t of tickers) {
          const { price, source } = await fetchStockPrice(t, comp?.entry_price_date)
          if (price) {
            prices[t] = price
            sources[t] = source === "manual"
          }
        }
        setEntryPrices(prices)
        setManualPriceSources(sources)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStockPrice = async (tickerSymbol: string, date: string) => {
    try {
      const response = await fetch(`/api/stock-price?ticker=${tickerSymbol}&date=${date}`)
      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Stock price fetch failed:", data.error)
        return { price: null, source: null }
      }

      return { price: data.price, source: data.source }
    } catch (error) {
      console.error("[v0] Error fetching price:", error)
      return { price: null, source: null }
    }
  }

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!competition) {
      alert("Competition has not been configured yet. Please ask the admin to set up the competition.")
      return
    }

    if (stocks.length >= 10) {
      alert("You can only pick 10 stocks!")
      return
    }

    if (stocks.some((s) => s.ticker.toUpperCase() === ticker.toUpperCase())) {
      alert("You already picked this stock!")
      return
    }

    setIsLoading(true)

    try {
      const { price, source } = await fetchStockPrice(ticker.toUpperCase(), competition?.entry_price_date)

      if (!price) {
        alert(
          "Could not find stock price for ticker: " +
            ticker.toUpperCase() +
            ". Please check:\n1. The ticker symbol is correct (e.g., AAPL, MSFT)\n2. The entry price date is correct\n3. Ask the admin to set a manual price in the admin panel\n4. Wait a moment and try again (API rate limits)",
        )
        setIsLoading(false)
        return
      }

      const quantity = 1000 / price

      const { error } = await supabase.from("stock_picks").insert([
        {
          participant_id: userId,
          competition_id: competition.id,
          ticker: ticker.toUpperCase(),
          entry_price: price,
          quantity,
        },
      ])

      if (error) throw error

      setEntryPrices({ ...entryPrices, [ticker.toUpperCase()]: price })
      setManualPriceSources({ ...manualPriceSources, [ticker.toUpperCase()]: source === "manual" })
      setTicker("")
      await fetchData()
      alert(`Stock added successfully! (${source === "manual" ? "Manual price" : "API price"})`)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error adding stock")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveStock = async (stockId: string) => {
    try {
      const { error } = await supabase.from("stock_picks").delete().eq("id", stockId)

      if (error) throw error
      await fetchData()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error removing stock")
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Select Your 10 Stocks</h1>
        {!competition ? (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">
              The competition has not been configured yet. Please ask the admin to set it up.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground mt-2">Entry price date: {competition?.entry_price_date}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Stock Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Stock</CardTitle>
            <CardDescription>Enter stock ticker symbol ({stocks.length}/10)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="ticker">Stock Ticker</Label>
                <Input
                  id="ticker"
                  placeholder="AAPL, MSFT, TSLA..."
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  disabled={stocks.length >= 10 || !competition}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading || stocks.length >= 10 || !competition} className="w-full">
                {!competition ? "Waiting for Competition Setup" : isLoading ? "Adding..." : "Add Stock"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stock List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Stock Picks</CardTitle>
          </CardHeader>
          <CardContent>
            {stocks.length === 0 ? (
              <p className="text-muted-foreground">No stocks selected yet</p>
            ) : (
              <div className="space-y-3">
                {stocks.map((stock) => (
                  <div key={stock.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Badge className="mb-2">{stock.ticker}</Badge>
                      {manualPriceSources[stock.ticker] && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Manual
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Entry: {formatCurrency(entryPrices[stock.ticker] || 0)} × {(stock.quantity || 0).toFixed(4)}{" "}
                        shares = {formatCurrency(1000)}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveStock(stock.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
