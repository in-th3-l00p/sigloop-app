import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from "lucide-react"
import { truncateAddress, formatDate, formatEthFull } from "@/lib/format"
import { getExplorerTxUrl } from "@/lib/explorer"
import { getTxStatusMeta, TX_STATUS_LEGEND } from "@/lib/tx-status"
import { SendDialog } from "./send-dialog"
import { ContactsDialog } from "./contacts-dialog"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const INLINE_TX_LIMIT = 8

export function TransactionsSection({ account }) {
  const [openAll, setOpenAll] = useState(false)
  const [search, setSearch] = useState("")
  const transactions = useQuery(
    api.transactions.transactions.listByAccount,
    { accountId: account._id }
  )

  const visibleTransactions = transactions ? transactions.slice(0, INLINE_TX_LIMIT) : []
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    const q = search.trim().toLowerCase()
    if (!q) return transactions
    return transactions.filter((tx) => {
      const amount = formatEthFull(tx.value)
      const dateLabel = new Date(tx.createdAt).toLocaleString("en-US")
      return [
        tx.from,
        tx.to,
        amount,
        dateLabel,
      ].some((v) => (v || "").toLowerCase().includes(q))
    })
  }, [transactions, search])

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Transactions</h2>
        <div className="flex items-center gap-2">
          <ContactsDialog />
          <SendDialog account={account} />
        </div>
      </div>

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
            No transactions yet. Send your first transaction!
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
                href={getExplorerTxUrl(account.chain, tx.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent/50 transition-colors group"
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
                    {counterparty ? truncateAddress(counterparty) : "Contract creation"}
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
            <DialogTitle>All Transactions</DialogTitle>
            <DialogDescription>
              Search by address, amount, or date.
            </DialogDescription>
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
                    href={getExplorerTxUrl(account.chain, tx.hash)}
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
                        {counterparty ? truncateAddress(counterparty) : "Contract creation"}
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
