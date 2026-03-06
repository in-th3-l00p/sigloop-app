import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ExternalLink, Download, Copy, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  CARD_SERVICE_BASE_URL,
  getPresetById,
} from "@/lib/integration-registry"
import { CreateIntegrationDialog } from "./create-integration-dialog"
import { downloadSkillArtifact, generateSkillArtifact } from "@/lib/skill-generator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function CopyBlock({ title, value, onAction }) {
  const [copied, copy] = useCopyToClipboard()

  if (!value) return null

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <Button
          variant="ghost"
          size="icon-xs"
          className="cursor-pointer"
          onClick={() => {
            copy(value)
            onAction?.()
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <pre className="integration-code-scroll max-h-40 overflow-auto rounded bg-muted/50 p-2 text-xs leading-relaxed">{value}</pre>
    </div>
  )
}

function IntegrationDrawerContent({
  integration,
  preset,
  cardSecret,
  cardContext,
  onSetupInteraction,
  onRemove,
}) {
  const fullApiDocs = `${CARD_SERVICE_BASE_URL}/openapi.json`
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleSkillDownload = () => {
    if (!cardSecret) return
    const artifact = generateSkillArtifact({
      preset,
      integration,
      cardSecret,
      cardContext,
      baseUrl: CARD_SERVICE_BASE_URL,
    })
    downloadSkillArtifact(artifact)
    onSetupInteraction(integration._id)
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{integration.name}</DrawerTitle>
        <DrawerDescription>{integration.description}</DrawerDescription>
      </DrawerHeader>

      <div className="space-y-4 px-4 pb-2 overflow-y-auto">
        <div className="flex items-center gap-2">
          {integration.type === "api" && (
            <a href={fullApiDocs} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Full API Docs
              </Button>
            </a>
          )}
        </div>

        {integration.type === "skill" && (
          <Button
            className="cursor-pointer gap-1.5"
            disabled={!cardSecret}
            onClick={handleSkillDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download Skill
          </Button>
        )}

        {integration.type === "api" && preset.curatedEndpoints?.length > 0 && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Curated Endpoints</p>
            <div className="space-y-2">
              {preset.curatedEndpoints.map((endpoint) => (
                <div key={`${endpoint.method}-${endpoint.path}`} className="rounded bg-muted/40 px-2 py-1.5">
                  <p className="text-xs font-mono">
                    <span className="font-semibold">{endpoint.method}</span> {endpoint.path}
                  </p>
                  <p className="text-xs text-muted-foreground">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {integration.type !== "skill" && (
          <CopyBlock title="Env" value={preset.envTemplate} onAction={() => onSetupInteraction(integration._id)} />
        )}
        <CopyBlock title="Install" value={preset.installCommand} onAction={() => onSetupInteraction(integration._id)} />
        <CopyBlock title="Snippet" value={preset.snippet} onAction={() => onSetupInteraction(integration._id)} />

        {integration.type === "skill" && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Information Given To Agent
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>Card identity: name, status, account address, chain.</li>
              <li>Spending context: limit, spent, and active card policies.</li>
              <li>Secure tool auth: x-card-secret for card-service API calls.</li>
              <li>Operational flow: check limits/policies, quote, then execute tx.</li>
              <li>Your customization: purpose, scope, behavior rules, escalation policy.</li>
            </ul>
          </div>
        )}

        {integration.verificationMessage && (
          <p className="text-xs text-muted-foreground">Last verification: {integration.verificationMessage}</p>
        )}
      </div>

      <DrawerFooter>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            className="cursor-pointer gap-1.5"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="cursor-pointer">Close</Button>
          </DrawerClose>
        </div>
      </DrawerFooter>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Integration?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{integration.name}</strong> from this card.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => {
                onRemove(integration._id)
                setConfirmOpen(false)
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CardIntegrationsSection({ cardId, cardSecret, card, chain, accountAddress }) {
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(null)

  const integrations = useQuery(api.integrations.integrations.listByCard, { cardId })
  const recordSetupInteraction = useMutation(api.integrations.integrations.recordSetupInteraction)
  const removeIntegration = useMutation(api.integrations.integrations.remove)

  const selectedIntegration = useMemo(
    () => integrations?.find((integration) => integration._id === selectedIntegrationId) ?? null,
    [integrations, selectedIntegrationId],
  )

  const selectedPreset = selectedIntegration
    ? getPresetById(selectedIntegration.presetId)
    : undefined
  const drawerPreset = selectedPreset ?? (selectedIntegration
    ? {
        docsUrl: CARD_SERVICE_BASE_URL,
        curatedEndpoints: [],
        envTemplate: "",
        installCommand: "",
        snippet: "",
      }
    : null)

  const cardContext = {
    name: card?.name,
    status: card?.status,
    limit: card?.limit,
    spent: card?.spent,
    policies: card?.policies ?? [],
    accountId: card?.accountId,
    chain,
    accountAddress,
    agentPurpose: selectedIntegration?.config?.agentPurpose,
    taskScope: selectedIntegration?.config?.taskScope,
    behavioralRules: selectedIntegration?.config?.behavioralRules,
    escalationPolicy: selectedIntegration?.config?.escalationPolicy,
  }

  const handleRemove = async (id) => {
    await removeIntegration({ id })
    setSelectedIntegrationId(null)
  }

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Integrations</h2>
        <CreateIntegrationDialog cardId={cardId} />
      </div>

      {integrations === undefined ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : integrations.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No integrations yet. Add one to connect this card with your agent platform.
        </p>
      ) : (
        <Drawer
          direction="right"
          open={Boolean(selectedIntegrationId)}
          onOpenChange={(open) => {
            if (!open) setSelectedIntegrationId(null)
          }}
        >
          <div className="space-y-2">
            {integrations.map((integration) => (
              <DrawerTrigger asChild key={integration._id}>
                <button
                  type="button"
                  onClick={() => setSelectedIntegrationId(integration._id)}
                  className="cursor-pointer w-full rounded-md border border-border p-3 text-left hover:bg-accent/40"
                >
                  <div>
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                  </div>
                </button>
              </DrawerTrigger>
            ))}
          </div>

          <DrawerContent>
            {selectedIntegration && drawerPreset && (
              <IntegrationDrawerContent
                integration={selectedIntegration}
                preset={drawerPreset}
                cardSecret={cardSecret}
                cardContext={cardContext}
                onSetupInteraction={(id) => recordSetupInteraction({ id })}
                onRemove={handleRemove}
              />
            )}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
