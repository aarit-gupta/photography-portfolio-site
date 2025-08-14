const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

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

const spacing = 8;
const planes = [];

imageUrls.forEach((url, i) => {
  loader.load(url, texture => {
    const geometry = new THREE.PlaneGeometry(4, 3);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);
    plane.userData.baseX = i * spacing;
    plane.position.x = plane.userData.baseX;
    scene.add(plane);
    planes.push(plane);
  });
});

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

let scrollOffset = 0;
window.addEventListener('wheel', event => {
  scrollOffset += event.deltaY * 0.005;
});

function animate() {
  requestAnimationFrame(animate);

  planes.forEach(plane => {
    const x = plane.userData.baseX - scrollOffset;
    plane.position.x = x;

    const distanceFromCenter = Math.abs(x);
    const closeness = Math.max(0, 1 - distanceFromCenter / spacing);

    plane.position.z = closeness * 2;
    const scale = 1 + closeness * 0.5;
    plane.scale.set(scale, scale, 1);
  });

  renderer.render(scene, camera);
}

animate();
