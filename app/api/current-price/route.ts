import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Cache for prices to avoid too many API calls
const priceCache: Record<string, { price: number; timestamp: number }> = {}
const CACHE_DURATION = 60 * 1000 // 1 minute

async function getYahooFinanceCurrentPrice(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`

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
      const closes = result.indicators.quote[0].close

      // Get the most recent close price
      if (closes && closes.length > 0) {
        const price = closes[closes.length - 1]
        if (price) {
          return price
        }
      }
    }

    throw new Error(`No price data found for ${ticker}`)
  } catch (error) {
    throw new Error(`Yahoo Finance error: ${error instanceof Error ? error.message : "Failed to fetch price"}`)
  }
}

async function getAlphaVantageCurrentPrice(ticker: string, apiKey: string) {
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`,
  )

  const data = await response.json()

  if (data["Error Message"]) {
    throw new Error(data["Error Message"])
  }

  const globalQuote = data["Global Quote"]
  if (!globalQuote) {
    throw new Error(`No data found for ticker: ${ticker}`)
  }

  const price = Number.parseFloat(globalQuote["05. price"])

  if (!price || isNaN(price)) {
    throw new Error("Invalid price data")
  }

  return price
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ticker = searchParams.get("ticker")

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
  }

  // Check cache first
  const cached = priceCache[ticker.toUpperCase()]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ price: cached.price })
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

    // Get current competition to check price provider
    const { data: competition } = await supabase.from("competitions").select("price_provider").single()
    const provider = competition?.price_provider || "alpha_vantage"

    let price: number

    if (provider === "yahoo_finance") {
      price = await getYahooFinanceCurrentPrice(ticker)
    } else {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 })
      }
      price = await getAlphaVantageCurrentPrice(ticker, apiKey)
    }

    // Cache the price
    priceCache[ticker.toUpperCase()] = {
      price,
      timestamp: Date.now(),
    }

    return NextResponse.json({ price })
  } catch (error) {
    console.error("[v0] Error fetching current price:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch current price"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
