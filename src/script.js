import * as THREE from "three";
import * as dat from "lil-gui";
import gsap from "gsap";

/**
 * Debug
 */
const gui = new dat.GUI();

const parameters = {
  materialColor: "#ffeded",
};

gui.addColor(parameters, "materialColor").onChange(() => {
  material.color.set(parameters.materialColor);
  particlesMaterial.color.set(parameters.materialColor);
});

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Objects
 */

//textures

const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load("textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter;
//env Map
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
  "/textures/envMap/px.png",
  "/textures/envMap/nx.png",
  "/textures/envMap/py.png",
  "/textures/envMap/ny.png",
  "/textures/envMap/pz.png",
  "/textures/envMap/nz.png",
]);
//Materials

//mat2
const material2 = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 3,
  roughness: 0.1,
  metalness: 0.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.5,
  transmission: 1.0,
  envMap: environmentMapTexture,
  envMapIntensity: 1.0,
  //   wireframe: true,
});

material2.depthTest = true;
material2.depthWrite = false;
material2.renderOrder = 1;

//mat3

//mat4

const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});

//Meshes
const objectsDistance = 4;

const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material);

const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), material2);

const mesh3 = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
  material
);
mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;

mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;

scene.add(mesh1, mesh2, mesh3);

const sectionMeshes = [mesh1, mesh2, mesh3];

/**
 * Particles
 */
// geometry

const particlesCount = 200;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] =
    objectsDistance * 0.5 - Math.random() * objectsDistance * 3;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

//Material
const particleMap = textureLoader.load("/textures/alphaParticles/9.png");

const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: true,
  size: 0.1,
  alphaMap: particleMap,
  transparent: true,
  depthWrite: false,
});

//Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
directionalLight.position.set(1, 1, 0);

scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
//Group

const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Scroll
 */
let scrollY = window.scrollY;
let previousTime = 0;

let currentSection = 0;

window.addEventListener("scroll", () => {
  //   previousScrollY = scrollY;
  scrollY = window.scrollY;

  const newSection = Math.round(scrollY / sizes.height);

  if (newSection != currentSection) {
    currentSection = newSection;

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: "power2.inOut",
      x: "+=6",
      y: "+=3",
      z: "+=1.5",
    });
  }
});

/**
 * Cursor
 */
const cursor = {
  x: 0,
  y: 0,
};

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

/**
 * Animate
 */
const updateBlobGeometry = (geometry, elapsedTime) => {
  const { attributes } = geometry;

  if (attributes) {
    const positions = attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      const noise =
        Math.sin(x * 0.3 + elapsedTime * 0.02) +
        Math.sin(y * 0.5 + elapsedTime * 0.03) +
        Math.sin(z * 0.7 + elapsedTime * 0.05) * 0.01;

      const displacement = noise * 0.0005; // Reduzido o fator de escala para tornar o efeito mais lento

      positions[i + 0] = x;
      positions[i + 1] = y - displacement;
      positions[i + 2] = z + displacement;
    }

    attributes.position.needsUpdate = true;
  }
};

const clock = new THREE.Clock();
// let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  //Update Camera
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;

  const parallaxX = cursor.x;
  const parallaxY = -cursor.y;
  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 3 * deltaTime;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 3 * deltaTime;

  // Update blob geometry
  if (mesh2.geometry) {
    updateBlobGeometry(mesh2.geometry, elapsedTime);
  }
  //Update Meshes
  for (const mesh of sectionMeshes) {
    mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
  }

  // Rotating particles
  particles.rotation.y += elapsedTime * 0.00001;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
