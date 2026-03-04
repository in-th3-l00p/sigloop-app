import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ExternalLink, Download, Copy, Check, FlaskConical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import {
  CARD_SERVICE_BASE_URL,
  getPresetById,
} from "@/lib/integration-registry"
import { CreateIntegrationDialog } from "./create-integration-dialog"

function statusBadge(status) {
  if (status === "verified") return "default"
  if (status === "error") return "destructive"
  if (status === "configured") return "secondary"
  return "outline"
}

function statusLabel(status) {
  if (status === "not_started") return "Not Started"
  if (status === "configured") return "Configured"
  if (status === "verified") return "Verified"
  if (status === "error") return "Error"
  return status
}

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
      <pre className="max-h-40 overflow-auto rounded bg-muted/50 p-2 text-xs leading-relaxed">{value}</pre>
    </div>
  )
}

function IntegrationDrawerContent({
  integration,
  preset,
  cardSecret,
  onSetupInteraction,
  onVerify,
  onRemove,
  isVerifying,
}) {
  const fullApiDocs = `${CARD_SERVICE_BASE_URL}/openapi.json`

  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2">
          {integration.name}
          <Badge variant={statusBadge(integration.status)}>{statusLabel(integration.status)}</Badge>
        </DrawerTitle>
        <DrawerDescription>{integration.description}</DrawerDescription>
      </DrawerHeader>

      <div className="space-y-4 px-4 pb-2 overflow-y-auto">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{integration.type}</Badge>
          <span>{integration.platform}</span>
        </div>

        <div className="flex items-center gap-2">
          <a href={preset.docsUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Platform Docs
            </Button>
          </a>
          {integration.type === "api" && (
            <a href={fullApiDocs} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="cursor-pointer gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Full API Docs
              </Button>
            </a>
          )}
        </div>

        {integration.type === "skill" && preset.skillDownloadUrl && (
          <a href={preset.skillDownloadUrl} target="_blank" rel="noopener noreferrer">
            <Button
              className="cursor-pointer gap-1.5"
              onClick={() => onSetupInteraction(integration._id)}
            >
              <Download className="h-3.5 w-3.5" />
              Download Skill
            </Button>
          </a>
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

        <CopyBlock title="Env" value={preset.envTemplate} onAction={() => onSetupInteraction(integration._id)} />
        <CopyBlock title="Install" value={preset.installCommand} onAction={() => onSetupInteraction(integration._id)} />
        <CopyBlock title="Snippet" value={preset.snippet} onAction={() => onSetupInteraction(integration._id)} />

        {integration.verificationMessage && (
          <p className="text-xs text-muted-foreground">Last verification: {integration.verificationMessage}</p>
        )}
      </div>

      <DrawerFooter>
        <div className="flex items-center gap-2">
          <Button
            className="cursor-pointer gap-1.5"
            disabled={!cardSecret || isVerifying}
            onClick={() => onVerify(integration)}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            {isVerifying ? "Verifying..." : "Test Integration"}
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer gap-1.5"
            onClick={() => onRemove(integration._id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="cursor-pointer">Close</Button>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </>
  )
}

export function CardIntegrationsSection({ cardId, cardSecret }) {
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const integrations = useQuery(api.integrations.integrations.listByCard, { cardId })
  const recordSetupInteraction = useMutation(api.integrations.integrations.recordSetupInteraction)
  const setVerificationResult = useMutation(api.integrations.integrations.setVerificationResult)
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

  const handleVerify = async (integration) => {
    if (!cardSecret) return

    setIsVerifying(true)
    try {
      const response = await fetch(`${CARD_SERVICE_BASE_URL}/v1/card/summary`, {
        headers: {
          "x-card-secret": cardSecret,
        },
      })

      if (!response.ok) {
        const text = await response.text()
        await setVerificationResult({
          id: integration._id,
          success: false,
          message: text || `HTTP ${response.status}`,
        })
        return
      }

      await setVerificationResult({
        id: integration._id,
        success: true,
        message: "Verified using /v1/card/summary",
      })
    } catch (error) {
      await setVerificationResult({
        id: integration._id,
        success: false,
        message: error instanceof Error ? error.message : "Verification failed",
      })
    } finally {
      setIsVerifying(false)
    }
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                    </div>
                    <Badge variant={statusBadge(integration.status)}>{statusLabel(integration.status)}</Badge>
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
                isVerifying={isVerifying}
                onSetupInteraction={(id) => recordSetupInteraction({ id })}
                onVerify={handleVerify}
                onRemove={handleRemove}
              />
            )}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
