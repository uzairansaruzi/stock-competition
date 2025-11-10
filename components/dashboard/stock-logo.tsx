"use client"

import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

const FALLBACK_COLORS = ["bg-blue-600", "bg-emerald-600", "bg-orange-500", "bg-purple-500", "bg-slate-600"]
const STORAGE_PREFIX = "stock-logo:"
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours
const PUBLIC_LOGO_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_API_KEY

type StoredLogo = {
  dataUrl: string
  expiresAt: number
}

type StockLogoProps = {
  ticker: string
  size?: number
  className?: string
}

const readFromStorage = (key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredLogo
    if (!parsed?.dataUrl || !parsed?.expiresAt) return null
    if (parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(key)
      return null
    }
    return parsed.dataUrl
  } catch {
    return null
  }
}

const writeToStorage = (key: string, dataUrl: string) => {
  if (typeof window === "undefined") return
  const entry: StoredLogo = {
    dataUrl,
    expiresAt: Date.now() + CACHE_TTL_MS,
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Ignore storage quota errors.
  }
}

const blobToDataUrl = async (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Unable to convert blob to data URL"))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

export function StockLogo({ ticker, size = 32, className }: StockLogoProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const normalizedTicker = ticker?.toUpperCase().trim() ?? ""
  const remoteUrl = useMemo(() => {
    if (!normalizedTicker || !PUBLIC_LOGO_TOKEN) return null
    return `https://img.logo.dev/ticker/${normalizedTicker.toLowerCase()}?token=${PUBLIC_LOGO_TOKEN}`
  }, [normalizedTicker])

  const fallbackColor = useMemo(() => {
    if (!normalizedTicker) return FALLBACK_COLORS[0]
    const index = normalizedTicker.charCodeAt(0) % FALLBACK_COLORS.length
    return FALLBACK_COLORS[index]
  }, [normalizedTicker])

  useEffect(() => {
    if (!remoteUrl || !normalizedTicker) {
      setHasError(true)
      return
    }

    setHasError(false)

    const cacheKey = `${STORAGE_PREFIX}${normalizedTicker}`
    const cached = readFromStorage(cacheKey)
    if (cached) {
      setSrc(cached)
      return
    }

    let cancelled = false

    const fetchLogo = async () => {
      try {
        const response = await fetch(remoteUrl, { cache: "force-cache" })
        if (!response.ok) throw new Error(`Logo.dev responded with ${response.status}`)
        const blob = await response.blob()
        const dataUrl = await blobToDataUrl(blob)
        if (!cancelled) {
          setSrc(dataUrl)
          writeToStorage(cacheKey, dataUrl)
        }
      } catch (error) {
        console.warn(`Failed to load logo for ${normalizedTicker}`, error)
        if (!cancelled) {
          setHasError(true)
        }
      }
    }

    fetchLogo()

    return () => {
      cancelled = true
    }
  }, [normalizedTicker, remoteUrl])

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full text-xs font-semibold text-white",
          fallbackColor,
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {normalizedTicker.slice(0, 3)}
      </div>
    )
  }

  return (
    <img
      key={normalizedTicker}
      src={src}
      alt={`${normalizedTicker} logo`}
      width={size}
      height={size}
      loading="lazy"
      className={cn("rounded-full border border-border bg-card object-contain", className)}
      onError={() => setHasError(true)}
    />
  )
}
