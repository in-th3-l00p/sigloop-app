import { useState, useEffect, useMemo } from "react"
import { useParams, Navigate, Link, useNavigate } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { parseEther } from "viem"
import {
  ArrowLeft,
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
  ExternalLink,
  Shield,
  Clock,
  X,
  Plus,
  Bot,
} from "lucide-react"
import { truncateAddress, formatDate, formatEth, formatEthFull, isValidAddress } from "@/lib/format"
import { getExplorerTxUrl } from "@/lib/explorer"
import { getTxStatusMeta, TX_STATUS_LEGEND } from "@/lib/tx-status"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CardIntegrationsSection } from "@/components/account-dashboard/card-integrations-section"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const RESET_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
}
const INLINE_TX_LIMIT = 8

export default function CardDashboardPage() {
  const { accountId, cardId } = useParams()
  const navigate = useNavigate()
  const { logout } = usePrivy()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()

  const card = useQuery(
    api.agentCards.agentCards.get,
    cardId ? { id: cardId } : "skip"
  )
  const account = useQuery(
    api.accounts.smartAccounts.get,
    card?.accountId ? { id: card.accountId } : "skip"
  )

  const cardWithSecret = useQuery(
    api.agentCards.agentCards.getWithSecret,
    cardId ? { id: cardId } : "skip"
  )

  const transactions = useQuery(
    api.agentCards.agentCards.listCardTransactions,
    cardId ? { cardId } : "skip"
  )

  const updateCard = useMutation(api.agentCards.agentCards.update)
  const removeCard = useMutation(api.agentCards.agentCards.remove)

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (card === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading card...</div>
      </div>
    )
  }

  if (card === null) {
    return <Navigate to={`/dashboard/${accountId}`} replace />
  }

  const backPath = `/dashboard/${accountId}`

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={backPath}>
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold">Agent Card</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={logout}
              className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <CardInfoSection
          card={card}
          cardWithSecret={cardWithSecret}
          updateCard={updateCard}
        />
        <SpendingSection card={card} updateCard={updateCard} />
        <PoliciesSection card={card} updateCard={updateCard} />
        <CardIntegrationsSection
          cardId={card._id}
          card={card}
          chain={account?.chain}
          accountAddress={account?.address}
          cardSecret={cardWithSecret?.secret}
        />
        <CardTransactionsSection transactions={transactions} chain={card.chain} />
        <DangerSection
          card={card}
          updateCard={updateCard}
          removeCard={removeCard}
          onDeleted={() => navigate(backPath)}
        />
      </div>
    </div>
  )
}

