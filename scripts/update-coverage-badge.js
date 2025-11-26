#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read coverage summary from lcov.info
const lcovPath = join(rootDir, 'coverage', 'lcov.info');
let lcovContent;
try {
    lcovContent = readFileSync(lcovPath, 'utf-8');
} catch (error) {
    console.error('Error reading coverage file. Run tests with coverage first.');
    process.exit(1);
}

// Parse coverage data
const lines = lcovContent.split('\n');
let totalLines = 0;
let coveredLines = 0;

for (const line of lines) {
    if (line.startsWith('LF:')) {
        totalLines += parseInt(line.substring(3), 10);
    } else if (line.startsWith('LH:')) {
        coveredLines += parseInt(line.substring(3), 10);
    }
}

const coverage = totalLines > 0 ? ((coveredLines / totalLines) * 100).toFixed(0) : 0;
console.log(`Coverage: ${coverage}% (${coveredLines}/${totalLines} lines)`);

// Determine badge color
let color = 'red';
if (coverage >= 90) color = 'brightgreen';
else if (coverage >= 80) color = 'green';
else if (coverage >= 70) color = 'yellow';
else if (coverage >= 60) color = 'orange';

// Update README.md
const readmePath = join(rootDir, 'README.md');
let readmeContent = readFileSync(readmePath, 'utf-8');

// Replace coverage badge
const badgeRegex = /<img src="https:\/\/img\.shields\.io\/badge\/coverage-\d+%25-\w+" alt="coverage" \/>/;
const newBadge = `<img src="https://img.shields.io/badge/coverage-${coverage}%25-${color}" alt="coverage" />`;

if (badgeRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(badgeRegex, newBadge);
    writeFileSync(readmePath, readmeContent, 'utf-8');
    console.log(`✓ Updated coverage badge in README.md to ${coverage}%`);
} else {
    console.error('Could not find coverage badge in README.md');
    process.exit(1);
}
