import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokensTab } from "./tokens-tab"
import { NftsTab } from "./nfts-tab"

export function DefiSection() {
  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">DeFi</h2>
      <Tabs defaultValue="tokens">
        <TabsList>
          <TabsTrigger value="tokens" className="cursor-pointer">Tokens</TabsTrigger>
          <TabsTrigger value="nfts" className="cursor-pointer">NFTs</TabsTrigger>
        </TabsList>
        <TabsContent value="tokens">
          <TokensTab />
        </TabsContent>
        <TabsContent value="nfts">
          <NftsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
