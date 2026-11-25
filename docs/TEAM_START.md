# Welcome to the team: start here (15 minutes)

## 1. Play it first (5 min, on your phone or laptop)

Open https://tacox2404-sudo.github.io/AURA-AI/

1. Create an account (any username + password).
2. Create a house: pick a house type, a name, a vibe.
3. Make your avatar in the Wardrobe, then explore every room using the tabs at the top.
4. Tap furniture to open things: the arcade, the Connect Four table, the easel, the gift box, the globe, the photo frame…
5. Try 🛠️ Build (place, move, rotate furniture) and 🚪 Rooms → "Create room" with a sentence like "spa room".
6. **To play with yourself as two people:** open a second browser window, log out from ☰, create a second account, then join with the invite code from 👥 People.

Until the lead finishes Supabase setup, this is **demo mode**: accounts and houses live
in your browser only, so you can't yet join a friend's house from another phone.

While you play, write down 3 things in **your area** you'd improve.

## 2. Your area

| Area | You own | Your prompt |
| --- | --- | --- |
| Lead | Repo, Supabase, merging, `src/core/` | [docs/prompts/lead.md](prompts/lead.md) |
| World | 3D scene, camera, avatars, walking, wardrobe | [docs/prompts/world.md](prompts/world.md) |
| Building | Furniture, build mode, rooms, AI room creator | [docs/prompts/build.md](prompts/build.md) |
| Social | Login, onboarding, invites, chat, points | [docs/prompts/social.md](prompts/social.md) |
| Activities | Games, gallery, calendar, wish list, weather, travel… | [docs/prompts/activities.md](prompts/activities.md) |

Your Day 1 task is already waiting for you on the
[Issues board](https://github.com/tacox2404-sudo/AURA-AI/issues), with your area's label.

## 3. Set up Claude Code (10 min)

1. Install [Node.js](https://nodejs.org) (LTS), [Git](https://git-scm.com) and Claude Code.
2. In a terminal:
   ```bash
   git clone https://github.com/tacox2404-sudo/AURA-AI.git
   cd AURA-AI
   claude
   ```
3. Open your prompt file above, copy everything under the line, and paste it into Claude.
   Claude reads the team rules (`CLAUDE.md`), runs the game for you and starts on your first goal.
4. Next days, start a new chat with: `continue <your area>` (see [docs/prompts/continue.md](prompts/continue.md)).

## 4. Team rules in one breath

Stay in your folder. Ask other areas through Issues. Work on a branch, open a pull
request, the lead merges. Everything must work on a phone and in demo mode. Ideas go on
the board with the `idea` label. Merge something every day.
