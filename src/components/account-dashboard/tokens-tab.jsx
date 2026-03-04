import { useEthBalance } from "@/hooks/use-eth-balance"
import { formatEth } from "@/lib/format"
import { Separator } from "@/components/ui/separator"

export function TokensTab({ account }) {
  const { balance, isLoading } = useEthBalance(account.address, account.chain)

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
        <div className="text-right">
          <p className="text-sm font-medium">
            {isLoading ? (
              <span className="animate-pulse text-muted-foreground">...</span>
            ) : (
              `${formatEth(balance)} ETH`
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
