# Testing & Linting Guide

## Unit tests

Run the Vitest suite any time you touch gameplay logic:

```powershell
npm run test:run
```

## Linting

Check JavaScript with ESLint and CSS with Stylelint:

```powershell
npm run lint
```

Or target them individually:

```powershell
npm run lint:js
npm run lint:css
```

The linters skip the generated `dist/` output and browser globals are preconfigured, so the commands should pass without extra flags.
