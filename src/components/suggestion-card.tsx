import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, User } from "lucide-react"
import type { Suggestion } from "@/lib/bsky"

interface SuggestionCardProps {
  suggestion: Suggestion
}

const DESCRIPTION_TRUNCATE_LENGTH = 150

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const [isFollowedByOpen, setIsFollowedByOpen] = React.useState(false)
  const [isDescriptionOpen, setIsDescriptionOpen] = React.useState(false)

  const previewFollowers = suggestion.followedBy.slice(0, 3)
  const hasMoreFollowers = suggestion.followedBy.length > 3

  const descriptionIsTruncated =
    (suggestion.description?.length ?? 0) > DESCRIPTION_TRUNCATE_LENGTH
  const truncatedDescription = descriptionIsTruncated
    ? suggestion.description?.slice(0, DESCRIPTION_TRUNCATE_LENGTH) + "..."
    : suggestion.description

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <a
            href={`https://bsky.app/profile/${suggestion.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            {suggestion.avatar ? (
              <img
                src={suggestion.avatar}
                alt={suggestion.displayName || suggestion.handle}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </a>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {/* Header - clickable */}
            <div className="flex items-start justify-between gap-2">
              <a
                href={`https://bsky.app/profile/${suggestion.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline min-w-0"
              >
                <p className="font-semibold truncate">
                  {suggestion.displayName || suggestion.handle}
                </p>
                <p className="text-muted-foreground text-sm truncate">
                  @{suggestion.handle}
                </p>
              </a>
              <Badge variant="secondary" className="shrink-0">
                {suggestion.followedByCount}{" "}
                {suggestion.followedByCount === 1 ? "friend" : "friends"}
              </Badge>
            </div>

            {/* Description */}
            {suggestion.description && (
              <p className="text-sm text-muted-foreground">
                {isDescriptionOpen
                  ? suggestion.description
                  : truncatedDescription}
                {descriptionIsTruncated && (
                  <button
                    onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                    className="text-primary hover:underline cursor-pointer ml-1"
                  >
                    {isDescriptionOpen ? "show less" : "show more"}
                  </button>
                )}
              </p>
            )}

            {/* Followed by */}
            <Collapsible
              open={isFollowedByOpen}
              onOpenChange={setIsFollowedByOpen}
            >
              <p className="text-sm text-muted-foreground">
                <span>Followed by </span>
                {previewFollowers.map((entry, i) => (
                  <span key={entry.handle}>
                    {entry.displayName}
                    {i < previewFollowers.length - 1 && ", "}
                  </span>
                ))}
                {hasMoreFollowers && !isFollowedByOpen && (
                  <CollapsibleTrigger className="text-primary hover:underline cursor-pointer">
                    , +{suggestion.followedBy.length - 3} more{" "}
                    <ChevronDown className="inline h-3 w-3" />
                  </CollapsibleTrigger>
                )}
                {hasMoreFollowers && (
                  <CollapsibleContent className="inline">
                    {suggestion.followedBy.slice(3).map((entry) => (
                      <span key={entry.handle}>
                        {", "}
                        {entry.displayName}
                      </span>
                    ))}{" "}
                    <CollapsibleTrigger className="text-primary hover:underline cursor-pointer">
                      show less{" "}
                      <ChevronDown className="inline h-3 w-3 rotate-180" />
                    </CollapsibleTrigger>
                  </CollapsibleContent>
                )}
              </p>
            </Collapsible>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
