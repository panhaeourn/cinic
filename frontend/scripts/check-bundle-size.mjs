import { readdir, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const limits = new Map([
  ['.js', 350 * 1024],
  ['.css', 120 * 1024],
  ['.webp', 1200 * 1024],
])
const assetsDirectory = fileURLToPath(new URL('../dist/assets/', import.meta.url))
const failures = []

for (const file of await readdir(assetsDirectory)) {
  const limit = limits.get(extname(file))
  if (!limit) continue
  const { size } = await stat(join(assetsDirectory, file))
  if (size > limit) failures.push(`${file}: ${size} bytes exceeds ${limit}`)
}

if (failures.length) {
  console.error(`Bundle budget failed:\n${failures.join('\n')}`)
  process.exit(1)
}

console.log('Bundle budget passed.')
