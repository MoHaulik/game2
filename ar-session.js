// ar-session.js - AR session management
import * as THREE from 'three';
import { log, showStatus } from './utils.js';
import { createHalfSphere, startVideoPlayback } from './video-handler.js';
import { createPlane } from './objects.js';
import { 
  camera, scene, renderer, controllers, activeControllers, render,
  xrSession, xrReferenceSpace
} from './main.js';
import { setupControllers } from './interaction.js';

// ===========================================
// Start AR session
// ===========================================
export function startAR() {
  if (!navigator.xr) {
    showStatus('WebXR not supported in this browser', false);
    return;
  }
  
  log('Starting AR session');
  
  navigator.xr.isSessionSupported('immersive-ar').then(supported => {
    if (!supported) {
      showStatus('AR not supported on this device', false);
      return;
    }
    
    navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'hand-tracking'],
      domOverlay: { root: document.body }
    }).then(onSessionStarted);
  });
}

// ===========================================
// Handle AR session start
// ===========================================
export function onSessionStarted(session) {
  log('AR session started');
  xrSession = session;
  
  document.getElementById('start-button').style.display = 'none';
  document.body.classList.add('xr-active');
  
  renderer.xr.setReferenceSpaceType('local');
  renderer.xr.setSession(session);
  
  session.requestReferenceSpace('local').then((referenceSpace) => {
    xrReferenceSpace = referenceSpace;
    
    // Set up controllers
    setupControllers(session);
    
    // Create our objects
    createHalfSphere();
    createPlane();
    
    // Start video playback
    startVideoPlayback();
    
    // Start render loop
    renderer.setAnimationLoop(render);
    
    // Handle session end
    session.addEventListener('end', onSessionEnded);
    
    showStatus('AR experience loaded. Tap objects to interact.');
  });
}

// ===========================================
// Handle AR session end
// ===========================================
export function onSessionEnded() {
  log('AR session ended');
  
  if (videoElement) {
    videoElement.pause();
    videoState = 'loaded';
  }
  
  document.getElementById('start-button').style.display = 'block';
  document.body.classList.remove('xr-active');
  
  xrSession = null;
  xrReferenceSpace = null;
  selectedObject = null;
  markedObject = null;
  characters = [];
  controllers = [];
  activeControllers.clear();
  
  if (halfSphere) {
    scene.remove(halfSphere);
    halfSphere.geometry.dispose();
    halfSphere.material.dispose();
    halfSphere = null;
  }
  
  clearScene();
  
  renderer.setAnimationLoop(null);
  
  showStatus('AR session ended');
}

// ===========================================
// Clear all objects from scene
// ===========================================
function clearScene() {
  while(scene.children.length > 0) { 
    const object = scene.children[0];
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
    scene.remove(object); 
  }
}