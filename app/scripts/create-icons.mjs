import { chromium } from '@playwright/test'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
})
const page = await browser.newPage()
for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>body{margin:0}</style><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7e3042"/><path d="M19 14h26v36H19c-5 0-7-7-2-10h28M22 23h15M22 30h12" fill="none" stroke="#efe0ba" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  )
  await page.screenshot({ path: `public/icon-${size}.png` })
}
await browser.close()
console.log('Generated install icons')
