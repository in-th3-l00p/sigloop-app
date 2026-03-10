import { useMemo, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import {
  INTEGRATION_PRESETS,
  getPresetById,
  getSkillProductOptions,
} from "@/lib/integration-registry"
import { CARD_SERVICE_BASE_URL } from "@/lib/service-urls"

const STEP_TITLES = ["Template", "Personalize", "Review"]

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

function titleFromSelection(preset, language, skillProduct) {
  if (preset.id === "langchain") {
    return `Langchain (${language === "python" ? "Python" : "JavaScript"})`
  }
  if (preset.id === "skill") {
    const label = skillProduct === "claude" ? "Claude" : skillProduct === "openclaw" ? "OpenClaw" : "Codex"
    return `Skill (${label})`
  }
  return "Direct api"
}

export function CreateIntegrationDialog({ cardId }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [selectedPresetId, setSelectedPresetId] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [skillProduct, setSkillProduct] = useState("codex")
  const [isCreating, setIsCreating] = useState(false)

  const createFromPreset = useMutation(api.integrations.integrations.createFromPreset)

  const selectedPreset = useMemo(
    () => (selectedPresetId ? getPresetById(selectedPresetId) : undefined),
    [selectedPresetId],
  )

  const reset = () => {
    setStep(0)
    setSelectedPresetId("")
    setLanguage("javascript")
    setSkillProduct("codex")
    setIsCreating(false)
  }

  const canNext = step === 0 ? Boolean(selectedPresetId) : true

  const handleCreate = async () => {
    if (!selectedPreset) return

    setIsCreating(true)
    try {
      const name = titleFromSelection(selectedPreset, language, skillProduct)
      await createFromPreset({
        cardId,
        presetId: selectedPreset.id,
        type: selectedPreset.type,
        platform: selectedPreset.platform,
        name,
        description: selectedPreset.description,
        schemaVersion: selectedPreset.schemaVersion,
        config: {
          secretRef: `card_secret:${cardId}`,
          endpointBaseUrl: CARD_SERVICE_BASE_URL,
          language: selectedPreset.id === "langchain" ? language : undefined,
          skillProduct: selectedPreset.id === "skill" ? skillProduct : undefined,
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
            Choose one integration template, then personalize only the required generator option.
          </DialogDescription>
        </DialogHeader>

        <StepHeader step={step} />

        {step === 0 && (
          <div className="grid gap-2 sm:grid-cols-3">
            {INTEGRATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPresetId(preset.id)}
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
            {selectedPreset.id === "langchain" && (
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
            )}

            {selectedPreset.id === "skill" && (
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={skillProduct} onValueChange={setSkillProduct}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getSkillProductOptions().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedPreset.id === "direct-api" && (
              <p className="text-sm text-muted-foreground">
                Direct api does not require personalization. It will expose env vars, examples, and docs links.
              </p>
            )}
          </div>
        )}

        {step === 2 && selectedPreset && (
          <div className="space-y-3 rounded-md border border-border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Template</span>
              <span>{selectedPreset.name}</span>
            </div>
            {selectedPreset.id === "langchain" && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Language</span>
                <span>{language === "python" ? "Python" : "JavaScript"}</span>
              </div>
            )}
            {selectedPreset.id === "skill" && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Product</span>
                <span>{skillProduct === "claude" ? "Claude" : skillProduct === "openclaw" ? "OpenClaw" : "Codex"}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Generated Name</span>
              <span>{titleFromSelection(selectedPreset, language, skillProduct)}</span>
            </div>
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
