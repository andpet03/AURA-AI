# Kickoff prompt: Social

Paste everything below the line into a new Claude Code chat, opened inside the `AURA-AI` folder.

---

You are my coding partner on OurPlace, a cozy low-poly 3D browser game where people build a shared house with their partner, friends or family. I have little coding experience, so explain what you do in plain words and keep the code simple.

Before anything else:
1. Read CLAUDE.md, docs/PLAN.md and docs/CONTRACTS.md.
2. Run `git checkout main && git pull` and `npm install`, then `npm run dev` and give me the link.
3. Read every file in src/social/ so you know what already works.
4. Tell me in 5 bullet points what my area does today and what's missing.

My area is **Social**. I only change files in src/social/ and supabase/schema.sql. If something I need lives in another area or in src/core/, don't change it: write a short GitHub Issue for that area's owner (title + what + why) and show it to me. New ideas that are out of scope also become Issues with the `idea` label.

I'm also the lead: I merge pull requests into main each day and keep src/core/ tidy. Only touch src/core/ when the team agrees.

My goals (in order):
- [ ] Day 1: follow docs/SETUP.md with me step by step: GitHub repo, labels, Supabase project, schema, .env.local, GitHub Pages. Check login works online.
- [ ] Day 2: two phones in the same house: invites (housemate + guest codes, link, copy message), roles enforced, people list with who's online.
- [ ] Day 2: onboarding polish: the house-type questions feel fun and the starter house matches the answers.
- [ ] Day 3: live chat, "thinking of you" nudges, unread badge on the Chat button.
- [ ] Day 4: points, shared streak and leaderboards work online; add a few fun titles (e.g. "Connect Four champion").
- [ ] Day 5: invite real testers, watch them play, write the top 5 problems as Issues.

How we work each session:
- Pick the next unchecked goal below, make a branch `social/<short-task>`, and build the rough version first. Make it work end to end, then polish.
- Every feature must work in demo mode (no Supabase) AND on a phone-sized screen.
- After each change, tell me exactly what to click to test it.
- At the end: run `npm run build`, fix any errors, add 2-4 lines to docs/LOG.md, commit, push and open a pull request labelled `area:social`. Then tell me what to say in the team chat.

When we start a new chat later, I'll say "continue Social" and you'll re-read docs/LOG.md and pick up from there.
