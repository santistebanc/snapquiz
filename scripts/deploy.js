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

// Update partykit.json with R2 bucket name if configured
const r2BucketName = envVars.R2_BUCKET_NAME;
if (r2BucketName) {
  const partykitJsonPath = path.join(__dirname, '..', 'partykit.json');
  const partykitJson = JSON.parse(fs.readFileSync(partykitJsonPath, 'utf-8'));
  
  // Ensure bindings object exists
  if (!partykitJson.bindings) {
    partykitJson.bindings = {};
  }
  
  // Update R2 bucket binding
  partykitJson.bindings.AUDIO_BUCKET = {
    type: 'r2',
    bucket_name: r2BucketName
  };
  
  // Write updated config back
  fs.writeFileSync(partykitJsonPath, JSON.stringify(partykitJson, null, 2) + '\n');
  console.log(`[Deploy] R2 bucket configured in partykit.json: ${r2BucketName}`);
} else {
  console.log('[Deploy] R2 bucket not configured (R2_BUCKET_NAME not set in .env)');
}

let deployCmd = `partykit deploy --with-vars --domain ${domain}`;

console.log(`[Deploy] Running: ${deployCmd}`);
console.log('');

// Execute deploy command
try {
  execSync(deployCmd, { stdio: 'inherit', env: { ...process.env, ...envVars } });
} catch (error) {
  console.error('Deploy failed:', error.message);
  process.exit(1);
}

