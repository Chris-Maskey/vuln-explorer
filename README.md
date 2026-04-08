# Vulnerability Explorer

A lightweight web interface for exploring security vulnerabilities using [OSV.dev](https://osv.dev) and [deps.dev](https://deps.dev).

Enter a CVE ID (e.g. `CVE-2021-44228`) to look up vulnerability details including affected packages, vulnerable version ranges, CVSS scores, aliases, and advisory links. Results are fetched live from the OSV and deps.dev APIs — no API key required.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
  App.tsx                        # Page shell — composes the feature modules
  vulnerabilityLookup.ts          # OSV and deps.dev API layer
  index.css                      # Global styles
  main.tsx                       # React entrypoint
  vulnerability/
    useVulnerabilityLookup.ts     # Lookup state machine and async orchestration
    formatters.ts                 # Display helpers (date formatting)
    components/
      SearchForm.tsx             # CVE ID input and submit button
      StatusBanner.tsx           # Error, info, and partial-notice banners
      LoadingSkeleton.tsx         # Pulse skeleton shown during primary lookup
      OverviewCard.tsx           # ID, CVSS badge, summary, details, aliases, timeline
      AffectedPackagesTable.tsx   # Ecosystem, package, version ranges, specific versions
```

## APIs

- **[OSV.dev](https://osv.dev)** — primary source for vulnerability details, affected packages, and version ranges. No authentication required.
- **[deps.dev](https://deps.dev)** — enrichment layer for CVSS scores and advisory links. Fetched after OSV results and gracefully degrades if unavailable.

## Build

```
npm run build    # Production build to dist/
npm run lint     # TypeScript type check
```
