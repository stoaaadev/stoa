import path from 'path'

const repoRoot = process.env.REPO_PATH
  ? path.resolve(process.env.REPO_PATH)
  : path.resolve(process.cwd(), '..')

export const PATHS = {
  root: repoRoot,
  stoaYml: path.join(repoRoot, 'stoa.yml'),
  memory: path.join(repoRoot, 'memory'),
  cronState: path.join(repoRoot, 'memory', 'cron-state.json'),
  positions: path.join(repoRoot, 'memory', 'positions.json'),
  portfolioState: path.join(repoRoot, 'memory', 'portfolio-state.json'),
  txLog: path.join(repoRoot, 'memory', 'tx-log.json'),
  tokenUsage: path.join(repoRoot, 'memory', 'token-usage.csv'),
  skillHealth: path.join(repoRoot, 'memory', 'skill-health'),
  logs: path.join(repoRoot, 'memory', 'logs'),
  mesh: path.join(repoRoot, 'memory', 'mesh'),
  dedupState: path.join(repoRoot, 'memory', 'dedup-state.json'),
  outputs: path.join(process.cwd(), 'outputs'),
  skills: path.join(repoRoot, 'skills'),
  agents: path.join(repoRoot, 'agents'),
}

export const AUTH_PASSWORD = process.env.AUTH_PASSWORD || ''
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
