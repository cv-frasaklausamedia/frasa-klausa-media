---
trigger: always_on
---

# Tech Stack & Framework Architecture

You are an expert AI assistant operating in a "vibe coding" environment. You must strictly follow these architectural rules and PRD constraints for all code generation, refactoring, and terminal executions.

## 1. Core Tech Stack
- **Framework:** Next.js 16.x using the App Router (`src/app`). NEVER use the Pages Router.
- **UI & Rendering:** React 19. Default to Server Components. Only use `'use client'` when React state, hooks, or browser APIs are strictly required.
- **Styling:** Tailwind CSS v4. Do not generate `tailwind.config.js` unless explicitly required by a specific component (Tailwind v4 is CSS-first). Use `@tailwindcss/typography` (`prose`) for rich text.
- **UI Components:** shadcn/ui, Radix UI, `lucide-react`, and `@hugeicons/react`. 
- **Package Manager:** Strictly use `npm`. DO NOT use `pnpm` or `yarn`.

## 2. Authentication & Database (Supabase)
- **Library:** Use `@supabase/ssr` and `@supabase/supabase-js`.
- **Auth:** Authentication is ONLY for `admin` and `super_admin`. There is NO public user registration or login.
- **Middleware:** Always configure `src/middleware.ts` for session management and route protection on the Edge Runtime.
- **Migrations:** SQL migrations must be placed in `src/migrations/` with sequential naming (e.g., `001_initial.sql`, `002_add_tables.sql`).
- **Security:** Always assume Row-Level Security (RLS) is enabled. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

## 3. UI/UX & Specific Implementations
- **Sidebar State:** Admin sidebar collapsed/expanded state MUST be persisted using **browser cookies** (via `cookies()` in SSR), NOT `localStorage`. This prevents layout shifts and flickering on page refresh.
- **Global Search:** Use a Command Dialog modal (`cmdk` / shadcn `Command`) triggered by `Ctrl + K` with a 300ms debounce.
- **Rich Text:** Use Tiptap (`@tiptap/react`) for the CMS editor and sanitize output using `isomorphic-dompurify`.
- **Maps:** Use responsive Google Maps Embed iframes for v1.0. DO NOT install heavy map libraries like `maplibre-gl`.
- **Forms & Validation:** Use `react-hook-form` paired with `zod`.
- **Tables & State:** Use `@tanstack/react-table` for data grids. Use Zustand for global client state and `@tanstack/react-query` for server state on the client.

## 4. Business Logic Constraints
- **Checkout Links:** Product pages must support WhatsApp, Shopee, and Tokopedia. If an admin leaves the Shopee/Tokopedia URL empty, the respective button MUST be hidden automatically (fallback rule).
- **Dynamic Copyright:** The public footer must use a dynamic current year format: `[Company Name] © {currentYear}`.
- **Keep-Alive:** Implement a `/api/keep-alive` route that executes a lightweight query (`SELECT 1`) to prevent Supabase auto-pause.

## 5. Vibe Coding & Execution Rules
- **Turbo Mode:** Operate under the assumption of continuous execution. Do not ask for confirmation to run terminal commands (like `npm install <package>` or file creation) UNLESS it is a highly destructive action (e.g., dropping database tables or deleting large directories).
- **Context7 MCP:** Always use your Context7 MCP tools to fetch the latest documentation for Next.js, React 19, Tailwind v4, and Supabase before writing boilerplate.
- **No Hallucinations:** Do not invent fake API keys, tokens, or credentials in the code. Use standard `env.example` placeholders.