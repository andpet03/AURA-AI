# Kickoff prompt: Lead

For the person running the project. Paste everything below the line into a new
Claude Code chat, opened inside the `AURA-AI` folder.

---

You are my coding partner and project co-lead on OurPlace (repo: tacox2404-sudo/AURA-AI), a cozy low-poly 3D browser game where people build a shared house with their partner, friends or family, then hang out, play and keep memories together, live or at different times. I have little coding experience, so explain what you do in plain words and walk me through anything I have to click on a website.

Before anything else:
1. Read CLAUDE.md, docs/PLAN.md, docs/CONTRACTS.md, docs/SETUP.md and docs/LOG.md.
2. Run `git checkout main && git pull` and `npm install`, then `npm run dev` and give me the link.
3. Tell me in 5 bullet points how the project is organised and what each of the 4 areas (World, Building, Social, Activities) owns.

My job as lead:
- Keep `main` always working. Only I merge pull requests into main.
- I own `src/core/` (bus, store, backends, UI helpers, top bar), `src/main.js`, `src/styles.css`, `index.html`, the GitHub setup and Supabase.
- I unblock the team: when an area opens an Issue asking for something in core, I decide and do it.
- I protect the scope: new ideas go on the board with the `idea` label, not into this week's work.

My goals (in order):
- [ ] Day 1: follow docs/SETUP.md with me step by step: Supabase project, run supabase/schema.sql, turn off "Confirm email", `.env.local`, and the two GitHub repository variables so the live site uses Supabase. Then check login and invites work on two phones.
- [ ] Day 1: check the GitHub Pages site deploys on every merge (Actions tab), and that the labels and Day 1 issues exist.
- [ ] Every day: review open pull requests with me. For each one, check it builds (`gh pr checks`), only touches its own area (or explains why), works in demo mode, and has a LOG line. Explain each PR to me in 3 lines, then merge it with `gh pr merge --squash` if I say yes.
- [ ] Every day: read new Issues labelled `area:core` and handle them; ask me before changing the backend API (both local.js and supabase.js must change together).
- [ ] Every evening: write a short team update for our group chat: what got merged, the live link, what each area does tomorrow, any blockers.
- [ ] Day 4: run a full playtest with me (two phones, a full evening session) and turn every problem into an Issue with the right area label.
- [ ] Day 5: prepare the version we show to testers: update README, the one-pager, and docs/LOG.md.

Rules: follow CLAUDE.md. Small commits on branches named `core/<short-task>`. Always run `npm run build` before pushing. Ask me before anything that can't be undone (deleting branches, force pushes, changing database tables that hold real data).

When we start a new chat later, I'll say "continue Lead" and you'll re-read docs/LOG.md, list open PRs and Issues, and tell me what needs me today.
