import { expect, type Page, type TestInfo } from '@playwright/test'

type Reference = Readonly<{ name: string; fullPage?: boolean }>

export async function captureUiReference(page: Page, info: TestInfo, reference: Reference) {
  const options = { fullPage: reference.fullPage, animations: 'disabled' as const }
  const path = info.outputPath(reference.name)
  await page.screenshot({ path, ...options })
  await info.attach(reference.name, { path, contentType: 'image/png' })
  // reason: les polices système diffèrent ; ne pas comparer une capture Linux aux références Windows.
  if (process.platform === 'win32') {
    await expect(page).toHaveScreenshot(reference.name, options)
  } else {
    info.annotations.push({
      type: 'visual-reference',
      description:
        'Capture jointe ; comparaison automatique disponible avec les références Windows.',
    })
  }
}
