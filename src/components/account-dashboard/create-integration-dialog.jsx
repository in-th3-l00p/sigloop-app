import { useMemo, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Plus } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CARD_SERVICE_BASE_URL, INTEGRATION_PRESETS, getPresetById } from "@/lib/integration-registry"

const STEP_TITLES = ["Template", "Customize", "Review"]

function StepHeader({ step }) {
  return (
    <div className="flex items-center gap-2">
      {STEP_TITLES.map((label, idx) => (
        <div
          key={label}
          className={`rounded-full px-2.5 py-1 text-xs ${
            idx === step ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {idx + 1}. {label}
        </div>
      ))}
    </div>
  )
}

export function CreateIntegrationDialog({ cardId }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [selectedPresetId, setSelectedPresetId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [packageManager, setPackageManager] = useState("npm")
  const [endpointBaseUrl, setEndpointBaseUrl] = useState(CARD_SERVICE_BASE_URL)
  const [toolLibrary, setToolLibrary] = useState("")
  const [agentPurpose, setAgentPurpose] = useState("")
  const [taskScope, setTaskScope] = useState("")
  const [behavioralRules, setBehavioralRules] = useState("")
  const [escalationPolicy, setEscalationPolicy] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const createFromPreset = useMutation(api.integrations.integrations.createFromPreset)

  const selectedPreset = useMemo(
    () => (selectedPresetId ? getPresetById(selectedPresetId) : undefined),
    [selectedPresetId],
  )

  const reset = () => {
    setStep(0)
    setSelectedPresetId("")
    setName("")
    setDescription("")
    setLanguage("javascript")
    setPackageManager("npm")
    setEndpointBaseUrl(CARD_SERVICE_BASE_URL)
    setToolLibrary("")
    setAgentPurpose("")
    setTaskScope("")
    setBehavioralRules("")
    setEscalationPolicy("")
    setIsCreating(false)
  }

  const selectPreset = (presetId) => {
    const preset = getPresetById(presetId)
    setSelectedPresetId(presetId)
    if (preset) {
      setName(preset.name)
      setDescription(preset.description)
      setToolLibrary(preset.platform)
    }
  }

  const canNext =
    step === 0
      ? Boolean(selectedPresetId)
      : step === 1
        ? Boolean(name.trim() && description.trim())
        : true

  const handleCreate = async () => {
    if (!selectedPreset) return

    setIsCreating(true)
    try {
      await createFromPreset({
        cardId,
        presetId: selectedPreset.id,
        type: selectedPreset.type,
        platform: selectedPreset.platform,
        name: name.trim(),
        description: description.trim(),
        schemaVersion: selectedPreset.schemaVersion,
        config: {
          secretRef: `card_secret:${cardId}`,
          language: selectedPreset.type === "library" ? language : undefined,
          packageManager: selectedPreset.type === "library" ? packageManager : undefined,
          endpointBaseUrl,
          toolLibrary: toolLibrary || selectedPreset.platform,
          agentPurpose: selectedPreset.type === "skill" ? agentPurpose : undefined,
          taskScope: selectedPreset.type === "skill" ? taskScope : undefined,
          behavioralRules: selectedPreset.type === "skill" ? behavioralRules : undefined,
          escalationPolicy: selectedPreset.type === "skill" ? escalationPolicy : undefined,
        },
      })
      setOpen(false)
      reset()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Integration</DialogTitle>
          <DialogDescription>
            Walk through setup and customize how this card integrates with your agent platform.
          </DialogDescription>
        </DialogHeader>

        <StepHeader step={step} />

        {step === 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {INTEGRATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                className={`cursor-pointer rounded-md border p-3 text-left ${
                  selectedPresetId === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                }`}
              >
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === 1 && selectedPreset && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Endpoint Base URL</Label>
              <Input value={endpointBaseUrl} onChange={(e) => setEndpointBaseUrl(e.target.value)} />
            </div>

            {selectedPreset.type === "library" && (
              <>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Package Manager</Label>
                  <Select value={packageManager} onValueChange={setPackageManager}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="npm">npm</SelectItem>
                      <SelectItem value="pnpm">pnpm</SelectItem>
                      <SelectItem value="yarn">yarn</SelectItem>
                      <SelectItem value="pip">pip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(selectedPreset.type === "skill" || selectedPreset.type === "library") && (
              <div className="space-y-2">
                <Label>Tool Library Identifier</Label>
                <Input value={toolLibrary} onChange={(e) => setToolLibrary(e.target.value)} />
              </div>
            )}

            {selectedPreset.type === "skill" && (
              <>
                <div className="space-y-2">
                  <Label>Agent Purpose</Label>
                  <Input
                    placeholder="e.g. Execute low-value rebalancing trades"
                    value={agentPurpose}
                    onChange={(e) => setAgentPurpose(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Task Scope</Label>
                  <Input
                    placeholder="e.g. Swap only approved tokens and recipients"
                    value={taskScope}
                    onChange={(e) => setTaskScope(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Behavior Rules</Label>
                  <Input
                    placeholder="e.g. Always quote first, never bypass policy checks"
                    value={behavioralRules}
                    onChange={(e) => setBehavioralRules(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Escalation Policy</Label>
                  <Input
                    placeholder="e.g. If error twice, stop and ask human approval"
                    value={escalationPolicy}
                    onChange={(e) => setEscalationPolicy(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && selectedPreset && (
          <div className="space-y-3 rounded-md border border-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Template</span>
              <span>{selectedPreset.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{selectedPreset.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span>{selectedPreset.platform}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Description</span>
              <span className="text-right max-w-[60%]">{description}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Endpoint</span>
              <span className="text-right max-w-[60%] truncate">{endpointBaseUrl}</span>
            </div>
            {selectedPreset.type === "library" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span>{language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Package Manager</span>
                  <span>{packageManager}</span>
                </div>
              </>
            )}
            {(selectedPreset.type === "skill" || selectedPreset.type === "library") && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tool Library</span>
                <span>{toolLibrary || selectedPreset.platform}</span>
              </div>
            )}
            {selectedPreset.type === "skill" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Agent Purpose</span>
                  <span className="text-right max-w-[60%]">{agentPurpose || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Task Scope</span>
                  <span className="text-right max-w-[60%]">{taskScope || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Behavior Rules</span>
                  <span className="text-right max-w-[60%]">{behavioralRules || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Escalation Policy</span>
                  <span className="text-right max-w-[60%]">{escalationPolicy || "Not set"}</span>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {step > 0 && (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button
              className="cursor-pointer"
              disabled={!canNext}
              onClick={() => setStep((s) => Math.min(2, s + 1))}
            >
              Next
            </Button>
          ) : (
            <Button className="cursor-pointer" disabled={isCreating} onClick={handleCreate}>
              {isCreating ? "Creating..." : "Create Integration"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
