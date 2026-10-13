import { readFile, writeFile } from 'node:fs/promises'
import { OFFICIAL_SUBCLASSES } from '../src/phbSubclassRules.ts'
const skills = {
  'Knowledge Domain': { count: 2, names: ['Arcana', 'History', 'Nature', 'Religion'] },
  'Nature Domain': { count: 1, names: ['Animal Handling', 'Nature', 'Survival'] },
  'College of Lore': { count: 3, names: [] },
  'Arcana Domain': { count: 1, names: ['Arcana'] },
  'Order Domain': { count: 1, names: ['Intimidation', 'Persuasion'] },
  'Peace Domain': { count: 1, names: ['Insight', 'Performance', 'Persuasion'] },
  'Arcane Archer': { count: 1, names: ['Arcana', 'Nature'] },
  'Way of Mercy': { count: 2, names: ['Insight', 'Medicine'] },
  'Way of the Drunken Master': { count: 1, names: ['Performance'] },
  Bladesinging: { count: 1, names: ['Performance'] },
  'Fey Wanderer': { count: 1, names: ['Deception', 'Performance', 'Persuasion'] },
  Scout: { count: 2, names: ['Nature', 'Survival'] },
}
const proficiencies = {
  'Tempest Domain': 'Heavy Armor, Martial Weapons',
  'War Domain': 'Heavy Armor, Martial Weapons',
  'Death Domain': 'Martial Weapons',
  'Forge Domain': "Heavy Armor, 1 Tool (Smith's Tools)",
  'Order Domain': 'Heavy Armor',
  'Twilight Domain': 'Heavy Armor, Martial Weapons',
  'Nature Domain': 'Heavy Armor',
  'College of Valor': 'Medium Armor, Shields, Martial Weapons',
  'College of Swords': 'Medium Armor, Scimitar',
  Assassin: "2 Tools (Disguise Kit, Poisoner's Kit)",
  Mastermind: '3 Tools (Disguise Kit, Forgery Kit, Gaming Set), 2 Languages',
  'Way of Mercy': '1 Tool (Herbalism Kit)',
  'Way of the Drunken Master': "1 Tool (Brewer's Supplies)",
  'The Hexblade': 'Medium Armor, Shields, Martial Weapons',
  Bladesinging: 'Light Armor, 1 Weapon (One-Handed Melee)',
  Alchemist: "1 Tool (Alchemist's Supplies)",
  Armorer: "Heavy Armor, 1 Tool (Smith's Tools)",
  Artillerist: "1 Tool (Woodcarver's Tools)",
  'Battle Smith': "Martial Weapons, 1 Tool (Smith's Tools)",
}
const source =
  '// Generated official 2014 reference installer. Backs up first; preserves IMAGE formulas.\nconst OFFICIAL_2014=' +
  JSON.stringify(OFFICIAL_SUBCLASSES, null, 2) +
  '\nconst OFFICIAL_SKILLS=' +
  JSON.stringify(skills, null, 2) +
  '\nconst OFFICIAL_PROFICIENCIES=' +
  JSON.stringify(proficiencies, null, 2) +
  '\n\n' +
  (await readFile('scripts/official-installer-body.js', 'utf8'))
await writeFile('../References/Install_Official2014.gs', source)
await writeFile('public/Install_Official2014.gs', source)
console.log('Built official 2014 installer: 13 classes / 118 subclasses')
