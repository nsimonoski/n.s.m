# kod3.dev

This is an Nx monorepo that currently hosts a web-based IDE at
[kod3.dev](https://kod3.dev/angular/). It has Angular and React frontends with a NestJS backend. The
workspace isn't tied to just the IDE though — it's set up so new apps can be added and share the
same libs, contracts, and styles.

## Why Nx

[Nx](https://nx.dev) makes multi-app, multi-framework monorepo development easy.

- **Code sharing** — feature libs like auth or file-explorer can be pulled into any Angular app.
  Shared contracts and utilities work across Angular, React, and NestJS. No copy-pasting between
  projects.
- **Versioning** — one `package.json`, one source of truth. Every app uses the same version of every
  dependency.
- **Task orchestration** — `nx build angular-ide` figures out what needs to be built first
  (contracts, utils, data-access...) and does it in the right order. You don't think about it.
- **Caching** — if a lib hasn't changed, Nx skips rebuilding it. Most of the time a full build only
  actually compiles the app itself.
- **Module boundaries** — ESLint rules enforce which libs can import what. A `type:ui` lib can't
  import from `type:feature`, for example. Catches bad imports at lint time, not at code review.
- **Code generation** — `nx generate` scaffolds new libs and components with consistent structure.
- **Affected commands** — `nx affected -t test` only runs the tests touched by your changes. Keeps
  CI fast.

## Shared Layer

Everything under `libs/shared/` is pure TypeScript — no Angular, no React. Any app can use it.

| Library     | What's in it                                            |
| ----------- | ------------------------------------------------------- |
| `contracts` | Interfaces and DTOs for API communication               |
| `utils`     | File helpers, git tree parsing, monaco config, env vars |
| `styles`    | SCSS variables, mixins, base styles                     |

The idea is simple: define your API types once, use them everywhere. The backend and both frontends
always agree on the shape of the data. When you add a new app, all of this is already there — you
just build the UI.

## Tech Stack

| Layer    | Technology | Version |
| -------- | ---------- | ------- |
| Frontend | Angular    | 21.1    |
| Frontend | React      | 19.0    |
| Backend  | NestJS     | 11.0    |
| Monorepo | Nx         | 22.5    |
| Language | TypeScript | 5.9     |

## Key Dependencies

| Package         | What it does                                |
| --------------- | ------------------------------------------- |
| `monaco-editor` | Code editor (AMD loader for Angular compat) |
| `simple-git`    | Git operations on the backend            |
| `chokidar`      | Watches the file system for changes         |
| `groq-sdk`      | AI chat via Groq (Llama 3.3)                |
| `socket.io`     | Real-time communication over WebSockets     |
| `ioredis`       | Redis for sessions and caching              |
| `@ngrx/signals` | State management on the Angular side        |
| `zustand`       | State management on the React side          |
| `marked`        | Renders markdown in AI chat responses       |

## Project Structure

```
apps/
  angular-ide/          Angular frontend (primary) — https://kod3.dev/angular/
  react-ide/            React frontend (alternative)
  nestjs-api/           NestJS backend API

libs/
  angular/
    features/
      auth/             Auth guards, routes, HTTP error interceptor
      ai-chat/          AI chat panel (Groq-powered)
      code-editor/      Monaco editor wrapper
      file-explorer/    File tree browser
      file-explorer-git/Git-aware file explorer with commit workflow
      ide/              IDE shell layout, activity bar, footer, branch picker
    shared/
      data-access/      HTTP services, WebSocket services, NgRx signal stores
      ui/               Reusable UI components (command palette, snackbar)
      utils/            Angular-specific utilities

  react/
    features/
      code-editor/      Monaco editor wrapper
      file-explorer/    File tree browser
    shared/
      data-access/      Zustand stores, WebSocket hooks
      ui/               Reusable UI components

  shared/
    contracts/          TypeScript interfaces and DTOs shared across apps
    utils/              Framework-agnostic utilities (file, git, monaco, env)
    styles/             Global SCSS variables, mixins, base styles

deploy/
  deploy.sh             Build and deploy script
  nginx/kod3.dev        Nginx reverse proxy config
```

## Commands

```bash
# Start apps locally
npm run angular-ide:start     # Angular frontend
npm run react-ide:start       # React frontend
npm run api:start             # NestJS backend

# Build
npx nx build angular-ide
npx nx build nestjs-api

# Lint & test
npx nx lint <project>
npx nx test <project>
npx nx run-many -t lint       # Lint all projects
npx nx run-many -t test       # Test all projects

# Visualize project graph
npx nx graph
```

## Testing

The codebase is still moving fast. Once things stabilize, proper test coverage is coming. Vitest is
the planned test runner for all projects — Angular, React, and NestJS.

## Deployment

Deployed to **kod3.dev** with Docker and nginx. Deployment runs automatically on merge to `dev`.

The deploy script builds the Angular frontend and NestJS API, then uploads everything to the server.
The frontend is served with nginx. The API and Redis run inside Docker containers. Nginx sits
in front and routes traffic — frontend requests get the static files, API and WebSocket requests are
forwarded to the backend container.
