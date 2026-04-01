#!/usr/bin/env node
'use strict';

/**
 * nanostack CLI — Installer for nanostack skills
 *
 * Security:
 * - Zero dependencies
 * - execFileSync only (no shell injection)
 * - Hardcoded repo URL (not user-configurable)
 * - Path validation before every file operation
 * - No eval, no require of downloaded code
 * - No credential handling
 * - No privilege escalation
 * - Repo integrity verification after clone
 */

const { execFileSync } = require('child_process');
const { existsSync, readdirSync, statSync, readFileSync } = require('fs');
const { join, resolve } = require('path');
const os = require('os');

// ─── Constants ─────────────────────────────────────────────
const REPO_URL = 'https://github.com/garagon/nanostack.git';
const REPO_OWNER = 'garagon';
const REPO_NAME = 'nanostack';
const HOME = os.homedir();
const VERSION = '1.0.0';

// Files that must exist in a valid nanostack clone
const EXPECTED_FILES = ['SKILL.md', 'setup', 'ZEN.md', 'bin/save-artifact.sh'];

// ─── Agent registry ────────────────────────────────────────
// Each agent has a detection method and an install path.
// The CLI is agent-agnostic — it detects what's available.
const AGENT_DEFS = [
  {
    name: 'Claude Code',
    host: 'claude',
    detect: () => existsSync(join(HOME, '.claude')) && statSync(join(HOME, '.claude')).isDirectory(),
    skillsDir: () => join(HOME, '.claude', 'skills'),
    installPath: () => join(HOME, '.claude', 'skills', REPO_NAME),
  },
  {
    name: 'Codex',
    host: 'codex',
    detect: () => commandExists('codex'),
    skillsDir: () => join(HOME, '.codex', 'skills'),
    installPath: () => join(HOME, '.codex', 'skills', REPO_NAME),
  },
  {
    name: 'Cursor',
    host: 'cursor',
    detect: () => commandExists('cursor') || existsSync(join(HOME, '.cursor')),
    skillsDir: () => null,
    installPath: () => null,
  },
  {
    name: 'OpenCode',
    host: 'opencode',
    detect: () => commandExists('opencode'),
    skillsDir: () => join(HOME, '.agents', 'skills'),
    installPath: () => join(HOME, '.agents', 'skills', REPO_NAME),
  },
  {
    name: 'Gemini CLI',
    host: 'gemini',
    detect: () => commandExists('gemini'),
    skillsDir: () => null,
    installPath: () => null,
  },
];

// ─── Safe execution helpers ────────────────────────────────

function safeExec(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', timeout: 60000, ...opts });
  } catch {
    return null;
  }
}

