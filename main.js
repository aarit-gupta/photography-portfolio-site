// Photography Portfolio - Clean Endless Scroll Implementation
let scene, camera, renderer;
let planes = [];
let scrollPosition = 0;
let scrollVelocity = 0;
let isScrolling = false;
let scrollTimeout;
let snapTimeout;
let navHint;

// Simple swipe navigation variables
let touchStartY = 0;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

// Focus mode variables
let isFocusMode = false;
let isExitingFocus = false; // New flag to track when we're exiting focus mode
let focusedPlane = null;
let isAnimating = false; // Track animation state
let keepCanvasesSTRAIGHT = true; // Flag to disable all rotations - start with straight canvases
let focusStartPosition = { x: 0, y: 0, z: 0 };
let canvasRotation = { x: 0, y: 0 };
let zoomLevel = 1;
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let rotationTimeout = null;
let cameraStartPosition = { x: 0, y: 0, z: 0 };
let cameraOffset = { x: 0, y: 0, z: 0 };
let header = null;
let exitButton = null;

// Rotation limits (in radians)
const maxRotationX = 0.3; // ~17 degrees
const maxRotationY = 0.4; // ~23 degrees
const rotationSnapDelay = 600; // 0.6 seconds

// Camera limits in focus mode - enhanced for better exploration
const maxCameraX = 4.0; // Increased horizontal movement range
const maxCameraY = 3.0; // Increased vertical movement range
const maxCameraZ = 2;

// Scroll parameters
const scrollSensitivity = 0.008; // Further reduced for less sensitive scrolling
const scrollDamping = 0.95; // Increased for smoother, longer momentum
const imageSpacing = 8.0; // Reduced spacing - closer but still max 3 visible
const snapDelay = 600; // 0.6 seconds
const snapSpeed = 0.08; // Reduced for slower, smoother snapping

// Enhanced lighting setup
// Removed - using MeshBasicMaterial which doesn't need lighting for better performance

// Optimized images array
const imageUrls = [
  "images-optimized/DSC00286.jpg",
  "images-optimized/DSC00293.jpg",
  "images-optimized/DSC00307.jpg",
  "images-optimized/DSC01767.jpg",
  "images-optimized/DSC01880.jpg",
  "images-optimized/DSC02386.jpg",
  "images-optimized/DSC02807.jpg",
  "images-optimized/DSC03255.jpg",
  "images-optimized/DSC03337.jpg",
  "images-optimized/DSC03354.jpg",
  "images-optimized/DSC03384.jpg",
  "images-optimized/DSC04289.jpg",
  "images-optimized/DSC04350.jpg",
  "images-optimized/DSC04419.jpg",
  "images-optimized/DSC04771.jpg",
  "images-optimized/DSC05516.jpg",
  "images-optimized/DSC05763.jpg",
  "images-optimized/DSC05939.jpg",
  "images-optimized/DSC05946.jpg",
  "images-optimized/DSC05986.jpg",
  "images-optimized/DSC07245.jpg",
  "images-optimized/DSC07277.jpg",
  "images-optimized/DSC07326.jpg",
  "images-optimized/DSC07352.jpg",
  "images-optimized/DSC07683.jpg",
  "images-optimized/DSC08388.jpg",
];

function init() {
  // Scene setup
  scene = new THREE.Scene();

  // Camera setup - wider field of view for more immersive feel
  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.x = 0; // Ensure camera is centered horizontally
  camera.position.y = 0; // Ensure camera is centered vertically
  camera.position.z = 8; // Reverted back to original position
  camera.lookAt(0, 0, 0); // Ensure camera is looking at center

  // Renderer setup with enhanced settings
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("bg"),
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Navigation hint element
  navHint = document.getElementById("navHint");

  // Get overlay (header area) for fading
  header = document.getElementById("overlay");

  // Create exit button for focus mode
  createExitButton();

  loadImages();
  setupEventListeners();
  animate();
}

function createExitButton() {
  exitButton = document.createElement("div");
  exitButton.id = "focusExitButton";
  exitButton.innerHTML = "×";
  exitButton.style.cssText = `
    position: fixed;
    top: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    font-weight: 300;
    color: #333;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    user-select: none;
  `;

  exitButton.addEventListener("click", exitFocusMode);
  exitButton.addEventListener("mouseenter", () => {
    exitButton.style.background = "rgba(255, 255, 255, 1)";
    exitButton.style.transform = "scale(1.1)";
  });
  exitButton.addEventListener("mouseleave", () => {
    exitButton.style.background = "rgba(255, 255, 255, 0.9)";
    exitButton.style.transform = "scale(1)";
  });

  document.body.appendChild(exitButton);
}

