import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Plus, Trash2, BookUser, Loader2 } from "lucide-react"
import { isValidAddress, truncateAddress } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ContactsDialog({ onSelect, hideAddForm, trigger }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const contacts = useQuery(api.contacts.contacts.list) ?? []
  const addContact = useMutation(api.contacts.contacts.create)
  const removeContact = useMutation(api.contacts.contacts.remove)

  const canAdd = name.trim().length > 0 && isValidAddress(address) && !isAdding

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      await addContact({ name: name.trim(), address })
      setName("")
      setAddress("")
    } catch {
      // keep form values on error
    } finally {
      setIsAdding(false)
    }
  }

  const handleSelect = (contact) => {
    if (onSelect) {
      onSelect(contact)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
            <BookUser className="h-3.5 w-3.5" />
            Contacts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contacts</DialogTitle>
          <DialogDescription>
            {onSelect ? "Select a contact or add a new one." : "Manage your saved contacts."}
          </DialogDescription>
        </DialogHeader>

        {!hideAddForm && (
          <div className="flex gap-2">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="0x address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 font-mono text-xs"
            />
            <Button
              size="icon"
              onClick={handleAdd}
              disabled={!canAdd}
              className="cursor-pointer shrink-0"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contacts yet
            </p>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact._id}
                className={`flex items-center justify-between rounded-md px-3 py-2 ${
                  onSelect
                    ? "cursor-pointer hover:bg-accent/50 transition-colors"
                    : ""
                }`}
                onClick={() => handleSelect(contact)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {truncateAddress(contact.address)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeContact({ id: contact._id })
                  }}
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
