import { AtpAgent, AppBskyActorDefs } from '@atproto/api'

const MS_WAIT_BETWEEN_REQUESTS = 100
const FETCH_LIMIT = 100
const BSKY_API_ENDPOINT = "https://public.api.bsky.app"

export function parseUsername(username: string) {
    if (username.startsWith("@")) {
        return username.slice(1)
    }
    return username
}

export interface Suggestion {
  handle: string
  displayName: string
  did: string
  followedByCount: number
  followedBy: string[]
}

export type ProgressCallback = (current: number, total: number, message: string) => void

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}


export async function getFollows(
    client: AtpAgent,
    target: string
): Promise<AppBskyActorDefs.ProfileView[]> {
    let cursor: string | undefined

    const followings: AppBskyActorDefs.ProfileView[] = []

    while (true) {
        const res = await client.getFollows({
            actor: target,
            cursor,
            limit: FETCH_LIMIT
        })

        followings.push(...res.data.follows)

        if (!res.data.cursor) {
            break
        }

        cursor = res.data.cursor
        await sleep(MS_WAIT_BETWEEN_REQUESTS)
    }

    return followings
}


export async function computeSuggestions(
    username: string,
    minFollowers: number = 2,
    maxSuggestions: number = 50,
    mode: "following" | "friends",
    progressCallback?: ProgressCallback
): Promise<Suggestion[]> {
    const client = new AtpAgent({ service: BSKY_API_ENDPOINT })

    progressCallback?.(0, 0, `Finding who ${username} follows...`)

    // Get direct follows
    let directFollows: AppBskyActorDefs.ProfileView[]

    try {
        directFollows = await getFollows(client, username)
    } catch (e) {
        throw new Error(`Could not fetch follows for ${username}: ${e}`)
    }

    if (directFollows.length === 0) {
        return []
    }

    const followingDids = new Set(directFollows.map(user => user.did))

    try {
        const targetUserProfile = await client.getProfile({ actor: username })
        followingDids.add(targetUserProfile.data.did)
    } catch (e) {
        // ignore for now
    }

    progressCallback?.(0, directFollows.length, `Processing ${directFollows.length} follows...`)

    // Get nested follows
    const candidates = new Map<string, Suggestion>()
    const totalFollows = directFollows.length

    for (let i = 0; i < directFollows.length; i++) {
        const directFollow = directFollows[i]

        progressCallback?.(i + 1, totalFollows, `Analyzing follows of ${directFollow.handle} (${i + 1}/${totalFollows})...`)

        let candidateFollows: AppBskyActorDefs.ProfileView[]

        try {
            candidateFollows = await getFollows(client, directFollow.handle)
        } catch (e) {
            console.warn(`Failed to fetch follows for ${directFollow.handle}: ${e}`)
            continue
        }

        for (const candidate of candidateFollows) {
            if (followingDids.has(candidate.did)) {
                continue
            }

            if (!candidates.has(candidate.did)) {
                candidates.set(candidate.did, {
                    handle: candidate.handle,
                    displayName: candidate.displayName ?? "",
                    did: candidate.did,
                    followedBy: [],
                    followedByCount: 0
                })
            }

            candidates.get(candidate.did)!.followedBy.push(directFollow.handle)
        }

        await sleep(MS_WAIT_BETWEEN_REQUESTS)
    }

    // Sort by number of followers and filter
    return [...candidates.values()]
        .map(c => ({ ...c, followedByCount: c.followedBy.length }))
        .filter(c => c.followedByCount >= minFollowers)
        .sort((a, b) => b.followedByCount - a.followedByCount)
        .slice(0, maxSuggestions)

}