# Debug Scripts

Ad-hoc Puppeteer scripts used during development to inspect routes, profiles,
sites, and admin/client pages.

## Local-only helpers

These scripts are local-only debugging helpers. They are not used by the
application in production and should never be run against live data.

## Environment Variables

Credentials are read from environment variables. No credentials should ever be
committed to this repository.

- `debug-admin.js` requires:
  - `DEBUG_ADMIN_EMAIL`
  - `DEBUG_ADMIN_PASSWORD`

- `debug-client.js` requires:
  - `DEBUG_CLIENT_EMAIL`
  - `DEBUG_CLIENT_PASSWORD`

## Usage

```bash
DEBUG_ADMIN_EMAIL=you@example.com DEBUG_ADMIN_PASSWORD=yourpassword node scripts/debug/debug-admin.js
```

## Important notes

- These scripts currently reference `puppeteer`, but `puppeteer` is **not listed in `package.json`** dependencies.
- Before running any script, install Puppeteer separately or add it to the project:
  ```bash
  npm install --save-dev puppeteer
  ```
- Several scripts contain hardcoded `localhost` URLs. Review and update them for your environment before executing.
