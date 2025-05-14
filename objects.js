// objects.js - 3D object creation and management
import * as THREE from 'three';
import { scene, initialPositions } from './main.js';

// ===========================================
// Object-related variables
// ===========================================
export let plane;
export let characters = [];

// ===========================================
// Create a plane with small character balls
// ===========================================
export function createPlane() {
  // Create a floating platform/plane
  const planeGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.2);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x66ccff,
    metalness: 0.5,
    roughness: 0.3,
    transparent: true,
    opacity: 0.9
  });
  
  plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.set(0, -0.1, -0.5);
  plane.castShadow = true;
  plane.receiveShadow = true;
  
  plane.userData = {
    isInteractable: true,
    originalPosition: plane.position.clone(),
    originalRotation: plane.rotation.clone(),
  };
  
  initialPositions.plane = plane.position.clone();
  
  scene.add(plane);
  
  createCharacters();
  
  return plane;
}

// ===========================================
// Create small character balls
// ===========================================
export function createCharacters() {
  const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
  
  for (let i = 0; i < 4; i++) {
    const size = 0.03;
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: colors[i],
      metalness: 0.3,
      roughness: 0.4,
      emissive: colors[i],
      emissiveIntensity: 0.2
    });
    
    const character = new THREE.Mesh(geometry, material);
    
    const posX = (i % 2 === 0) ? -0.1 : 0.1;
    const posZ = (i < 2) ? -0.05 : 0.05;
    character.position.set(posX, 0.03, posZ);
    
    character.userData = {
      isInteractable: true,
      index: i,
      originalPosition: character.position.clone(),
      originalRotation: character.rotation.clone(),
    };
    
    initialPositions['character' + i] = character.position.clone();
    
    character.castShadow = true;
    
    characters.push(character);
    plane.add(character);
  }
  
  return characters;
}