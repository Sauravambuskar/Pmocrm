#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 CRM Project - Vercel Deployment Setup');
console.log('==========================================\n');

// Check if required files exist
const requiredFiles = [
    'package.json',
    'vercel.json',
    '.env.example',
    'lib/database.js',
    'api/dashboard.js',
    'api/contacts.js',
    'api/projects.js',
    'api/tasks.js'
];

console.log('✅ Checking required files...');
const missingFiles = [];

requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        missingFiles.push(file);
    } else {
        console.log(`   ✓ ${file}`);
    }
});

if (missingFiles.length > 0) {
    console.log('\n❌ Missing required files:');
    missingFiles.forEach(file => console.log(`   ✗ ${file}`));
    console.log('\nPlease ensure all required files are present before deployment.');
    process.exit(1);
}

console.log('\n✅ All required files present!');

// Check environment variables
console.log('\n🔧 Environment Setup:');
if (!fs.existsSync('.env')) {
    console.log('   ⚠️  No .env file found. Please create one based on .env.example');
    console.log('   📝 Required variables:');
    console.log('      - DATABASE_URL');
    console.log('      - NODE_ENV');
    console.log('      - API_BASE_URL');
} else {
    console.log('   ✓ .env file exists');
}

// Deployment checklist
console.log('\n📋 Deployment Checklist:');
console.log('   1. ✓ Project structure ready');
console.log('   2. ⚠️  Set up cloud database (PlanetScale/Railway/Neon)');
console.log('   3. ⚠️  Configure environment variables in Vercel');
console.log('   4. ⚠️  Import database schema');
console.log('   5. ⚠️  Deploy to Vercel');

console.log('\n🛠️  Next Steps:');
console.log('   1. Set up your cloud database');
console.log('   2. Update .env with your database URL');
console.log('   3. Run: npm install');
console.log('   4. Run: vercel --prod');
console.log('   5. Configure environment variables in Vercel dashboard');

console.log('\n🌐 Database Options:');
console.log('   • PlanetScale: https://planetscale.com (Recommended)');
console.log('   • Railway: https://railway.app');
console.log('   • Neon: https://neon.tech');

console.log('\n📚 Documentation:');
console.log('   • Full setup guide: README.md');
console.log('   • Vercel docs: https://vercel.com/docs');

console.log('\n🎉 Ready for deployment!');
console.log('   Run this script anytime to check your setup.\n'); 