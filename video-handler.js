// video-handler.js - Video element and texture management
import * as THREE from 'three';
import { log, showStatus } from './utils.js';
import { SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_RINGS, scene } from './main.js';

// ===========================================
// Video-related variables
// ===========================================
let videoElement;
let videoTexture;
export let videoState = 'unloaded';
export let halfSphere;

// ===========================================
// Initialize video element and texture
// ===========================================
export function initVideo() {
  log('Initializing video');
  videoState = 'loading';
  
  videoElement = document.getElementById('video-source');
  
  videoElement.addEventListener('loadedmetadata', () => {
    log('Video metadata loaded');
  });
  
  videoElement.addEventListener('canplay', () => {
    log('Video can play');
    videoState = 'loaded';
    createVideoTexture();
  });
  
  videoElement.addEventListener('playing', () => {
    log('Video playing');
    videoState = 'playing';
  });
  
  videoElement.addEventListener('error', (e) => {
    const error = e.target.error;
    log(`Video error: ${error ? error.message : 'unknown error'}`);
    videoState = 'error';
    showStatus('Error loading video', false);
  });
  
  videoElement.load();
  
  setTimeout(() => {
    if (videoState === 'loading') {
      log('Video load timeout - continuing anyway');
      videoState = 'loaded';
      createVideoTexture();
    }
  }, 5000);
}

// ===========================================
// Create video texture
// ===========================================
function createVideoTexture() {
  try {
    log('Creating video texture');
    
    videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    videoTexture.generateMipmaps = false;
    
    log('Video texture created');
  } catch (error) {
    log(`Error creating video texture: ${error}`);
  }
}

// ===========================================
// Start video playback with retry mechanism
// ===========================================
export function startVideoPlayback() {
  if (!videoElement || videoState === 'playing') return;
  
  log('Starting video playback');
  
  videoElement.play().then(() => {
    log('Video playback started successfully');
    videoState = 'playing';
  }).catch(error => {
    log(`Failed to autoplay video: ${error}`);
    showStatus('Tap screen to start video');
    
    const startVideo = function() {
      videoElement.play().then(() => {
        log('Video started after user interaction');
        videoState = 'playing';
        document.removeEventListener('click', startVideo);
      }).catch(err => {
        log(`Video play failed after user interaction: ${err}`);
      });
    };
    
    document.addEventListener('click', startVideo);
  });
}

// ===========================================
// Create half-sphere with video projection
// ===========================================
export function createHalfSphere() {
  log('Creating half-sphere');
  
  const geometry = new THREE.SphereGeometry(
    SPHERE_RADIUS,
    SPHERE_SEGMENTS,
    SPHERE_RINGS,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  
  geometry.scale(-1, 1, 1);
  
  const material = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.FrontSide
  });
  
  halfSphere = new THREE.Mesh(geometry, material);
  
  halfSphere.position.set(0, 0, -0.7);
  halfSphere.rotation.x = Math.PI;
  
  scene.add(halfSphere);
  
  log('Half-sphere created');
  
  return halfSphere;
}