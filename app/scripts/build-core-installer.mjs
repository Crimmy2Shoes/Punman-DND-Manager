import { writeFile, readFile } from 'node:fs/promises'
import { PHB_SUBCLASSES } from '../src/phbSubclassRules.ts'
const body = await readFile('scripts/core-installer-body.js', 'utf8')
const source =
  '// Generated core PHB 2014 subclass reference rows. Does not replace workbook formulas.\nconst CORE_2014 = ' +
  JSON.stringify(PHB_SUBCLASSES, null, 2) +
  '\n\n' +
  body
await writeFile('../References/Install_Core2014.gs', source)
await writeFile('public/Install_Core2014.gs', source)
console.log('Built core 2014 installer')
