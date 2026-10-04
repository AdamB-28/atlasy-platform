import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const localCandidates = process.platform === 'win32'
  ? [path.resolve('..', '.venv', 'Scripts', 'python.exe')]
  : [path.resolve('..', '.venv', 'bin', 'python')]
const candidates = [
  ...(process.env.PYTHON ? [{ command: process.env.PYTHON, prefix: [] }] : []),
  ...localCandidates.filter(existsSync).map((command) => ({ command, prefix: [] })),
  { command: 'python', prefix: [] },
  ...(process.platform === 'win32' ? [{ command: 'py', prefix: ['-3'] }] : []),
]

const args = process.argv.slice(2)
for (const candidate of candidates) {
  const result = spawnSync(candidate.command, [...candidate.prefix, ...args], { stdio: 'inherit' })
  if (result.error?.code === 'ENOENT') continue
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  process.exit(result.status ?? 1)
}

console.error('Python 3 was not found. Set PYTHON or install Python 3.8+.')
process.exit(1)