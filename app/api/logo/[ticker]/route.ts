import { NextRequest, NextResponse } from "next/server"

const LOGO_API_BASE = "https://img.logo.dev/ticker/"
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours

type CacheEntry = {
  buffer: Buffer
  contentType: string
  expiresAt: number
}

const inMemoryCache = new Map<string, CacheEntry>()

const buildCacheHeaders = (contentType: string) => ({
  "Content-Type": contentType,
  "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
  "Access-Control-Allow-Origin": "*",
})

const fallbackLogo = (ticker: string) => {
  const initials = ticker.slice(0, 4).toUpperCase()
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <rect width="48" height="48" rx="12" fill="hsl(222, 47%, 11%)" />
      <text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="700">
        ${initials}
      </text>
    </svg>
  `.trim()

  return new NextResponse(svg, {
    status: 200,
    headers: buildCacheHeaders("image/svg+xml"),
  })
}

export async function GET(_request: NextRequest, context: { params: { ticker?: string } }) {
  const ticker = context.params.ticker?.trim()

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
  }

  const sanitizedTicker = ticker.toUpperCase()
  const remoteTicker = sanitizedTicker.toLowerCase()

  const cached = inMemoryCache.get(sanitizedTicker)
  if (cached && cached.expiresAt > Date.now()) {
    return new NextResponse(cached.buffer, {
      status: 200,
      headers: buildCacheHeaders(cached.contentType),
    })
  }

  const apiKey = process.env.LOGO_DEV_API_KEY
  if (!apiKey) {
    console.warn("LOGO_DEV_API_KEY is not configured")
    return fallbackLogo(sanitizedTicker)
  }

  const logoUrl = `${LOGO_API_BASE}${encodeURIComponent(remoteTicker)}?token=${apiKey}`

  try {
    const response = await fetch(logoUrl, {
      headers: { Accept: "image/*" },
      // Let Next.js cache the upstream response for the TTL duration.
      cache: "force-cache",
      next: { revalidate: CACHE_TTL_MS / 1000 },
    })

    if (!response.ok) {
      console.warn(`Logo.dev returned ${response.status} for ${sanitizedTicker}`)
      return fallbackLogo(sanitizedTicker)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = response.headers.get("content-type") ?? "image/png"

    inMemoryCache.set(sanitizedTicker, {
      buffer,
      contentType,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    return new NextResponse(buffer, {
      status: 200,
      headers: buildCacheHeaders(contentType),
    })
  } catch (error) {
    console.error(`Unable to fetch logo for ${sanitizedTicker}`, error)
    return fallbackLogo(sanitizedTicker)
  }
}
