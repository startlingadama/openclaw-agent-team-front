<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history - force pushing, or rebasing/amending/squashing commits
> that are already pushed - as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All backend calls go through `src/lib/api` (typed client); there is no runtime mock fallback. The Python backend is the source of truth, using `VITE_API_BASE_URL` or the local default `http://127.0.0.1:8000`.
- Auth is delegated to the Python backend (`/api/auth/login|signup|me|logout`, bearer token); client-side `AuthGate` in __root protects pages - no Cloud auth, backend owns authorization.
- Real-time: all execution events go through `src/lib/api/stream.ts` (ExecutionStream: SSE via fetch+ReadableStream so the Bearer token can be sent). Components never open EventSource directly - they use `useExecutionStream` (`src/lib/api/use-execution-stream.ts`), which writes backend events into the React Query cache. Backend endpoint: `GET /api/tasks/{id}/events` (SSE, JSON data frames, event types per spec §9).
