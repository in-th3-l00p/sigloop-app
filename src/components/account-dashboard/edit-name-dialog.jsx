import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Loader2, Pencil } from "lucide-react"
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

export function EditNameDialog({ accountId, currentName }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)
  const updateAccount = useMutation(api.accounts.smartAccounts.update)

  useEffect(() => {
    if (open) setName(currentName)
  }, [open, currentName])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === currentName) return

    setIsSaving(true)
    try {
      await updateAccount({ id: accountId, name: trimmed })
      setOpen(false)
    } catch {
      // keep dialog open on error
    } finally {
      setIsSaving(false)
    }
  }

  const canSubmit = name.trim().length > 0 && name.trim() !== currentName && !isSaving

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="cursor-pointer">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Account</DialogTitle>
          <DialogDescription>
            Enter a new name for this smart account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="edit-name">Account Name</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSave()}
          />
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
            onClick={handleSave}
            disabled={!canSubmit}
            className="cursor-pointer"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
