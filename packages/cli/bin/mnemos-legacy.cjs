#!/usr/bin/env node
/**
 * Legacy shim — kept so anyone still running `mnemos` after installing `mnestis`
 * sees a friendly pointer to the new command name.
 */
console.log(`
  The mnemos command is now mnestis.

  Use:
    npx mnestis .
    npm install -g mnestis

  Homepage: https://mnestis.vercel.app
`)
