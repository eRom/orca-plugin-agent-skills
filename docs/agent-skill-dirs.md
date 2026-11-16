# Project skill directories read by Orca's agents

Research of 2026-11-16, primary sources only (official docs, the agent's own repository). `src/skill-dirs.ts` encodes
this table: only **verified** reads count, an unverified read is treated as absent. Re-check before each release.

Managed directories (the only ones the plugin reads, lists, writes or removes): `.agents/skills`, `.claude/skills`,
`.grok/skills`, `.kiro/skills`, `.qoder/skills`, `.codebuddy/skills`, `.zcode/skills`, `.trae/skills`,
`.openclaude/skills`, `.prime/agent/skills`. Never the root `skills/`.

| Orca agent | Managed dirs read (verified) | Other project dirs it reads | Source |
|---|---|---|---|
| claude, claude-agent-teams | `.claude/skills` | nested `.claude/skills` | code.claude.com/docs/en/skills (2026-11-16, Claude Code 2.1.325); `.agents` requests #31005, #107421 open |
| openclaude | `.openclaude/skills` | user `~/.agents/skills` | Twigpine/openclaude `docs/skills.md` (v0.36.0) |
| codex | `.agents/skills` | | developers.openai.com/codex/skills |
| grok | `.grok/skills` | project `.agents` / `.claude` unverified | docs.x.ai/build/features/skills-plugins-marketplaces (2026-08-11) |
| copilot | `.agents/skills`, `.claude/skills` | `.github/skills` | docs.github.com, Copilot CLI agent skills |
| opencode | `.agents/skills`, `.claude/skills` | `.opencode/skills` | opencode.ai/docs/skills |
| opencode2 | `.agents/skills`, `.claude/skills` | | assumed as OpenCode (beta of the same agent), unverified |
| mimo-code | `.agents/skills` | `.mimocode/skills`; `.claude` opt-in | XiaomiMiMo/MiMo-Code README (v0.1.17) |
| ante | `.agents/skills`, `.claude/skills` | `.ante/skills` | docs.antigma.ai/extend/skills |
| trae | `.trae/skills` | | docs.trae.ai (IDE page; no CLI page found) |
| muse | `.agents/skills`, `.claude/skills` | `.codex/skills` | ai.developer.meta.com, Muse Code docs |
| dsh | `.agents/skills` | `.dsh/skills` | deepseek-ai/deepseek-harness `packages/skill/skill-filesystem/README.md` |
| qoder, qoder-cn | `.qoder/skills` | | docs.qoder.com/cli/Skills |
| zcode | `.zcode/skills` | | zcode.z.ai/docs/skill |
| pi | `.agents/skills` | `.pi/skills` | pi.dev/docs/latest/skills |
| omp | `.agents/skills` | `.omp`, others (exact list not extracted) | can1357/oh-my-pi `docs/skills.md` |
| prime-agent | `.prime/agent/skills` | | PrimeIntellect-ai/prime-agent `crates/pa-core/src/skills/loader.rs` |
| gemini | `.agents/skills` | `.gemini/skills` | geminicli.com/docs/cli/skills |
| antigravity | `.agents/skills` | `.agent/skills` (legacy) | antigravity.google/docs/skills |
| aider | none (no skills support) | | aider docs and HISTORY.md (v0.86.0) |
| goose | `.agents/skills`, `.claude/skills` | `.goose/skills` | goose-docs.ai, Agent Skills |
| amp | `.agents/skills`, `.claude/skills` | | ampcode.com/manual |
| kilo | `.agents/skills` | `.kilo/skills`; `.claude` behind a setting | Kilo-Org/kilocode `packages/kilo-docs/pages/customize/skills.md` |
| kiro | `.kiro/skills` | | kiro.dev/docs/skills |
| crush | `.agents/skills`, `.claude/skills` | `.crush/skills`, `.cursor/skills` | charmbracelet/crush `internal/config/load.go` |
| aug | `.agents/skills`, `.claude/skills` | `.augment/skills` | docs.augmentcode.com/cli/skills |
| autohand | `.agents/skills`, `.claude/skills` | `.autohand/skills` | autohandai/code-cli `docs/agent-skills.md` |
| cline | `.agents/skills`, `.claude/skills` | `.cline/skills`, `.clinerules/skills` | cline/cline `skill-directories.ts` (VS Code extension) |
| codebuff | `.agents/skills`, `.claude/skills` | | CodebuffAI/codebuff `sdk/src/skills/load-skills.ts` |
| freebuff | `.agents/skills`, `.claude/skills` | | same SDK as Codebuff |
| command-code | `.agents/skills` | `.commandcode/skills` | commandcode.ai docs, Agent Skills |
| continue | `.claude/skills` | `.continue/skills` | continuedev/continue `extensions/cli/src/util/loadMarkdownSkills.ts` |
| cursor | `.agents/skills`, `.claude/skills` | `.cursor/skills`, `.codex/skills` | cursor.com/docs/skills |
| droid | `.agents/skills` | `.factory/skills` | docs.factory.ai/cli/configuration/skills |
| kimi | `.agents/skills` | one brand dir among `.kimi`, `.claude`, `.codex` | MoonshotAI/kimi-cli `docs/en/customization/skills.md` |
| mistral-vibe | `.agents/skills` (trusted folder only) | `.vibe/skills` | docs.mistral.ai Skills; mistral-vibe 2.2.0 notes |
| qwen-code | `.agents/skills` | `.qwen/skills` | Qwen Code docs, Agent Skills (search extract) |
| rovo | `.agents/skills` | `.rovodev/skills` | support.atlassian.com, Rovo Dev CLI Agent Skills |
| hermes | `.agents/skills` (after `hermes skills trust`) | `.hermes/skills` | NousResearch/hermes-agent `agent/skill_utils.py` |
| devin | `.agents/skills` | `.devin/skills`, `.windsurf/skills` | docs.devin.ai |
| openclaw | `.agents/skills` | root `skills/` (not managed) | openclaw/openclaw `docs/tools/skills.md` |
| codebuddy | `.codebuddy/skills` | | codebuddy.ai/docs/cli/skills |
| jcode | `.agents/skills`, `.claude/skills` | `.jcode/skills` | 1jehuang/jcode `crates/jcode-base/src/skill.rs` |

Writing: the `skills` library writes `.agents/skills` (`universal`), `.claude/skills` (`claude-code`), `.grok/skills`
(`grok`), `.kiro/skills` (`kiro-cli`), `.qoder/skills` (`qoder`), `.codebuddy/skills` (`codebuddy`), `.zcode/skills`
(`zcode`), `.trae/skills` (`trae`). The plugin copies files itself into `.openclaude/skills` and `.prime/agent/skills`,
which the library does not know.
