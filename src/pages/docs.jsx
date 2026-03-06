import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth } from "convex/react"
import { Navigate, Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, BookOpen, CreditCard, Bot, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { GeneralDocs } from "@/components/docs/general-docs"
import { CardServiceDocs } from "@/components/docs/card-service-docs"
import { AgentIntegrationDocs } from "@/components/docs/agent-integration-docs"
import { ApiServiceDocs } from "@/components/docs/api-service-docs"

const SECTIONS = [
  { id: "general", label: "General", icon: BookOpen },
  { id: "card-service", label: "Card Service", icon: CreditCard },
  { id: "agent-integration", label: "AI Agent Integration", icon: Bot },
  { id: "api-service", label: "API Service & SDK", icon: Server },
]

function DocsSidebar({ activeSection, onSelect }) {
  return (
    <div className="w-56 shrink-0 border-r border-border">
      <div className="p-4 pb-3">
        <Link to="/app/dashboard">
          <Button variant="ghost" size="sm" className="cursor-pointer gap-1.5 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
      </div>
      <Separator />
      <ScrollArea className="h-[calc(100vh-57px)]">
        <nav className="p-3 space-y-1">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Documentation
          </p>
          {SECTIONS.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelect(section.id)}
                className={`cursor-pointer w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {section.label}
              </button>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}

function DocsContent({ section }) {
  switch (section) {
    case "card-service":
      return <CardServiceDocs />
    case "agent-integration":
      return <AgentIntegrationDocs />
    case "api-service":
      return <ApiServiceDocs />
    default:
      return <GeneralDocs />
  }
}

export default function DocsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSection = searchParams.get("section") || "general"

  const handleSelect = (section) => {
    setSearchParams({ section })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="flex min-h-screen">
      <DocsSidebar activeSection={activeSection} onSelect={handleSelect} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-end p-4 border-b border-border">
          <ThemeToggle />
        </div>
        <ScrollArea className="h-[calc(100vh-57px)]">
          <div className="mx-auto max-w-3xl p-8">
            <DocsContent section={activeSection} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
