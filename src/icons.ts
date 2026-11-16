// Variantes d'icônes selon le thème d'Orca, et version estompée. Module pur : le panneau l'importe, il n'a pas de
// système de fichiers, donc la liste des variantes est une table statique (un test la compare au disque dans les deux sens).

export type ColorScheme = 'light' | 'dark'

/**
 * Images de base (chemin relatif à la racine du plugin) qui ont une variante pour un thème : la variante est dans le
 * sous-dossier `on-<thème>/` du même dossier (`agent-icons/on-light/codex.png`).
 * Orca dessine Codex, Aider, Pi et OpenCode 2 avec `currentColor` : notre PNG converti est clair, donc illisible
 * sur fond clair. Kilo a au contraire un glyphe sombre, illisible sur fond sombre.
 */
export const ICON_VARIANTS: Readonly<Record<ColorScheme, readonly string[]>> = {
  light: ['agent-icons/codex.png', 'agent-icons/aider.png', 'agent-icons/pi.png', 'agent-icons/opencode2.png'],
  dark: ['agent-icons/kilo.png']
}

/** Chemin de la variante de `iconPath` pour `colorScheme` si elle existe, sinon `iconPath` inchangé. */
export function themedIcon(iconPath: string, colorScheme: ColorScheme): string {
  if (!ICON_VARIANTS[colorScheme].includes(iconPath)) return iconPath
  const slash = iconPath.lastIndexOf('/')
  return `${iconPath.slice(0, slash)}/on-${colorScheme}/${iconPath.slice(slash + 1)}`
}

/** Version estompée d'une icône (agent absent de l'inventaire) : `agent-icons/x.png` donne `agent-icons/dim/x.png`. */
export function dimIcon(iconPath: string): string {
  return iconPath.replace(/^agent-icons\//, 'agent-icons/dim/')
}
