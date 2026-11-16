// Messages dans la langue d'affichage d'Orca, lue à chaque appel : seul module à mêler `env.locale` et copy.ts.
import { env } from 'orca'
import { localeOf, messagesFor, type Locale, type Messages } from './copy'

export const copy = (): Messages => messagesFor(env.locale)

export const currentLocale = (): Locale => localeOf(env.locale)
