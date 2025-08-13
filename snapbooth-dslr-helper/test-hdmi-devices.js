#!/usr/bin/env node
// test-hdmi-devices.js
// Test script to detect HDMI capture devices

const { spawn } = require('child_process');
const os = require('os');

async function testDeviceDetection() {
  const platform = os.platform();
  console.log(`\n🔍 Testing HDMI device detection on ${platform}...\n`);

  try {
    if (platform === 'darwin') {
      // macOS
      console.log('📱 macOS - Testing FFmpeg avfoundation...');
      await testFFmpegAvfoundation();
      
    } else if (platform === 'linux') {
      // Linux
      console.log('🐧 Linux - Testing v4l2-ctl...');
      await testV4L2Devices();
      
      console.log('\n📱 Linux - Testing FFmpeg v4l2...');
      await testFFmpegV4L2();
      
    } else {
      // Windows
      console.log('🪟 Windows - Testing FFmpeg dshow...');
      await testFFmpegDShow();
    }
    
  } catch (error) {
    console.error('❌ Device detection failed:', error.message);
  }
}

async function testFFmpegAvfoundation() {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'avfoundation',
      '-list_devices', 'true',
      '-i', ''
    ]);

    let output = '';
    
    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.stderr.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FFmpeg avfoundation output:');
        console.log(output);
        
        // Parse for capture devices
        const lines = output.split('\n');
        const captureDevices = lines.filter(line => 
          line.includes('Capture') && !line.includes('Audio')
        );
        
        if (captureDevices.length > 0) {
          console.log('\n📹 Found capture devices:');
          captureDevices.forEach(device => {
            console.log(`  - ${device.trim()}`);
          });
        } else {
          console.log('\n⚠️  No capture devices found');
        }
        
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

async function testV4L2Devices() {
  return new Promise((resolve, reject) => {
    const v4l2 = spawn('v4l2-ctl', ['--list-devices']);

    let output = '';
    
    v4l2.stdout.on('data', (data) => {
      output += data.toString();
    });

    v4l2.stderr.on('data', (data) => {
      output += data.toString();
    });

    v4l2.on('close', (code) => {
      if (code === 0) {
        console.log('✅ v4l2-ctl output:');
        console.log(output);
        
        // Parse for video devices
        const lines = output.split('\n');
        const videoDevices = lines.filter(line => 
          line.includes('/dev/video')
        );
        
        if (videoDevices.length > 0) {
          console.log('\n📹 Found video devices:');
          videoDevices.forEach(device => {
            console.log(`  - ${device.trim()}`);
          });
        } else {
          console.log('\n⚠️  No video devices found');
        }
        
        resolve();
      } else {
        reject(new Error(`v4l2-ctl exited with code ${code}`));
      }
    });

    v4l2.on('error', (error) => {
      reject(error);
    });
  });
}

async function testFFmpegV4L2() {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'v4l2',
      '-list_formats', 'all',
      '-i', '/dev/video0'
    ]);

    let output = '';
    
    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.stderr.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', (code) => {
      console.log('✅ FFmpeg v4l2 output:');
      console.log(output);
      resolve();
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

async function testFFmpegDShow() {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'dshow',
      '-list_devices', 'true',
      '-i', 'dummy'
    ]);

    let output = '';
    
    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.stderr.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', (code) => {
      console.log('✅ FFmpeg dshow output:');
      console.log(output);
      
      // Parse for video devices
      const lines = output.split('\n');
      const videoDevices = lines.filter(line => 
        line.includes('DirectShow video devices')
      );
      
      if (videoDevices.length > 0) {
        console.log('\n📹 Found DirectShow video devices');
      } else {
        console.log('\n⚠️  No DirectShow video devices found');
      }
      
      resolve();
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
}

async function testBasicCapture() {
  console.log('\n🎬 Testing basic capture...');
  
  const platform = os.platform();
  let command, args;
  
  if (platform === 'darwin') {
    command = 'ffmpeg';
    args = [
      '-f', 'avfoundation',
      '-framerate', '30',
      '-video_size', '640x480',
      '-i', '0:0',
      '-t', '3',
      '-y',
      'test_capture.mp4'
    ];
  } else if (platform === 'linux') {
    command = 'ffmpeg';
    args = [
      '-f', 'v4l2',
      '-framerate', '30',
      '-video_size', '640x480',
      '-i', '/dev/video0',
      '-t', '3',
      '-y',
      'test_capture.mp4'
    ];
  } else {
    console.log('⚠️  Basic capture test not implemented for Windows');
    return;
  }
  
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args);
    
    process.stdout.on('data', (data) => {
      console.log('stdout:', data.toString());
    });
    
    process.stderr.on('data', (data) => {
      console.log('stderr:', data.toString());
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Basic capture test successful');
      } else {
        console.log(`⚠️  Basic capture test failed with code ${code}`);
      }
      resolve();
    });
    
    process.on('error', (error) => {
      console.error('❌ Basic capture test error:', error);
      reject(error);
    });
  });
}

// Run the tests
async function main() {
  console.log('🚀 HDMI Device Detection Test');
  console.log('==============================');
  
  await testDeviceDetection();
  
  console.log('\n🎯 Testing basic capture (3 seconds)...');
  await testBasicCapture();
  
  console.log('\n✅ Device detection test complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Connect your HDMI capture device');
  console.log('2. Connect your camera HDMI output to the capture device');
  console.log('3. Run this test again to verify detection');
  console.log('4. Start the DSLR helper with HDMI live view support');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testDeviceDetection, testBasicCapture }; 