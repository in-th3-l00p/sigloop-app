import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth } from "convex/react"
import { Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const { login } = usePrivy()
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background gradient effect */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-white/[0.02] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-white/[0.015] blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Sparkle accent */}
        <span className="text-muted-foreground text-sm tracking-widest">
          &#10023;
        </span>

        {/* Logo / Brand */}
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          sigloop
        </h1>

        {/* Tagline */}
        <p className="max-w-md text-center text-lg text-muted-foreground">
          wallets for agents that pay
        </p>

        {/* Subtitle */}
        <p className="max-w-sm text-center text-sm text-muted-foreground/70">
          the payment layer the agentic web needs
        </p>

        {/* Login Button */}
        <Button
          onClick={login}
          size="lg"
          className="mt-4 min-w-[200px] cursor-pointer"
        >
          Sign In
        </Button>

        {/* Bottom sparkle */}
        <span className="mt-8 text-muted-foreground/50 text-xs tracking-widest">
          &#10023; &#10023; &#10023;
        </span>
      </div>

      {/* Bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}
