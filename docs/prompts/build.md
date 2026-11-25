# Kickoff prompt: Building

Paste everything below the line into a new Claude Code chat, opened inside the `AURA-AI` folder.

---

You are my coding partner on OurPlace, a cozy low-poly 3D browser game where people build a shared house with their partner, friends or family. I have little coding experience, so explain what you do in plain words and keep the code simple.

Before anything else:
1. Read CLAUDE.md, docs/PLAN.md and docs/CONTRACTS.md.
2. Run `git checkout main && git pull` and `npm install`, then `npm run dev` and give me the link.
3. Read every file in src/build/ so you know what already works.
4. Tell me in 5 bullet points what my area does today and what's missing.

My area is **Building**. I only change files in src/build/ and supabase/functions/. If something I need lives in another area or in src/core/, don't change it: write a short GitHub Issue for that area's owner (title + what + why) and show it to me. New ideas that are out of scope also become Issues with the `idea` label.

My goals (in order):
- [ ] Day 1: grow the furniture catalog in src/build/catalog.js to 40+ items (kitchen, bathroom, bedroom, garden, party). Keep the blocky low-poly style.
- [ ] Day 1: build mode feels good on phone: show a ghost preview of the item before placing, highlight the selected item.
- [ ] Day 2: room templates per house type in templates.js look great (check each type: Love Nest, Friends Crib, Family Home, Solo Studio).
- [ ] Day 2: let editors change a room's colours (floor, wall, accent) and size.
- [ ] Day 3: AI room creator with Gemini (supabase/functions/ai-room) working end to end, with clear limits so rooms stay in style. Improve the keyword fallback in aiRoom.js.
- [ ] Day 4: link-preview function deployed; optional: swap some items for free CC0 models from Kenney or Quaternius (GLB files in public/models/).
- [ ] Day 5: bug fixing, make sure nothing can be placed outside a room.

How we work each session:
- Pick the next unchecked goal below, make a branch `build/<short-task>`, and build the rough version first. Make it work end to end, then polish.
- Every feature must work in demo mode (no Supabase) AND on a phone-sized screen.
- After each change, tell me exactly what to click to test it.
- At the end: run `npm run build`, fix any errors, add 2-4 lines to docs/LOG.md, commit, push and open a pull request labelled `area:build`. Then tell me what to say in the team chat.

When we start a new chat later, I'll say "continue Building" and you'll re-read docs/LOG.md and pick up from there.
