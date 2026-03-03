import { Copy, Check, Calendar } from "lucide-react"
import { getAccountIcon } from "@/components/smart-accounts-section"
import { getChainDisplayName } from "@/lib/chains"
import { truncateAddress, formatDate } from "@/lib/format"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { EditNameDialog } from "./edit-name-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function GeneralInfoSection({ account }) {
  const Icon = getAccountIcon(account.icon)
  const [copied, copy] = useCopyToClipboard()

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{account.name}</h2>
              <EditNameDialog accountId={account._id} currentName={account.name} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono">
                {truncateAddress(account.address)}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => copy(account.address)}
                className="cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary">{getChainDisplayName(account.chain)}</Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(account.createdAt)}
        </div>
      </div>
    </div>
  )
}
