const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('bg'),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);

const loader = new THREE.TextureLoader();
const imageUrls = [
  'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&w=800',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&w=800',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&w=800',
  'https://images.unsplash.com/photo-1507149833265-60c372daea22?auto=format&w=800'
];

const spacing = 5;
imageUrls.forEach((url, i) => {
  loader.load(url, texture => {
    const geometry = new THREE.PlaneGeometry(4, 3);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.z = -i * spacing;
    plane.position.x = (Math.random() - 0.5) * 2;
    plane.position.y = (Math.random() - 0.5) * 2;
    scene.add(plane);
  });
});

camera.position.z = 5;

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

let scrollY = 0;
window.addEventListener('wheel', event => {
  scrollY += event.deltaY * 0.002;
  camera.position.z = 5 + scrollY;
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
