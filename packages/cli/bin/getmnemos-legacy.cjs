#!/usr/bin/env node
/**
 * Legacy shim — kept so anyone still running `getmnemos` sees a friendly
 * deprecation notice and is pointed at the new package.
 */
console.log(`
  getmnemos has been renamed to mnestis.

  Install the new package:
    npm install -g mnestis
    npx mnestis .

  Homepage: https://mnestis.vercel.app
`)
