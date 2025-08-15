"use client"

import { useState, useEffect } from "react"
import { authClient } from "@better-env/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Trash2, Terminal, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import RedirectToSignIn from "@/components/auth/redirect-to-signin"
import { toast } from "sonner"

interface CliToken {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string
  token?: string
}

export default function CliPage() {
  const session = authClient.useSession()
  const [tokens, setTokens] = useState<CliToken[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTokenName, setNewTokenName] = useState("")
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<CliToken | null>(null)

  useEffect(() => {
    if (session.data?.user) {
      fetchTokens()
    }
  }, [session.data])

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/cli/token")
      const result = await response.json()
      if (result.success) {
        setTokens(result.data)
      }
    } catch (error) {
      toast.error("Failed to fetch CLI tokens", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const createToken = async () => {
    if (!newTokenName.trim()) {
      toast.error("Please enter a token name")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/cli/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName.trim() }),
      })

      const result = await response.json()
      if (result.success) {
        setNewToken(result.data)
        setNewTokenName("")
        fetchTokens()
        toast.success("CLI token created successfully")
      } else {
        toast.error(result.error || "Failed to create token")
      }
    } catch (error) {
      toast.error("Failed to create CLI token", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setCreating(false)
    }
  }

  const deleteToken = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/cli/token?id=${tokenId}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        setTokens(tokens.filter(t => t.id !== tokenId))
        toast.success("Token deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete token")
      }
    } catch (error) {
      toast.error("Failed to delete token", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToken(text)
      setTimeout(() => setCopiedToken(null), 2000)
      toast.success("Token copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy token", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  if (session.isPending) {
    return <div className="flex h-screen items-center justify-center"><Spinner size={24} /></div>
  }

  if (!session.data?.user) {
    return <RedirectToSignIn />
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="h-6 w-6" />
          <h1 className="text-3xl font-bold">CLI Authentication</h1>
        </div>
        <p className="text-muted-foreground">
          Create and manage tokens for authenticating with the Better Env CLI.
        </p>
      </div>

      <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">Quick CLI Setup</CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            The easiest way to authenticate your CLI is through device authorization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm">
              <strong>Option 1: Device Authorization (Recommended)</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Run <code className="bg-background px-1 py-0.5 rounded">better-env login</code> in your terminal</li>
                <li>Press SPACE when prompted to start device authorization</li>
                <li>Your browser will open to this page automatically</li>
                <li>Enter the code displayed in your terminal</li>
                <li>You&apos;re ready to go!</li>
              </ol>
            </div>
            <div className="text-sm">
              <strong>Option 2: Manual Token (Advanced)</strong>
              <p className="text-muted-foreground mt-1">
                Create a token manually below and configure it in your CLI.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {newToken && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">Token Created Successfully!</CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Copy this token now - it won&apos;t be shown again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-background rounded text-sm font-mono border">
                {newToken.token}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(newToken.token!)}
              >
                {copiedToken === newToken.token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-4 p-3 bg-muted rounded text-sm">
              <strong>Usage:</strong>
              <br />
              1. Install the CLI: <code>npm install -g @better-env/cli</code>
              <br />
              2. Set your token: <code>better-env login {newToken.token}</code>
              <br />
              3. Start using: <code>better-env projects</code>
            </div>
            <Button
              variant="link"
              size="sm"
              className="mt-3"
              onClick={() => setNewToken(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Token</CardTitle>
          <CardDescription>
            Generate a new CLI token to authenticate with the Better Env CLI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                placeholder="e.g., My Laptop, CI/CD Pipeline"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createToken()}
                disabled={creating}
              />
            </div>
            <Button
              onClick={createToken}
              disabled={creating || !newTokenName.trim()}
              className="mt-6"
            >
              {creating ? (
                <Spinner size={16} />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Token
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Tokens</CardTitle>
          <CardDescription>
            Manage your existing CLI tokens. Delete any tokens you no longer need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No CLI tokens created yet. Create your first token above.
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{token.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {new Date(token.expiresAt) > new Date() ? "Active" : "Expired"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Created: {new Date(token.createdAt).toLocaleDateString()}</div>
                      {token.lastUsedAt && (
                        <div>Last used: {new Date(token.lastUsedAt).toLocaleDateString()}</div>
                      )}
                      <div>Expires: {new Date(token.expiresAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => deleteToken(token.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
