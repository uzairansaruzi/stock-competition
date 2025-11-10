"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/format-currency"
import { StockLogo } from "@/components/dashboard/stock-logo"

interface ParticipantPortfolioProps {
  participantId: string
  participantName: string
}

interface StockPosition {
  ticker: string
  entry_price: number
  current_price: number
  quantity: number
  dollar_gain: number
  percent_gain: number
}

export default function ParticipantPortfolio({ participantId, participantName }: ParticipantPortfolioProps) {
  const supabase = createClient()
  const [portfolio, setPortfolio] = useState<StockPosition[]>([])
  const [totals, setTotals] = useState({
    totalInvested: 0,
    totalCurrent: 0,
    totalGain: 0,
    percentGain: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    refreshPortfolio()
    const interval = setInterval(refreshPortfolio, 5000) // Auto-refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const refreshPortfolio = async () => {
    try {
      // Get participant's stock picks
      const { data: picks } = await supabase.from("stock_picks").select("*").eq("participant_id", participantId)

      if (!picks || picks.length === 0) {
        setPortfolio([])
        setIsLoading(false)
        return
      }

      // Fetch current prices for all stocks
      const positions: StockPosition[] = []
      let totalInvested = 0
      let totalCurrent = 0

      for (const pick of picks) {
        try {
          const response = await fetch(`/api/current-price?ticker=${pick.ticker}`)
          const data = await response.json()

          if (data.price) {
            const entryValue = 1000 // Entry value is always $1000 per stock with fractional shares
            const currentValue = data.price * (pick.quantity || 0)
            const dollarGain = currentValue - entryValue
            const percentGain = entryValue > 0 ? (dollarGain / entryValue) * 100 : 0

            positions.push({
              ticker: pick.ticker,
              entry_price: pick.entry_price || 0,
              current_price: data.price,
              quantity: pick.quantity || 0,
              dollar_gain: dollarGain,
              percent_gain: percentGain,
            })

            totalInvested += entryValue
            totalCurrent += currentValue
          }
        } catch (error) {
          console.error(`Error fetching price for ${pick.ticker}:`, error)
        }
      }

      const totalGain = totalCurrent - totalInvested
      const percentGain = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

      setPortfolio(positions)
      setTotals({
        totalInvested,
        totalCurrent,
        totalGain,
        percentGain,
      })
    } catch (error) {
      console.error("Error refreshing portfolio:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{participantName}'s Portfolio</h1>
        <p className="text-muted-foreground mt-2">View detailed holdings and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalInvested)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalCurrent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.totalGain >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totals.totalGain)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Return %</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold flex items-center gap-1 ${
                totals.percentGain >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {totals.percentGain >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {formatNumber(totals.percentGain, 2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Holdings</CardTitle>
          <CardDescription>Current performance of selected stocks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading portfolio...</p>
          ) : portfolio.length === 0 ? (
            <p className="text-muted-foreground">No stocks selected.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Ticker</th>
                    <th className="text-right py-3 px-4 font-semibold">Entry Price</th>
                    <th className="text-right py-3 px-4 font-semibold">Current Price</th>
                    <th className="text-right py-3 px-4 font-semibold">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold">Entry Value</th>
                    <th className="text-right py-3 px-4 font-semibold">Current Value</th>
                    <th className="text-right py-3 px-4 font-semibold">Gain/Loss</th>
                    <th className="text-right py-3 px-4 font-semibold">Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((position) => {
                    const entryValue = 1000 // Entry value is always $1000 per stock with fractional shares
                    const currentValue = position.current_price * position.quantity
                    const isPositive = position.dollar_gain >= 0

                    return (
                      <tr key={position.ticker} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <StockLogo ticker={position.ticker} size={32} className="shrink-0" />
                            <Badge>{position.ticker}</Badge>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{formatCurrency(position.entry_price)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(position.current_price)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(position.quantity, 4)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(entryValue)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(currentValue)}</td>
                        <td
                          className={`text-right py-3 px-4 font-semibold ${
                            isPositive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {formatCurrency(position.dollar_gain)}
                        </td>
                        <td
                          className={`text-right py-3 px-4 font-semibold ${
                            isPositive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {formatNumber(position.percent_gain, 2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
