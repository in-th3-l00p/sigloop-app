import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Bot, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgentCardVisual } from "./agent-card-visual"
import { CreateCardDialog } from "./create-card-dialog"

export function AgentCardsSection({ account }) {
  const [createOpen, setCreateOpen] = useState(false)

  const cards = useQuery(
    api.agentCards.agentCards.list,
    { accountId: account._id }
  )

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Agent Cards</h2>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="cursor-pointer gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          New Card
        </Button>
      </div>

      {cards === undefined ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[1.586/1] rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-8">
          <Bot className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No agent cards yet. Create one to give agents access to this wallet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card._id}
              to={`/dashboard/${account._id}/card/${card._id}`}
            >
              <AgentCardVisual card={card} />
            </Link>
          ))}
        </div>
      )}

      <CreateCardDialog
        accountId={account._id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
