import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth } from "convex/react"
import { ArrowLeft, Plus, Send, Trash2 } from "lucide-react"
import { parseEther } from "viem"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiServiceConfigCard } from "@/components/api-service-config-card"
import { useApiServiceClient } from "@/hooks/use-api-service-client"
import { formatEthFull, isValidAddress, truncateAddress } from "@/lib/format"

function generateCardSecret() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `sgl_${crypto.randomUUID()}`
  }
  return `sgl_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export default function SdkAccountDashboardPage() {
  const { accountId } = useParams()
  const { logout } = usePrivy()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { client, baseUrl, setBaseUrl, apiKey, setApiKey, isConfigured } = useApiServiceClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [account, setAccount] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [contacts, setContacts] = useState([])
  const [cards, setCards] = useState([])

  const [contactName, setContactName] = useState("")
  const [contactAddress, setContactAddress] = useState("")
  const [addingContact, setAddingContact] = useState(false)

  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [sending, setSending] = useState(false)

  const [cardName, setCardName] = useState("")
  const [cardLimit, setCardLimit] = useState("")
  const [creatingCard, setCreatingCard] = useState(false)

  const canAddContact = contactName.trim().length > 0 && isValidAddress(contactAddress) && !addingContact
  const canSend = isValidAddress(to) && Number(amount) > 0 && !sending

  const loadAccountData = useCallback(async () => {
    if (!isConfigured || !accountId) return
    setLoading(true)
    setError("")
    try {
      const [accountResult, txResult, contactsResult, cardsResult] = await Promise.all([
        client.getAccount(accountId),
        client.listAccountTransactions(accountId),
        client.listContacts(),
        client.listAccountCards(accountId),
      ])
      setAccount(accountResult.account)
      setTransactions(txResult.transactions ?? [])
      setContacts(contactsResult.contacts ?? [])
      setCards(cardsResult.cards ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account data")
    } finally {
      setLoading(false)
    }
  }, [client, isConfigured, accountId])

  useEffect(() => {
    void loadAccountData()
  }, [loadAccountData])

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [transactions],
  )

  const handleAddContact = async () => {
    setAddingContact(true)
    setError("")
    try {
      await client.createContact({ name: contactName.trim(), address: contactAddress })
      setContactName("")
      setContactAddress("")
      await loadAccountData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact")
    } finally {
      setAddingContact(false)
    }
  }

  const handleRemoveContact = async (contactId) => {
    setError("")
    try {
      await client.removeContact(contactId)
      await loadAccountData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove contact")
    }
  }

  const handleSend = async () => {
    if (!accountId) return
    setSending(true)
    setError("")
    try {
      await client.sendTransaction(accountId, {
        to,
        value: parseEther(amount).toString(),
      })
      setTo("")
      setAmount("")
      await loadAccountData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send transaction")
    } finally {
      setSending(false)
    }
  }

  const handleCreateCard = async () => {
    if (!accountId || !cardName.trim()) return
    setCreatingCard(true)
    setError("")
    try {
      await client.createCard({
        accountId,
        name: cardName.trim(),
        secret: generateCardSecret(),
        limit: cardLimit && Number(cardLimit) > 0 ? parseEther(cardLimit).toString() : undefined,
      })
      setCardName("")
      setCardLimit("")
      await loadAccountData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create card")
    } finally {
      setCreatingCard(false)
    }
  }

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app/sdk/dashboard">
              <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Account (SDK)</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={logout} className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
          </div>
        </div>

        <ApiServiceConfigCard baseUrl={baseUrl} setBaseUrl={setBaseUrl} apiKey={apiKey} setApiKey={setApiKey} onConnect={loadAccountData} isConnecting={loading} />

        <div className="rounded-lg border border-border p-4 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
          {!isConfigured ? (
            <p className="text-sm text-muted-foreground">Connect to API service first.</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading account...</p>
          ) : account ? (
            <>
              <p className="text-sm font-medium">{account.name}</p>
              <p className="text-xs text-muted-foreground">{account.chain}</p>
              <p className="text-xs font-mono text-muted-foreground">{account.address}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Account not found.</p>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Send Transaction</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sdk-to">To</Label>
              <Input id="sdk-to" value={to} onChange={(event) => setTo(event.target.value)} placeholder="0x..." className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdk-amount">Amount (ETH)</Label>
              <Input id="sdk-amount" type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.01" />
            </div>
          </div>
          <Button onClick={handleSend} disabled={!isConfigured || !canSend} className="cursor-pointer gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Transactions</h2>
          {sortedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedTransactions.map((tx) => (
                <div key={tx._id ?? tx.hash} className="rounded-md border border-border p-2">
                  <p className="text-sm">{tx.direction === "out" ? "Sent" : "Received"} {formatEthFull(tx.value)} ETH</p>
                  <p className="text-xs text-muted-foreground font-mono">{truncateAddress(tx.from)} {"->"} {truncateAddress(tx.to)}</p>
                  <p className="text-xs text-muted-foreground">{tx.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Contacts</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Name" />
            <Input value={contactAddress} onChange={(event) => setContactAddress(event.target.value)} placeholder="0x..." className="font-mono text-xs" />
            <Button onClick={handleAddContact} disabled={!isConfigured || !canAddContact} className="cursor-pointer gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact._id} className="flex items-center justify-between rounded-md border border-border p-2">
                  <div>
                    <p className="text-sm">{contact.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{contact.address}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="cursor-pointer" onClick={() => handleRemoveContact(contact._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Cards</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={cardName} onChange={(event) => setCardName(event.target.value)} placeholder="Card name" />
            <Input value={cardLimit} onChange={(event) => setCardLimit(event.target.value)} placeholder="Limit ETH (optional)" type="number" min="0" step="any" />
            <Button onClick={handleCreateCard} disabled={!isConfigured || creatingCard || !cardName.trim()} className="cursor-pointer gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {creatingCard ? "Creating..." : "Create"}
            </Button>
          </div>

          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cards yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cards.map((card) => (
                <Link key={card._id} to={`/app/sdk/accounts/${accountId}/cards/${card._id}`} className="rounded-md border border-border p-3 hover:bg-accent/40">
                  <p className="text-sm font-medium">{card.name}</p>
                  <p className="text-xs text-muted-foreground">status: {card.status}</p>
                  <p className="text-xs text-muted-foreground">spent: {formatEthFull(card.spent || "0")} ETH</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
