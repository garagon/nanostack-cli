<h1 align="center">nanostack</h1>
<p align="center">
  One command. Full engineering team.<br>
  Turns your AI agent into an engineering team that challenges scope, plans, reviews, tests, audits and ships.
</p>

<p align="center">
  <a href="https://nanostack.sh">nanostack.sh</a> · <a href="https://github.com/garagon/nanostack">GitHub</a> · <a href="https://github.com/garagon/nanostack/blob/main/LICENSE">Apache 2.0</a>
</p>

---

## Install

```bash
npx nanostack install
```

Detects your AI coding agents, installs everything, runs setup. Then open your agent and type `/nano-run` to configure your project.

## What you get

A sprint workflow that runs inside your agent:

```
/think → /nano → build → /review → /qa → /security → /ship
```

Each step is a skill. Each skill saves an artifact. The next skill reads it. Nothing falls through the cracks.

| Skill | What it does |
|-------|-------------|
| `/think` | Challenges the scope before building. Three thinking modes. |
| `/nano` | Plans the implementation. Files, steps, risks. |
| `/review` | Two-pass code review. Scope drift detection. |
| `/qa` | Tests it. Browser, API, CLI, or debug. |
| `/security` | OWASP Top 10 + STRIDE audit. Graded A-F. |
| `/ship` | Creates PR, verifies CI, generates sprint journal. |

Plus `/feature` for incremental work, `/guard` for safety, `/compound` for knowledge capture, and `/conductor` for parallel sprints.

Run `/think --autopilot` and the agent runs the full sprint automatically. Or go step by step.

## Supported agents

Works with [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Cursor](https://www.cursor.com), [Codex](https://openai.com/index/introducing-codex), [OpenCode](https://github.com/opencode-ai/opencode), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Amp](https://ampcode.com), [Cline](https://cline.bot), and [Antigravity](https://antigravity.dev).

## Commands

```bash
npx nanostack install   # detect agents, install skills, run setup
npx nanostack update    # pull latest version
npx nanostack doctor    # diagnose installation
```

## Requirements

- macOS, Linux, or Windows (Git Bash / WSL)
- Node.js 18+
- git
- [jq](https://jqlang.github.io/jq/)

## Security

Zero dependencies. All shell execution uses `execFileSync` (no shell injection). Repository URL hardcoded to `github.com/garagon/nanostack`. Cloned repos verified against expected file signatures. No `eval`, no dynamic `require`, no credential handling.

## License

Apache 2.0
