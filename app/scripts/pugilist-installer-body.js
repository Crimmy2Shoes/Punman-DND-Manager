/** Run installPugilist from Extensions > Apps Script in the native character sheet. */
function installPugilist() {
  const book = SpreadsheetApp.getActiveSpreadsheet()
  const main = book.getSheetByName('v2.1')
  const classes = book.getSheetByName('Class Info')
  const attacks = book.getSheetByName('Attack Info')
  const inventory = book.getSheetByName('Inventory')
  if (!main || !classes || !attacks || !inventory)
    throw new Error('Expected the original v2.1 workbook layout. No changes made.')
  if (book.getSheetByName('Pugilist'))
    throw new Error(
      'A Pugilist tab already exists. No changes made; inspect it before installing again.',
    )
  if (book.getNamedRanges().some((r) => r.getName() === 'PugilistLevel'))
    throw new Error('PugilistLevel already exists. No changes made.')
  function nextRow(sheet, maximum, needed, name) {
    const values = sheet.getRange(7, 2, maximum - 6, 1).getValues()
    if (values.some((row) => row[0] === name))
      throw new Error(name + ' already exists. No changes made.')
    let last = 6
    values.forEach((row, index) => {
      if (row[0] !== '') last = index + 7
    })
    for (let start = last + 1; start + needed - 1 <= maximum; start++) {
      let free = true
      for (let row = start; row < start + needed; row++) {
        const range = sheet.getRange(row, 2, 1, Math.min(42, sheet.getMaxColumns() - 1))
        if (
          range.getValues()[0].some((v) => v !== '' && v !== 0 && v !== false && v !== '-') ||
          range.getFormulas()[0].some(Boolean)
        ) {
          free = false
          break
        }
      }
      if (free) return start
    }
    throw new Error('No free block of reference rows in ' + sheet.getName() + '. No changes made.')
  }
  const classRow = nextRow(classes, 180, 1 + PUGILIST.clubs.length, 'Pugilist')
  const attackRow = nextRow(attacks, 201, 1, 'Pugilist Fisticuffs')
  const originals = [
    ['v2.1', 'C15'],
    ['v2.1', 'C25'],
    ['v2.1', 'H18'],
    ['Inventory', 'E24'],
  ].map(([tab, cell]) => ({
    tab,
    cell,
    formula: book.getSheetByName(tab).getRange(cell).getFormula(),
  }))
  if (originals.some((c) => !c.formula))
    throw new Error('Expected effective-score and carrying-capacity formulas. No changes made.')
  // The backup retains all artwork, formulas, scripts and existing character values.
  const backup = book.copy(book.getName() + ' — before Pugilist — ' + new Date().toISOString())
  console.log('Backup: ' + backup.getUrl())
  try {
    const pugilist = book.insertSheet('Pugilist')
    Object.entries(PUGILIST.cells).forEach(([address, value]) =>
      pugilist.getRange(address).setValue(value),
    )
    pugilist
      .getRange('D2:F21')
      .setValues(PUGILIST.moxie.map((points, index) => [index + 1, PUGILIST.dice[index], points]))
    book.setNamedRange('PugilistLevel', pugilist.getRange('B2'))
    const checkbox = SpreadsheetApp.newDataValidation()
      .requireCheckbox()
      .setAllowInvalid(false)
      .build()
    PUGILIST.checkboxes.forEach((address) => pugilist.getRange(address).setDataValidation(checkbox))
    const integer = (formula) =>
      SpreadsheetApp.newDataValidation()
        .requireFormulaSatisfied(formula)
        .setAllowInvalid(false)
        .build()
    Object.entries(PUGILIST.validations).forEach(([address, formula]) =>
      pugilist.getRange(address).setDataValidation(integer(formula)),
    )
    Object.entries(PUGILIST.classColumns).forEach(([col, value]) =>
      classes.getRange(col + classRow).setValue(value),
    )
    PUGILIST.clubs.forEach((club, index) => {
      const row = classRow + index + 1
      Object.keys(PUGILIST.classColumns).forEach((col) =>
        classes.getRange(col + row).setValue(col === 'B' ? 'Pugilist' : col === 'E' ? club : '-'),
      )
      if (club === 'Arena Royale') classes.getRange('AM' + row).setFormula('=Pugilist!B34')
      if (club === 'Bloodhound Bruisers')
        classes
          .getRange('M' + row)
          .setFormula(
            '=IF(AND(PugilistLevel>=11,Pugilist!B37),proficiencyBonus,IF(PugilistLevel>=3,"adv","-"))',
          )
      if (club === 'Hand of Dread')
        classes.getRange('AJ' + row).setFormula('=IF(PugilistLevel>=3,"Constitution","-")')
    })
    Object.entries(PUGILIST.attackColumns).forEach(([col, value]) =>
      attacks.getRange(col + attackRow).setValue(value),
    )
    originals.forEach(({ tab, cell, formula }) => {
      const expression = '(' + formula.slice(1) + ')'
      const next =
        tab === 'Inventory'
          ? '=IF(PugilistLevel>=15,' + expression + '*2,' + expression + ')'
          : cell === 'H18'
            ? '=IF(PugilistLevel>=7,1,' + expression + ')'
            : '=IF(AND(PugilistLevel>=20,Pugilist!B25),MAX(' +
              expression +
              ',MIN(22,' +
              expression +
              '+2)),' +
              expression +
              ')'
      book.getSheetByName(tab).getRange(cell).setFormula(next)
    })
    pugilist
      .getRange('B25')
      .setNote(
        'Enable only if the level-20 STR/CON increases have not already been applied manually.',
      )
    pugilist
      .getRange('B11')
      .setNote('Pugilist exhaustion tracker; condition effects are adjudicated at the table.')
    pugilist
      .getRange('B3')
      .setNote('Choose a Fight Club in the class/level text or app creation wizard.')
    pugilist
      .getRange('B5')
      .setNote(
        'Restore after an eligible short or long rest. Check current points after changing level.',
      )
    pugilist.setFrozenRows(1)
    pugilist.setColumnWidth(1, 280)
    pugilist.setColumnWidth(2, 230)
    pugilist
      .getRange('A1:F1')
      .setBackground('#253a32')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
    pugilist.getRange('A2:A39').setFontWeight('bold')
    pugilist.getRange('A1:F39').setWrap(true)
    SpreadsheetApp.flush()
    console.log('Installed in: ' + book.getUrl())
    SpreadsheetApp.getUi().alert(
      'Pugilist installed. Refresh the app. Your backup is:\n' + backup.getUrl(),
    )
  } catch (error) {
    throw new Error(
      'Installation stopped: ' +
        error.message +
        '. Restore the backup if needed: ' +
        backup.getUrl(),
    )
  }
}
