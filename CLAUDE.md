# CLAUDE.md - Axios Codebase Guide

## Project Overview

Axios is an isomorphic HTTP client (v1.14.0) that runs in Node.js and browsers. Source code is ES modules in `lib/`, with builds for CJS, ESM, and UMD via Rollup.

## Quick Reference

```bash
npm test                          # Run all tests (vitest)
npm run test:vitest:unit          # Unit tests only (fastest)
npm run test:vitest:browser       # Browser tests (Chromium, interactive)
npm run test:vitest:browser:headless  # Browser tests (3 engines, headless)
npm run test:vitest:watch         # Watch mode
npm run lint                      # ESLint on lib/**/*.js
npm run fix                       # Auto-fix lint + Prettier
npm run build                     # Production build (gulp clear + rollup)
npm start                         # Sandbox dev server
npm run examples                  # Examples server on localhost:3000
```

## Source Code Architecture

```
lib/
├── axios.js              # Entry point: createInstance() factory, static exports
├── utils.js              # 40+ type-checking utilities (kindOf, isObject, etc.)
├── core/
│   ├── Axios.js          # Main class: request(), interceptor chain execution
│   ├── AxiosError.js     # Error class with code/config/request/response context
│   ├── AxiosHeaders.js   # Case-insensitive header management with accessors
│   ├── InterceptorManager.js  # Request/response interceptor lifecycle
│   ├── dispatchRequest.js     # Adapter selection and request dispatch
│   ├── mergeConfig.js    # Strategy-based config merging (deep/shallow/override)
│   ├── settle.js         # Response status validation
│   └── transformData.js  # Data transformation pipeline
├── adapters/
│   ├── adapters.js       # Adapter resolution: tries ['xhr', 'http', 'fetch']
│   ├── http.js           # Node.js adapter (HTTP/2, proxies, streams, compression)
│   ├── xhr.js            # Browser XMLHttpRequest adapter
│   └── fetch.js          # Fetch API adapter with streaming
├── cancel/               # CancelToken, CanceledError, isCancel()
├── defaults/             # Default config (transformers, headers, timeouts)
├── platform/             # Platform-specific implementations (node/, browser/)
└── helpers/              # ~30 utility modules (URL building, cookies, streams, etc.)
```

## Key Architectural Patterns

- **Adapter pattern**: Platform-agnostic core with pluggable adapters (http/xhr/fetch)
- **Interceptor chain**: Promise-based request/response middleware with sync/async support
- **Factory pattern**: `createInstance()` returns a callable function with prototype methods
- **Config merging strategy**: Different properties use different merge rules (override vs deep merge)
- **Symbol-based privacy**: Uses `Symbol('internals')` for private class properties
- **Platform abstraction**: `lib/platform/` swaps implementations via package.json `browser` field

## Module System

- Source: ES modules (`.js` extension) with `export default`
- Entry: `index.js` re-exports all named exports from `lib/axios.js`
- Builds: `dist/node/axios.cjs` (Node CJS), `dist/browser/axios.cjs` (Browser CJS), `dist/esm/axios.js` (ESM), `dist/axios.js` (UMD)
- Types: `index.d.ts` (ESM) and `index.d.cts` (CJS)
- Package.json `exports` field handles conditional resolution per environment (bun, react-native, browser, default)

## Test Structure

```
tests/
├── unit/           # *.test.js - Vitest, node environment
├── browser/        # *.browser.test.js - Vitest + Playwright
├── smoke/          # *.smoke.test.js/cjs - Package compatibility
├── module/         # CJS/ESM module resolution tests
└── setup/          # Shared test utilities (server.js, browser.setup.js)
```

- Test framework: **Vitest** (Jest-compatible API)
- Browser tests use **Playwright** provider (Chromium, Firefox, WebKit)
- Test server helpers in `tests/setup/server.js` (Express-based)
- Test timeout: 10 seconds

## Code Style

- **Formatter**: Prettier - semicolons, single quotes, 2-space indent, 100 char width, ES5 trailing commas
- **Linter**: ESLint (flat config) targeting ES2018
- **Pre-commit**: Husky + lint-staged runs Prettier on `*.{js,cjs,mjs,ts,json,md,yml,yaml}`
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`), max 130 char header

## Naming Conventions

- **Classes**: PascalCase (`Axios`, `AxiosError`, `InterceptorManager`)
- **Functions/utils**: camelCase (`buildURL`, `parseHeaders`, `validateStatus`)
- **Constants**: UPPER_SNAKE_CASE (`VERSION`, `ERR_NETWORK`, `ETIMEDOUT`)
- **Error codes**: `ERR_` prefix (`ERR_BAD_OPTION_VALUE`, `ERR_NETWORK`, `ERR_BAD_REQUEST`)
- **Test files**: `name.test.js` (unit), `name.browser.test.js` (browser)

## Important Implementation Details

- `lib/axios.js` creates a default instance via `createInstance(defaults)` - the instance is a bound function that also has methods attached
- Config merging in `mergeConfig.js` has prototype pollution guards (`__proto__`, `constructor`)
- The HTTP adapter (`lib/adapters/http.js`) is the largest file (~29KB) handling redirects, proxies, HTTP/2, compression, and streaming
- `AxiosHeaders` generates dynamic accessor methods (e.g., `getContentType()`, `setAuthorization()`)
- Error codes are defined as static properties on `AxiosError`
- The `lib/env/data.js` VERSION constant is auto-generated by the gulp `env` task

## Common Tasks

**Adding a new helper**: Create in `lib/helpers/`, use default export, add tests in `tests/unit/helpers/`

**Modifying request behavior**: Changes typically go in `lib/core/Axios.js` (interceptor chain) or `lib/core/dispatchRequest.js` (dispatch logic)

**Adding adapter functionality**: Modify the specific adapter in `lib/adapters/`. Node-specific code goes in `http.js`, browser in `xhr.js` or `fetch.js`

**Updating defaults**: Edit `lib/defaults/index.js` for config defaults, `lib/defaults/transitional.js` for backward compatibility flags
