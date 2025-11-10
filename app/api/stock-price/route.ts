import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getYahooFinancePrice(ticker: string, date: string) {
  try {
    // Yahoo Finance uses epoch timestamps
    const targetDate = new Date(date)
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - 365) // Get 1 year of history to be safe

    const startEpoch = Math.floor(startDate.getTime() / 1000)
    const endEpoch = Math.floor(targetDate.getTime() / 1000)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&period1=${startEpoch}&period2=${endEpoch}`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.chart.result && data.chart.result.length > 0) {
      const result = data.chart.result[0]
      const timestamps = result.timestamp
      const closes = result.indicators.quote[0].close

      // Find the closest date on or before the target date
      let closestIndex = -1
      const targetEpoch = Math.floor(targetDate.getTime() / 1000)

      for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i] <= targetEpoch) {
          closestIndex = i
        } else {
          break
        }
      }

      if (closestIndex >= 0 && closes[closestIndex]) {
        const price = closes[closestIndex]
        const priceDate = new Date(timestamps[closestIndex] * 1000).toISOString().split("T")[0]
        return { price, date: priceDate }
      }
    }

    throw new Error(`No price data found for ${ticker} on or before ${date}`)
  } catch (error) {
    throw new Error(`Yahoo Finance error: ${error instanceof Error ? error.message : "Failed to fetch price"}`)
  }
}

async function getAlphaVantagePrice(ticker: string, date: string, apiKey: string) {
  const response = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}`,
  )

  const data = await response.json()

  // Check for rate limit error
  if (data["Note"] || data["Information"]) {
    console.error("[v0] Alpha Vantage rate limit:", data)
    throw new Error("API rate limit reached. Please try again in a moment.")
  }

  if (data["Error Message"]) {
    console.error("[v0] Alpha Vantage error:", data["Error Message"])
    throw new Error(`Invalid ticker: ${ticker}`)
  }

  const timeSeries = data["Time Series (Daily)"]

  if (!timeSeries) {
    console.error("[v0] No time series data for ticker:", ticker, "Response:", data)
    throw new Error(`No data found for ticker: ${ticker}`)
  }

  // Find the price for the specified date or closest date before it
  let price = null
  let closestDate = null

  for (const [dataDate, dayData] of Object.entries(timeSeries)) {
    if (dataDate <= date) {
      if (!closestDate || dataDate > closestDate) {
        closestDate = dataDate
        price = Number.parseFloat((dayData as any)["4. close"])
      }
    }
  }

  if (!price) {
    console.error("[v0] No price data for specified date:", date, "Ticker:", ticker)
    throw new Error(`No price data available for ${ticker} on or before ${date}`)
  }

  return { price, date: closestDate }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get("ticker")
  const date = searchParams.get("date")

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    // Get current competition
    const { data: competition } = await supabase.from("competitions").select("id, price_provider").single()

    if (competition) {
      // Check for manual price first
      const { data: manualPrice } = await supabase
        .from("manual_entry_prices")
        .select("price")
        .eq("competition_id", competition.id)
        .eq("ticker", ticker.toUpperCase())
        .single()

      if (manualPrice) {
        console.log("[v0] Using manual entry price for", ticker, ":", manualPrice.price)
        return NextResponse.json({ price: manualPrice.price, date: date, source: "manual" })
      }
    }

    let priceData
    const provider = competition?.price_provider || "alpha_vantage"

    if (provider === "yahoo_finance") {
      priceData = await getYahooFinancePrice(ticker, date!)
    } else {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 })
      }
      priceData = await getAlphaVantagePrice(ticker, date!, apiKey)
    }

    console.log(`[v0] Got price for ${ticker} from ${provider}:`, priceData.price)
    return NextResponse.json({
      price: priceData.price,
      date: priceData.date,
      source: provider,
    })
  } catch (error) {
    console.error("[v0] Error fetching stock price:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch stock price"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
