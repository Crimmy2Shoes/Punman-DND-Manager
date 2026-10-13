/** Run installOfficial2014 in the native Google Sheet's Apps Script project. */
function installOfficial2014() {
  const book = SpreadsheetApp.getActiveSpreadsheet(),
    sheet = book.getSheetByName('Class Info')
  if (!sheet || !book.getSheetByName('v2.1') || sheet.getRange('E5').getValue() !== 'Subclass')
    throw Error('Expected original v2.1 layout. No changes made.')
  const normalize = (s) =>
    String(s)
      .toLowerCase()
      .replace(
        /^(path of (?:the )?|college of |circle of (?:the )?|way of (?:the )?|oath of (?:the )?|school of |the )/,
        '',
      )
      .replace(/ domain$/, '')
      .replace(/^banneret$/, 'purple dragon knight')
  const cap = 600,
    width = Math.min(54, sheet.getMaxColumns() - 1),
    existing = Math.min(cap, sheet.getMaxRows())
  if (width < 38) throw Error('Class Info columns are missing. No changes made.')
  const values = sheet.getRange(7, 2, existing - 6, width).getValues(),
    formulas = sheet.getRange(7, 2, existing - 6, width).getFormulas()
  const missing = []
  if (!values.some((row) => row[0] === 'Artificer' && ['', '-'].includes(row[3])))
    missing.push({ className: 'Artificer', subclass: '-' })
  Object.entries(OFFICIAL_2014).forEach(([className, subs]) =>
    subs.forEach((subclass) => {
      if (!values.some((row) => row[0] === className && normalize(row[3]) === normalize(subclass)))
        missing.push({ className, subclass })
    }),
  )
  let last = 6
  values.forEach((row, i) => {
    if (row[0] !== '') last = i + 7
  })
  let start = 0
  // Rows107–114 are the existing Pugilist installer's reserved block.
  for (
    let candidate = Math.max(last + 1, 115);
    candidate + missing.length - 1 <= cap;
    candidate++
  ) {
    if (
      Array.from({ length: missing.length }, (_, i) => candidate + i).every(
        (row) =>
          !formulas[row - 7]?.some(Boolean) &&
          (!values[row - 7] ||
            values[row - 7].every((v) => v === '' || v === '-' || v === 0 || v === false)),
      )
    ) {
      start = candidate
      break
    }
  }
  if (missing.length && !start)
    throw Error('No free Class Info block through row600. No changes made.')
  // Only extend explicit references to this table. Never rewrite unrelated ranges or IMAGE formulas.
  const extend = (f) =>
    String(f).replace(
      /('Class Info'!\$?[A-Z]+\$?7:\$?[A-Z]+\$?)180\b/g,
      (_, prefix) => prefix + '600',
    )
  const formulaEdits = [],
    validationEdits = []
  book.getSheets().forEach((tab) => {
    const range = tab.getDataRange(),
      grid = range.getFormulas(),
      validations = range.getDataValidations()
    grid.forEach((row, r) =>
      row.forEach((f, c) => {
        if (!f || /\bIMAGE\s*\(/i.test(f)) return
        const next = extend(f)
        if (next !== f) formulaEdits.push({ tab, row: r + 1, col: c + 1, value: next })
      }),
    )
    validations.forEach((row, r) =>
      row.forEach((rule, c) => {
        if (!rule) return
        const type = rule.getCriteriaType(),
          args = rule.getCriteriaValues()
        if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
          const source = args[0]
          if (
            source.getSheet().getName() === 'Class Info' &&
            source.getRow() === 7 &&
            source.getLastRow() === 180
          )
            validationEdits.push({ tab, row: r + 1, col: c + 1, rule, source, args })
        } else if (
          type === SpreadsheetApp.DataValidationCriteria.CUSTOM_FORMULA &&
          extend(args[0]) !== args[0]
        )
          validationEdits.push({ tab, row: r + 1, col: c + 1, rule, args: [extend(args[0])], type })
      }),
    )
  })
  if (!missing.length && !formulaEdits.length && !validationEdits.length) {
    book.toast('All official 2014 options are already installed.')
    return
  }
  const backup = book.copy(book.getName() + ' — before official 2014 — ' + new Date().toISOString())
  console.log('Backup: ' + backup.getUrl())
  if (sheet.getMaxRows() < cap) sheet.insertRowsAfter(sheet.getMaxRows(), cap - sheet.getMaxRows())
  const columns = ['B', 'E', 'I', 'K', 'M', 'O', 'Q', 'X', 'AB', 'AG', 'AJ', 'AM']
  missing.forEach(({ className, subclass }, i) => {
    const fields = Object.fromEntries(columns.map((col) => [col, '-']))
    fields.B = className
    fields.E = subclass
    if (className === 'Artificer' && subclass === '-') {
      fields.K = 'd8'
      fields.Q =
        'Constitution, Intelligence, Choose 2, Arcana, History, Investigation, Medicine, Nature, Perception, Sleight of Hand'
      fields.X = "Simple Weapons, 1 Tool (Artisan's Tools)"
      fields.AB = "Light Armor, Medium Armor, Shields, 2 Tools (Thieves' Tools, Tinker's Tools)"
      fields.AG = 'Artificer Casting'
      fields.AJ = 'Intelligence'
    }
    const skill = OFFICIAL_SKILLS[subclass]
    if (skill) {
      fields.Q = 'Choose ' + skill.count + ', ' + skill.names.join(', ')
      fields.AB = skill.count + ' Skill' + (skill.count === 1 ? '' : 's')
    }
    if (['Eldritch Knight', 'Arcane Trickster'].includes(subclass)) {
      fields.AG = 'Third Caster'
      fields.AJ = 'Intelligence'
    }
    const profs = OFFICIAL_PROFICIENCIES[subclass]
    if (profs) fields.AB = (fields.AB === '-' ? '' : fields.AB + ', ') + profs
    Object.entries(fields).forEach(([col, value]) =>
      sheet.getRange(col + (start + i)).setValue(value),
    )
  })
  formulaEdits.forEach((e) => e.tab.getRange(e.row, e.col).setFormula(e.value))
  validationEdits.forEach((e) => {
    const args = e.source
      ? [
          sheet.getRange(7, e.source.getColumn(), cap - 6, e.source.getNumColumns()),
          ...e.args.slice(1),
        ]
      : e.args
    e.tab.getRange(e.row, e.col).setDataValidation(
      e.rule
        .copy()
        .withCriteria(e.type || SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE, args)
        .build(),
    )
  })
  SpreadsheetApp.flush()
  book.toast(
    missing.length +
      ' official reference rows added; ' +
      formulaEdits.length +
      ' Class Info ranges extended. Refresh the app.',
  )
}
