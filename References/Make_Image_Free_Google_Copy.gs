/**
 * Paste into Extensions > Apps Script in the native Google spreadsheet.
 * Run makeImageFreeCopy. It creates a separate copy; the source is never edited.
 * It clears only cells whose formulas call IMAGE, keeping other formulas and formatting.
 */
function makeImageFreeCopy() {
  const source = SpreadsheetApp.getActiveSpreadsheet();
  if (!source) throw new Error('Run this from the spreadsheet through Extensions > Apps Script.');
  const copy = source.copy(source.getName() + ' — No External Images');
  let removed = 0;
  for (const sheet of copy.getSheets()) {
    const range = sheet.getDataRange();
    const formulas = range.getFormulas();
    const addresses = [];
    for (let row = 0; row < formulas.length; row++) {
      for (let col = 0; col < formulas[row].length; col++) {
        if (/\bIMAGE\s*\(/i.test(formulas[row][col])) {
          addresses.push(sheet.getRange(range.getRow() + row, range.getColumn() + col).getA1Notation());
        }
      }
    }
    if (addresses.length) sheet.getRangeList(addresses).clearContent();
    removed += addresses.length;
  }
  SpreadsheetApp.flush();
  const url = copy.getUrl();
  console.log('Created copy: ' + url);
  console.log('Removed IMAGE formula cells: ' + removed);
  console.log('Original sheet unchanged: ' + source.getUrl());
  SpreadsheetApp.getUi().alert('Image-free copy created', 'Removed ' + removed + ' image formulas. Your original sheet is unchanged.\n\nCopy URL:\n' + url, SpreadsheetApp.getUi().ButtonSet.OK);
}
