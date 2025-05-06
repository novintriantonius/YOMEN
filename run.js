#!/usr/bin/env node

const os = require('os');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get platform
const platform = os.platform();

// Check if NodeJS is installed
try {
  const nodeVersion = require('child_process').execSync('node -v').toString().trim();
  console.log(`Node.js ${nodeVersion} detected.`);
} catch (error) {
  console.error('Error: Node.js is not installed. Please install it from https://nodejs.org/');
  process.exit(1);
}

// Cross-platform launcher
console.log(`Detected platform: ${platform}`);

const runScript = () => {
  if (platform === 'win32') {
    // Windows
    console.log('Running on Windows...');
    const batPath = path.join(__dirname, 'RUN.bat');
    
    if (fs.existsSync(batPath)) {
      const childProcess = exec(`"${batPath}"`, { cwd: __dirname });
      childProcess.stdout.pipe(process.stdout);
      childProcess.stderr.pipe(process.stderr);
    } else {
      console.error('Error: RUN.bat file not found. Please make sure it exists in the project directory.');
    }
  } else {
    // Unix-based (macOS, Linux)
    console.log(`Running on ${platform === 'darwin' ? 'macOS' : 'Linux'}...`);
    const shPath = path.join(__dirname, 'run.sh');
    
    if (fs.existsSync(shPath)) {
      // Make sure run.sh is executable
      fs.chmodSync(shPath, '755');
      
      const childProcess = exec(`"${shPath}"`, { cwd: __dirname });
      childProcess.stdout.pipe(process.stdout);
      childProcess.stderr.pipe(process.stderr);
    } else {
      console.error('Error: run.sh file not found. Please make sure it exists in the project directory.');
    }
  }
};

// Run the appropriate script
runScript(); 