import { useState } from "react"
import { Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const SUPPORTED_CHAINS = [
  { id: "ethereum", name: "Ethereum" },
  { id: "base", name: "Base" },
  { id: "polygon", name: "Polygon" },
  { id: "arbitrum", name: "Arbitrum" },
  { id: "optimism", name: "Optimism" },
]

function AccountCard({ account }) {
  return (
    <button className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50 cursor-pointer w-full">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Wallet className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{account.name}</p>
        <p className="text-xs text-muted-foreground">{account.chain}</p>
      </div>
    </button>
  )
}

function CreateAccountDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [chain, setChain] = useState("")

  const handleCreate = () => {
    // TODO: Call Convex mutation to store account + ZeroDev to create kernel account
    setName("")
    setChain("")
    setOpen(false)
  }

  const canSubmit = name.trim().length > 0 && chain.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 text-left transition-colors hover:bg-accent/50 cursor-pointer w-full">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
            <Plus className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground">New account</p>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Smart Account</DialogTitle>
          <DialogDescription>
            Create a new Kernel smart account. It will be deployed on-chain when you send your first transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              placeholder="e.g. My Trading Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chain">Network</Label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger id="chain" className="w-full">
                <SelectValue placeholder="Select a network" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CHAINS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canSubmit}
            className="cursor-pointer"
          >
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SmartAccountsSection({ accounts = [] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Smart Accounts</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {accounts.map((account) => (
          <AccountCard key={account._id} account={account} />
        ))}
        <CreateAccountDialog />
      </div>
    </div>
  )
}
