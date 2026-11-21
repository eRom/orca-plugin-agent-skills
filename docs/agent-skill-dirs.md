# Project skill directories read by Orca's agents

Research of 2026-11-16, primary sources only (official docs, the agent's own repository). `src/skill-dirs.ts` encodes
this table: only **verified** reads count, an unverified read is treated as absent. Re-check before each release.

Which agents are detected, and from which source (Orca's history, then the config directories of the section
"Config directories used for detection" below), is described for users in the README, section "Platforms".

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

## Config directories used for detection

Research of 2026-11-21, primary sources only (official docs, the agent's own repository). Detection looks for these
directories in the user's home, for the Orca agents that skills.sh does not know (the `skills` library detects the
others). A directory counts only when a primary source says the agent creates or reads it; no source means no
signal. `src/agents.ts` encodes this table (`configDirs`). Re-check before each release. A relocated home
(`XDG_CONFIG_HOME`, `DSH_HOME`, `JCODE_HOME`, `MIMOCODE_HOME`, `PRIME_AGENT_CODING_AGENT_DIR`, `ANTE_HOME`,
`PI_CONFIG_DIR` for OMP) is not followed: such a user falls back on Orca's history. Source for `PI_CONFIG_DIR`
(fetched 2026-11-21): can1357/oh-my-pi `packages/utils/src/dirs.ts`, `getConfigDirName()` returns
`process.env.PI_CONFIG_DIR || ".omp"` (`CONFIG_DIR_NAME`), and the config root is `~/<that name>`.

| Orca agent | Home directory (signal) | Source (2026-11-21) |
|---|---|---|
| openclaude | `.openclaude` | Twigpine/openclaude `docs/skills.md`: user settings `~/.openclaude/settings.json`, user skills `~/.openclaude/skills` |
| opencode2 | none | opencode.ai/v2/docs/cli/config: `~/.config/opencode/cli.json`, the directory OpenCode already uses, so it carries no v2-only signal; the agent is seen through Orca's history only |
| mimo-code | `.config/mimocode` | XiaomiMiMo/MiMo-Code README, File Locations table: `~/.config/mimocode/mimocode.jsonc`, `tui.json`, personal skills `~/.config/mimocode/skills/` (Windows: `%LOCALAPPDATA%\mimocode`, not covered) |
| ante | `.ante` | docs.antigma.ai/extend/skills: user-level skills in `~/.ante/skills/` |
| muse | none | no primary source found (Meta's docs name no home directory; `~/.config/muse` appears only in a third-party blog) |
| dsh | `.dsh` | deepseek-ai/deepseek-harness `packages/util/home-paths` (`README.md` and `src/index.ts`: `DSH_HOME_DIR_NAME = '.dsh'`, default home `~/.dsh`) |
| omp | `.omp` | can1357/oh-my-pi `packages/utils/src/dirs.ts`: `CONFIG_DIR_NAME = '.omp'`, config root `~/.omp`, agent directory `~/.omp/agent` |
| prime-agent | `.prime/agent` | PrimeIntellect-ai/prime-agent `crates/pa-types/src/platform/dirs.rs`: `CONFIG_DIR_NAME = ".prime/agent"`, `agent_dir()` is `<home>/.prime/agent` |
| codebuff | `.config/manicode` | CodebuffAI/codebuff `cli/src/utils/config-dir.ts` and `sdk/src/credentials.ts`: `os.homedir()/.config/manicode` |
| freebuff | `.config/manicode` | same CLI source as Codebuff (`FREEBUFF_CONFIG_DIR` only overrides it): the two share this directory, so it cannot tell them apart |
| jcode | `.jcode` | 1jehuang/jcode `crates/jcode-storage/src/lib.rs`: `jcode_dir()` is `JCODE_HOME` or `<home>/.jcode` |

Agents with no signal at all and no skills.sh identifier (`UNDETECTED_AGENTS` in `src/agents.ts`): opencode2 and muse.
Both are in Orca's history list, so they appear once the user has run them in Orca. Local check on Romain's Mac
(2026-11-21): `~/.dsh`, `~/.omp` and `~/.config/opencode` exist.
