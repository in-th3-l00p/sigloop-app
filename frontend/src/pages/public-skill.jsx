import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"

function CodeBlock({ children }) {
  return (
    <pre className="overflow-auto rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed text-foreground">
      {children}
    </pre>
  )
}

export default function PublicSkillPage() {
  const { slug } = useParams()
  const published = useQuery(api.integrations.integrations.getPublicSkillArtifactBySlug, slug ? { slug } : "skip")

  const artifact = useMemo(() => {
    if (!published?.artifactJson) return null
    try {
      return JSON.parse(published.artifactJson)
    } catch {
      return null
    }
  }, [published?.artifactJson])

  if (published === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-sm text-muted-foreground">Loading published skill...</div>
      </div>
    )
  }

  if (!published || !artifact) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="max-w-md space-y-2 text-center">
          <h1 className="text-xl font-semibold">Published skill not found</h1>
          <p className="text-sm text-muted-foreground">This install link is missing or no longer available.</p>
        </div>
      </div>
    )
  }

  const skillFile = artifact.files?.find((file) => file.path === "prompt/SKILL.md")
  const manifestFile = artifact.files?.find((file) => file.path === "manifest.json")
  const examplesFile = artifact.files?.find((file) => file.path === "examples/http.md")

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Sigloop Public Skill</p>
          <h1 className="text-3xl font-semibold">{published.integrationName}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            This page exposes a published Sigloop agent skill package. It is designed for agents such as OpenClaw, Claude, or Codex to load the wallet contract and operate the assigned card through the live card-service.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Product</p>
            <p className="mt-2 text-sm font-medium">{published.product}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Published</p>
            <p className="mt-2 text-sm font-medium">{published.publishedAt ? new Date(published.publishedAt).toLocaleString() : "Unknown"}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">API base URL</p>
            <p className="mt-2 break-all text-sm font-medium">{artifact.apiBaseUrl}</p>
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Bootstrap Prompt</h2>
              <p className="text-sm text-muted-foreground">Paste this into the target agent to tell it where to install the public skill from.</p>
            </div>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigator.clipboard.writeText(published.prompt ?? "")}
            >
              Copy Prompt
            </Button>
          </div>
          <CodeBlock>{published.prompt ?? ""}</CodeBlock>
        </section>

        <section className="space-y-3 rounded-2xl border border-border p-5">
          <h2 className="text-lg font-semibold">Skill Instructions</h2>
          <CodeBlock>{skillFile?.content ?? ""}</CodeBlock>
        </section>

        <section className="space-y-3 rounded-2xl border border-border p-5">
          <h2 className="text-lg font-semibold">Manifest</h2>
          <CodeBlock>{manifestFile?.content ?? ""}</CodeBlock>
        </section>

        <section className="space-y-3 rounded-2xl border border-border p-5">
          <h2 className="text-lg font-semibold">HTTP Examples</h2>
          <CodeBlock>{examplesFile?.content ?? ""}</CodeBlock>
        </section>
      </div>
    </div>
  )
}
