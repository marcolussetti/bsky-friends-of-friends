import { Home } from "@/components/home"
import { GitHubCorner } from "@/components/github-corner"

export function App() {
  return (
    <>
      <GitHubCorner url="https://github.com/marcolussetti/bsky-friends-of-friends" />
      <Home />
    </>
  )
}

export default App
