"use client"

import { cn } from "@/lib/utils"
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "./ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { computeSuggestions, parseUsername, type ProgressUpdate } from "@/lib/bsky"

export function Home() {
  const [username, setUsername] = React.useState("")
  const [mode, setMode] = React.useState<"following" | "friends">("following")
  const [isLoading, setIsLoading] = React.useState(false)
  const [progress, setProgress] = React.useState<ProgressUpdate | null>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Searching for:", username, "mode:", mode)
      const suggestions = await computeSuggestions(parseUsername(username), 2, 50, mode, (update: ProgressUpdate) => {
        setProgress(update)
      })
      console.log("Suggestions:", suggestions)
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }

  return (
    <div className="bg-background w-full">
        <div
            data-slow="home-wrapper"
                className={cn(
                    "mx-auto grid min-h-screen w-full max-w-5xl min-w-0 content-center items-start gap-8 p-4 pt-2 sm:gap-12 sm:p-6 md:grid-cols-2 md:gap-8 lg:p-12 2xl:max-w-6xl"
                )}
        >
            <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance md:col-span-2">
                Friends of Friends in Bluesky
            </h1>
            <p className="text-center text-muted-foreground text-xl md:col-span-2">
                Find Bluesky accounts you may be interested in following that your friends already follow.
            </p>

            <Card className="w-full max-w-xl md:col-span-2 mx-auto">
                {/* <CardHeader></CardHeader> */}
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6 ">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Your BlueSky Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="@username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />

                                <RadioGroup value={mode} onValueChange={(v) => setMode(v as "following" | "friends")} className="w-fit">
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="following" id="following" />
                                        <Label htmlFor="following">Following (one-way follow is sufficient)</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value="friends" id="friends" />
                                        <Label htmlFor="friends">Friends-only (mutual following)</Label>
                                    </div>
                                </RadioGroup>

                                <Button type="submit" disabled={isLoading}>
                                  {isLoading && <Loader2 className="animate-spin" />}
                                  {isLoading && progress
                                    ? `${progress.message} (${progress.current}/${progress.total})`
                                    : "Search"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

