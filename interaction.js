// interaction.js - Controller and interaction management
import * as THREE from 'three';
import { log, showStatus } from './utils.js';
import { 
  scene, renderer, camera, controllers, activeControllers, HOLD_DURATION,
  selectHoldTimer, interactionMode, selectedObject, markedObject,
  initialControllerPositions, initialDistance, initialRotation, initialScale,
  grabOffset, initialObjectPosition, characters, plane
} from './main.js';

// ===========================================
// Setup controllers for AR interaction
// ===========================================
export function setupControllers(session) {
  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    controller.userData.id = i;
    scene.add(controller);
    
    addHandVisual(controller, i === 0 ? 0x6699ff : 0xff6666);
    
    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);
    
    controllers.push(controller);
  }
}

// ===========================================
// Add visual representation of hand controllers
// ===========================================
function addHandVisual(controller, color) {
  const handGeometry = new THREE.SphereGeometry(0.025, 16, 16);
  const handMaterial = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.3,
    metalness: 0.5,
    transparent: true,
    opacity: 0.7
  });
  const handMesh = new THREE.Mesh(handGeometry, handMaterial);
  controller.add(handMesh);
}

// ===========================================
// Handle select start event (trigger press)
// ===========================================
export function onSelectStart(event) {
  const controller = event.target;
  const controllerPos = new THREE.Vector3();
  controller.getWorldPosition(controllerPos);
  
  activeControllers.add(controller.userData.id);
  
  selectHoldTimer = setTimeout(() => {
    if (markedObject) {
      selectedObject = markedObject;
      interactionMode = 'move';
      
      if (selectedObject === plane) {
        initialObjectPosition.copy(selectedObject.position);
      } else {
        selectedObject.getWorldPosition(initialObjectPosition);
      }
      
      grabOffset.copy(initialObjectPosition).sub(controllerPos);
      
      initialControllerPositions[controller.userData.id] = controllerPos.clone();
      
      showStatus('Moving object. Use both hands to resize/rotate.');
    } else {
      const intersectedObject = findIntersectedObject(controllerPos);
      
      if (intersectedObject) {
        selectedObject = intersectedObject;
        interactionMode = 'move';
        highlightObject(selectedObject, true);
        
        if (selectedObject === plane) {
          initialObjectPosition.copy(selectedObject.position);
        } else {
          selectedObject.getWorldPosition(initialObjectPosition);
        }
        
        grabOffset.copy(initialObjectPosition).sub(controllerPos);
        
        initialControllerPositions[controller.userData.id] = controllerPos.clone();
        
        showStatus('Moving object. Use both hands to resize/rotate.');
      }
    }
  }, HOLD_DURATION);
}

// ===========================================
// Handle select end event (trigger release)
// ===========================================
export function onSelectEnd(event) {
  const controller = event.target;
  
  activeControllers.delete(controller.userData.id);
  
  if (selectHoldTimer) {
    clearTimeout(selectHoldTimer);
    selectHoldTimer = null;
    
    if (interactionMode === 'none') {
      const controllerPos = new THREE.Vector3();
      controller.getWorldPosition(controllerPos);
      
      const intersectedObject = findIntersectedObject(controllerPos);
      
      if (intersectedObject) {
        if (markedObject) {
          highlightObject(markedObject, false);
        }
        
        if (markedObject === intersectedObject) {
          markedObject = null;
          showStatus('Object unmarked.');
        } else {
          markedObject = intersectedObject;
          highlightObject(markedObject, true);
          showStatus('Object marked. Hold select to grab it.');
        }
      }
    }
  }
  
  if (interactionMode === 'transform') {
    if (activeControllers.size === 1) {
      interactionMode = 'move';
      
      const remainingControllerId = Array.from(activeControllers)[0];
      const remainingController = controllers[remainingControllerId];
      const controllerPos = new THREE.Vector3();
      remainingController.getWorldPosition(controllerPos);
      
      if (selectedObject === plane) {
        initialObjectPosition.copy(selectedObject.position);
      } else {
        selectedObject.getWorldPosition(initialObjectPosition);
      }
      
      grabOffset.copy(initialObjectPosition).sub(controllerPos);
      
      showStatus('Transform complete. Still moving object.');
    }
    else if (activeControllers.size === 0) {
      resetInteraction();
    }
  }
  else if (interactionMode === 'move' && activeControllers.size === 0) {
    resetInteraction();
  }
}

// ===========================================
// Reset interaction state
// ===========================================
export function resetInteraction() {
  if (selectedObject && selectedObject !== markedObject) {
    highlightObject(selectedObject, false);
  }
  
  if (markedObject) {
    highlightObject(markedObject, true);
  }
  
  selectedObject = null;
  interactionMode = 'none';
  activeControllers.clear();
  initialControllerPositions = {};
  showStatus(markedObject ? 'Object still marked. Hold select to grab it.' : 'Tap objects to mark them.');
}

