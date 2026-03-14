# kod3.dev

An Nx monorepo for building full-stack web applications. It currently hosts a web-based IDE (kod3.dev) with Angular and React frontends powered by a NestJS backend — but the workspace is designed to support any number of apps sharing the same infrastructure, contracts, and UI primitives.

## Why Nx

[Nx](https://nx.dev) provides the tooling that makes a multi-app, multi-framework monorepo practical:

- **Task orchestration** — build, lint, test, and serve any project with a single command. Nx understands the dependency graph and runs tasks in the right order.
- **Caching** — local and remote computation caching means unchanged projects aren't rebuilt. In this repo, building one app typically cache-hits on all shared libs.
- **Module boundaries** — ESLint rules enforced via project tags (`type:feature`, `type:data-access`, `type:ui`, etc.) prevent illegal cross-layer imports at lint time.
- **Code generation** — scaffolding new libs, components, or services follows consistent patterns across the workspace.
- **Affected commands** — `nx affected -t test` runs only the tests impacted by a given change, keeping CI fast as the repo grows.

## Framework-Agnostic Shared Layer

The `libs/shared/` directory contains code that is completely framework-independent — pure TypeScript with zero Angular or React imports. Any app in the monorepo can depend on it.

| Library      | What it provides                                                  |
| ------------ | ----------------------------------------------------------------- |
| `contracts`  | TypeScript interfaces and DTOs for API communication              |
| `utils`      | Utility functions (file helpers, git tree parsing, monaco config) |
| `styles`     | Global SCSS variables, mixins, and base styles                    |

This means:
- **API contracts are defined once** and consumed by both frontends and the backend — no drift between what the API sends and what the UI expects.
- **Utilities are framework-agnostic**, testable with plain unit tests and reusable across Angular, React, or any future frontend.
- **Adding a new app** (e.g. a dashboard, a mobile web app) starts with shared contracts and utilities already in place — only the UI layer needs to be built.

## Tech Stack

| Layer    | Technology        | Version |
| -------- | ----------------- | ------- |
| Frontend | Angular           | 21.1    |
| Frontend | React             | 19.0    |
| Backend  | NestJS            | 11.0    |
| Monorepo | Nx                | 22.5    |
| Language | TypeScript        | 5.9     |

## Key Dependencies

| Package          | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `monaco-editor`  | Code editor (AMD loader for Angular compat)    |
| `simple-git`     | Git CLI wrapper for backend git operations     |
| `chokidar`       | File system watching for real-time reactivity  |
| `groq-sdk`       | LLM integration (Groq / Llama 3.3)            |
| `socket.io`      | Real-time WebSocket communication              |
| `ioredis`        | Redis client for sessions and caching          |
| `@ngrx/signals`  | Signal-based state management (Angular)        |
| `zustand`        | Lightweight state management (React)           |
| `marked`         | Markdown rendering for AI chat responses       |

## Project Structure

```
apps/
  angular-ide/          Angular frontend (primary) — https://kod3.dev/angular/
  react-ide/            React frontend (alternative)
  nestjs-api/           NestJS backend API

libs/
  angular/
    features/
      auth/             Authentication guards, routes, HTTP error interceptor
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

The codebase is growing and changing fast. Once the architecture stabilizes, tests are coming. Vitest is the planned test runner for all projects — Angular, React, and NestJS.

## Deployment

The app is deployed to **kod3.dev** via Docker and nginx:

- Angular frontend served at `/angular/` by nginx
- NestJS API runs in Docker on port 3000, proxied at `/api/`
- Redis runs alongside the API in Docker Compose
- WebSocket connections proxied at `/socket.io/`

```bash
./deploy/deploy.sh
```
