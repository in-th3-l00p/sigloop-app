import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { parseEther } from "viem"
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  Pause,
  Play,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react"
import { truncateAddress, formatDate, formatEth } from "@/lib/format"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CardDetailDialog({ card, open, onOpenChange }) {
  const [secretRevealed, setSecretRevealed] = useState(false)
  const [editingLimit, setEditingLimit] = useState(false)
  const [newLimit, setNewLimit] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, copy] = useCopyToClipboard()

  const cardWithSecret = useQuery(
    api.agentCards.agentCards.getWithSecret,
    open && secretRevealed && card ? { id: card._id } : "skip"
  )

  const transactions = useQuery(
    api.agentCards.agentCards.listCardTransactions,
    open && card ? { cardId: card._id } : "skip"
  )

  const updateCard = useMutation(api.agentCards.agentCards.update)
  const removeCard = useMutation(api.agentCards.agentCards.remove)

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSecretRevealed(false)
      setEditingLimit(false)
      setEditingName(false)
      setConfirmDelete(false)
    }
  }, [open])

  // Reset confirm delete after timeout
  useEffect(() => {
    if (!confirmDelete) return
    const timer = setTimeout(() => setConfirmDelete(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmDelete])

  if (!card) return null

  const isPaused = card.status === "paused"
  const isUnlimited = !card.limit
  const spentNum = BigInt(card.spent || "0")
  const limitNum = card.limit ? BigInt(card.limit) : 0n
  const progressPct = !isUnlimited && limitNum > 0n
    ? Math.min(100, Number((spentNum * 100n) / limitNum))
    : 0

  const handleSaveLimit = async () => {
    try {
      const limitWei = newLimit && Number(newLimit) > 0
        ? parseEther(newLimit).toString()
        : ""
      await updateCard({ id: card._id, limit: limitWei })
      setEditingLimit(false)
      setNewLimit("")
    } catch {
      // silently fail — UI stays in edit mode
    }
  }

  const handleSaveName = async () => {
    if (!newName.trim()) return
    try {
      await updateCard({ id: card._id, name: newName.trim() })
      setEditingName(false)
      setNewName("")
    } catch {
      // silently fail
    }
  }

  const handleToggleStatus = async () => {
    await updateCard({
      id: card._id,
      status: isPaused ? "active" : "paused",
    })
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await removeCard({ id: card._id })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={card.name}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button size="sm" onClick={handleSaveName} className="cursor-pointer shrink-0">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditingName(false); setNewName("") }}
                  className="cursor-pointer shrink-0"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <DialogTitle className="flex-1">{card.name}</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => { setEditingName(true); setNewName(card.name) }}
                  className="cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Badge variant={isPaused ? "secondary" : "default"} className="shrink-0">
                  {isPaused ? "Paused" : "Active"}
                </Badge>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Secret Key */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Secret Key
            </p>
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <code className="flex-1 text-xs font-mono truncate">
                {secretRevealed && cardWithSecret
                  ? cardWithSecret.secret
                  : "sgl_ •••••••••••••••••••••••••••••••••••••"}
              </code>
              {secretRevealed && cardWithSecret && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => copy(cardWithSecret.secret)}
                  className="cursor-pointer shrink-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSecretRevealed(!secretRevealed)}
                className="cursor-pointer shrink-0"
              >
                {secretRevealed ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Spending */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Spending
              </p>
              {editingLimit ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="New limit"
                    className="h-7 w-24 text-xs"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveLimit()}
                  />
                  <span className="text-xs text-muted-foreground">ETH</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveLimit}
                    className="cursor-pointer h-7 px-2 text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingLimit(false); setNewLimit("") }}
                    className="cursor-pointer h-7 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => { setEditingLimit(true); setNewLimit("") }}
                  className="cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span>{formatEth(card.spent)} ETH spent</span>
              <span className="text-muted-foreground">
                {isUnlimited ? "No limit" : `of ${formatEth(card.limit)} ETH`}
              </span>
            </div>
            {!isUnlimited && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Transactions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Transactions
            </p>
            {transactions === undefined ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2 animate-pulse">
                    <div className="h-6 w-6 rounded bg-muted" />
                    <div className="flex-1 h-4 rounded bg-muted" />
                    <div className="h-4 w-16 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {transactions.map((tx) => {
                  const isOutgoing = tx.direction === "out"
                  const counterparty = isOutgoing ? tx.to : tx.from
                  return (
                    <div
                      key={tx._id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                        isOutgoing ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                      }`}>
                        {isOutgoing ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownLeft className="h-3 w-3" />
                        )}
                      </div>
                      <span className="flex-1 text-xs font-mono text-muted-foreground truncate">
                        {counterparty ? truncateAddress(counterparty) : "Contract"}
                      </span>
                      <span className="text-xs font-medium shrink-0">
                        {isOutgoing ? "-" : "+"}{formatEth(tx.value)} ETH
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="cursor-pointer gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className="cursor-pointer gap-1.5"
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
