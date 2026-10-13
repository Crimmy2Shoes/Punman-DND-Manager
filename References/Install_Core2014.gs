// Generated core PHB 2014 subclass reference rows. Does not replace workbook formulas.
const CORE_2014 = {
  "Barbarian": [
    "Path of the Berserker",
    "Path of the Totem Warrior"
  ],
  "Bard": [
    "College of Lore",
    "College of Valor"
  ],
  "Cleric": [
    "Knowledge Domain",
    "Life Domain",
    "Light Domain",
    "Nature Domain",
    "Tempest Domain",
    "Trickery Domain",
    "War Domain"
  ],
  "Druid": [
    "Circle of the Land",
    "Circle of the Moon"
  ],
  "Fighter": [
    "Champion",
    "Battle Master",
    "Eldritch Knight"
  ],
  "Monk": [
    "Way of the Open Hand",
    "Way of Shadow",
    "Way of the Four Elements"
  ],
  "Paladin": [
    "Oath of Devotion",
    "Oath of the Ancients",
    "Oath of Vengeance"
  ],
  "Ranger": [
    "Hunter",
    "Beast Master"
  ],
  "Rogue": [
    "Thief",
    "Assassin",
    "Arcane Trickster"
  ],
  "Sorcerer": [
    "Draconic Bloodline",
    "Wild Magic"
  ],
  "Warlock": [
    "The Archfey",
    "The Fiend",
    "The Great Old One"
  ],
  "Wizard": [
    "School of Abjuration",
    "School of Conjuration",
    "School of Divination",
    "School of Enchantment",
    "School of Evocation",
    "School of Illusion",
    "School of Necromancy",
    "School of Transmutation"
  ]
}

/** Run installCore2014 in Extensions > Apps Script of your native v2.1 sheet. */
function installCore2014() {
  const book = SpreadsheetApp.getActiveSpreadsheet(),
    sheet = book.getSheetByName('Class Info')
  if (!sheet || !book.getSheetByName('v2.1') || sheet.getRange('E5').getValue() !== 'Subclass')
    throw Error('Expected the original v2.1 workbook layout. No changes made.')
  const normalize = (name) =>
    String(name)
      .toLowerCase()
      .replace(
        /^(path of the |college of |circle of the |way of the |way of |oath of the |oath of |school of |the )/,
        '',
      )
      .replace(/ domain$/, '')
  const maxRow = Math.min(180, sheet.getMaxRows()),
    width = Math.min(54, sheet.getMaxColumns() - 1)
  const values = sheet.getRange(7, 2, maxRow - 6, width).getValues(),
    formulas = sheet.getRange(7, 2, maxRow - 6, width).getFormulas()
  const missing = []
  Object.entries(CORE_2014).forEach(([className, subclasses]) =>
    subclasses.forEach((subclass) => {
      if (!values.some((row) => row[0] === className && normalize(row[3]) === normalize(subclass)))
        missing.push({ className, subclass })
    }),
  )
  if (!missing.length) {
    book.toast('All core PHB 2014 subclass names are already installed.')
    return
  }
  let last = 6
  values.forEach((row, i) => {
    if (row[0] !== '') last = i + 7
  })
  let start = 0
  for (let candidate = last + 1; candidate + missing.length - 1 <= maxRow; candidate++) {
    if (
      Array.from({ length: missing.length }, (_, i) => candidate + i).every(
        (row) =>
          !formulas[row - 7].some(Boolean) &&
          values[row - 7].every((v) => v === '' || v === '-' || v === 0 || v === false),
      )
    ) {
      start = candidate
      break
    }
  }
  if (!start) throw Error('No free reference block through Class Info row 180. No changes made.')
  const backup = book.copy(book.getName() + ' — before core 2014 — ' + new Date().toISOString())
  console.log('Backup: ' + backup.getUrl())
  const columns = ['B', 'E', 'I', 'K', 'M', 'O', 'Q', 'X', 'AB', 'AG', 'AJ', 'AM']
  missing.forEach(({ className, subclass }, i) => {
    const row = start + i,
      fields = Object.fromEntries(columns.map((col) => [col, '-']))
    fields.B = className
    fields.E = subclass
    if (subclass === 'Knowledge Domain') {
      fields.Q = 'Choose 2, Arcana, History, Nature, Religion'
      fields.AB = '2 Skills, 2 Languages'
    }
    if (subclass === 'Nature Domain') {
      fields.Q = 'Choose 1, Animal Handling, Nature, Survival'
      fields.AB = 'Heavy Armor, 1 Skill'
    }
    if (['Tempest Domain', 'War Domain'].includes(subclass))
      fields.AB = 'Heavy Armor, Martial Weapons'
    if (subclass === 'College of Valor') fields.AB = 'Medium Armor, Shields, Martial Weapons'
    if (subclass === 'Assassin') fields.AB = "2 Tools (Disguise Kit, Poisoner's Kit)"
    // The original v2.1 AT16 formula explicitly supports this caster type.
    if (['Eldritch Knight', 'Arcane Trickster'].includes(subclass)) {
      fields.AG = 'Third Caster'
      fields.AJ = 'Intelligence'
    }
    Object.entries(fields).forEach(([col, value]) => sheet.getRange(col + row).setValue(value))
  })
  SpreadsheetApp.flush()
  book.toast(missing.length + ' core subclass reference rows added. Refresh the character app.')
}