function CardInfoSection({ card, cardWithSecret, updateCard }) {
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [secretRevealed, setSecretRevealed] = useState(false)
  const [copied, copy] = useCopyToClipboard()

  const isPaused = card.status === "paused"

  const handleSaveName = async () => {
    if (!newName.trim()) return
    try {
      await updateCard({ id: card._id, name: newName.trim() })
      setEditingName(false)
      setNewName("")
    } catch {
      // stay in edit mode
    }
  }

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
            isPaused ? "bg-muted text-muted-foreground" : "bg-violet-500/10 text-violet-500"
          }`}>
            <Bot className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            {editingName ? (
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{card.name}</h2>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => { setEditingName(true); setNewName(card.name) }}
                  className="cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={isPaused ? "secondary" : "default"}>
                {isPaused ? "Paused" : "Active"}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDate(card.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secret Key */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Secret Key
        </p>
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2.5">
          <code className="flex-1 text-sm font-mono truncate">
            {secretRevealed && cardWithSecret
              ? cardWithSecret.secret
              : "sgl_ \u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
          </code>
          {secretRevealed && cardWithSecret && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => copy(cardWithSecret.secret)}
              className="cursor-pointer shrink-0"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
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
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SpendingSection({ card, updateCard }) {
  const [editingLimit, setEditingLimit] = useState(false)
  const [newLimit, setNewLimit] = useState("")

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
      // stay in edit mode
    }
  }

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Spending</h2>
        {editingLimit ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              step="any"
              min="0"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder="Unlimited"
              className="h-7 w-28 text-xs"
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

      <div className="rounded-md bg-muted/50 p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold tracking-tight">{formatEth(card.spent)} ETH</p>
          <p className="text-sm text-muted-foreground">
            {isUnlimited ? "No limit" : `of ${formatEth(card.limit)} ETH`}
          </p>
        </div>
        {!isUnlimited && (
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
        {card.limitResetPeriod && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Resets {RESET_LABELS[card.limitResetPeriod] ?? card.limitResetPeriod}
            {card.limitResetAt && (
              <span>&middot; next {formatDate(card.limitResetAt)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PoliciesSection({ card, updateCard }) {
  const [editing, setEditing] = useState(false)
  const [pendingPolicies, setPendingPolicies] = useState([])
  const [newContractAddr, setNewContractAddr] = useState("")
  const [newMaxPerTx, setNewMaxPerTx] = useState("")
  const [newResetPeriod, setNewResetPeriod] = useState("")

  useEffect(() => {
    if (editing) {
      setPendingPolicies(card.policies ?? [])
      setNewResetPeriod(card.limitResetPeriod ?? "")
      const maxPolicy = (card.policies ?? []).find((p) => p.type === "maxPerTx")
      setNewMaxPerTx(maxPolicy ? formatEth(maxPolicy.value) : "")
    }
  }, [editing, card])

  const allowedContracts = (card.policies ?? []).filter((p) => p.type === "allowedContract")
  const maxPerTxPolicy = (card.policies ?? []).find((p) => p.type === "maxPerTx")

  const handleAddContract = () => {
    if (!isValidAddress(newContractAddr)) return
    if (pendingPolicies.some((p) => p.type === "allowedContract" && p.value === newContractAddr)) return
    setPendingPolicies([...pendingPolicies, { type: "allowedContract", value: newContractAddr }])
    setNewContractAddr("")
  }

  const handleRemovePolicy = (idx) => {
    setPendingPolicies(pendingPolicies.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    try {
      let policies = pendingPolicies.filter((p) => p.type === "allowedContract")
      if (newMaxPerTx && Number(newMaxPerTx) > 0) {
        policies = [
          ...policies,
          { type: "maxPerTx", value: parseEther(newMaxPerTx).toString() },
        ]
      }
      await updateCard({
        id: card._id,
        policies,
        limitResetPeriod: newResetPeriod || "",
      })
      setEditing(false)
    } catch {
      // stay in edit mode
    }
  }

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Policies</h2>
        {!editing && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setEditing(true)}
            className="cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* Reset period */}
          <div className="space-y-2">
            <p className="text-xs font-medium">Limit Reset Period</p>
            <div className="flex gap-1.5 flex-wrap">
              {["", "daily", "weekly", "monthly"].map((p) => (
                <button
                  key={p}
                  onClick={() => setNewResetPeriod(p)}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-xs border transition-colors ${
                    newResetPeriod === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {p ? RESET_LABELS[p] : "None"}
                </button>
              ))}
            </div>
          </div>

          {/* Max per tx */}
          <div className="space-y-2">
            <p className="text-xs font-medium">Max Per Transaction</p>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                step="any"
                min="0"
                value={newMaxPerTx}
                onChange={(e) => setNewMaxPerTx(e.target.value)}
                placeholder="No limit"
                className="h-8 text-xs max-w-48"
              />
              <span className="text-xs text-muted-foreground">ETH</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium">Allowed Contracts</p>
            {pendingPolicies.filter((p) => p.type === "allowedContract").length > 0 && (
              <div className="space-y-1">
                {pendingPolicies.map((p, i) => p.type === "allowedContract" && (
                  <div key={i} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                    <code className="flex-1 text-xs font-mono truncate">{p.value}</code>
                    <button
                      onClick={() => handleRemovePolicy(i)}
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newContractAddr}
                onChange={(e) => setNewContractAddr(e.target.value)}
                placeholder="0x..."
                className="text-xs font-mono flex-1 max-w-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddContract()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleAddContract}
                disabled={!isValidAddress(newContractAddr)}
                className="cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to allow all contracts.
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="cursor-pointer">
              Save Policies
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {allowedContracts.length === 0 && !maxPerTxPolicy && !card.limitResetPeriod ? (
            <p className="text-sm text-muted-foreground">No policies configured.</p>
          ) : (
            <div className="space-y-2">
              {card.limitResetPeriod && (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    Limit resets {RESET_LABELS[card.limitResetPeriod] ?? card.limitResetPeriod}
                  </span>
                </div>
              )}
              {maxPerTxPolicy && (
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">Max {formatEth(maxPerTxPolicy.value)} ETH per transaction</span>
                </div>
              )}
              {allowedContracts.map((p, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono truncate">{truncateAddress(p.value, 10, 8)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CardTransactionsSection({ transactions, chain }) {
  const [openAll, setOpenAll] = useState(false)
  const [search, setSearch] = useState("")
  const visibleTransactions = transactions ? transactions.slice(0, INLINE_TX_LIMIT) : []
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    const q = search.trim().toLowerCase()
    if (!q) return transactions
    return transactions.filter((tx) => {
      const amount = formatEthFull(tx.value)
      const dateLabel = new Date(tx.createdAt).toLocaleString("en-US")
      return [tx.from, tx.to, amount, dateLabel].some((v) => (v || "").toLowerCase().includes(q))
    })
  }, [transactions, search])

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">Transactions</h2>
      {/* <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {TX_STATUS_LEGEND.map((item) => {
          const meta = getTxStatusMeta(item.status)
          return (
            <div key={item.status} className="flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div> */}

      {transactions === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-md bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <ArrowUpRight className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No transactions from this card yet.
          </p>
        </div>
      ) : (
        <div className="space-y-1 max-h-64 sm:max-h-80 overflow-y-auto">
          {visibleTransactions.map((tx) => {
            const isOutgoing = tx.direction === "out"
            const counterparty = isOutgoing ? tx.to : tx.from
            const statusMeta = getTxStatusMeta(tx.status)
            return (
              <a
                key={tx._id}
                href={getExplorerTxUrl(chain, tx.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent/50 transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  isOutgoing ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                }`}>
                  {isOutgoing ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">
                      {isOutgoing ? "Sent" : "Received"}
                    </p>
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {counterparty ? truncateAddress(counterparty) : "Contract"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">
                    {isOutgoing ? "-" : "+"}{formatEthFull(tx.value)} ETH
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )
          })}
          {transactions.length > INLINE_TX_LIMIT && (
            <button
              type="button"
              className="w-full rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer"
              onClick={() => setOpenAll(true)}
            >
              View all {transactions.length} transactions
            </button>
          )}
        </div>
      )}
      <Dialog open={openAll} onOpenChange={setOpenAll}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>All Card Transactions</DialogTitle>
            <DialogDescription>Search by address, amount, or date.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search address, ETH amount, or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="space-y-1 max-h-[55vh] overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No matching transactions.</p>
            ) : (
              filteredTransactions.map((tx) => {
                const isOutgoing = tx.direction === "out"
                const counterparty = isOutgoing ? tx.to : tx.from
                const statusMeta = getTxStatusMeta(tx.status)
                return (
                  <a
                    key={tx._id}
                    href={getExplorerTxUrl(chain, tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      isOutgoing ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                    }`}>
                      {isOutgoing ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{isOutgoing ? "Sent" : "Received"}</p>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {counterparty ? truncateAddress(counterparty) : "Contract"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {isOutgoing ? "-" : "+"}{formatEthFull(tx.value)} ETH
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString("en-US")}</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )
              })
            )}
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DangerSection({ card, updateCard, removeCard, onDeleted }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isPaused = card.status === "paused"

  useEffect(() => {
    if (!confirmDelete) return
    const timer = setTimeout(() => setConfirmDelete(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmDelete])

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
    onDeleted()
  }

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">Actions</h2>
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleStatus}
          className="cursor-pointer gap-1.5"
        >
          {isPaused ? (
            <>
              <Play className="h-3.5 w-3.5" />
              Resume Card
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5" />
              Pause Card
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="cursor-pointer gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {confirmDelete ? "Confirm Delete" : "Delete Card"}
        </Button>
      </div>
    </div>
  )
}
