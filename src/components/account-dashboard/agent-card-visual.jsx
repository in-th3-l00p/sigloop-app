import { formatEth } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

export function AgentCardVisual({ card }) {
  const isPaused = card.status === "paused"
  const isUnlimited = !card.limit

  return (
    <div className="relative aspect-[1.586/1] w-full rounded-xl overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-[0.99]">
      {/* Gradient background */}
      <div className={`absolute inset-0 ${
        isPaused
          ? "bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800"
          : "bg-gradient-to-br from-violet-800 via-purple-900 to-indigo-950"
      }`} />

      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-4 text-white">
        {/* Top: name + status */}
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold truncate pr-2">{card.name}</p>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] border-white/30 ${
              isPaused ? "text-white/60" : "text-white/90"
            }`}
          >
            {isPaused ? "Paused" : "Active"}
          </Badge>
        </div>

        {/* Middle: limit */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/60">Limit</p>
          <p className="text-lg font-bold">
            {isUnlimited ? "Unlimited" : `${formatEth(card.limit)} ETH`}
          </p>
        </div>

        {/* Bottom: masked secret + chip */}
        <div className="flex items-end justify-between">
          <p className="text-xs font-mono text-white/60 tracking-wide">
            sgl_ &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull;
          </p>
          <div className="h-5 w-7 rounded-sm bg-white/20" />
        </div>
      </div>
    </div>
  )
}
