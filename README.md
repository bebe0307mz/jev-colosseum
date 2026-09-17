# Jev Colosseum

A living AI arena where models fight, breed, mutate, and die in a self-running gladiator ecosystem. Watch 8 AI gladiator-models clash on randomized text challenges every 30 seconds while hundreds of crowd avatars react in real time.

## Features

- **Self-running simulation** -- 8 gladiators fight autonomously, no input needed
- **God Mode** -- Lightning Strike the leader, Breed two fighters into a mutant hybrid, or secretly Assassinate a fighter
- **Live crowd** -- hundreds of tiny avatars lean toward the winner; click any seat to flip its allegiance
- **Bloodline tree** -- every breed and death updates a phylogeny you can explore; click any dead ancestor to replay their death
- **Ollama integration** -- paste your local Ollama endpoint and your home rig drops into the arena as a challenger

## Stack

Next.js 14 static export, Framer Motion, Canvas 2D crowd particle system, seeded precomputed fight transcripts, localStorage-free (all in-memory).

## Dev

```
npm install
npm run dev
```

## Deploy

Deployed to Vercel via git push.
