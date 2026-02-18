# Solution

This repo intentionally shipped with a few backend and frontend issues. Below is what I changed, and the trade-offs.

## Backend (Node/Express)

### Refactor blocking I/O
- Replaced `fs.readFileSync`/`fs.writeFileSync` in `backend/src/routes/items.js` with `fs.promises.readFile`/`writeFile`.
- Updated route handlers to `async`/`await` while keeping the same `try/catch -> next(err)` behavior.

**Trade-off:** this is still a file-backed “DB”, so each request reads/parses the full JSON file. For a real system, move to a database or a process-level cache with invalidation.

### Performance: cache `/api/stats`
- Implemented an in-memory cache in `backend/src/routes/stats.js`.
- Cache invalidates when `data/items.json` changes, using a cheap signature based on file `mtimeMs` + `size`.
- Added in-flight request deduping to avoid recomputing stats multiple times under concurrency.

**Trade-off:** cache is per-process (lost on restart). `mtimeMs:size` is a pragmatic change detector; a content hash would be stronger but costs more CPU.

### Pagination + server-side search
- `GET /api/items` now supports `q`, `limit`, and `page` (1-based).
- Preserved response shape as an array for backwards compatibility and added `X-Total-Count` for total results after filtering.
- Exposed `X-Total-Count` via CORS (`backend/src/index.js`) so the browser can read it.

**Trade-off:** uses simple `Array.filter` + `slice`, which is fine for the assessment dataset but not for very large datasets.

### Testing
- Added Jest + Supertest tests in `backend/__tests__/items.test.js` (happy paths + error cases).
- Tests mock `fs.promises` to avoid touching disk.

## Frontend (React)

### Fix memory leak on unmount
- Added `AbortController` so requests are cancelled on unmount and we don’t call state setters after unmount.

### Pagination + search UI
- `frontend/src/pages/Items.js` now provides:
  - debounced search input
  - page size selector
  - prev/next paging
- Fetches pass `q/page/limit` to the backend and uses `X-Total-Count` to compute total pages.

### Bug fix: HTML returned instead of JSON
- Centralized API URL building in `frontend/src/utils/api.js`.
  - dev default: `http://localhost:3001`
  - deploy override: `REACT_APP_API_BASE_URL`
- Added a content-type guard so bad responses fail with a clear error.

### Performance: virtualization
- Integrated `react-window` and switched the item list to a virtualized `List` so the UI stays smooth with many rows.

**Trade-off:** fixed row height (fast and simple). If rows become variable-height, we’d switch to dynamic row height support.

### UI/UX polish
- Added `frontend/src/styles.css` for a cleaner layout and improved focus styles.
- Added skeleton loading states for the list and detail view.
- Respects `prefers-reduced-motion` for the shimmer animation.

### Frontend tests
- Added a small Jest test for the API URL helper (`frontend/src/utils/api.test.js`) so `npm test` passes.

## Running tests

```bash
cd backend
npm test

cd ../frontend
# in CI (non-watch) mode:
CI=true npm test
```

