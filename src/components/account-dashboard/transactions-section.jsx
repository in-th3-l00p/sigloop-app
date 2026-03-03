import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from "lucide-react"
import { truncateAddress, formatDate, formatEth } from "@/lib/format"
import { SendDialog } from "./send-dialog"
import { ContactsDialog } from "./contacts-dialog"

const ETHERSCAN_BASE = {
  sepolia: "https://sepolia.etherscan.io",
}

export function TransactionsSection({ account }) {
  const transactions = useQuery(
    api.transactions.transactions.listByAccount,
    { accountId: account._id }
  )
  const explorerBase = ETHERSCAN_BASE[account.chain] ?? "https://sepolia.etherscan.io"

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
        <div className="space-y-1">
          {transactions.map((tx) => {
            const isOutgoing = tx.direction === "out"
            const counterparty = isOutgoing ? tx.to : tx.from

            return (
              <a
                key={tx._id}
                href={`${explorerBase}/tx/${tx.hash}`}
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
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                      tx.status === "success" ? "bg-green-500" : "bg-red-500"
                    }`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {counterparty ? truncateAddress(counterparty) : "Contract creation"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">
                    {isOutgoing ? "-" : "+"}{formatEth(tx.value)} ETH
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
