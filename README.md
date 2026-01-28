# Bluesky Friends of Friends / bskyfof

Want to find new accounts to follow on Bluesky? What if you started by looking at what accounts your friends already followed?

This project finds accounts that you don't follow yet, but many of those you follow already do, and presents them as a list.

This is based on [an idea](https://bsky.app/profile/did:plc:5tqbhdeuhy6dzyq6tadyza4c/post/3mdgupi6j2c2s) by [Franklin Sayre](https://bsky.app/profile/franklinsayre.bsky.social).

Do be aware that this may take a very long time to query accounts if you follow lots of people, let alone if others also follow lots of people!

## Development

- Install dependencies with `npm ci`
- Start dev server (Vite): `npm run dev` — open http://localhost:5173
- Build: `npm run build` (runs `tsc -b` then `vite build`).
- Preview production build: `npm run preview`.
- Type check: `npx tsc --noEmit`.
- Lint: `npm run lint`.

The linters are also bundled in `pre-commit` so please just use that :)

### Key files

- UI - Home page: `src/components/home.tsx`
- UI - Suggestion card (for each suggestion): `src/components/suggestion-card.tsx`
- "Logic" for Bluesky requests: `src/lib/bsky.ts`

## Limitations

This approach is very, very slow. The pagination size is 100, and with how many follows and nested follows we need to process, this is excruciating.

We need to find a different approach here honestly, as an account with 2K follows takes hours basically.