// ===========================================
// Highlight/unhighlight object
// ===========================================
export function highlightObject(object, isHighlighted) {
  if (!object || !object.material) return;
  
  if (isHighlighted) {
    if (Array.isArray(object.material)) {
      object.material.forEach(mat => {
        mat.emissive = new THREE.Color(0x0088ff);
        mat.emissiveIntensity = 0.5;
      });
    } else {
      object.material.emissive = new THREE.Color(0x0088ff);
      object.material.emissiveIntensity = 0.5;
    }
  } else {
    if (Array.isArray(object.material)) {
      object.material.forEach(mat => {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
      });
    } else {
      object.material.emissive = new THREE.Color(0x000000);
      object.material.emissiveIntensity = 0;
    }
  }
}

// ===========================================
// Get distance between controllers
// ===========================================
export function getControllerDistance() {
  if (controllers.length < 2) return 0;
  
  const leftPos = new THREE.Vector3();
  const rightPos = new THREE.Vector3();
  
  controllers[0].getWorldPosition(leftPos);
  controllers[1].getWorldPosition(rightPos);
  
  return leftPos.distanceTo(rightPos);
}

// ===========================================
// Find intersected object from controller position
// ===========================================
export function findIntersectedObject(controllerPos) {
  let closestObject = null;
  let closestDistance = 0.2;
  
  const planeDistance = controllerPos.distanceTo(plane.position);
  if (planeDistance < closestDistance) {
    closestDistance = planeDistance;
    closestObject = plane;
  }
  
  const localControllerPos = plane.worldToLocal(controllerPos.clone());
  
  characters.forEach((character, index) => {
    const worldCharPos = new THREE.Vector3();
    character.getWorldPosition(worldCharPos);
    const distance = controllerPos.distanceTo(worldCharPos);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestObject = character;
    }
  });
  
  return closestObject;
}

// ===========================================
// Handle object interactions during frame update
// ===========================================
export function handleObjectInteraction() {
  if (!selectedObject) return;
  
  if (interactionMode === 'move' && activeControllers.size === 1) {
    const controllerId = Array.from(activeControllers)[0];
    const controller = controllers[controllerId];
    
    const controllerPos = new THREE.Vector3();
    controller.getWorldPosition(controllerPos);
    
    const newPosition = new THREE.Vector3().copy(controllerPos).add(grabOffset);
    
    if (selectedObject === plane) {
      selectedObject.position.copy(newPosition);
    } 
    else if (characters.includes(selectedObject)) {
      const localPos = plane.worldToLocal(newPosition.clone());
      localPos.y = selectedObject.userData.originalPosition.y;
      selectedObject.position.copy(localPos);
    }
  }
  
  else if (interactionMode === 'transform' && activeControllers.size === 2) {
    const currentPositions = [];
    controllers.forEach(controller => {
      const pos = new THREE.Vector3();
      controller.getWorldPosition(pos);
      currentPositions[controller.userData.id] = pos;
    });
    
    const currentDistance = getControllerDistance();
    
    if (initialDistance > 0) {
      let scaleFactor = currentDistance / initialDistance;
      scaleFactor = Math.max(0.5, Math.min(scaleFactor, 3.0));
      selectedObject.scale.copy(initialScale).multiplyScalar(scaleFactor);
    }
    
    const leftPos = currentPositions[0];
    const rightPos = currentPositions[1];
    
    if (leftPos && rightPos) {
      const vector = new THREE.Vector3().subVectors(rightPos, leftPos);
      const currentAngle = Math.atan2(vector.x, vector.z);
      
      const rotationDelta = currentAngle - initialRotation;
      selectedObject.rotation.y = selectedObject.userData.originalRotation.y + rotationDelta;
      
      const midpoint = new THREE.Vector3().addVectors(leftPos, rightPos).multiplyScalar(0.5);
      const forward = new THREE.Vector3(0, 0, -0.05);
      forward.applyQuaternion(camera.quaternion);
      midpoint.add(forward);
      
      if (selectedObject === plane) {
        selectedObject.position.copy(midpoint);
      } 
      else if (characters.includes(selectedObject)) {
        const targetLocalPos = plane.worldToLocal(midpoint);
        targetLocalPos.y = selectedObject.userData.originalPosition.y;
        selectedObject.position.copy(targetLocalPos);
      }
    }
  }
}

// ===========================================
// Handle frame interactions (called from render)
// ===========================================
export function handleFrameInteractions(frame) {
  // Check two-controller interaction to switch to transform mode
  if (selectedObject && interactionMode === 'move' && activeControllers.size === 2) {
    interactionMode = 'transform';
    
    initialDistance = getControllerDistance();
    initialScale.copy(selectedObject.scale);
    
    const leftPos = new THREE.Vector3();
    const rightPos = new THREE.Vector3();
    controllers[0].getWorldPosition(leftPos);
    controllers[1].getWorldPosition(rightPos);
    const vector = new THREE.Vector3().subVectors(rightPos, leftPos);
    initialRotation = Math.atan2(vector.x, vector.z);
    
    showStatus('Transforming object (scale/rotate)');
  }
  
  // Handle object interactions
  if (selectedObject) {
    handleObjectInteraction();
  }
}