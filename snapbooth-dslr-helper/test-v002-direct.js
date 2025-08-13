#!/usr/bin/env node
// test-v002-direct.js
// Test script for v002 Camera Live direct integration

const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

async function testV002DirectIntegration() {
  console.log('🚀 v002 Camera Live Direct Integration Test');
  console.log('==========================================');
  
  if (os.platform() !== 'darwin') {
    console.log('❌ v002 Camera Live is only available on macOS');
    return;
  }

  console.log('\n📋 Checking v002 Camera Live availability...');
  
  // Check if v002 Camera Live is installed
  const v002AppPath = '/Applications/v002 Camera Live.app';
  if (!fs.existsSync(v002AppPath)) {
    console.log('❌ v002 Camera Live not found at:', v002AppPath);
    console.log('💡 Download from: https://github.com/v002/v002-Camera-Live/releases');
    return;
  }
  console.log('✅ v002 Camera Live found');

  // Check if v002 Camera Live is running
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      const ps = spawn('ps', ['aux']);
      let output = '';
      
      ps.stdout.on('data', (data) => {
        output += data.toString();
      });

      ps.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout: output });
        } else {
          reject(new Error('Failed to check process status'));
        }
      });

      ps.on('error', reject);
    });

    const isRunning = stdout.includes('Camera Live') || stdout.includes('v002');
    if (isRunning) {
      console.log('✅ v002 Camera Live is running');
    } else {
      console.log('⚠️  v002 Camera Live is not running');
      console.log('💡 Launch v002 Camera Live and start live view');
    }
  } catch (error) {
    console.log('❌ Failed to check v002 Camera Live status:', error.message);
  }

  // Test camera detection
  console.log('\n📷 Testing camera detection...');
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      const gphoto2 = spawn('gphoto2', ['--auto-detect']);
      let output = '';
      
      gphoto2.stdout.on('data', (data) => {
        output += data.toString();
      });

      gphoto2.stderr.on('data', (data) => {
        output += data.toString();
      });

      gphoto2.on('close', (code) => {
        resolve({ stdout: output, code });
      });

      gphoto2.on('error', reject);
    });

    if (stdout.includes('Canon') || stdout.includes('EOS')) {
      console.log('✅ Camera detected');
      console.log('📋 Camera info:', stdout.trim());
    } else {
      console.log('❌ No camera detected');
      console.log('💡 Connect your Canon DSLR via USB');
    }
  } catch (error) {
    console.log('❌ Failed to detect camera:', error.message);
  }

  // Test output directory creation
  console.log('\n📁 Testing output directory setup...');
  const outputDir = './static/v002_output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('✅ Created output directory:', outputDir);
  } else {
    console.log('✅ Output directory exists:', outputDir);
  }

  console.log('\n✅ v002 direct integration test complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Connect your Canon DSLR via USB');
  console.log('2. Launch v002 Camera Live and start live view');
  console.log('3. Run this test again to verify integration');
  console.log('4. Start the DSLR helper with v002 direct support');
  console.log('\n💡 Note: This approach doesn\'t require SyphonInject!');
}

async function main() {
  try {
    await testV002DirectIntegration();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testV002DirectIntegration }; 