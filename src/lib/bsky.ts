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

export interface EnhancedProfile extends AppBskyActorDefs.ProfileView {
    following: AppBskyActorDefs.ProfileView[]
    followers?: AppBskyActorDefs.ProfileView[]  // only fetched in friends mode
}

export interface Suggestion {
  handle: string
  displayName: string
  did: string
  followedByCount: number
  followedBy: string[]
}

export type ProgressPhase = "fetching-follows" | "filtering-friends" | "finding-candidates"

export interface ProgressUpdate {
    current: number
    total: number
    message: string
    phase: ProgressPhase
    percentage: number
    overallPercentage: number
}

export type ProgressCallback = (update: ProgressUpdate) => void

interface ProgressTracker {
    completedCalls: number
    totalCalls: number
}

function emitProgress(
    callback: ProgressCallback | undefined,
    tracker: ProgressTracker,
    phase: ProgressPhase,
    current: number,
    total: number,
    message: string
) {
    callback?.({
        current,
        total,
        message,
        phase,
        percentage: total > 0 ? Math.round((current / total) * 100) : 0,
        overallPercentage: tracker.totalCalls > 0
            ? Math.round((tracker.completedCalls / tracker.totalCalls) * 100)
            : 0
    })
}

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

export async function getFollowers(
    client: AtpAgent,
    target: string
): Promise<AppBskyActorDefs.ProfileView[]> {
    let cursor: string | undefined

    const followers: AppBskyActorDefs.ProfileView[] = []

    while (true) {
        const res = await client.getFollowers({
            actor: target,
            cursor,
            limit: FETCH_LIMIT
        })

        followers.push(...res.data.followers)

        if (!res.data.cursor) {
            break
        }

        cursor = res.data.cursor
        await sleep(MS_WAIT_BETWEEN_REQUESTS)
    }

    return followers
}

export async function computeSuggestions(
    username: string,
    minFollowers: number = 2,
    maxSuggestions: number = 50,
    mode: "following" | "friends",
    progressCallback?: ProgressCallback
): Promise<Suggestion[]> {
    const client = new AtpAgent({ service: BSKY_API_ENDPOINT })

    // Progress tracking - we'll refine totalCalls as we learn more
    const tracker: ProgressTracker = {
        completedCalls: 0,
        totalCalls: 2  // Initial estimate: getProfile + getFollows
    }

    // Get user's DID early - needed for friends mode check
    let userDid: string
    try {
        const userProfile = await client.getProfile({ actor: username })
        userDid = userProfile.data.did
        tracker.completedCalls++
    } catch {
        throw new Error(`Could not find user "${username}". Please check the username is correct.`)
    }

    emitProgress(progressCallback, tracker, "fetching-follows", 0, 0, `Finding who ${username} follows...`)

    // Get direct follows
    let followedProfiles: AppBskyActorDefs.ProfileView[]

    try {
        followedProfiles = await getFollows(client, username)
        tracker.completedCalls++
    } catch (e) {
        throw new Error(`Could not fetch follows for ${username}: ${e}`)
    }

    if (followedProfiles.length === 0) {
        return []
    }

    // Now we know N - update total estimate
    // Phase 1: N calls (getFollows for each followed user)
    // Phase 2: In friends mode, M calls (unknown until filtering, estimate as N for now)
    const N = followedProfiles.length
    tracker.totalCalls = 2 + N + (mode === "friends" ? N : 0)

    emitProgress(progressCallback, tracker, "fetching-follows", 0, followedProfiles.length, `Processing ${followedProfiles.length} follows...`)

    const followedEnhancedProfiles = new Map<string, EnhancedProfile>()
    for (const [i, user] of followedProfiles.entries()) {
        emitProgress(progressCallback, tracker, "fetching-follows", i + 1, followedProfiles.length, `Fetching follows for ${user.handle}...`)
        followedEnhancedProfiles.set(user.did, {
            ...user,
            following: await getFollows(client, user.handle),
        })
        tracker.completedCalls++
        await sleep(MS_WAIT_BETWEEN_REQUESTS)
    }

    // Step 1: In friends mode, filter to only mutual friends (they follow the user back)
    if (mode === "friends") {
        for (const [did, profile] of followedEnhancedProfiles) {
            const followsUserBack = profile.following.some(f => f.did === userDid)
            if (!followsUserBack) {
                followedEnhancedProfiles.delete(did)
            }
        }
        // Refine total estimate now that we know M (mutual friends count)
        const M = followedEnhancedProfiles.size
        tracker.totalCalls = 2 + N + M
    }

    const alreadyFollowed = new Set(followedProfiles.map(user => user.did))
    alreadyFollowed.add(userDid)

    // Step 2: Find candidates from followed users
    const candidates = new Map<string, Suggestion>()
    const followedUsers = [...followedEnhancedProfiles.values()]

    for (const [i, followedUser] of followedUsers.entries()) {
        emitProgress(progressCallback, tracker, "finding-candidates", i + 1, followedUsers.length, `Analyzing ${mode === "friends" ? "friends" : "follows"} of ${followedUser.handle}...`)
        // Use cached following
        let candidatePool = followedUser.following

        // In friends mode, filter to followedUser's mutual friends
        if (mode === "friends") {
            const followedUserFollowers = await getFollowers(client, followedUser.handle)
            tracker.completedCalls++
            await sleep(MS_WAIT_BETWEEN_REQUESTS)
            const followerDids = new Set(followedUserFollowers.map(f => f.did))
            candidatePool = followedUser.following.filter(f => followerDids.has(f.did))
        }

        for (const candidate of candidatePool) {
            if (alreadyFollowed.has(candidate.did)) {
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

            candidates.get(candidate.did)!.followedBy.push(followedUser.handle)
        }
    }

    // Step 3: Sort by number of followers and filter
    return [...candidates.values()]
        .map(c => ({ ...c, followedByCount: c.followedBy.length }))
        .filter(c => c.followedByCount >= minFollowers)
        .sort((a, b) => b.followedByCount - a.followedByCount)
        .slice(0, maxSuggestions)

}