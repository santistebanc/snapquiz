#!/usr/bin/env node

/**
 * Deploy script that reads .env and passes R2 bucket configuration to PartyKit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Build deploy command
const domain = envVars.DOMAIN;
if (!domain) {
  console.error('Error: DOMAIN not found in .env file');
  process.exit(1);
}

let deployCmd = `partykit deploy --with-vars --domain ${domain}`;

// Add R2 bucket binding if configured
const r2BucketName = envVars.R2_BUCKET_NAME;
if (r2BucketName) {
  deployCmd += ` --with-r2-bucket AUDIO_BUCKET=${r2BucketName}`;
  console.log(`[Deploy] R2 bucket configured: ${r2BucketName}`);
} else {
  console.log('[Deploy] R2 bucket not configured (R2_BUCKET_NAME not set in .env)');
}

console.log(`[Deploy] Running: ${deployCmd}`);
console.log('');

// Execute deploy command
try {
  execSync(deployCmd, { stdio: 'inherit', env: { ...process.env, ...envVars } });
} catch (error) {
  console.error('Deploy failed:', error.message);
  process.exit(1);
}

