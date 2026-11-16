# Origine des icônes d'agents

Ces icônes illustrent les agents dans le volet « Agent Profiles ». Elles viennent du dépôt d'Orca
(https://github.com/stablyai/orca, licence MIT), commit `ed507d41f4d`.

## Copies directes (38 fichiers)

Copiés tels quels depuis `src/shared/agent-icons/`, mêmes noms de fichier :

amp, ante, antigravity, aug, autohand, cline, codebuddy, codebuff, command-code, continue, copilot,
crush, cursor, devin, droid, dsh, freebuff, gemini, goose, grok, hermes, jcode, kilo, kimi, kiro,
mimo-code, mistral-vibe, muse, openclaude, openclaw, opencode, prime-agent, qoder-cn, qoder,
qwen-code, rovo, trae, zcode.

## Conversions (7 fichiers)

Orca dessine ces sept agents avec des composants JSX et non avec un PNG. Chaque composant a été
transcrit en SVG autonome (`fillOpacity` devient `fill-opacity`, `className` retiré, identifiant de
dégradé écrit en dur), puis rendu avec `rsvg-convert -w 128 -h 128` en PNG transparent de 128 px.
`currentColor` est remplacé par `#D97757` pour Claude et par `#E4E4E7` partout ailleurs (lisible sur
fond sombre, comme dans Orca) ; les couleurs explicites restent.

| Fichier | Composant d'Orca | Fichier source |
|---|---|---|
| `claude.png`, `claude-agent-teams.png` | `ClaudeIcon` | `src/renderer/src/components/status-bar/accounts/provider-icons.tsx` |
| `codex.png` | `OpenAIIcon` | `src/renderer/src/components/status-bar/accounts/provider-icons.tsx` |
| `opencode2.png` | `OpenCodeIcon` | `src/renderer/src/components/agent/icons/agent-icon-glyphs.tsx` |
| `pi.png` | `PiIcon` | `src/renderer/src/components/agent/icons/agent-icon-glyphs.tsx` |
| `omp.png` | `OmpIcon` | `src/renderer/src/components/agent/icons/agent-icon-glyphs.tsx` |
| `aider.png` | `AiderIcon` | `src/renderer/src/components/agent/icons/agent-icon-glyphs.tsx` |

Écart assumé pour `omp.png` : le dégradé d'Orca est écrit en `oklch(...)`, que `rsvg-convert` ne lit
pas (le rendu sort noir). Les trois couleurs ont été converties en sRGB (`#f84fcc`, `#9362f4`,
`#00dbe4`) ; la dernière est hors gamut et se retrouve écrêtée.

## Variantes par thème

Pourquoi : Orca dessine Codex, Aider, Pi et OpenCode 2 avec `currentColor`, donc lisibles dans les deux thèmes.
Nos PNG convertis sont figés en `#E4E4E7` et disparaissent sur fond clair. Kilo a l'inverse : un glyphe sombre,
invisible sur fond sombre. Le store garde toujours le chemin de base (`agent-icons/codex.png`) ; le panneau choisit
la variante au rendu selon `env.theme.colorScheme` (`src/icons.ts`, table `ICON_VARIANTS`).

| Variante | Thème | Glyphe |
|---|---|---|
| `on-light/codex.png`, `on-light/aider.png`, `on-light/pi.png`, `on-light/opencode2.png` | clair | `#18181B` |
| `on-dark/kilo.png` | sombre | `#E4E4E7` |

Recette (à partir de l'icône de base, qui garde sa transparence) :

```
magick agent-icons/codex.png -fill '#18181B' -colorize 100 agent-icons/on-light/codex.png
magick agent-icons/kilo.png -fill '#E4E4E7' -colorize 100 agent-icons/on-dark/kilo.png
```

Ajouter une variante : générer le fichier, puis l'ajouter à `ICON_VARIANTS` ; un test vérifie que chaque variante
déclarée existe sur disque, avec son icône de base.

## Licences

Le code d'Orca est sous licence MIT, « Copyright (c) 2026 Lovecast Inc. ». Les logos restent des
marques de leurs détenteurs respectifs : ils servent ici uniquement à reconnaître l'agent.