// Function to display error message when no images are found
function showImageError() {
  // Remove any existing planes
  planes.forEach((plane) => {
    scene.remove(plane.group);
  });
  planes = [];

  // Create error message element
  const errorDiv = document.createElement("div");
  errorDiv.id = "imageError";
  errorDiv.innerHTML = `
    <div class="error-content">
      <h2>Error Loading Images</h2>
      <p>Failed to load images from the array.</p>
      <p>Please check your internet connection and refresh the page.</p>
    </div>
  `;
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;

  // Style the content
  const style = document.createElement("style");
  style.textContent = `
    #imageError .error-content h2 {
      color: #333;
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
    }
    #imageError .error-content p {
      color: #666;
      margin: 10px 0;
      font-size: 16px;
      line-height: 1.5;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(errorDiv);
}

// Simple image loading function using stock images
function loadImages() {
  if (imageUrls.length === 0) {
    console.warn("No images found in imageUrls array");
    showImageError();
    return;
  }

  console.log(`Loading ${imageUrls.length} stock images...`);

  const loader = new THREE.TextureLoader();
  const loadingIndicator = document.getElementById("loadingIndicator");
  const loadingBar = document.getElementById("loadingBar");
  let loadedCount = 0;
  const totalImages = imageUrls.length;
  const tempPlanes = []; // Store planes temporarily until all are loaded

  // Show loading indicator
  if (loadingIndicator) {
    loadingIndicator.classList.remove("hidden");
  }

  imageUrls.forEach((url, index) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const aspectRatio = texture.image.width / texture.image.height;
        const { width, height } = calculateOptimalImageSize(aspectRatio);

        // Create plane but don't add to scene yet
        const planeData = createImagePlaneData(texture, width, height, index);
        tempPlanes[index] = planeData; // Store in correct index position

        loadedCount++;

        // Update progress bar
        const progress = (loadedCount / totalImages) * 100;
        if (loadingBar) {
          loadingBar.style.width = progress + "%";
        }

        // When all images are loaded, add them to scene at once
        if (loadedCount === totalImages) {
          // Hide loading indicator
          if (loadingIndicator) {
            loadingIndicator.classList.add("hidden");
          }

          // Add all planes to scene and planes array
          tempPlanes.forEach((planeData) => {
            if (planeData) {
              planes.push(planeData.plane);
              scene.add(planeData.group);
            }
          });

          updateImagePositions();
          console.log(`Successfully loaded all ${totalImages} images`);
        }
      },
      undefined,
      (error) => {
        console.error(`Failed to load image: ${url}`, error);
        loadedCount++;

        // Update progress even on error
        const progress = (loadedCount / totalImages) * 100;
        if (loadingBar) {
          loadingBar.style.width = progress + "%";
        }

        // Still proceed when all attempts are done (success or failure)
        if (loadedCount === totalImages) {
          if (loadingIndicator) {
            loadingIndicator.classList.add("hidden");
          }

          // Add successful planes to scene
          tempPlanes.forEach((planeData) => {
            if (planeData) {
              planes.push(planeData.plane);
              scene.add(planeData.group);
            }
          });

          updateImagePositions();
          console.log(
            `Finished loading process: ${planes.length}/${totalImages} images loaded successfully`
          );
        }
      }
    );
  });
}

// New function to calculate optimal image size based on screen space and device
function calculateOptimalImageSize(aspectRatio) {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const screenAspectRatio = screenWidth / screenHeight;
  const isMobile = screenWidth <= 768;
  const isTablet = screenWidth > 768 && screenWidth <= 1024;
  const isDesktop = screenWidth > 1024;

  // Calculate available viewport space (accounting for UI elements)
  const availableWidth = screenWidth * 0.8; // 80% of screen width
  const availableHeight = screenHeight * 0.7; // 70% of screen height (accounting for header)

  let width, height;

  if (isMobile) {
    if (screenAspectRatio < 1) {
      // Mobile Portrait - favor vertical images with more padding
      if (aspectRatio <= 1) {
        // Portrait/Square images - smaller for more padding
        height = Math.min(3.2, availableHeight / 140); // Reduced from 4.0
        width = height * aspectRatio;
      } else {
        // Landscape images - keep reasonable size
        width = Math.min(2.8, availableWidth / 140); // Reduced from 3.5
        height = width / aspectRatio;
      }
    } else {
      // Mobile Landscape - more balanced sizing with padding
      if (aspectRatio > 1.3) {
        // Wide landscape images
        width = Math.min(3.2, availableWidth / 120); // Reduced from 4.0
        height = width / aspectRatio;
      } else {
        // Portrait/square images
        height = Math.min(2.8, availableHeight / 120); // Reduced from 3.5
        width = height * aspectRatio;
      }
    }
  } else if (isTablet) {
    // Tablet sizing - balanced approach
    if (aspectRatio > 1.2) {
      // Landscape images
      width = Math.min(4.5, availableWidth / 140); // Reduced from 6.0
      height = width / aspectRatio;
    } else {
      // Portrait/square images
      height = Math.min(4.0, availableHeight / 120); // Reduced from 5.0
      width = height * aspectRatio;
    }
  } else {
    // Desktop - favor landscape images and give more space
    if (aspectRatio > 1.1) {
      // Landscape images - make them prominent on desktop
      width = Math.min(5.0, availableWidth / 160); // Reduced from 7.0
      height = width / aspectRatio;
    } else {
      // Portrait images - still substantial but not overwhelming
      height = Math.min(4.0, availableHeight / 130); // Reduced from 5.5
      width = height * aspectRatio;
    }
  }

  // Ensure minimum sizes for visibility
  const minSize = isMobile ? 2.0 : 2.5;
  if (width < minSize) {
    width = minSize;
    height = width / aspectRatio;
  }
  if (height < minSize) {
    height = minSize;
    width = height * aspectRatio;
  }

  // Ensure maximum sizes don't overwhelm the viewport - stricter limits
  const maxSize = isMobile ? 4.0 : 5.0; // Reduced from 6.0/8.0 to 4.0/5.0
  if (width > maxSize) {
    width = maxSize;
    height = width / aspectRatio;
  }
  if (height > maxSize) {
    height = maxSize;
    width = height * aspectRatio;
  }

  return { width, height };
}

function createImagePlane(texture, width, height, index) {
  const group = new THREE.Group();

  // Store original index for consistent animations
  group.userData.originalIndex = index;
  group.userData.aspectRatio = width / height;

  // Create image plane
  const imageGeometry = new THREE.PlaneGeometry(width, height);
  const imageMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
  });

  const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);

  group.add(imageMesh);

  // Calculate Y position with proper padding from header and bottom
  const yPosition = calculateVerticalPosition(height);

  // Initial positioning - static, no animation
  group.position.x = index * imageSpacing;
  group.position.y = yPosition; // Static position, no sine wave offset
  group.position.z = 0;

  // Ensure all rotations are perfectly straight
  group.rotation.x = 0;
  group.rotation.y = 0;
  group.rotation.z = 0;

  const plane = {
    group,
    baseRotation: { x: 0, y: 0, z: 0 },
    originalIndex: index,
  };

  planes.push(plane);
  scene.add(group);
}

// Create plane data without adding to scene (for loading)
function createImagePlaneData(texture, width, height, index) {
  const group = new THREE.Group();

  // Store original index for consistent animations
  group.userData.originalIndex = index;
  group.userData.aspectRatio = width / height;

  // Create image plane
  const imageGeometry = new THREE.PlaneGeometry(width, height);
  const imageMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
  });

  const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);

  group.add(imageMesh);

  // Calculate Y position with proper padding from header and bottom
  const yPosition = calculateVerticalPosition(height);

  // Initial positioning - static, no animation
  group.position.x = index * imageSpacing;
  group.position.y = yPosition; // Static position, no sine wave offset
  group.position.z = 0;

  // Ensure all rotations are perfectly straight
  group.rotation.x = 0;
  group.rotation.y = 0;
  group.rotation.z = 0;

  const plane = {
    group,
    baseRotation: { x: 0, y: 0, z: 0 },
    originalIndex: index,
  };

  // Return data without adding to scene
  return { plane, group };
}

// New function to calculate dynamic spacing based on image width
// New function to calculate vertical position with proper padding
function calculateVerticalPosition(imageHeight) {
  const screenHeight = window.innerHeight;
  const isMobile = window.innerWidth <= 768;

  // Calculate header height (approximate)
  const headerHeight = isMobile ? 120 : 150; // Approximate header space in pixels

  // Calculate bottom padding
  const bottomPadding = isMobile ? 100 : 120; // Space from bottom

  // Available vertical space
  const availableHeight = screenHeight - headerHeight - bottomPadding;

  // Convert to Three.js world units (rough conversion)
  const worldSpaceHeight = availableHeight / 100; // Adjust this ratio as needed

  // Position images in the middle of available space, accounting for image height
  const centerY = -(headerHeight / 300); // Changed from /200 to /300 to move images up
  const heightPadding = Math.min(0.5, imageHeight / 10); // Additional padding for taller images

  return centerY - heightPadding;
}

function updateImagePositions() {
  const totalImages = planes.length;

  planes.forEach((plane, index) => {
    // Simple fixed spacing based on index
    let x = index * imageSpacing + scrollPosition;

    // Calculate total width for wrapping
    const totalWidth = totalImages * imageSpacing;

    // Create endless scroll by wrapping positions
    while (x > totalWidth / 2) x -= totalWidth;
    while (x < -totalWidth / 2) x += totalWidth;

    plane.group.position.x = x;

    // Static positioning - no floating animation
    // Skip positioning for focused plane during focus mode
    if (!isFocusMode || plane !== focusedPlane) {
      // Get stored height for better vertical positioning
      const imageHeight = plane.group.userData.height || 4;
      const baseY = calculateVerticalPosition(imageHeight);

      plane.group.position.y = baseY; // Static position, no animation
    }

    // Center enlargement - scale up when close to center
    const distanceFromCenter = Math.abs(x);
    const centerRange = imageSpacing * 0.8;
    const centerFactor = Math.max(0, 1 - distanceFromCenter / centerRange);

    // Only skip scaling for focused plane during focus mode
    if (!isFocusMode || plane !== focusedPlane) {
      const scale = 1 + centerFactor * 0.4;
      plane.group.scale.set(scale, scale, 1);
    }

    // Depth positioning - center images come forward
    plane.group.position.z = centerFactor * 2 - 1;

    // Angle non-centered images away from camera based on distance from center
    if (!isFocusMode || plane !== focusedPlane) {
      // Y-axis rotation based on distance from center (creates subtle 3D perspective effect)
      // Only apply rotation to non-centered images
      const maxRotationAngle = 0.35; // ~20 degrees max for dramatic outward tilt
      const rotationIntensity = Math.min(
        distanceFromCenter / (imageSpacing * 1.5),
        1
      ); // Normalize distance
      const rotationDirection = x > 0 ? 1 : -1; // Rotate away from center

      // Only apply Y rotation if the image is not centered (distance > threshold)
      if (distanceFromCenter > imageSpacing * 0.3) {
        plane.group.rotation.y =
          rotationDirection * rotationIntensity * maxRotationAngle;
      } else {
        // Keep centered images perfectly straight
        plane.group.rotation.y = 0;
      }
    }

    // Keep all Z rotations straight - no Z rotation animations
    plane.group.rotation.z = 0;
  });
}

function setupEventListeners() {
  // Mouse wheel scrolling - explicitly set passive: false
  window.addEventListener("wheel", handleScroll, { passive: false });

  // Arrow key navigation
  window.addEventListener("keydown", handleKeyPress);

  // Focus mode event listeners
  renderer.domElement.addEventListener("click", handleClick);
  renderer.domElement.addEventListener("mousedown", handleMouseDown);
  renderer.domElement.addEventListener("mousemove", handleMouseMove);
  renderer.domElement.addEventListener("mouseup", handleMouseUp);

  // Prevent context menu
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  // Prevent browser zoom
  window.addEventListener("keydown", (e) => {
    // Prevent Ctrl/Cmd + Plus/Minus/0 (zoom shortcuts)
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "+" || e.key === "-" || e.key === "0")
    ) {
      e.preventDefault();
    }
  });

  // Prevent mouse wheel zoom with Ctrl/Cmd
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Window resize
  window.addEventListener("resize", onWindowResize);

  // Touch events for mobile - need passive: false to prevent default when needed
  renderer.domElement.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  renderer.domElement.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  renderer.domElement.addEventListener("touchend", handleTouchEnd, {
    passive: false,
  });

  // Mobile navigation buttons
  const navLeft = document.getElementById("navLeft");
  const navRight = document.getElementById("navRight");

  if (navLeft) {
    navLeft.addEventListener("click", handleNavLeft);
    navLeft.addEventListener("touchstart", handleNavLeft, { passive: false });
  }

  if (navRight) {
    navRight.addEventListener("click", handleNavRight);
    navRight.addEventListener("touchstart", handleNavRight, { passive: false });
  }
}

// Mobile navigation button handlers
function handleNavLeft(event) {
  event.preventDefault();
  event.stopPropagation();

  // Use the same animation as arrow keys - move left (positive direction)
  const moveDistance = imageSpacing;
  animateToNextPhoto(moveDistance);

  // Trigger scroll start effects
  handleScrollStart();
}

function handleNavRight(event) {
  event.preventDefault();
  event.stopPropagation();

  // Use the same animation as arrow keys - move right (negative direction)
  const moveDistance = -imageSpacing;
  animateToNextPhoto(moveDistance);

  // Trigger scroll start effects
  handleScrollStart();
}

// Touch event handlers for focus mode
let touchStartDistance = 0;
let initialZoom = 1;

function handleTouchStart(event) {
  if (
    event.touches.length === 2 &&
    isFocusMode &&
    !isAnimating &&
    !isExitingFocus
  ) {
    // Two finger pinch start (focus mode only)
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    touchStartDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    initialZoom = zoomLevel;
    event.preventDefault();
  } else if (event.touches.length === 1) {
    // Single finger touch
    isDragging = true;
    dragStart.x = event.touches[0].clientX;
    dragStart.y = event.touches[0].clientY;
    touchStartY = event.touches[0].clientY;

    // Prevent default only in focus mode for rotation
    if (isFocusMode && !isAnimating && !isExitingFocus) {
      event.preventDefault();
    }
  }
}

function handleTouchMove(event) {
  if (
    event.touches.length === 2 &&
    isFocusMode &&
    !isAnimating &&
    !isExitingFocus
  ) {
    // Two finger pinch zoom (focus mode only)
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    if (touchStartDistance > 0) {
      const scale = currentDistance / touchStartDistance;
      zoomLevel = Math.max(0.5, Math.min(3, initialZoom * scale));

      if (focusedPlane) {
        focusedPlane.group.scale.setScalar(1.4 * zoomLevel);
      }
    }
    event.preventDefault();
  } else if (event.touches.length === 1 && isDragging) {
    if (isFocusMode && !isAnimating && !isExitingFocus) {
      // Focus mode - single finger drag rotation with limits
      const deltaX = (event.touches[0].clientX - dragStart.x) * 0.005;
      const deltaY = (event.touches[0].clientY - dragStart.y) * 0.005;

      // Apply rotation limits
      canvasRotation.y = Math.max(
        -maxRotationY,
        Math.min(maxRotationY, deltaX)
      );
      canvasRotation.x = Math.max(
        -maxRotationX,
        Math.min(maxRotationX, -deltaY)
      );

      if (focusedPlane) {
        focusedPlane.group.rotation.y =
          focusedPlane.baseRotation.z + canvasRotation.y;
        focusedPlane.group.rotation.x = canvasRotation.x;
      }

      // Clear existing timeout and set new one for snap-back
      clearTimeout(rotationTimeout);
      rotationTimeout = setTimeout(() => {
        if (isFocusMode && !isDragging) {
          animateRotationReturn();
        }
      }, rotationSnapDelay);

      event.preventDefault();
    }
    // No complex gallery mode scrolling - handled in touchend
  }
}

function handleTouchEnd(event) {
  if (event.touches.length === 0) {
    isDragging = false;
    touchStartDistance = 0;

    // Simple swipe detection for gallery mode navigation
    if (!isFocusMode) {
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      const swipeThreshold = 50; // Minimum distance for a swipe

      if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0) {
          // Swipe down - go to previous image (left)
          handleNavLeft(event);
        } else {
          // Swipe up - go to next image (right)
          handleNavRight(event);
        }
      }
    }

    // Focus mode snap-back timer
    if (isFocusMode) {
      clearTimeout(rotationTimeout);
      rotationTimeout = setTimeout(() => {
        animateRotationReturn();
      }, rotationSnapDelay);
    }
  }
}

function handleScroll(event) {
  if (isFocusMode && !isExitingFocus) {
    // In focus mode, scroll becomes zoom (but not while exiting)
    handleZoom(event);
    return;
  }

  event.preventDefault();

  // Add velocity to scroll
  const delta = event.deltaY;
  scrollVelocity += delta * scrollSensitivity;

  handleScrollStart();
}

function handleKeyPress(event) {
  if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
    // Disable arrow keys in focus mode (unless exiting)
    if (isFocusMode && !isExitingFocus) return;

    event.preventDefault();

    // Move exactly one image spacing with direct animation
    const direction = event.code === "ArrowLeft" ? 1 : -1;
    const moveDistance = direction * imageSpacing;

    // Animate directly to the next photo position
    animateToNextPhoto(moveDistance);

    handleScrollStart();
  }

  // ESC key to exit focus mode
  if (event.code === "Escape" && isFocusMode) {
    exitFocusMode();
  }

  // Space bar to enter/exit focus mode
  if (event.code === "Space") {
    event.preventDefault(); // Prevent page scroll

    if (isAnimating) {
      // Ignore spacebar during animations
      return;
    }

    if (isFocusMode) {
      // Exit focus mode if currently in it
      exitFocusMode();
    } else {
      // Enter focus mode on the centered image
      const centeredPlane = findCenteredPlane();
      if (centeredPlane) {
        enterFocusMode(centeredPlane);
      }
    }
  }
}

function animateToNextPhoto(moveDistance) {
  const startPosition = scrollPosition;
  const targetPosition = scrollPosition + moveDistance;
  const duration = 400; // Faster animation to match typical scroll feel
  let startTime = null;

  const animate = (currentTime) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    let progress = Math.min(elapsed / duration, 1);

    // Smooth easing curve
    progress =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Update scroll position
    scrollPosition =
      startPosition + (targetPosition - startPosition) * progress;

    if (elapsed < duration) {
      requestAnimationFrame(animate);
    } else {
      // Ensure exact final position
      scrollPosition = targetPosition;
      // Clear any residual velocity
      scrollVelocity = 0;
    }
  };

  requestAnimationFrame(animate);
}

function handleScrollStart() {
  isScrolling = true;

  // Hide navigation hint
  if (navHint) {
    navHint.classList.add("hidden");
  }

  // Clear existing timeouts
  clearTimeout(scrollTimeout);
  clearTimeout(snapTimeout);

  // Set timeout to detect when scrolling stops (100ms after last scroll input)
  scrollTimeout = setTimeout(() => {
    isScrolling = false;
    if (navHint) {
      navHint.classList.remove("hidden");
    }

    // Wait 0.6 seconds after scrolling stops, then center closest image
    snapTimeout = setTimeout(() => {
      if (!isFocusMode && !isAnimating) {
        snapToCenter();
      }
    }, 600); // Exactly 0.6 seconds as requested
  }, 100);
}

function snapToCenter() {
  // Find the closest image to center (x = 0)
  let closestDistance = Infinity;
  let closestPosition = 0;

  planes.forEach((plane) => {
    const distance = Math.abs(plane.group.position.x);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPosition = plane.group.position.x;
    }
  });

  // Calculate the scroll needed to center the closest image
  const targetScroll = scrollPosition - closestPosition;

  // Smooth animation to target
  const animateSnap = () => {
    const distance = targetScroll - scrollPosition;
    if (Math.abs(distance) > 0.01) {
      scrollPosition += distance * snapSpeed;
      requestAnimationFrame(animateSnap);
    } else {
      scrollPosition = targetScroll;
    }
  };

  animateSnap();
}

function findCenteredPlane() {
  // Find the plane closest to center (x = 0)
  let closestDistance = Infinity;
  let centeredPlane = null;

  planes.forEach((plane) => {
    const distance = Math.abs(plane.group.position.x);
    if (distance < closestDistance) {
      closestDistance = distance;
      centeredPlane = plane;
    }
  });

  // Only return the plane if it's reasonably centered (use dynamic spacing)
  if (centeredPlane && closestDistance < imageSpacing * 0.6) {
    return centeredPlane;
  }

  return null;
}

function animate() {
  requestAnimationFrame(animate);

  // Apply velocity to scroll position
  scrollPosition += scrollVelocity;

  // Apply damping to velocity
  scrollVelocity *= scrollDamping;

  // Stop very small velocities
  if (Math.abs(scrollVelocity) < 0.001) {
    scrollVelocity = 0;
  }

  updateImagePositions();
  renderer.render(scene, camera);
}

// Focus Mode Functions
function handleClick(event) {
  if (isAnimating) {
    // Ignore clicks during any animations (enter/exit focus mode)
    return;
  }

  if (isFocusMode) {
    // In focus mode, clicks are ignored (use X button to exit)
    return;
  }

  // Check if the click is on a UI element (header, buttons, etc.)
  const target = event.target;
  const isUIElement =
    target.closest(".header") ||
    target.closest("#overlay") ||
    target.closest("#navLeft") ||
    target.closest("#navRight") ||
    target.closest("#focusExitButton") ||
    target.tagName === "A" ||
    target.tagName === "BUTTON";

  if (isUIElement) {
    // Let the UI element handle the click normally
    return;
  }

  // Calculate mouse position for raycasting
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Raycast to find clicked image
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    // Find the plane that contains this mesh
    const clickedMesh = intersects[0].object;
    const clickedPlane = planes.find((plane) =>
      plane.group.children.includes(clickedMesh)
    );

    if (clickedPlane) {
      // Only allow clicking on centered images (use dynamic spacing)
      const distanceFromCenter = Math.abs(clickedPlane.group.position.x);
      if (distanceFromCenter < imageSpacing * 0.6) {
        // Only center image is clickable
        enterFocusMode(clickedPlane);
      }
    }
  }
}

function handleMouseDown(event) {
  if (!isFocusMode || isAnimating || isExitingFocus) return;

  isDragging = true;
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;

  renderer.domElement.style.cursor = "grabbing";
}

function handleMouseMove(event) {
  if (!isFocusMode || !isDragging || isAnimating || isExitingFocus) return;

  const deltaX = (event.clientX - dragStart.x) * 0.003; // Reduced sensitivity for smoother control
  const deltaY = (event.clientY - dragStart.y) * 0.003;

  // Default behavior: Camera movement (no modifier keys needed)
  if (!event.ctrlKey && !event.metaKey) {
    // Camera movement mode - pan around the image
    cameraOffset.x = Math.max(-maxCameraX, Math.min(maxCameraX, deltaX * 3));
    cameraOffset.y = Math.max(-maxCameraY, Math.min(maxCameraY, -deltaY * 3));

    // Apply camera offset
    camera.position.x = cameraStartPosition.x + cameraOffset.x;
    camera.position.y = cameraStartPosition.y + cameraOffset.y;
    camera.lookAt(0, 0, 0);
  } else {
    // Image rotation mode (with Ctrl/Cmd key)
    canvasRotation.y = Math.max(-maxRotationY, Math.min(maxRotationY, deltaX));
    canvasRotation.x = Math.max(-maxRotationX, Math.min(maxRotationX, -deltaY));

    // Apply rotation to focused image
    if (focusedPlane) {
      focusedPlane.group.rotation.y =
        focusedPlane.baseRotation.z + canvasRotation.y;
      focusedPlane.group.rotation.x = canvasRotation.x;
    }
  }

  // Clear existing timeout and set new one for snap-back
  clearTimeout(rotationTimeout);
  rotationTimeout = setTimeout(() => {
    if (isFocusMode && !isDragging) {
      // Snap back rotation if there was rotation (Ctrl/Cmd drag)
      if (event.ctrlKey || event.metaKey) {
        animateRotationReturn();
      }
      // Snap back camera position if there was camera movement (default drag)
      else if (
        Math.abs(cameraOffset.x) > 0.1 ||
        Math.abs(cameraOffset.y) > 0.1
      ) {
        animateCameraReturn();
      }
    }
  }, rotationSnapDelay);
}

function handleMouseUp(event) {
  if (!isFocusMode || isAnimating || isExitingFocus) return;

  isDragging = false;
  renderer.domElement.style.cursor = "grab";

  // Start snap-back timer based on what was moved
  clearTimeout(rotationTimeout);
  rotationTimeout = setTimeout(() => {
    if (isFocusMode) {
      // Check if there was rotation and snap it back
      if (canvasRotation.x !== 0 || canvasRotation.y !== 0) {
        animateRotationReturn();
      }
      // Check if there was camera movement and snap it back
      else if (
        Math.abs(cameraOffset.x) > 0.1 ||
        Math.abs(cameraOffset.y) > 0.1
      ) {
        animateCameraReturn();
      }
    }
  }, rotationSnapDelay);
}

function handleZoom(event) {
  if (!isFocusMode || isAnimating || isExitingFocus) return;

  event.preventDefault();

  const zoomSpeed = 0.08; // Slightly slower for more precise control
  const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;

  // Reduced zoom bounds for less aggressive zooming
  zoomLevel = Math.max(0.5, Math.min(3.0, zoomLevel + delta));

  if (focusedPlane) {
    // Apply zoom to the focused image with more conservative scaling
    const newScale = 1.4 * zoomLevel; // Reduced base scale from 1.8 to 1.4
    focusedPlane.group.scale.setScalar(newScale);

    console.log("ZOOM: Zoom level:", zoomLevel, "New scale:", newScale);

    // Slightly adjust camera distance based on zoom for better perspective
    const zoomOffset = (zoomLevel - 1) * 0.5;
    camera.position.z = cameraStartPosition.z - zoomOffset;
  }
}

function enterFocusMode(plane) {
  isFocusMode = true;
  focusedPlane = plane;

  // Store original positions of ALL planes before animation
  planes.forEach((p) => {
    if (!p.group.userData.preFocusPosition) {
      p.group.userData.preFocusPosition = {
        x: p.group.position.x,
        y: p.group.position.y,
        z: p.group.position.z,
      };
    }
  });

  // Store original positions
  focusStartPosition = {
    x: plane.group.position.x,
    y: plane.group.position.y,
    z: plane.group.position.z,
  };

  cameraStartPosition = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };

  // Reset rotation and camera offset (but keep zoom level)
  canvasRotation = { x: 0, y: 0 };
  cameraOffset = { x: 0, y: 0, z: 0 };
  // Don't reset zoomLevel here - let user start with current zoom

  // Animate to focus state
  animateToFocus();

  // Change cursor
  renderer.domElement.style.cursor = "grab";

  // Hide navigation hint immediately
  if (navHint) {
    navHint.classList.add("hidden");
  }

  // Hide mobile navigation buttons in focus mode
  const navLeft = document.getElementById("navLeft");
  const navRight = document.getElementById("navRight");
  if (navLeft) {
    navLeft.style.opacity = "0";
    navLeft.style.visibility = "hidden";
  }
  if (navRight) {
    navRight.style.opacity = "0";
    navRight.style.visibility = "hidden";
  }

  // Show exit button with fade in
  if (exitButton) {
    exitButton.style.visibility = "visible";
    exitButton.style.opacity = "1";
  }
}

function exitFocusMode() {
  if (!focusedPlane) return;

  console.log(
    "EXIT: Starting exit from focus mode - Current zoom level:",
    zoomLevel,
    "Current scale:",
    focusedPlane.group.scale.x
  );

  // Set exiting flag to enable gallery controls while keeping focus mode active for animation
  isExitingFocus = true;

  // Clear rotation timeout
  clearTimeout(rotationTimeout);

  // Reset dragging state immediately when exiting
  isDragging = false;

  // Clear any pending camera or rotation animations
  rotationTimeout = null;

  // Start the exit animation
  animateFromFocus();

  // Reset cursor
  renderer.domElement.style.cursor = "default";

  // Hide exit button immediately (but keep it functional during animation)
  if (exitButton) {
    exitButton.style.opacity = "0";
    exitButton.style.visibility = "hidden";
  }

  // Show mobile navigation buttons again when exiting focus mode
  const navLeft = document.getElementById("navLeft");
  const navRight = document.getElementById("navRight");
  if (navLeft) {
    navLeft.style.opacity = "1";
    navLeft.style.visibility = "visible";
  }
  if (navRight) {
    navRight.style.opacity = "1";
    navRight.style.visibility = "visible";
  }
}

function animateToFocus() {
  if (!focusedPlane) return;

  isAnimating = true; // Disable clicks during animation

  // Safety timeout to re-enable clicks if animation fails
  setTimeout(() => {
    if (!isFocusMode) {
      isAnimating = false;
    }
  }, 1000);

  const duration = 600;
  const startTime = Date.now();

  const startPos = { ...focusStartPosition };
  const targetPos = { x: 0, y: 0, z: 5.2 }; // Center with camera at y: 0
  const startScale = focusedPlane.group.scale.x;
  const targetScale = 1.4; // Reduced scale for less aggressive zoom

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Animate focused image position and scale
    focusedPlane.group.position.x =
      startPos.x + (targetPos.x - startPos.x) * eased;
    focusedPlane.group.position.y =
      startPos.y + (targetPos.y - startPos.y) * eased;
    focusedPlane.group.position.z =
      startPos.z + (targetPos.z - startPos.z) * eased;

    const currentScale = startScale + (targetScale - startScale) * eased;
    focusedPlane.group.scale.setScalar(currentScale);

    // Debug logging
    if (progress === 1) {
      console.log(
        "Focus animation complete - Start scale:",
        startScale,
        "Current scale:",
        currentScale,
        "Target scale:",
        targetScale
      );
    }

    // Fade out header synchronized with animation
    if (header) {
      const headerOpacity = Math.max(0, 1 - progress);
      header.style.opacity = headerOpacity.toString();
    }

    // Make ALL other images fade out smoothly
    planes.forEach((plane) => {
      if (plane !== focusedPlane) {
        const fadeProgress = Math.min(progress * 2, 1); // Smooth fade timing

        // Keep images visible but fade them out
        plane.group.visible = true;

        // Use stored original position and gradually move away
        const originalPos = plane.group.userData.preFocusPosition;
        if (originalPos) {
          const pushAmount = fadeProgress * 15; // Reduced push distance
          if (originalPos.x >= 0) {
            plane.group.position.x = originalPos.x + pushAmount;
          } else {
            plane.group.position.x = originalPos.x - pushAmount;
          }
        }

        // Smooth opacity fade
        plane.group.children.forEach((child) => {
          if (child.material) {
            child.material.opacity = Math.max(0, 1 - fadeProgress);
            child.material.transparent = true;
          }
        });

        // Smooth scale reduction
        const scaleProgress = Math.max(0.1, 1 - fadeProgress * 0.9); // Don't scale to near zero
        plane.group.scale.setScalar(scaleProgress);
      }
    });

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isAnimating = false; // Re-enable clicks when animation completes
    }
  };

  animate();
}

function animateFromFocus() {
  if (!focusedPlane) return;

  console.log("EXIT: Starting reverse animation");

  isAnimating = true; // Disable clicks during exit animation

  // Safety timeout to re-enable clicks if animation fails
  setTimeout(() => {
    isAnimating = false;
  }, 1000);

  const duration = 600;
  const startTime = Date.now();

  // REVERSE of animateToFocus: start from focus state, go to original
  const startPos = { x: 0, y: 0, z: 5.2 }; // Start from focus position
  const targetPos = { ...focusStartPosition }; // Go to original position
  const startScale = focusedPlane.group.scale.x; // Current focused scale
  const targetScale =
    1 + Math.max(0, 1 - Math.abs(focusStartPosition.x) / 8) * 0.4; // Original gallery scale

  const animate = () => {
    // Safety check - if focusedPlane becomes null, stop animation
    if (!focusedPlane) {
      return;
    }

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Animate focused image position and scale (REVERSE)
    focusedPlane.group.position.x =
      startPos.x + (targetPos.x - startPos.x) * eased;
    focusedPlane.group.position.y =
      startPos.y + (targetPos.y - startPos.y) * eased;
    focusedPlane.group.position.z =
      startPos.z + (targetPos.z - startPos.z) * eased;

    const currentScale = startScale + (targetScale - startScale) * eased;
    focusedPlane.group.scale.setScalar(currentScale);

    // Reset zoom level back to neutral
    const targetZoom = 1.0;
    zoomLevel = zoomLevel + (targetZoom - zoomLevel) * eased;

    // Reset rotation and camera offsets to zero
    const targetRotationX = 0;
    const targetRotationY = focusedPlane.baseRotation.z; // Return to base rotation only
    focusedPlane.group.rotation.x = canvasRotation.x * (1 - eased);
    focusedPlane.group.rotation.y =
      focusedPlane.baseRotation.z + canvasRotation.y * (1 - eased);

    // Restore camera to original gallery position (0, 0, 8)
    const originalCameraX = 0;
    const originalCameraY = 0;
    const originalCameraZ = 8;

    camera.position.x =
      cameraStartPosition.x +
      cameraOffset.x * (1 - eased) +
      (originalCameraX - cameraStartPosition.x) * eased;
    camera.position.y =
      cameraStartPosition.y +
      cameraOffset.y * (1 - eased) +
      (originalCameraY - cameraStartPosition.y) * eased;
    camera.position.z =
      cameraStartPosition.z -
      (zoomLevel - 1) * 0.5 +
      (originalCameraZ - cameraStartPosition.z) * eased;
    camera.lookAt(0, 0, 0);

    // Fade in header synchronized with animation (REVERSE: 0 to 1)
    if (header) {
      const headerOpacity = Math.min(1, progress);
      header.style.opacity = headerOpacity.toString();
    }

    // Make ALL other images fade IN smoothly (REVERSE)
    planes.forEach((plane) => {
      if (plane !== focusedPlane) {
        const fadeProgress = Math.min(progress * 2, 1); // Same fade timing as original

        // Keep images visible during fade-in
        plane.group.visible = true;

        // Restore original position and move back from pushed away position (REVERSE)
        const originalPos = plane.group.userData.preFocusPosition;
        if (originalPos) {
          const pushAmount = (1 - fadeProgress) * 15; // REVERSE: start pushed, return to original
          if (originalPos.x >= 0) {
            plane.group.position.x = originalPos.x + pushAmount;
          } else {
            plane.group.position.x = originalPos.x - pushAmount;
          }
        }

        // Smooth opacity fade IN (REVERSE: 0 to 1)
        plane.group.children.forEach((child) => {
          if (child.material) {
            child.material.opacity = Math.min(1, fadeProgress);
            child.material.transparent = true;
          }
        });

        // Smooth scale increase (REVERSE: small to normal)
        const scaleProgress = 0.1 + (1 - 0.1) * fadeProgress; // REVERSE: grow from 0.1 to 1
        plane.group.scale.setScalar(scaleProgress);
      }
    });

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Complete restoration
      isFocusMode = false; // Now set focus mode to false when animation completes
      isExitingFocus = false; // Reset exiting flag
      focusedPlane = null; // Clear focused plane
      zoomLevel = 1.0;
      keepCanvasesSTRAIGHT = true; // Keep all canvases straight from now on

      // Reset camera to original gallery position
      camera.position.x = 0;
      camera.position.y = 0;
      camera.position.z = 8;
      camera.lookAt(0, 0, 0);

      // Clear all focus mode offsets
      cameraOffset = { x: 0, y: 0, z: 0 };
      canvasRotation = { x: 0, y: 0 };

      planes.forEach((plane) => {
        plane.group.visible = true;

        // Reset ALL rotations to be perfectly straight
        plane.group.rotation.x = 0;
        plane.group.rotation.y = 0;
        plane.group.rotation.z = 0;

        // Also reset the baseRotation so future animations start from straight
        plane.baseRotation = { z: 0 };

        plane.group.children.forEach((child) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 1;
          }
        });
        if (plane.group.userData.preFocusPosition) {
          delete plane.group.userData.preFocusPosition;
        }
      });

      // Show navigation hint when animation is complete
      if (navHint) {
        navHint.classList.remove("hidden");
      }

      updateImagePositions();
      isAnimating = false; // Re-enable clicks when exit animation completes
    }
  };

  animate();
}

function animateRotationReturn() {
  if (!focusedPlane || !isFocusMode) return;

  const duration = 400;
  const startTime = Date.now();
  const startRotation = { ...canvasRotation };
  const startCameraOffset = { ...cameraOffset };

  const animate = () => {
    // Safety check - stop if no longer in focus mode
    if (!isFocusMode || !focusedPlane) {
      return;
    }

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);

    // Return image rotation to neutral
    canvasRotation.x = startRotation.x * (1 - eased);
    canvasRotation.y = startRotation.y * (1 - eased);

    focusedPlane.group.rotation.x = canvasRotation.x;
    focusedPlane.group.rotation.y =
      focusedPlane.baseRotation.z + canvasRotation.y;

    // Return camera to original position
    cameraOffset.x = startCameraOffset.x * (1 - eased);
    cameraOffset.y = startCameraOffset.y * (1 - eased);

    camera.position.x = cameraStartPosition.x + cameraOffset.x;
    camera.position.y = cameraStartPosition.y + cameraOffset.y;
    camera.lookAt(0, 0, 0);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

// New function to handle camera position reset only
function animateCameraReturn() {
  if (!focusedPlane || !isFocusMode) return;

  const duration = 600;
  const startTime = Date.now();
  const startCameraOffset = { ...cameraOffset };

  const animate = () => {
    // Safety check - stop if no longer in focus mode
    if (!isFocusMode || !focusedPlane) {
      return;
    }

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);

    // Return camera to original position
    cameraOffset.x = startCameraOffset.x * (1 - eased);
    cameraOffset.y = startCameraOffset.y * (1 - eased);

    camera.position.x = cameraStartPosition.x + cameraOffset.x;
    camera.position.y = cameraStartPosition.y + cameraOffset.y;
    camera.lookAt(0, 0, 0);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Recalculate and update image sizes and positioning for new screen dimensions
  if (planes.length > 0) {
    planes.forEach((plane, index) => {
      const mesh = plane.group.children[0];
      const texture = mesh.material.map;

      if (texture && texture.image) {
        const aspectRatio = texture.image.width / texture.image.height;
        const { width, height } = calculateOptimalImageSize(aspectRatio);

        // Update stored dimensions
        plane.group.userData.width = width;
        plane.group.userData.height = height;

        // Update geometry with new dimensions
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(width, height);
      }
    });

    // Update positions after resize
    updateImagePositions();
  }
}

// Initialize when page loads
window.addEventListener("load", init);
