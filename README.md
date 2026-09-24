# JiraWay

**Learn Jira by actually using it.**

JiraWay is a hands-on learning platform that teaches complete beginners how to use Jira — not by reading about it, but by working inside a real, interactive Jira-style workspace. No videos to passively watch, no docs to skim: every concept is taught by doing the actual action on the actual interface.

🔗 **[Live Demo](https://your-app.vercel.app)** — replace with your Vercel URL

---

## 📸 Screenshots

<!-- Add your screenshots to a `docs/` folder in the repo, then reference them like this: -->

| Board View | Backlog View |
|---|---|
| ![Board](docs/board-view.png) | ![Backlog](docs/backlog-view.png) |

## 🎥 Module Demos

<!-- GitHub renders short video files inline if you drag-and-drop them into a Markdown file/PR comment on github.com,
     which gives you a CDN link like the example below. Do that for each clip, then paste the links here. -->

- [Module 1 — Orientation](#)
- [Module 2 — Creating Your First Issue](#)
- [Module 3 — Updating Progress](#)
- [Module 4 — Boards & Sprints](#)
- [Module 5 — Backlog & Sprint Planning](#)

---

## Why This Exists

Most people learning Jira are handed a video or a wiki page and told to figure out the rest by clicking around. That's not learning — it's guessing. JiraWay was built to fix that: instead of describing what a sprint or a backlog is, it puts you inside a real, working Jira-style workspace and has you *do* the action it's teaching, right on the real element.

## The Problem It Solves

Jira beginners can't use Jira confidently on their own — even after watching tutorials or reading documentation — because those resources *explain* Jira without ever making you practice it. JiraWay closes that gap: every lesson happens inside a real, working ticket board, not a slideshow next to one.

## Who It's For

- **Jira beginners** — anyone starting a new job, internship, or team that uses Jira and has never touched it before
- **Students and early-career developers** — learning the tool most real engineering teams already run on, before they need it on the job
- **Recruiters and interviewers** — this project also doubles as a portfolio piece, built to demonstrate product thinking and frontend engineering for SDE-1-level roles

## What Makes It Different

- **Teaches by doing, not by watching** — no passive tutorial video; every explanation is attached directly to the real button, field, or card it's describing
- **One ticket, one story** — a single ticket you create yourself carries forward through every module, so progress feels continuous instead of a series of disconnected demos
- **A genuinely working board underneath** — drag-and-drop, comments, subtasks, sprints, and epics all really work, not a static mockup with hotspots
- **Zero setup for the learner** — no backend, no account creation beyond a name and email, nothing to install

## How It Works — Learn → Practice → Apply

JiraWay teaches through five guided modules, each building on a single ticket that carries forward through the whole curriculum:

1. **Orientation** — a guided tour of a real team workspace (project, board, tickets, team)
2. **Creating Your First Issue** — create a real ticket from scratch, with an optional field-by-field walkthrough
3. **Updating Progress** — drag your ticket across the board and leave a real comment
4. **Boards & Sprints** — recognize what a sprint badge, search, and "Complete Sprint" actually do
5. **Backlog & Sprint Planning** — see where tickets come from, move one into a sprint, and watch it ripple onto the board

After finishing once, the curriculum unlocks a plain workspace to explore freely, plus a "Practice again" option to revisit any module.

## Features

- **Guided, hands-on modules** — every explanation is tied directly to the real UI element it describes, never a standalone slide
- **A real, working Jira-style board** — drag-and-drop tickets, subtasks, comments, priorities, story points, epics, sprints
- **No backend required** — the entire app runs client-side; all learner progress is saved to `localStorage`, scoped per learner
- **Lightweight login** — name + email only, no password, no real authentication — just enough to keep each learner's progress separate
- **Admin tooling** — a hidden admin role for reviewing learner activity, timings, and resetting demo data during development/demos

## Tech Stack

- **React** (JavaScript, no TypeScript)
- **Vite** — build tool and dev server
- **Tailwind CSS** — styling
- Plain React hooks + `localStorage` for state — no backend, no database, no external state library

## Getting Started

```bash
git clone https://github.com/Kaviya0253/JiraWay.git
cd JiraWay
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`) in your browser.

## Why No Backend?

This is a deliberate design choice, not a limitation. JiraWay is a single-learner-per-browser teaching tool — every learner's progress, tickets, and activity are scoped to their own `localStorage` namespace on their own device. That keeps the project simple to run, simple to deploy (a static build with zero server cost), and focused entirely on the teaching experience rather than infrastructure.

## About This Project

JiraWay was built as a portfolio project to explore product thinking, interaction design, and frontend engineering — designing a guided learning experience around a genuinely functional clone of a complex real-world tool, rather than a simplified mock.

**Author:** Kaviya — [GitHub](https://github.com/Kaviya0253)
