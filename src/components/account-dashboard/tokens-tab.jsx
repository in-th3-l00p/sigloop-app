import { Separator } from "@/components/ui/separator"

export function TokensTab() {
  return (
    <div className="space-y-3">
      {/* ETH row */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
            <span className="text-sm font-bold text-blue-500">E</span>
          </div>
          <div>
            <p className="text-sm font-medium">Ethereum</p>
            <p className="text-xs text-muted-foreground">ETH</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* ERC-20 empty state */}
      <p className="text-xs text-muted-foreground text-center py-4">
        No other tokens found on Sepolia
      </p>
    </div>
  )
}
