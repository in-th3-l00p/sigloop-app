import { useState } from "react"
import { useConvexAuth } from "convex/react"
import { Navigate, Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, BookOpen, CreditCard, Bot, Server, ChevronRight, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { GeneralDocs } from "@/components/docs/general-docs"
import { CardServiceDocs } from "@/components/docs/card-service-docs"
import { CardSdkDocs } from "@/components/docs/card-sdk-docs"
import { AgentIntegrationDocs } from "@/components/docs/agent-integration-docs"
import { AgentSkillDocs } from "@/components/docs/agent-skill-docs"
import { AgentLangchainDocs } from "@/components/docs/agent-langchain-docs"
import { AgentElizaosDocs } from "@/components/docs/agent-elizaos-docs"
import { AgentDirectApiDocs } from "@/components/docs/agent-direct-api-docs"
import { AgentCardSdkDocs } from "@/components/docs/agent-card-sdk-docs"
import { AgentX402Docs } from "@/components/docs/agent-x402-docs"
import { ApiServiceDocs } from "@/components/docs/api-service-docs"
import { ApiSdkDocs } from "@/components/docs/api-sdk-docs"

const SIDEBAR_ITEMS = [
  { id: "general", label: "General", icon: BookOpen },
  {
    id: "card",
    label: "Card Interaction",
    icon: CreditCard,
    children: [
      { id: "card-api", label: "API Reference" },
      { id: "card-sdk", label: "SDK" },
    ],
  },
  {
    id: "agent",
    label: "AI Agent Integration",
    icon: Bot,
    children: [
      { id: "agent-overview", label: "Overview" },
      { id: "agent-skills", label: "Skill Packages" },
      { id: "agent-langchain", label: "LangChain" },
      { id: "agent-elizaos", label: "ElizaOS" },
      { id: "agent-direct-api", label: "Direct API" },
      { id: "agent-card-sdk", label: "Card SDK" },
      { id: "agent-x402", label: "X402 Protocol" },
    ],
  },
  {
    id: "api",
    label: "API Interaction",
    icon: Server,
    children: [
      { id: "api-ref", label: "API Reference" },
      { id: "api-sdk", label: "SDK" },
    ],
  },
]

function SidebarItem({ item, activeSection, onSelect, expandedGroups, onToggleGroup }) {
  const Icon = item.icon
  const hasChildren = Boolean(item.children)
  const isExpanded = expandedGroups.has(item.id)
  const isActive = activeSection === item.id
  const isChildActive = hasChildren && item.children.some((c) => c.id === activeSection)

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggleGroup(item.id)}
          className={`cursor-pointer w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
            isChildActive
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>
        {isExpanded && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
            {item.children.map((child) => {
              const childActive = activeSection === child.id
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onSelect(child.id)}
                  className={`cursor-pointer w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    childActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <Package className="h-3.5 w-3.5 shrink-0" />
                  {child.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`cursor-pointer w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </button>
  )
}

function DocsSidebar({ activeSection, onSelect }) {
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = new Set()
    for (const item of SIDEBAR_ITEMS) {
      if (item.children?.some((c) => c.id === activeSection)) {
        initial.add(item.id)
      }
    }
    return initial
  })

  const handleToggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleSelect = (sectionId) => {
    onSelect(sectionId)
    for (const item of SIDEBAR_ITEMS) {
      if (item.children?.some((c) => c.id === sectionId)) {
        setExpandedGroups((prev) => new Set(prev).add(item.id))
      }
    }
  }

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
          {SIDEBAR_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              activeSection={activeSection}
              onSelect={handleSelect}
              expandedGroups={expandedGroups}
              onToggleGroup={handleToggleGroup}
            />
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}

function DocsContent({ section }) {
  switch (section) {
    case "card-api":
      return <CardServiceDocs />
    case "card-sdk":
      return <CardSdkDocs />
    case "agent-overview":
      return <AgentIntegrationDocs />
    case "agent-skills":
      return <AgentSkillDocs />
    case "agent-langchain":
      return <AgentLangchainDocs />
    case "agent-elizaos":
      return <AgentElizaosDocs />
    case "agent-direct-api":
      return <AgentDirectApiDocs />
    case "agent-card-sdk":
      return <AgentCardSdkDocs />
    case "agent-x402":
      return <AgentX402Docs />
    case "api-ref":
      return <ApiServiceDocs />
    case "api-sdk":
      return <ApiSdkDocs />
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
