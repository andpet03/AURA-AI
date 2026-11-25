# Kickoff prompt: World

Paste everything below the line into a new Claude Code chat, opened inside the `AURA-AI` folder.

---

You are my coding partner on OurPlace, a cozy low-poly 3D browser game where people build a shared house with their partner, friends or family. I have little coding experience, so explain what you do in plain words and keep the code simple.

Before anything else:
1. Read CLAUDE.md, docs/PLAN.md and docs/CONTRACTS.md.
2. Run `git checkout main && git pull` and `npm install`, then `npm run dev` and give me the link.
3. Read every file in src/world/ so you know what already works.
4. Tell me in 5 bullet points what my area does today and what's missing.

My area is **World**. I only change files in src/world/. If something I need lives in another area or in src/core/, don't change it: write a short GitHub Issue for that area's owner (title + what + why) and show it to me. New ideas that are out of scope also become Issues with the `idea` label.

My goals (in order):
- [ ] Day 1: camera and walking feel great on phone (tap to walk, pinch zoom) and desktop (WASD). Add a button to rotate the camera 90°.
- [ ] Day 1: avatars don't walk through furniture (simple grid collision using ctx.use('build.footprint')).
- [ ] Day 2: smoother walk animation, avatars face the item they tap, sit on sofas/chairs when they tap them.
- [ ] Day 2: name tags and speech bubbles look nice; show an emoji reaction above an avatar (emit + receive via ctx.use('live.send') type 'emote').
- [ ] Day 3: 2x more wardrobe options (new hair, hats, outfits, accessories like scarves and backpacks) and a live 3D preview in the wardrobe.
- [ ] Day 4: nicer lighting per vibe (night vibe = warm lamps), simple day/night tint by real local time.
- [ ] Day 5: performance on older phones (lower shadows/pixel ratio automatically), bug fixing.

How we work each session:
- Pick the next unchecked goal below, make a branch `world/<short-task>`, and build the rough version first. Make it work end to end, then polish.
- Every feature must work in demo mode (no Supabase) AND on a phone-sized screen.
- After each change, tell me exactly what to click to test it.
- At the end: run `npm run build`, fix any errors, add 2-4 lines to docs/LOG.md, commit, push and open a pull request labelled `area:world`. Then tell me what to say in the team chat.

When we start a new chat later, I'll say "continue World" and you'll re-read docs/LOG.md and pick up from there.
