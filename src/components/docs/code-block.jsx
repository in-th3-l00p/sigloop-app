import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export function CodeBlock({ children, title }) {
  const [copied, copy] = useCopyToClipboard()

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {title && (
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="cursor-pointer"
            onClick={() => copy(children)}
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      )}
      {!title && (
        <div className="absolute right-2 top-2 z-10">
          <Button
            variant="ghost"
            size="icon-xs"
            className="cursor-pointer"
            onClick={() => copy(children)}
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  )
}

export function DocSection({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

export function DocSubSection({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

export function EndpointBlock({ method, path, description, scope, body, response }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
          method === "GET" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
          method === "POST" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
          method === "PATCH" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
          "bg-red-500/10 text-red-600 dark:text-red-400"
        }`}>
          {method}
        </span>
        <code className="text-sm font-mono">{path}</code>
        {scope && (
          <span className="text-xs text-muted-foreground ml-auto">scope: {scope}</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {body && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Body</p>
          <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto"><code>{body}</code></pre>
        </div>
      )}
      {response && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Response</p>
          <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto"><code>{response}</code></pre>
        </div>
      )}
    </div>
  )
}
