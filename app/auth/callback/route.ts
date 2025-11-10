import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const fallbackRedirect = (origin: string, path = "/auth/login") => {
  const sanitizedOrigin = origin?.replace(/\/$/, "") || ""
  return NextResponse.redirect(`${sanitizedOrigin}${path}`)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return fallbackRedirect(origin)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Failed to exchange Supabase code", error)
      return fallbackRedirect(origin, "/auth/login?error=verification")
    }
  } catch (error) {
    console.error("Unexpected error during Supabase callback", error)
    return fallbackRedirect(origin, "/auth/login?error=verification")
  }

  return fallbackRedirect(origin, "/dashboard")
}
