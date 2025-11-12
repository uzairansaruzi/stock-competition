import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, LineChart, ShieldCheck, Trophy, Users } from "lucide-react"

type Feature = {
  title: string
  description: string
  icon: LucideIcon
}

type Step = {
  title: string
  description: string
}

type Stat = {
  value: string
  label: string
}

const features: Feature[] = [
  {
    title: "Live leaderboard",
    description: "Track every portfolio in real time with Supabase-backed updates.",
    icon: Trophy,
  },
  {
    title: "Collaborative picks",
    description: "Coordinate with your team and lock trades before the weekly deadline.",
    icon: Users,
  },
  {
    title: "Actionable data",
    description: "Visualize pricing trends so competitors can react with confidence.",
    icon: LineChart,
  },
  {
    title: "Secure by default",
    description: "Authentication, row-level security, and audit trails powered by Supabase.",
    icon: ShieldCheck,
  },
]

const steps: Step[] = [
  {
    title: "Create your account",
    description: "Use the login portal to register with email + password in seconds.",
  },
  {
    title: "Select your stocks",
    description: "Head to the Stock Picks page to submit trades before the round locks.",
  },
  {
    title: "Watch the leaderboard",
    description: "Portfolio values refresh automatically so bragging rights stay current.",
  },
]

const stats: Stat[] = [
  { value: "15,000+", label: "Stocks, ETF, and more" },
  { value: "$250K", label: "Virtual capital tracked" },
  { value: "24/7", label: "Portfolio monitoring" },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 text-zinc-900 dark:from-black dark:via-zinc-950 dark:to-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-20 sm:pt-28 lg:px-8">
        <section className="space-y-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 backdrop-blur dark:border-zinc-800 dark:bg-white/5 dark:text-blue-400">
            <span>Season 2026</span>
            <span className="text-zinc-400">Starting soon!</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              Run your stock-picking competition with live data, frictionless auth, and beautiful dashboards.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
              Submit trades, audit portfolios, and follow the leaderboard in
              one collaborative workspace.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Login to compete
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/stock-picks"
              className="flex items-center justify-center rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-white dark:border-zinc-800 dark:text-zinc-50 dark:hover:border-zinc-700"
            >
              Preview stock picks
            </Link>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            New participant? Toggle "Sign Up" on the login screen to create your account instantly.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm shadow-zinc-900/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm shadow-zinc-900/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-3xl font-bold text-zinc-950 dark:text-zinc-50">{stat.value}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm shadow-zinc-900/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{step.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
