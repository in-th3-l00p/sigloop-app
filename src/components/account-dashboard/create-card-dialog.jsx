import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { parseEther } from "viem"
import { Loader2 } from "lucide-react"
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

export function CreateCardDialog({ accountId, open, onOpenChange }) {
  const [name, setName] = useState("")
  const [limit, setLimit] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  const createCard = useMutation(api.agentCards.agentCards.create)

  const canSubmit = name.trim().length > 0 && !isCreating

  const handleCreate = async () => {
    setIsCreating(true)
    setError(null)
    try {
      const secret = `sgl_${crypto.randomUUID()}`
      const limitWei = limit && Number(limit) > 0
        ? parseEther(limit).toString()
        : undefined
      await createCard({
        accountId,
        name: name.trim(),
        secret,
        limit: limitWei,
      })
      setName("")
      setLimit("")
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
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent>
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
            <p className="text-xs text-muted-foreground">
              Leave blank to create an unlimited card.
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
