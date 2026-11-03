# trail-rec for Claude

Claude drives your own Chrome and records what it does, with captions, as proof that a
change works. You get a private link to the recording and share it when you want to.
Your teammates can mark up a recording ("this button is cut off"), and Claude pulls
those marks, fixes them, replies, and resolves them.

Works in **Claude Code** and in **Cowork** (when the session runs on your computer).

## Before you start

Nothing to install in Terminal: the plugin brings the trail-rec CLI with it. You need
Node 20 or newer on your computer (https://nodejs.org).

1. Add the trail-rec extension to Chrome:
   https://chromewebstore.google.com/detail/trail-rec/mapophjibjnhalgcpaekmhlgjdbjmjal
2. Add this plugin. In Claude Code:

   ```
   /plugin marketplace add jeverd/trail-rec-plugins
   /plugin install trail-rec@trail-rec
   ```

   In Cowork: Customize, Plugins, Add marketplace: `jeverd/trail-rec-plugins`, then
   install trail-rec.
3. Ask Claude something like "check my trail-rec setup". Claude helps you sign in and
   tells you if anything is missing.
4. For Claude to drive Chrome, turn on "Let agents control this browser" in the
   extension's popup. It's off until you do.

## Try it

- "Open localhost:3000, test the signup form, and record it."
- "Pull the feedback on https://trail.ariff.ai/r/… and fix it."
- "Record a short demo of the new settings page and give me the link."

## What it runs and sends

- **What it starts.** The plugin starts one program on your computer,
  `scripts/start.mjs`, which runs the trail-rec CLI that comes in the plugin
  (`bin/trail-rec.mjs`) as `trail-rec mcp`: that gives Claude the trail-rec tools. The
  plugin downloads nothing.
- **What it writes on your computer.** A copy of that CLI in
  `~/.local/share/trail-rec/plugin/` (the plugin's own folder moves with each version,
  and Chrome needs a path that stays put), Chrome's native messaging file for the
  trail-rec extension (`com.trailrec.bridge.json`, in Chrome's NativeMessagingHosts
  folder) with the small script it starts in `~/.config/trail-rec/`, and your sign-in
  in `~/.config/trail-rec/`. `trail-rec bridge uninstall` removes the Chrome link.
- **Updates.** The CLI updates with the plugin.
- **Chrome.** The tools talk to the trail-rec extension in your Chrome through a local
  connection on your computer. Claude can only drive Chrome after you turn on "Let
  agents control this browser" in the extension's popup.
- **What it sends, and where.** The CLI talks only to trail-rec: `trail.ariff.ai` and
  its database and file storage at Supabase (`yrhoumvbzbiirrpzsmjg.supabase.co`).
  Recordings stay on your computer until you or Claude upload one; an upload is private
  to you until you share it. Reading and replying to feedback uses your trail-rec
  account. Sign-in is by a code emailed to you. Once a day the CLI checks
  `trail.ariff.ai/cli/version.json` for a newer version, with no account details.
- **What a recording holds.** The recorded tab's page structure and changes, clicks,
  scrolling and typing (typed text hidden by default), console messages, network
  requests (addresses, methods, status codes, timings), errors, and a video of the tab.
  Emails, card numbers, and tokens are scrubbed from console output and addresses
  before anything is saved.
- **Tool labels.** Every tool is labeled as read-only or as one that changes something,
  so Claude asks before the ones that act on a page or your recordings.

Privacy: https://trail.ariff.ai/privacy. Setup, tools, and help: https://trail.ariff.ai/claude

## If something doesn't work

Ask Claude to run **setup_check**, or run `trail-rec doctor` in Terminal. It checks the
CLI, the sign-in, the Chrome extension and the connection to it, and says what to fix.
