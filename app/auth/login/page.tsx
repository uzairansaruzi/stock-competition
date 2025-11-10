"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const getRedirectUrl = () => {
    const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    const baseRedirectUrl =
      process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.length > 0
        ? process.env.NEXT_PUBLIC_SITE_URL
        : fallbackOrigin

    try {
      return new URL("/auth/callback", baseRedirectUrl).toString()
    } catch {
      return `${fallbackOrigin.replace(/\/$/, "")}/auth/callback`
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters")
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectUrl(),
          },
        })
        if (error) throw error
        setSuccess("Account created! Check your email to confirm your account.")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Unable to start Google sign in")
      setIsGoogleLoading(false)
    }
    // Supabase redirects on success, so we intentionally do not reset the loading state.
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Stock Competition</CardTitle>
              <CardDescription>
                {isSignUp ? "Create an account to compete" : "Login to view your portfolio"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={isSignUp ? "Min. 6 characters" : ""}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {isSignUp && (
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  )}
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {success && <p className="text-sm text-green-500">{success}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (isSignUp ? "Creating account..." : "Logging in...") : isSignUp ? "Sign Up" : "Login"}
                  </Button>
                  {!isSignUp && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isGoogleLoading}
                      onClick={handleGoogleSignIn}
                    >
                      {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
                    </Button>
                  )}
                </div>
              </form>
              <div className="mt-4 text-center text-sm">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => setIsSignUp(false)} className="font-semibold text-blue-600 hover:underline">
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button onClick={() => setIsSignUp(true)} className="font-semibold text-blue-600 hover:underline">
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
