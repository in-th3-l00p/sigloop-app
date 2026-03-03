import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ArrowUpRight, Loader2, BookUser } from "lucide-react"
import { parseEther } from "viem"
import { isValidAddress } from "@/lib/format"
import { sendTransaction } from "@/lib/zerodev"
import { ContactsDialog } from "./contacts-dialog"
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
  DialogTrigger,
} from "@/components/ui/dialog"

export function SendDialog({ account }) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)

  const accountWithKey = useQuery(
    api.accounts.smartAccounts.getWithPrivateKey,
    open ? { id: account._id } : "skip"
  )
  const createTx = useMutation(api.transactions.transactions.create)

  const canSubmit = isValidAddress(to) && Number(amount) > 0 && !isSending

  const handleSend = async () => {
    if (!accountWithKey?.privateKey) return

    setIsSending(true)
    setError(null)
    try {
      const value = parseEther(amount)
      const result = await sendTransaction({
        chainSlug: account.chain,
        privateKey: accountWithKey.privateKey,
        to,
        value,
      })
      await createTx({
        accountId: account._id,
        hash: result.txHash,
        from: account.address,
        to,
        value: value.toString(),
        direction: "out",
        status: "success",
        chain: account.chain,
      })
      setTo("")
      setAmount("")
      setOpen(false)
    } catch (err) {
      setError(err.message ?? "Transaction failed")
    } finally {
      setIsSending(false)
    }
  }

  const handleContactSelect = (contact) => {
    setTo(contact.address)
  }

  const reset = () => {
    setTo("")
    setAmount("")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer gap-1.5">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Send
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send ETH</DialogTitle>
          <DialogDescription>
            Send ETH from {account.name} via UserOperation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="send-to">Recipient</Label>
            <div className="flex gap-2">
              <Input
                id="send-to"
                placeholder="0x..."
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="font-mono text-xs"
                disabled={isSending}
              />
              <ContactsDialog
                onSelect={handleContactSelect}
                trigger={
                  <Button variant="outline" size="icon" className="cursor-pointer shrink-0">
                    <BookUser className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="send-amount">Amount</Label>
            <div className="relative">
              <Input
                id="send-amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-12"
                disabled={isSending}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ETH
              </span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSending}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSubmit}
            className="cursor-pointer"
          >
            {isSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isSending ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
