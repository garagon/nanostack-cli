# nanostack

Installer for [nanostack](https://nanostack.sh) skills. Detects your AI coding agents, installs skills, and verifies the installation.

## Install

```bash
npx nanostack install
```

Detects installed agents (Claude Code, Cursor, Codex, OpenCode, Gemini CLI), clones the skill set, and runs setup. One command.

Then run `/nano-run` in your agent to configure your project.

## Update

```bash
npx nanostack update
```

Pulls the latest version and re-runs setup if needed.

## Diagnose

```bash
npx nanostack doctor
```

Checks installation integrity, detects agents, verifies skills and scripts.

## Security

- Zero dependencies
- All shell execution uses `execFileSync` (no shell injection)
- Repository URL is hardcoded to `github.com/garagon/nanostack`
- Cloned repository is verified against expected file signatures
- Remote origin is verified to point to the correct repository
- All paths validated to be under the user's home directory
- No `eval`, no dynamic `require`, no execution of downloaded code
- No credential handling, no privilege escalation

## Supported agents

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Cursor](https://www.cursor.com)
- [Codex](https://openai.com/index/introducing-codex)
- [OpenCode](https://github.com/opencode-ai/opencode)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Amp](https://ampcode.com)
- [Cline](https://cline.bot)
- [Antigravity](https://antigravity.dev)

## License

Apache 2.0
