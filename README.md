# JiraWay

Learn Jira by actually using it.

JiraWay is a hands-on learning platform that teaches complete beginners how to use Jira. Instead of watching videos or skimming docs, learners work inside a real, interactive Jira-style workspace, and every concept is taught by doing the actual action on the actual interface.

**Live Demo:** [https://jira-way.vercel.app](https://jira-way.vercel.app)

---

## Screenshots

| Board View | Backlog View |
|---|---|
| ![Board](docs/board-view.png) | ![Backlog](docs/backlog-view.png) |

## Module Demos

- [Module 1: Orientation](#)
- [Module 2: Creating Your First Issue](#)
- [Module 3: Updating Progress](#)
- [Module 4: Boards and Sprints](#)
- [Module 5: Backlog and Sprint Planning](#)

---



## The Problem It Solves

Beginners often cannot use Jira confidently on their own, even after tutorials or documentation, because those resources explain Jira without ever making you practice it. JiraWay closes that gap: every lesson happens inside a real, working ticket board, not in a slideshow beside one.

## Who It Is For

- **Jira beginners:** anyone starting a new job, internship, or team that uses Jira for the first time.
- **Students and early-career developers:** anyone who wants to learn the tool most engineering teams already run on, before they need it on the job.


## What Makes It Different

- **Learn by doing:** there are no passive tutorial videos. Every explanation is attached directly to the real button, field, or card it describes.
- **One ticket, one story:** a single ticket you create yourself carries through every module, so progress feels continuous rather than a series of disconnected demos.
- **A genuinely working board:** drag-and-drop, comments, subtasks, sprints, and epics all work. It is not a static mockup with hotspots.
- **Zero setup for the learner:** no backend, no account creation beyond a name and email, and nothing to install.

## How It Works

JiraWay follows a Learn, Practice, Apply approach across five guided modules. Each module builds on the same ticket.

| # | Module | What You Do |
|---|---|---|
| 1 | Orientation | Take a guided tour of a real team workspace: project, board, tickets, and team. |
| 2 | Creating Your First Issue | Create a real ticket from scratch, with an optional field-by-field walkthrough. |
| 3 | Updating Progress | Drag your ticket across the board and leave a real comment. |
| 4 | Boards and Sprints | Learn what a sprint badge, search, and "Complete Sprint" actually do. |
| 5 | Backlog and Sprint Planning | See where tickets come from, move one into a sprint, and watch it appear on the board. |

After finishing once, the curriculum unlocks a plain workspace to explore freely, along with a "Practice again" option to revisit any module.

## Features

- **Guided, hands-on modules:** every explanation is tied to the real UI element it describes, never a standalone slide.
- **A real Jira-style board:** drag-and-drop tickets, subtasks, comments, priorities, story points, epics, and sprints.
- **No backend required:** the entire app runs client-side, and learner progress is saved to `localStorage`, scoped per learner.
- **Lightweight login:** name and email only, with no password and no real authentication, just enough to keep each learner's progress separate.
- **Admin tooling:** a hidden admin role for reviewing learner activity and timings, and for resetting demo data during development and demos.

## Tech Stack

- **React** (JavaScript, no TypeScript)
- **Vite** for the build tool and dev server
- **Tailwind CSS** for styling
- **React hooks and `localStorage`** for state, with no backend, database, or external state library


**Author:** Kaviya ([GitHub](https://github.com/Kaviya0253))
