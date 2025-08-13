#!/usr/bin/env node
// test-syphon-integration.js
// Test script for Syphon integration with v002 Camera Live

const { spawn } = require('child_process');
const os = require('os');

async function testSyphonIntegration() {
  const platform = os.platform();
  
  console.log('🔍 Testing Syphon Integration');
  console.log('==============================');
  console.log(`Platform: ${platform}`);
  
  if (platform !== 'darwin') {
    console.log('❌ Syphon is only available on macOS');
    console.log('💡 Consider using HDMI input or gphoto2 live view on other platforms');
    return;
  }

  console.log('\n📱 macOS detected - testing Syphon integration...\n');

  try {
    // Test 1: Check if SyphonInject is available
    await testSyphonInject();
    
    // Test 2: List available Syphon servers
    await testSyphonServers();
    
    // Test 3: Test v002 Camera Live connection
    await testV002CameraLive();
    
    // Test 4: Test Syphon capture
    await testSyphonCapture();
    
  } catch (error) {
    console.error('❌ Syphon integration test failed:', error.message);
  }
}

async function testSyphonInject() {
  console.log('🔧 Test 1: Checking SyphonInject availability...');
  
  return new Promise((resolve, reject) => {
    const syphon = spawn('which', ['SyphonInject']);
    
    syphon.stdout.on('data', (data) => {
      const path = data.toString().trim();
      if (path) {
        console.log(`✅ SyphonInject found at: ${path}`);
        resolve();
      } else {
        reject(new Error('SyphonInject not found'));
      }
    });
    
    syphon.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('SyphonInject not installed'));
      }
    });
    
    syphon.on('error', (error) => {
      reject(new Error('SyphonInject not available: ' + error.message));
    });
  });
}

async function testSyphonServers() {
  console.log('\n🔧 Test 2: Listing available Syphon servers...');
  
  return new Promise((resolve, reject) => {
    const syphon = spawn('SyphonInject', ['--list']);
    
    let output = '';
    syphon.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    syphon.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    syphon.on('close', (code) => {
      if (code === 0) {
        const servers = output.split('\n')
          .filter(line => line.trim())
          .map(line => line.trim());
        
        console.log('📋 Available Syphon servers:');
        if (servers.length > 0) {
          servers.forEach((server, index) => {
            console.log(`  ${index + 1}. ${server}`);
          });
          
          // Check for v002 Camera Live
          const cameraServer = servers.find(server => 
            server.includes('Camera Live') || 
            server.includes('v002') ||
            server.includes('Canon')
          );
          
          if (cameraServer) {
            console.log(`\n✅ Found camera server: ${cameraServer}`);
          } else {
            console.log('\n⚠️  No camera server found. Make sure v002 Camera Live is running.');
          }
        } else {
          console.log('  No servers found');
        }
        
        resolve(servers);
      } else {
        reject(new Error(`SyphonInject --list failed with code ${code}`));
      }
    });
    
    syphon.on('error', (error) => {
      reject(new Error('Failed to list Syphon servers: ' + error.message));
    });
  });
}

async function testV002CameraLive() {
  console.log('\n🔧 Test 3: Testing v002 Camera Live connection...');
  
  // Check if v002 Camera Live is running
  return new Promise((resolve, reject) => {
    const ps = spawn('ps', ['aux']);
    
    let output = '';
    ps.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ps.on('close', (code) => {
      if (code === 0) {
        const isRunning = output.includes('Camera Live') || output.includes('v002');
        
        if (isRunning) {
          console.log('✅ v002 Camera Live is running');
        } else {
          console.log('⚠️  v002 Camera Live is not running');
          console.log('💡 Please:');
          console.log('   1. Download v002 Camera Live from GitHub releases');
          console.log('   2. Connect your Canon DSLR via USB');
          console.log('   3. Launch v002 Camera Live');
          console.log('   4. Start live view in the app');
        }
        
        resolve(isRunning);
      } else {
        reject(new Error('Failed to check running processes'));
      }
    });
    
    ps.on('error', (error) => {
      reject(new Error('Failed to check processes: ' + error.message));
    });
  });
}

async function testSyphonCapture() {
  console.log('\n🔧 Test 4: Testing Syphon capture...');
  
  return new Promise((resolve, reject) => {
    // Try to capture a short test video
    const args = [
      '--server', 'v002 Camera Live',
      '--output', 'test_syphon_capture.mov',
      '--duration', '3'
    ];
    
    console.log(`Running: SyphonInject ${args.join(' ')}`);
    
    const syphon = spawn('SyphonInject', args);
    
    let output = '';
    syphon.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    syphon.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    syphon.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Syphon capture test successful');
        console.log('📁 Test file saved as: test_syphon_capture.mov');
      } else {
        console.log('⚠️  Syphon capture test failed');
        console.log('💡 This might be normal if v002 Camera Live is not running');
      }
      resolve();
    });
    
    syphon.on('error', (error) => {
      console.log('⚠️  SyphonInject not available or failed');
      console.log('💡 Install SyphonInject: brew install syphon-inject');
      resolve(); // Don't fail the test, just warn
    });
  });
}

async function testCameraDetection() {
  console.log('\n🔧 Test 5: Testing camera detection...');
  
  return new Promise((resolve, reject) => {
    const gphoto2 = spawn('gphoto2', ['--auto-detect']);
    
    let output = '';
    gphoto2.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    gphoto2.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    gphoto2.on('close', (code) => {
      if (code === 0) {
        const lines = output.split('\n');
        const cameraLines = lines.filter(line => 
          line.includes('Canon') || line.includes('camera')
        );
        
        if (cameraLines.length > 0) {
          console.log('✅ Camera detected:');
          cameraLines.forEach(line => {
            console.log(`  - ${line.trim()}`);
          });
        } else {
          console.log('⚠️  No camera detected');
          console.log('💡 Please:');
          console.log('   1. Connect your Canon DSLR via USB');
          console.log('   2. Set camera to "PC Connection" mode');
          console.log('   3. Ensure camera is powered on');
        }
        
        resolve(cameraLines.length > 0);
      } else {
        console.log('⚠️  gphoto2 not available or failed');
        resolve(false);
      }
    });
    
    gphoto2.on('error', (error) => {
      console.log('⚠️  gphoto2 not installed');
      console.log('💡 Install gphoto2: brew install gphoto2');
      resolve(false);
    });
  });
}

async function main() {
  console.log('🚀 Syphon Integration Test');
  console.log('==========================');
  
  await testSyphonIntegration();
  await testCameraDetection();
  
  console.log('\n✅ Syphon integration test complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Install v002 Camera Live if not already done');
  console.log('2. Connect your Canon DSLR via USB');
  console.log('3. Launch v002 Camera Live and start live view');
  console.log('4. Run this test again to verify Syphon integration');
  console.log('5. Start the DSLR helper with Syphon support');
  console.log('\n💡 For Canon 600D users: Syphon provides much better reliability than gphoto2!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  testSyphonIntegration, 
  testV002CameraLive, 
  testSyphonCapture,
  testCameraDetection 
}; 