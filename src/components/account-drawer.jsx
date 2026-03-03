import { usePrivy, useLinkAccount } from "@privy-io/react-auth"
import { Mail, Wallet, User, Link, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

function LinkedAccount({ icon: Icon, label, value, onUnlink }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm truncate">{value}</p>
        </div>
      </div>
      {onUnlink && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
          onClick={onUnlink}
        >
          <Unlink className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

function AccountDrawerContent() {
  const { user, unlinkEmail, unlinkWallet } = usePrivy()
  const { linkEmail, linkWallet } = useLinkAccount()

  const linkedEmails = user?.linkedAccounts?.filter((a) => a.type === "email") ?? []
  const linkedWallets = user?.linkedAccounts?.filter((a) => a.type === "wallet") ?? []
  const totalLinked = linkedEmails.length + linkedWallets.length
  const canUnlink = totalLinked > 1

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Account</DrawerTitle>
        <DrawerDescription>
          Manage your linked accounts and login methods.
        </DrawerDescription>
      </DrawerHeader>

      <div className="px-4 pb-4 space-y-4">
        {/* User ID */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">User ID</p>
            <p className="text-sm font-mono truncate">{user?.id}</p>
          </div>
        </div>

        <Separator />

        {/* Email accounts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Email</h3>
            {!user?.email && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs cursor-pointer"
                onClick={linkEmail}
              >
                <Link className="h-3 w-3 mr-1.5" />
                Link
              </Button>
            )}
          </div>
          {linkedEmails.length > 0 ? (
            linkedEmails.map((account) => (
              <LinkedAccount
                key={account.address}
                icon={Mail}
                label="Email"
                value={account.address}
                onUnlink={canUnlink ? () => unlinkEmail(account.address) : undefined}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-2">No email linked</p>
          )}
        </div>

        <Separator />

        {/* Wallet accounts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Wallets</h3>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={linkWallet}
            >
              <Link className="h-3 w-3 mr-1.5" />
              Link
            </Button>
          </div>
          {linkedWallets.length > 0 ? (
            linkedWallets.map((account) => (
              <LinkedAccount
                key={account.address}
                icon={Wallet}
                label={account.walletClientType || "Wallet"}
                value={`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                onUnlink={canUnlink ? () => unlinkWallet(account.address) : undefined}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-2">No wallet linked</p>
          )}
        </div>
      </div>

      <DrawerFooter>
        <DrawerClose asChild>
          <Button variant="outline" className="cursor-pointer">Close</Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  )
}

export function AccountDrawer({ children }) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent>
        <AccountDrawerContent />
      </DrawerContent>
    </Drawer>
  )
}
