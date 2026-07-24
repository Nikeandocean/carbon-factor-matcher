#!/usr/bin/env node

/**
 * Carbon Factor Matcher - MCP Server
 *
 * npm wrapper that launches the Python MCP server.
 * Auto-installs from PyPI if not already present.
 */

const { execSync, spawn } = require('child_process');

// Check if Python is available
try {
  execSync('python --version', { stdio: 'ignore' });
} catch (e) {
  console.error('Error: Python 3.11+ is required to run carbon-factor-matcher');
  console.error('Install from https://www.python.org/downloads/');
  process.exit(1);
}

// Ensure the Python package is installed (upgrade if outdated)
try {
  execSync('python -c "import carbon_factor_matcher"', { stdio: 'ignore' });
  // Package exists, try to upgrade silently
  try {
    execSync('pip install --upgrade carbon-factor-matcher', { stdio: 'ignore' });
  } catch (_) {
    // Ignore upgrade failures (offline, permission, etc.)
  }
} catch (_) {
  console.error('Installing carbon-factor-matcher from PyPI...');
  try {
    execSync('pip install carbon-factor-matcher', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to install. Run manually: pip install carbon-factor-matcher');
    process.exit(1);
  }
}

// Launch the MCP server
const child = spawn('python', ['-m', 'carbon_factor_matcher'], {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
