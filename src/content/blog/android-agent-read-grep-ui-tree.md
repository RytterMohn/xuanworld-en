---
title: "Why We Stopped Truncating Android UI Trees and Gave Our Mobile Agent read & grep"
description: "How borrowing the coding-agent file paradigm solved accessibility tree truncation, token bloat, and blind keyword-guessing loops in LifeBuddy."
pubDate: 2026-11-25
tags: ["ai-agents", "android", "accessibility", "engineering"]
---

While testing [LifeBuddy](https://github.com/RytterMohn/LifeBuddy) on real Chinese super-apps (WeChat, Meituan, deeply nested WebViews), we kept noticing a frustrating failure mode:

**The agent would stall on a single screen and repeatedly guess keywords one by one**—searching `"Search"`, then `"Find"`, then `"Discover"`, then `"Settings"`—as if it were poking around in the dark.

When we dug into `PhoneAccessibilityService.kt` and `PhoneTools.kt`, the root cause turned out to be a classic **context-budget vs. visibility** trap.

## The Two Bugs Behind "Blind Probing"

### 1. Hard DFS Truncation Dropped the Bottom Half of Complex Screens

To stay under our 24,000-token planning budget, our original accessibility tree walker enforced two hard caps:

```kotlin
if (depth > 30 || count++ >= 500) return
// ...
if (!privateNode && node.isVisibleToUser && node.isEnabled && nodes.size < 100) { ... }
```

Combined with `flagIncludeNotImportantViews` in the accessibility service XML, nested layout containers (`LinearLayout`, `FrameLayout`, Compose wrappers) burned through the `500`-node DFS traversal budget before ever reaching the lower half of the screen—or the bottom navigation bar.

### 2. A Redundant `find_nodes` Tool Created an Illusion of Deeper Search

Worse, our `phone_find_nodes(query)` tool did **not** query the live accessibility tree. It simply ran a substring filter over the *exact same truncated 100-node list* that was already inside the prompt.

When the target button was missing (either truncated away or labeled differently from what the LLM expected), the model assumed `phone_find_nodes` could uncover hidden elements—and burned step after step guessing different keywords.

## Borrowing the Coding-Agent Paradigm (`read` + `grep`)

Coding agents like Pi Agent and Claude Code solved an almost identical problem for large repositories: **never stuff a giant raw structure into every turn, and never silently truncate it either.** Instead:

1. **Persist the complete artifact to disk** in a compact, line-numbered text format.
2. **Give the model `read(startLine, lineCount)` and `grep(query)` with surrounding context lines.**

Applied to Android accessibility trees, the design clicked immediately.

### Step 1: Collect the Full Tree and Render a Compact Line-Oriented Document

In `PhoneAccessibilityService.kt`, we raised traversal caps from `500 / 100` to `4000 / 1000` (with visual indentation depth computed only on meaningful nodes, not empty container wrappers) and recorded screen region (`top`, `mid`, `bottom`) plus bounding boxes.

Instead of serializing verbose JSON into every LLM request, `ScreenDocument.render()` writes a compact, one-node-per-line tree snapshot to `cacheDir/screen_snapshots/screen_<id>.ui.txt`:

```text
# pkg=com.tencent.mm snapshot=snap-1 nodes=186 truncated=false
[n0] scroll rid=com.tencent.mm:id/list
  [n1] click top [0,180,1080,320] text="File Transfer"
    [n2] ->n1 mid [200,260,600,310] text="[Image]"
...
[n185] click bottom [810,2200,1080,2340] text="Me"
```

This format uses **3–5× fewer tokens than JSON** while preserving parent-child hierarchy, clickable delegation (`->n1`), regions, and exact `nodeId`s bound to our local execution policy.

### Step 2: Inline Small Screens, Preview Large Screens

Forcing an extra `read` round-trip on a 15-node settings dialog would waste latency. So `ScreenDocument.promptSection()` adapts automatically:

- **Small/medium screens (≤ 80 lines)**: inline the entire numbered file in the prompt so the agent acts in a single step.
- **Large screens (> 80 lines)**: show the top 35 lines (app bar, search bar, headers) **plus** the bottom 10 lines (usually the bottom tab bar!), and explicitly tell the model which line range (`L36..L176`) is omitted in the saved snapshot file.

### Step 3: Real `grep` with Context + Safe Literal Fallback

Upgrading `phone_find_nodes(query)` to grep the full saved file with `±2` merged context lines (`grep -n -C 2` style) changes everything:

- Matching a non-clickable text label immediately reveals its **clickable parent container** and **neighboring toggle/price/status** in the same response.
- **Subtle real-world gotcha**: UI text on mobile apps constantly contains regex metacharacters like `[Image](1)` or `Send(2)`. Those strings *compile as valid regexes* (`[Image]` becomes a character class!), so a naive `try Regex else literal` check fails silently. Our `ScreenDocument.grep` runs regex first and automatically falls back to literal case-insensitive matching whenever regex returns zero hits.

### Step 4: Frozen Snapshots During Inspection + Anti-Guessing Nudge

In `PhoneRunner.kt`, consecutive `READ_SCREEN` / `FIND_NODES` turns reuse the **frozen `before` snapshot** so line numbers never drift mid-inspection while dynamic content (like clocks or carousels) updates. Right before any mutating action (`TAP`, `TYPE`, `SCROLL`) or `FINISH`, the runner still re-observes the live screen and verifies the SHA-256 fingerprint—keeping every safety guarantee intact.

Finally, if the model gets 3 consecutive zero-match `grep` calls on the same snapshot, the runner injects a direct feedback nudge: stop guessing keywords and call `phone_read_screen(startLine, lineCount)` to read the screen file in chunks.

## Key Takeaways

- **Truncation without visibility is worse than pagination.** If an agent doesn't know what it can't see, it will hallucinate or loop.
- **Give mobile agents the same primitives that make coding agents effective.** Line-numbered files, ranged `read`, and context-aware `grep` transfer cleanly from source code to UI trees.
- **Keep safety checks deterministic and local.** The LLM explores the text projection freely, while local `PhonePolicy` and fingerprint verification guard every real click.

The full implementation is live in [RytterMohn/LifeBuddy](https://github.com/RytterMohn/LifeBuddy) (`ScreenDocument.kt` & `PhoneAccessibilityService.kt`).