function commandExists(name) {
  try {
    execFileSync('which', [name], { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function isValidPath(p) {
  const resolved = resolve(p);
  if (!resolved.startsWith(HOME)) return false;
  if (p.includes('..')) return false;
  return true;
}

// ─── Agent detection ───────────────────────────────────────

function detectAgents() {
  return AGENT_DEFS
    .filter(a => a.detect())
    .map(a => ({
      name: a.name,
      host: a.host,
      skillsDir: a.skillsDir(),
      installPath: a.installPath(),
    }));
}

// Find the nanostack installation across all agent paths
function findInstallation() {
  const agents = detectAgents();
  for (const agent of agents) {
    if (agent.installPath && existsSync(agent.installPath)) {
      return { path: agent.installPath, agent: agent.name };
    }
  }
  return null;
}

// ─── Repo integrity verification ───────────────────────────

function verifyRepo(path) {
  if (!existsSync(path)) return { valid: false, reason: 'path does not exist' };
  if (!existsSync(join(path, '.git'))) return { valid: false, reason: 'not a git repository' };

  for (const file of EXPECTED_FILES) {
    if (!existsSync(join(path, file))) {
      return { valid: false, reason: `missing expected file: ${file}` };
    }
  }

  const remote = safeExec('git', ['-C', path, 'remote', 'get-url', 'origin']);
  if (remote && !remote.trim().includes(REPO_OWNER + '/' + REPO_NAME)) {
    return { valid: false, reason: `remote does not point to ${REPO_OWNER}/${REPO_NAME}` };
  }

  return { valid: true };
}

// ─── install ───────────────────────────────────────────────

function cmdInstall() {
  console.log(`\nnanostack v${VERSION}\n`);

  const agents = detectAgents();

  console.log('Detecting agents...');
  if (agents.length === 0) {
    console.log('  No supported agents found.');
    console.log('  Supported: Claude Code, Cursor, Codex, OpenCode, Gemini CLI');
    process.exit(1);
  }
  agents.forEach(a => console.log(`  ${a.name} ✓`));
  console.log();

  // Find agent with a skills directory for primary install
  const primary = agents.find(a => a.installPath);
  if (!primary) {
    console.log('No agent with a skills directory detected.');
    console.log(`Clone manually: git clone ${REPO_URL}`);
    process.exit(1);
  }

  const installPath = primary.installPath;
  if (!isValidPath(installPath)) {
    console.error(`Error: unsafe install path: ${installPath}`);
    process.exit(1);
  }

  // Clone or update
  if (existsSync(installPath)) {
    const check = verifyRepo(installPath);
    if (check.valid) {
      console.log('Already installed. Updating...');
      const result = safeExec('git', ['-C', installPath, 'pull', '--ff-only']);
      if (result === null) {
        console.error('Update failed. Run manually:');
        console.error(`  cd ${installPath} && git stash && git pull && git stash pop`);
        process.exit(1);
      }
      console.log(result.trim());
    } else {
      console.error(`Error: ${installPath} exists but failed integrity check.`);
      console.error(`Reason: ${check.reason}`);
      console.error('Remove it and try again.');
      process.exit(1);
    }
  } else {
    console.log('Installing...');
    const skillsDir = join(installPath, '..');
    if (!existsSync(skillsDir)) {
      safeExec('mkdir', ['-p', skillsDir]);
    }

    safeExec('git', ['clone', REPO_URL, installPath], { stdio: 'inherit', timeout: 120000 });

    if (!existsSync(installPath)) {
      console.error('Clone failed. Check your network connection.');
      process.exit(1);
    }

    const check = verifyRepo(installPath);
    if (!check.valid) {
      console.error(`Integrity check failed after clone: ${check.reason}`);
      console.error('Report at https://github.com/garagon/nanostack/issues');
      process.exit(1);
    }
  }

  // Run setup
  console.log('\nRunning setup...');
  const setupPath = join(installPath, 'setup');
  if (!existsSync(setupPath)) {
    console.error('Setup script not found.');
    process.exit(1);
  }

  try {
    execFileSync('bash', [setupPath, '--host', 'auto'], {
      cwd: installPath,
      stdio: 'inherit',
      timeout: 30000,
    });
  } catch {
    console.error('Setup failed.');
    process.exit(1);
  }

  // Install Gemini extension if detected
  if (agents.find(a => a.host === 'gemini')) {
    console.log('\nInstalling Gemini extension...');
    const result = safeExec('gemini', ['extensions', 'install', REPO_URL, '--consent'], { timeout: 30000 });
    console.log(result ? '  Gemini extension installed.' : '  Gemini extension already installed.');
  }

  console.log('\nDone. Run /nano-run in your agent to get started.\n');
}

// ─── update ────────────────────────────────────────────────

function cmdUpdate() {
  console.log(`\nnanostack update v${VERSION}\n`);

  const installation = findInstallation();
  if (!installation) {
    console.log('Not installed. Run: npx nanostack install');
    process.exit(1);
  }

  const check = verifyRepo(installation.path);
  if (!check.valid) {
    console.error(`Integrity check failed: ${check.reason}`);
    process.exit(1);
  }

  const upgradePath = join(installation.path, 'bin', 'upgrade.sh');
  if (!existsSync(upgradePath)) {
    console.error('Upgrade script not found.');
    process.exit(1);
  }

  try {
    execFileSync('bash', [upgradePath], {
      cwd: installation.path,
      stdio: 'inherit',
      timeout: 60000,
    });
  } catch {
    console.error('Update failed.');
    process.exit(1);
  }
}

// ─── doctor ────────────────────────────────────────────────

function cmdDoctor() {
  console.log(`\nnanostack doctor v${VERSION}\n`);

  let issues = 0;
  const installation = findInstallation();

  // Installation
  console.log('Installation:');
  if (!installation) {
    console.log('  Not installed. Run: npx nanostack install');
    process.exit(1);
  }

  const installPath = installation.path;
  const check = verifyRepo(installPath);
  console.log(`  Path: ${installPath}`);
  console.log(`  Agent: ${installation.agent}`);
  console.log(`  Integrity: ${check.valid ? '✓' : '✗ ' + check.reason}`);
  if (!check.valid) issues++;

  const ver = safeExec('git', ['-C', installPath, 'describe', '--tags', '--always']);
  if (ver) console.log(`  Version: ${ver.trim()}`);

  safeExec('git', ['-C', installPath, 'fetch', '--dry-run'], { timeout: 10000 });
  const behind = safeExec('git', ['-C', installPath, 'rev-list', '--count', 'HEAD..@{u}']);
  if (behind && parseInt(behind.trim()) > 0) {
    console.log(`  Updates: ${behind.trim()} commits behind. Run: npx nanostack update`);
  } else if (behind) {
    console.log('  Updates: up to date');
  }

  // Agents
  console.log('\nAgents:');
  const agents = detectAgents();
  if (agents.length === 0) {
    console.log('  None detected.');
    issues++;
  } else {
    agents.forEach(a => console.log(`  ${a.name} ✓`));
  }

  // Skills (check across all agent skill directories)
  console.log('\nSkills:');
  const skills = ['think', 'nano', 'review', 'qa', 'security', 'ship', 'guard', 'conductor', 'compound', 'feature', 'nano-run', 'nano-help'];
  const found = [];
  const missing = [];

  for (const skill of skills) {
    let exists = false;
    for (const agent of agents) {
      if (agent.skillsDir && existsSync(join(agent.skillsDir, skill))) {
        exists = true;
        break;
      }
    }
    (exists ? found : missing).push(skill);
  }

  for (let i = 0; i < found.length; i += 4) {
    console.log(`  ${found.slice(i, i + 4).map(s => '/' + s + ' ✓').join('  ')}`);
  }
  if (missing.length > 0) {
    console.log(`  Missing: ${missing.map(s => '/' + s).join(', ')}`);
    issues++;
  }

  // Scripts
  console.log('\nScripts:');
  const binDir = join(installPath, 'bin');
  if (existsSync(binDir)) {
    const scripts = readdirSync(binDir).filter(f => f.endsWith('.sh'));
    const executable = scripts.filter(f => {
      try { return (statSync(join(binDir, f)).mode & 0o111) !== 0; } catch { return false; }
    });
    console.log(`  ${scripts.length} found, ${executable.length} executable`);
    if (executable.length < scripts.length) {
      console.log(`  Fix: chmod +x ${binDir}/*.sh`);
      issues++;
    }
  }

  console.log(`\n${issues === 0 ? 'All checks passed.' : `${issues} issue${issues > 1 ? 's' : ''} found.`}\n`);
  process.exit(issues > 0 ? 1 : 0);
}

// ─── dispatch ──────────────────────────────────────────────

const cmd = process.argv[2];

switch (cmd) {
  case 'install': cmdInstall(); break;
  case 'update':  cmdUpdate(); break;
  case 'doctor':  cmdDoctor(); break;
  case '-v': case '--version':
    console.log(`nanostack v${VERSION}`);
    break;
  case '-h': case '--help': case undefined:
    console.log(`
nanostack v${VERSION}

Usage: npx nanostack <command>

Commands:
  install   Detect agents, install skills, run setup
  update    Pull latest version
  doctor    Diagnose installation

https://nanostack.sh
`);
    break;
  default:
    console.error(`Unknown command: ${cmd}`);
    console.error('Run: npx nanostack --help');
    process.exit(1);
}
