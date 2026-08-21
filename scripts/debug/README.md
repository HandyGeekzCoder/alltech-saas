# Debug Scripts

Ad-hoc Puppeteer scripts used during development to inspect routes, profiles, sites, and admin/client pages.

## Important notes

- These scripts currently reference `puppeteer`, but `puppeteer` is **not listed in `package.json`** dependencies.
- Before running any script, install Puppeteer separately or add it to the project:
  ```bash
  npm install --save-dev puppeteer
  ```
- Several scripts contain hardcoded `localhost` URLs and placeholder credentials. Review and update them for your environment before executing.
