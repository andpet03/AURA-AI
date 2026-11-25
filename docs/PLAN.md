# OurPlace plan (short version for Claude; the full plan is the team's shared doc)

**Goal:** a rough but fully working draft in 4-5 days. Broad first, then deep.
Free to run, non-commercial, browser on phone and desktop.

## The game
- Every player can create a house or join one. **Housemates** can build and decorate;
  **guests** (invite code or link) can visit, chat and play but not edit. Houses are private.
- Onboarding asks who the house is for, a name, a vibe and cities; the answer picks
  starter rooms:
  - Love Nest: Entrance, Game Room, Date Night, Memory Room, Dream Room
  - Friends Crib: Entrance, Game Room, Lounge, Trip HQ, Hall of Fame
  - Family Home: Entrance, Game Room, Living Room, Kitchen, Wish Corner
  - Solo Studio: Entrance, Game Room, Studio
- Low-poly 3D rooms (Sims-style cut-away camera), blocky avatars with many outfits.
- See each other live (presence, chat, speech bubbles, nudges); everything also works
  when people play at different times.
- Build mode: place / move / rotate / delete furniture, add rooms. AI turns a sentence
  ("travel planning room") into a room built ONLY from our catalog + activities.
- Activities on furniture: Connect Four, Tic-Tac-Toe, Draw & Guess (live or turn by turn),
  memory gallery, calendar + meetup countdown, gift wish list (secret claiming),
  weather in each city, movie night, travel planner with smart links, link boards,
  notes/checklists, portals to outside sites.
- Points for everything, shared streak, leaderboards and win records.
  **Nothing is locked behind points.**

## Not yet
Native apps, public houses, voice/video, push notifications, AI-made 3D objects,
paid anything, scraping big sites (use official free APIs + smart links).

## Stack
Three.js + Vite · Supabase (auth, Postgres, realtime, edge functions) · Gemini Flash
(free tier) · Open-Meteo · TMDB (optional) · GitHub Pages.
