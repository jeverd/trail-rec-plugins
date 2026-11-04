# trail-rec plugins for Claude

The [trail-rec](https://trail.ariff.ai) plugin for **Claude Code** and **Cowork**: Claude drives your
own Chrome and records what it does, with captions, as proof that a change works, and works
through your teammates' feedback on recordings.

## Install

Claude Code:

```
/plugin marketplace add jeverd/trail-rec-plugins
/plugin install trail-rec@trail-rec
```

Cowork: Customize, Plugins, Add, Add marketplace: `jeverd/trail-rec-plugins`.

The plugin brings the trail-rec CLI with it. You also need Node 20 or newer and the
[trail-rec Chrome extension](https://chromewebstore.google.com/detail/trail-rec/mapophjibjnhalgcpaekmhlgjdbjmjal);
see [trail-rec/README.md](trail-rec/README.md).

Updates: every change is published here as a new commit, and Claude treats each commit as a
new version. To get them as they come, turn on auto-update for this marketplace: in Claude
Code, `/plugin`, Marketplaces, trail-rec, Enable auto-update; in Cowork, Sync automatically.
Or update by hand: `claude plugin update trail-rec@trail-rec`, or Check for updates in Cowork.

This repository is published from trail-rec's own repository. Changes made here are overwritten.
