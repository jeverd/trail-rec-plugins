# Setup and sign-in

## Install

trail-rec is a single Node file. It needs Node 20 or newer (`node --version`).

```sh
curl -fsSL https://trail.ariff.ai/install.sh | sh    # puts trail-rec in ~/.local/bin
trail-rec --version
```

If `trail-rec` isn't found afterwards, `~/.local/bin` isn't on the PATH. The installer
prints the line to add. For now, run `~/.local/bin/trail-rec`. Ask the user before you
install anything or edit their shell profile.

- `trail-rec update` installs the newest build. The installed skill updates itself to
  match the next time trail-rec runs.
- `trail-rec skill install` installs this skill for the agents on this computer.
  `trail-rec skill status` shows where it's installed.

## Check everything

```sh
trail-rec doctor      # MCP: setup_check
```

It checks the CLI, the sign-in, the trail-rec Chrome extension, the bridge to it, and
agent control, and says how to fix each problem. Run it before recording, and when a
`browser` or `record` command fails.

## The Claude plugin (Claude Code and Cowork)

The trail-rec plugin brings this skill, the tools, and its own copy of the CLI: it
starts `trail-rec mcp` on the user's computer and connects Chrome by itself, so there's
nothing to install but the Chrome extension (and Node 20 or newer). Add it in Claude
Code with `/plugin marketplace add jeverd/trail-rec-plugins` then
`/plugin install trail-rec@trail-rec`; in Cowork, from Customize, Plugins, Add
marketplace. In Cowork, commands run in a sandbox, so use the tools for everything:
sign in with `sign_in_start` and `sign_in_finish`, and if `setup_check` says Chrome
isn't connected (the extension was added after the plugin), call `bridge_install`.
The plugin's CLI updates with the plugin, not with `trail-rec update`.

## MCP

For agents that use tools instead of a shell:

```sh
claude mcp add trail-rec -- trail-rec mcp          # Claude Code
```

Other MCP clients run the command `trail-rec mcp` over stdio. The MCP server uses the
CLI's sign-in, so sign in from a shell first.

## Sign in

Check first:

```sh
trail-rec whoami      # "Ana Ruiz <ana@company.com> on https://…", or "Not signed in. Run: trail-rec login"
```

Sign-in uses a code sent to the user's work email. Ask the user for their email. Don't guess it.

**At a terminal the user is typing in:** `trail-rec login` asks for the email, then the code.

**From an agent (no terminal), in two steps:**

```sh
trail-rec login --email ana@company.com
# → Sent a sign-in code to ana@company.com. Then run: trail-rec login --email ana@company.com --code <code>
```

Ask the user for the 6-digit code from that email (or the sign-in link from it: a
pasted link works as the code too), then:

```sh
trail-rec login --email ana@company.com --code 123456
# → Signed in as Ana Ruiz <ana@company.com> on https://…
```

- Each new code cancels the earlier ones. If a code fails (`That code didn’t work…`),
  ask for the newest one. Don't send another email.
- `Too many sign-in emails for now…` means use a code from the last hour that's already
  in their inbox.
- On a local backend the code goes to Mailpit, not the inbox. The message says where.
- The session is saved in `~/.config/trail-rec/session.json`. Never read or print it.
- `trail-rec logout` signs out.

**In a cloud sandbox (no inbox, a fresh machine each run):** don't sign in. If
`TRAIL_REC_TOKEN` is set, every command already runs as its owner, and `whoami` ends
with `(with TRAIL_REC_TOKEN)`. If it isn't set, ask the user to run
`trail-rec token create --name <agent>` on their own computer and add the token to
this agent's secrets as `TRAIL_REC_TOKEN`. Never print the token, write it to a file,
or commit it. A token can't make more tokens, and `login`/`logout` refuse while it's set.

**Driving a browser in a cloud sandbox.** There's no Chrome with the extension there.
Check with `trail-rec browser status`:

- On Devin, it finds Devin's own Chrome (`Connected to Chrome … at http://127.0.0.1:29229`).
  Recording it records what happens in it, whoever drives.
- Anywhere else, start a headless one: `trail-rec browser launch`. It needs a Chrome or
  Chromium on the machine. If it says `No Chrome found`, ask the user before installing
  one (`npx playwright install chromium`, or set `CHROME_PATH`).
- To be signed in to the app, ask the user for a storage-state file (cookies and
  localStorage, as Playwright saves them): `trail-rec browser launch --storage-state auth.json`.
  Never print or commit it.

Without the CLI, the same token works with the hosted MCP server at
`https://trail.ariff.ai/mcp` (`Authorization: Bearer <token>`), which has the feedback
tools but not the browser or recording ones.
