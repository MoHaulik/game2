// main.js - Main entry point and initialization
import * as THREE from 'three';
import { initVideo, startVideoPlayback, videoState } from './video-handler.js';
import { startAR, onSessionEnded } from './ar-session.js';
import { setupLogging, showStatus, log } from './utils.js';

// ===========================================
// Constants and configuration
// ===========================================
export const DEBUG = false;
export const SPHERE_RADIUS = 0.5;
export const SPHERE_SEGMENTS = 32;
export const SPHERE_RINGS = 32;
export const HOLD_DURATION = 500; // milliseconds to consider a hold

// ===========================================
// Global variables - export for module sharing
// ===========================================
export let camera, scene, renderer;
export let xrSession = null;
export let xrReferenceSpace = null;
export let halfSphere;
export let controllers = [];
export let activeControllers = new Set();
export let initialControllerPositions = {};
export let initialDistance = 0;
export let initialRotation = 0;
export let initialScale = new THREE.Vector3();
export let selectedObject = null;
export let markedObject = null;
export let interactionMode = 'none';
export let selectHoldTimer = null;
export let characters = [];
export let plane;
export let initialPositions = {};
export let grabOffset = new THREE.Vector3();
export let initialObjectPosition = new THREE.Vector3();

// ===========================================
// Initialize Three.js scene
// ===========================================
function initScene() {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(1, 1, 1);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  window.addEventListener('resize', onWindowResize);
  
  log('Scene initialized');
}

// ===========================================
// Handle window resize
// ===========================================
function onWindowResize() {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// ===========================================
// Render function
// ===========================================
export function render(time, frame) {
  // Verify video is still playing - to be implemented in video-handler module
  // Will be moved to imported function call
  
  // Animate characters not being interacted with
  characters.forEach(character => {
    if (character !== selectedObject && character !== markedObject) {
      character.rotation.y += 0.01;
    }
  });
  
  // Slowly rotate the half-sphere
  if (halfSphere) {
    halfSphere.rotation.y += 0.001;
  }
  
  if (frame) {
    // This section will be handled by imported function from interaction.js
    // handleFrameInteractions(frame);
  }
  
  renderer.render(scene, camera);
}

// ===========================================
// Initialize everything
// ===========================================
function init() {
  log('Initializing application');
  
  setupLogging();
  initScene();
  initVideo();
  
  document.getElementById('start-button').addEventListener('click', startAR);
  document.getElementById('exit-ar').addEventListener('click', onSessionEnded);
  
  log('Initialization complete');
}

// Start the application
window.addEventListener('load', init);