#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

// Read the HTML file
const htmlPath = path.join(__dirname, '../public/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace the LEMONFOX_API_KEY placeholder
const lemonfoxKey = process.env.LEMONFOX_API_KEY || 'null';
html = html.replace(
  'window.LEMONFOX_API_KEY = null; // Will be set by build process',
  `window.LEMONFOX_API_KEY = '${lemonfoxKey}';`
);

// Write the updated HTML file
fs.writeFileSync(htmlPath, html);

console.log('Environment variables injected into HTML');
