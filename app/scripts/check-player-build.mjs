import fs from 'node:fs'
const root = new URL('../dist-players/', import.meta.url)
const assets = fs.readdirSync(new URL('assets/', root))
const javascript = assets
  .filter((f) => f.endsWith('.js'))
  .map((f) => fs.readFileSync(new URL(`assets/${f}`, root), 'utf8'))
  .join('')
if (
  assets.some((f) => /OwnerApp|Offline|^App-/.test(f)) ||
  javascript.includes('1fL_L9AuurbK6zpHtkrPiHfTIJ2NiAp0Gs1ar5AnGeRM') ||
  ['Install_Official2014.gs', 'Install_Pugilist.gs', 'Install_Core2014.gs', 'sw.js'].some((f) =>
    fs.existsSync(new URL(f, root)),
  )
)
  throw Error('Player build contains owner assets. Do not publish it.')
console.log(
  'Player build verified: owner preview, personal sheet URL, legacy journal and installers excluded.',
)
