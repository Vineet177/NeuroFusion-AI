import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Brain, Activity, Scan, Layers } from 'lucide-react';

const HOTSPOTS = [
  {
    id: 'hippocampus',
    name: 'HIPPOCAMPUS',
    sub: 'Memory & learning region',
    status: 'MRI Volumetric Analysis ✓ Available',
    position: [0.35, -0.1, 0.25],
    color: '#A78BFA'
  },
  {
    id: 'frontal',
    name: 'FRONTAL CORTEX',
    sub: 'Executive & cognitive control',
    status: 'MMSE / MoCA Cognitive Prior ✓ Active',
    position: [0.0, 0.55, 0.65],
    color: '#7C3AED'
  },
  {
    id: 'temporal',
    name: 'TEMPORAL LOBE',
    sub: 'Auditory & language processing',
    status: '19-Channel EEG Alpha/Theta ✓ Mapped',
    position: [-0.65, -0.15, 0.1],
    color: '#F0A7C0'
  },
  {
    id: 'parietal',
    name: 'PARIETAL LOBE',
    sub: 'Sensory integration & spatial awareness',
    status: 'Structural T1 Segmentation ✓ Tracked',
    position: [0.0, 0.5, -0.45],
    color: '#C4B5FD'
  }
];

const Brain3D = ({ activeModality = 'all', className = '' }) => {
  const containerRef = useRef(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setIsWebGLSupported(false);
        return;
      }
    } catch {
      setIsWebGLSupported(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.4, 4.2);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 3. Brain Group Setup
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // 4. Generate Anatomical Brain Geometry (Dual Hemispheres with Cortical Sulci & Gyri)
    const particleCount = 2800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const baseColor1 = new THREE.Color(0x7c3aed); // Aurora Violet
    const baseColor2 = new THREE.Color(0xa78bfa); // Soft Lavender
    const highlightColor = new THREE.Color(0xf0a7c0); // Soft Rose

    for (let i = 0; i < particleCount; i++) {
      // Parametric dual-ellipsoid with sinusoidal surface folds
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(Math.random() * 2 - 1);
      
      const hemisphere = Math.random() > 0.5 ? 1 : -1;
      const xOffset = hemisphere * 0.38;

      // Base Anatomical Proportions
      let rx = 0.85 + 0.12 * Math.sin(u * 5) * Math.cos(v * 4);
      let ry = 0.95 + 0.14 * Math.cos(u * 4) * Math.sin(v * 6);
      let rz = 1.25 + 0.18 * Math.sin(u * 6) * Math.cos(v * 3);

      // Longitudinal fissure separation
      rx *= 0.88;
      
      let x = rx * Math.sin(v) * Math.cos(u) + xOffset;
      let y = ry * Math.sin(v) * Math.sin(u) * 0.85;
      let z = rz * Math.cos(v) * 0.95;

      // Brainstem / Cerebellum tapering
      if (y < -0.4 && z < -0.2) {
        x *= 0.65;
        z *= 0.75;
      }

      // Add gentle random surface variation
      x += (Math.random() - 0.5) * 0.04;
      y += (Math.random() - 0.5) * 0.04;
      z += (Math.random() - 0.5) * 0.04;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color gradient from Frontal to Occipital
      const t = (z + 1.2) / 2.4;
      const mixed = baseColor1.clone().lerp(baseColor2, t);
      if (Math.random() > 0.82) mixed.lerp(highlightColor, 0.75);

      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;

      sizes[i] = Math.random() * 0.035 + 0.02;
    }

    const brainGeometry = new THREE.BufferGeometry();
    brainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    brainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Circle texture for smooth particles
    const createCircleTexture = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.35, 'rgba(167, 139, 250, 0.85)');
      gradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.25)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      const texture = new THREE.Texture(c);
      texture.needsUpdate = true;
      return texture;
    };

    const brainMaterial = new THREE.PointsMaterial({
      size: 0.052,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      map: createCircleTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const brainPoints = new THREE.Points(brainGeometry, brainMaterial);
    brainGroup.add(brainPoints);

    // 5. Neural Synapse Connections (Connecting Lines)
    const lineCount = 380;
    const linePositions = new Float32Array(lineCount * 6);
    const lineColors = new Float32Array(lineCount * 6);
    let lineIdx = 0;

    for (let i = 0; i < lineCount; i++) {
      const idx1 = Math.floor(Math.random() * particleCount);
      let idx2 = Math.floor(Math.random() * particleCount);
      
      const x1 = positions[idx1 * 3];
      const y1 = positions[idx1 * 3 + 1];
      const z1 = positions[idx1 * 3 + 2];

      const x2 = positions[idx2 * 3];
      const y2 = positions[idx2 * 3 + 1];
      const z2 = positions[idx2 * 3 + 2];

      const dist = Math.hypot(x1 - x2, y1 - y2, z1 - z2);
      if (dist < 0.42 && dist > 0.05) {
        linePositions[lineIdx * 6] = x1;
        linePositions[lineIdx * 6 + 1] = y1;
        linePositions[lineIdx * 6 + 2] = z1;

        linePositions[lineIdx * 6 + 3] = x2;
        linePositions[lineIdx * 6 + 4] = y2;
        linePositions[lineIdx * 6 + 5] = z2;

        const lineColor = baseColor2.clone().lerp(highlightColor, Math.random());
        lineColors[lineIdx * 6] = lineColor.r;
        lineColors[lineIdx * 6 + 1] = lineColor.g;
        lineColors[lineIdx * 6 + 2] = lineColor.b;

        lineColors[lineIdx * 6 + 3] = lineColor.r;
        lineColors[lineIdx * 6 + 4] = lineColor.g;
        lineColors[lineIdx * 6 + 5] = lineColor.b;

        lineIdx++;
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions.subarray(0, lineIdx * 6), 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors.subarray(0, lineIdx * 6), 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending
    });

    const brainLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    brainGroup.add(brainLines);

    // 6. Interactive Hotspot Meshes
    const hotspotObjects = [];
    HOTSPOTS.forEach((spot) => {
      const sphereGeo = new THREE.SphereGeometry(0.065, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(spot.color),
        transparent: true,
        opacity: 0.9,
        wireframe: true
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(spot.position[0], spot.position[1], spot.position[2]);
      mesh.userData = spot;
      brainGroup.add(mesh);
      hotspotObjects.push(mesh);
    });

    // 7. Ambient Outer Neural Dust Constellation
    const dustCount = 180;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const r = 1.8 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      dustPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      size: 0.035,
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    // 8. Mouse Interaction & Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);
    let targetRotationX = 0.15;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;

      mouseX = x;
      mouseY = y;
      targetRotationY = x * 0.45;
      targetRotationX = -y * 0.35 + 0.15;

      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseLeave = () => {
      mouse.x = -100;
      mouse.y = -100;
      targetRotationY = 0;
      targetRotationX = 0.15;
      setHoveredHotspot(null);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 10. Animation Render Loop (Using performance.now to avoid deprecation warning)
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Gentle continuous rotation + smooth mouse tilt
      brainGroup.rotation.y += 0.0035;
      brainGroup.rotation.y += (targetRotationY - brainGroup.rotation.y) * 0.04;
      brainGroup.rotation.x += (targetRotationX - brainGroup.rotation.x) * 0.04;

      // Gentle floating bob
      brainGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.06;
      dustPoints.rotation.y = elapsedTime * 0.02;

      // Pulse Hotspots
      hotspotObjects.forEach((mesh, idx) => {
        const scale = 1 + Math.sin(elapsedTime * 3 + idx) * 0.22;
        mesh.scale.set(scale, scale, scale);
      });

      // Raycasting for interactive tooltips
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspotObjects);
      if (intersects.length > 0) {
        const hit = intersects[0].object.userData;
        setHoveredHotspot(hit);
      } else {
        setHoveredHotspot(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      brainGeometry.dispose();
      brainMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[380px] sm:min-h-[480px] flex items-center justify-center select-none ${className}`}>
      
      {/* Floating Modality Navigation Badges */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <div className="px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-[#171321]/80 backdrop-blur-md border border-white/60 dark:border-purple-900/40 shadow-xs flex items-center space-x-2 text-[11px] font-semibold text-[#171321] dark:text-[#F7F7F5]">
          <Scan className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>MRI Structural ↘</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-20 pointer-events-none">
        <div className="px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-[#171321]/80 backdrop-blur-md border border-white/60 dark:border-purple-900/40 shadow-xs flex items-center space-x-2 text-[11px] font-semibold text-[#171321] dark:text-[#F7F7F5]">
          <span>↗ EEG Spectral</span>
          <Activity className="w-3.5 h-3.5 text-[#A78BFA]" />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="px-4 py-1.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-[#7C3AED] dark:text-[#C4B5FD] shadow-xs flex items-center space-x-2 text-[11px] font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>↓ MULTIMODAL AI FUSION</span>
        </div>
      </div>

      {/* Interactive Hotspot Tooltip */}
      {hoveredHotspot && (
        <div
          style={{
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y - 45}px`
          }}
          className="absolute z-30 pointer-events-none bg-[#171321]/95 backdrop-blur-md p-3.5 rounded-xl border border-purple-400/40 text-white shadow-2xl space-y-1 min-w-[210px] transition-transform"
        >
          <div className="flex items-center justify-between gap-2 border-b border-purple-900/50 pb-1">
            <span className="text-[11px] font-extrabold tracking-wider text-[#A78BFA] font-mono">
              {hoveredHotspot.name}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#F0A7C0] animate-ping" />
          </div>
          <p className="text-[11px] text-slate-300 font-medium">
            {hoveredHotspot.sub}
          </p>
          <p className="text-[10px] text-emerald-400 font-semibold font-mono">
            {hoveredHotspot.status}
          </p>
        </div>
      )}

      {/* Static Fallback if WebGL unavailable */}
      {!isWebGLSupported && (
        <div className="text-center p-8 rounded-2xl bg-white/40 dark:bg-[#171321]/40 backdrop-blur-md border border-white/50 dark:border-purple-900/30 max-w-sm space-y-3">
          <Brain className="w-16 h-16 text-[#7C3AED] mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-[#171321] dark:text-[#F7F7F5]">
            NeuroFusion 3D Neural Engine
          </h3>
          <p className="text-xs text-slate-500">
            Multimodal MRI volumetric processing and EEG spectral decomposition
          </p>
        </div>
      )}

    </div>
  );
};

export default Brain3D;
