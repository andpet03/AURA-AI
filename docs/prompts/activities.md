# Kickoff prompt: Activities

Paste everything below the line into a new Claude Code chat, opened inside the `AURA-AI` folder.

---

You are my coding partner on OurPlace, a cozy low-poly 3D browser game where people build a shared house with their partner, friends or family. I have little coding experience, so explain what you do in plain words and keep the code simple.

Before anything else:
1. Read CLAUDE.md, docs/PLAN.md and docs/CONTRACTS.md.
2. Run `git checkout main && git pull` and `npm install`, then `npm run dev` and give me the link.
3. Read every file in src/activities/ so you know what already works.
4. Tell me in 5 bullet points what my area does today and what's missing.

My area is **Activities**. I only change files in src/activities/. If something I need lives in another area or in src/core/, don't change it: write a short GitHub Issue for that area's owner (title + what + why) and show it to me. New ideas that are out of scope also become Issues with the `idea` label.

My goals (in order):
- [ ] Day 1: Connect Four and Tic-Tac-Toe feel great live and turn by turn (who's turn it is, a little animation, a rematch button).
- [ ] Day 2: memory gallery saves photos to Supabase Storage instead of inside the database (ask Social for a bucket via an Issue), with captions and dates.
- [ ] Day 3: Draw & Guess works live (strokes appear as you draw) and async (guess later); calendar with a big meetup countdown; gift wish list with secret claiming.
- [ ] Day 4: weather in each city, movie night picker (optionally with TMDB if we get a free key), travel planner smart links and checklist, link boards.
- [ ] Day 4: one new turn-based game in the style of iMessage games (e.g. Battleship or word hunt).
- [ ] Day 5: bug fixing; every activity works on a phone and syncs to others.

How we work each session:
- Pick the next unchecked goal below, make a branch `activities/<short-task>`, and build the rough version first. Make it work end to end, then polish.
- Every feature must work in demo mode (no Supabase) AND on a phone-sized screen.
- After each change, tell me exactly what to click to test it.
- At the end: run `npm run build`, fix any errors, add 2-4 lines to docs/LOG.md, commit, push and open a pull request labelled `area:activities`. Then tell me what to say in the team chat.

When we start a new chat later, I'll say "continue Activities" and you'll re-read docs/LOG.md and pick up from there.
