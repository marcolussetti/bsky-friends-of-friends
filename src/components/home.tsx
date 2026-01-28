"use client"

import { cn } from "@/lib/utils"
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "./ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  computeSuggestions,
  parseUsername,
  type ProgressUpdate,
  type Suggestion,
} from "@/lib/bsky"
import { SuggestionCard } from "./suggestion-card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const ITEMS_PER_PAGE = 10

export function Home() {
  const [username, setUsername] = React.useState("")
  const [mode, setMode] = React.useState<"following" | "friends">("following")
  const [isLoading, setIsLoading] = React.useState(false)
  const [progress, setProgress] = React.useState<ProgressUpdate | null>(null)
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [showSlowWarning, setShowSlowWarning] = React.useState(false)

  const totalPages = Math.ceil(suggestions.length / ITEMS_PER_PAGE)
  const paginatedSuggestions = suggestions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setCurrentPage(1)
    setShowSlowWarning(false)
    try {
      const results = await computeSuggestions(
        parseUsername(username),
        2,
        50,
        mode,
        (update: ProgressUpdate) => {
          setProgress(update)
          if (update.total > 50) {
            setShowSlowWarning(true)
          }
        }
      )
      setSuggestions(results)
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
          "mx-auto flex flex-col w-full max-w-2xl min-w-0 gap-8 p-4 pt-8 sm:p-6 lg:p-12"
        )}
      >
        <header className="text-center">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            Friends of Friends in Bluesky
          </h1>
          <p className="text-muted-foreground text-xl mt-2">
            Find Bluesky accounts you may be interested in following that your
            friends already follow.
          </p>
        </header>

        {showSlowWarning && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
            <AlertTriangle />
            <AlertTitle>This may take a while</AlertTitle>
            <AlertDescription>
              This user has more than 50 follows. The tool really doesn't handle
              this well — expect it to be very, very slow.
            </AlertDescription>
          </Alert>
        )}

        <Card className="w-full">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
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

                  <RadioGroup
                    value={mode}
                    onValueChange={(v) => setMode(v as "following" | "friends")}
                    className="w-fit"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="following" id="following" />
                      <Label htmlFor="following">
                        Following (one-way follow is sufficient)
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="friends" id="friends" />
                      <Label htmlFor="friends">
                        Friends-only (mutual following)
                      </Label>
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

        {suggestions.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">
              Suggestions ({suggestions.length})
            </h2>

            <div className="flex flex-col gap-3">
              {paginatedSuggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.did} suggestion={suggestion} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={cn(
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={cn(
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
