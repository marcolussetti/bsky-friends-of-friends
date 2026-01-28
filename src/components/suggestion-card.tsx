import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import type { Suggestion } from "@/lib/bsky"

interface SuggestionCardProps {
  suggestion: Suggestion
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Show first 3 followers in preview
  const previewFollowers = suggestion.followedBy.slice(0, 3)
  const remainingCount = suggestion.followedBy.length - 3
  const hasMore = remainingCount > 0

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">
                {suggestion.displayName || suggestion.handle}
              </p>
              <p className="text-muted-foreground text-sm">
                @{suggestion.handle}
              </p>
            </div>
            <a
              href={`https://bsky.app/profile/${suggestion.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View Profile
            </a>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="text-sm text-muted-foreground">
              <span>Followed by </span>
              {previewFollowers.map((handle, i) => (
                <span key={handle}>
                  {handle}
                  {i < previewFollowers.length - 1 && ", "}
                </span>
              ))}
              {hasMore && !isOpen && (
                <>
                  <span>, </span>
                  <CollapsibleTrigger className="text-primary hover:underline cursor-pointer">
                    and {remainingCount} more <ChevronDown className="inline h-3 w-3" />
                  </CollapsibleTrigger>
                </>
              )}
            </div>

            <CollapsibleContent>
              <div className="text-sm text-muted-foreground mt-1">
                {suggestion.followedBy.slice(3).map((handle, i) => (
                  <span key={handle}>
                    {handle}
                    {i < suggestion.followedBy.length - 4 && ", "}
                  </span>
                ))}
              </div>
              <CollapsibleTrigger className="text-sm text-primary hover:underline cursor-pointer mt-1">
                Show less <ChevronDown className="inline h-3 w-3 rotate-180" />
              </CollapsibleTrigger>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  )
}
