import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { parseEther } from "viem"
import { Loader2, Plus, X } from "lucide-react"
import { isValidAddress } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const RESET_OPTIONS = [
  { value: "", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

export function CreateCardDialog({ accountId, open, onOpenChange }) {
  const [name, setName] = useState("")
  const [limit, setLimit] = useState("")
  const [resetPeriod, setResetPeriod] = useState("")
  const [maxPerTx, setMaxPerTx] = useState("")
  const [allowedContracts, setAllowedContracts] = useState([])
  const [contractInput, setContractInput] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  const createCard = useMutation(api.agentCards.agentCards.create)

  const canSubmit = name.trim().length > 0 && !isCreating

  const handleAddContract = () => {
    if (!isValidAddress(contractInput)) return
    if (allowedContracts.includes(contractInput)) return
    setAllowedContracts([...allowedContracts, contractInput])
    setContractInput("")
  }

  const handleRemoveContract = (addr) => {
    setAllowedContracts(allowedContracts.filter((a) => a !== addr))
  }

  const handleCreate = async () => {
    setIsCreating(true)
    setError(null)
    try {
      const secret = `sgl_${crypto.randomUUID()}`
      const limitWei = limit && Number(limit) > 0
        ? parseEther(limit).toString()
        : undefined

      const policies = []
      for (const addr of allowedContracts) {
        policies.push({ type: "allowedContract", value: addr })
      }
      if (maxPerTx && Number(maxPerTx) > 0) {
        policies.push({ type: "maxPerTx", value: parseEther(maxPerTx).toString() })
      }

      await createCard({
        accountId,
        name: name.trim(),
        secret,
        limit: limitWei,
        limitResetPeriod: resetPeriod || undefined,
        policies: policies.length > 0 ? policies : undefined,
      })
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err.message ?? "Failed to create card")
    } finally {
      setIsCreating(false)
    }
  }

  const reset = () => {
    setName("")
    setLimit("")
    setResetPeriod("")
    setMaxPerTx("")
    setAllowedContracts([])
    setContractInput("")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Agent Card</DialogTitle>
          <DialogDescription>
            Create an API-key-style card for agent access to this wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="card-name">Name</Label>
            <Input
              id="card-name"
              placeholder="e.g. Trading Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-limit">Spending Limit</Label>
            <div className="relative">
              <Input
                id="card-limit"
                type="number"
                step="any"
                min="0"
                placeholder="Leave empty for unlimited"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="pr-12"
                disabled={isCreating}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ETH
              </span>
            </div>
          </div>

          {/* Reset period — only relevant with a limit */}
          {limit && Number(limit) > 0 && (
            <div className="space-y-2">
              <Label>Limit Reset Period</Label>
              <div className="flex gap-1.5 flex-wrap">
                {RESET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setResetPeriod(opt.value)}
                    disabled={isCreating}
                    className={`cursor-pointer rounded-md px-3 py-1.5 text-xs border transition-colors ${
                      resetPeriod === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {resetPeriod && (
                <p className="text-xs text-muted-foreground">
                  Spent amount resets to zero {resetPeriod}.
                </p>
              )}
            </div>
          )}

          {/* Max per tx */}
          <div className="space-y-2">
            <Label htmlFor="card-max-tx">Max Per Transaction</Label>
            <div className="relative">
              <Input
                id="card-max-tx"
                type="number"
                step="any"
                min="0"
                placeholder="No limit"
                value={maxPerTx}
                onChange={(e) => setMaxPerTx(e.target.value)}
                className="pr-12"
                disabled={isCreating}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ETH
              </span>
            </div>
          </div>

          {/* Allowed contracts */}
          <div className="space-y-2">
            <Label>Allowed Contracts</Label>
            {allowedContracts.length > 0 && (
              <div className="space-y-1">
                {allowedContracts.map((addr) => (
                  <div key={addr} className="flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1">
                    <code className="flex-1 text-[11px] font-mono truncate">{addr}</code>
                    <button
                      type="button"
                      onClick={() => handleRemoveContract(addr)}
                      disabled={isCreating}
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                value={contractInput}
                onChange={(e) => setContractInput(e.target.value)}
                placeholder="0x..."
                className="text-xs font-mono flex-1"
                disabled={isCreating}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddContract())}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleAddContract}
                disabled={!isValidAddress(contractInput) || isCreating}
                className="cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to allow all contracts.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canSubmit}
            className="cursor-pointer"
          >
            {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isCreating ? "Creating..." : "Create Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
