import { Image } from "lucide-react"

export function NftsTab() {
  return (
    <div className="text-center py-8">
      <Image className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground">No NFTs found</p>
      <p className="text-xs text-muted-foreground mt-1">
        NFT tracking coming soon for mainnet
      </p>
    </div>
  )
}
