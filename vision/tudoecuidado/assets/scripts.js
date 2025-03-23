

// 
// Animação para o Titulo da Sessão
//
document.addEventListener('DOMContentLoaded', () => {
    const servicesTitle = document.querySelector('#servicos .section-title-v1');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Dispara quando 10% do elemento estiver visível
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Adiciona as classes de animação
                servicesTitle.classList.add('animate__animated', 'animate__backInUp');
                
                // Para de observar após a animação
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    observer.observe(servicesTitle);
});



// 
// OBJETO 3D
//

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('obj-3d').appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Camera position
camera.position.z = 5;

// Load 3D model
const mtlLoader = new MTLLoader();
mtlLoader.load('https://faganelo.me/vision/tudoecuidado/obj.mtl', function(materials) {
    materials.preload();
    
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load('https://faganelo.me/vision/tudoecuidado/tinker.obj', function(object) {
        // Center the object
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Scale the object to fit the screen
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        object.scale.multiplyScalar(scale);
        
        // Center the object
        object.position.sub(center.multiplyScalar(scale));
        
        scene.add(object);
    });
});

// Animation
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the entire scene
    scene.rotation.y += 0.005;
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();

// 
// ----------------------
//