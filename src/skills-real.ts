// Seul import d'exécution de la bibliothèque `skills`. Chargé par le worker empaqueté, jamais par les tests.
import * as skills from 'skills'
import { createSkillsLib } from './skills-lib'

export const realSkillsLib = createSkillsLib(skills)
