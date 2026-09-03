import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, Scan, Eye, ShieldAlert, RotateCcw, Zap } from 'lucide-react';

export const HoloCard3D = ({ className = "" }) => {
  const containerRef = useRef(null);
  const { isDark } = useTheme();
  const [activeMode, setActiveMode] = useState('scan'); // 'scan', 'biometric', 'tamper'
  const [isHovered, setIsHovered] = useState(false);
  const sceneStateRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 340;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Card Texture Generator (Procedural High-Detail Hologram ID)
    const createCardTexture = (mode) => {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 640;
      const ctx = cvs.getContext('2d');

      // Card Base Gradient
      const grad = ctx.createLinearGradient(0, 0, cvs.width, cvs.height);
      if (isDark) {
        grad.addColorStop(0, '#0c1527');
        grad.addColorStop(0.5, '#070d18');
        grad.addColorStop(1, '#081426');
      } else {
        grad.addColorStop(0, '#f8fafc');
        grad.addColorStop(0.5, '#f1f5f9');
        grad.addColorStop(1, '#e2e8f0');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      // Micro-Guilloche Pattern Background Lines
      ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.08)' : 'rgba(2, 132, 199, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < cvs.width; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.bezierCurveTo(i + 100, 200, i - 100, 400, i, cvs.height);
        ctx.stroke();
      }

      // Security Border Ring
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, cvs.width - 40, cvs.height - 40);

      // Header Banner
      ctx.fillStyle = isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(2, 132, 199, 0.12)';
      ctx.fillRect(20, 20, cvs.width - 40, 75);

      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('IDENTITY SPECIMEN // TRUSTID SECURE PASS', 45, 68);

      // Electronic Smart Chip
      ctx.fillStyle = mode === 'tamper' ? '#e11d48' : '#eab308';
      ctx.fillRect(70, 130, 90, 70);
      ctx.strokeStyle = isDark ? '#ffffff' : '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(70, 130, 90, 70);
      // Chip contacts
      ctx.fillStyle = '#000000';
      ctx.fillRect(112, 130, 4, 70);
      ctx.fillRect(70, 163, 90, 4);

      // Portrait Photograph Area
      const pX = 60, pY = 230, pW = 200, pH = 260;
      ctx.fillStyle = isDark ? '#0f172a' : '#cbd5e1';
      ctx.fillRect(pX, pY, pW, pH);
      ctx.strokeStyle = mode === 'biometric' ? '#22d3ee' : (isDark ? '#38bdf8' : '#0284c7');
      ctx.lineWidth = mode === 'biometric' ? 4 : 2;
      ctx.strokeRect(pX, pY, pW, pH);

      // Silhouette face avatar
      ctx.fillStyle = isDark ? '#334155' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(pX + pW / 2, pY + pH / 2 - 25, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(pX + pW / 2, pY + pH - 15, 65, 45, 0, 0, Math.PI, true);
      ctx.fill();

      // If Tamper mode: Draw simulated anomaly heatmap patch
      if (mode === 'tamper') {
        const radGrad = ctx.createRadialGradient(pX + pW / 2, pY + pH / 2, 10, pX + pW / 2, pY + pH / 2, 85);
        radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.75)');
        radGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.5)');
        radGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(pX, pY, pW, pH);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TAMPER ANOMALY DETECTED', pX + 5, pY - 10);
      }

      // Biometric Scanning Grid overlay if biometric mode
      if (mode === 'biometric') {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.lineWidth = 1.5;
        for (let y = pY + 20; y < pY + pH; y += 25) {
          ctx.beginPath();
          ctx.moveTo(pX, y);
          ctx.lineTo(pX + pW, y);
          ctx.stroke();
        }
      }

      // Demographic Data Fields
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '16px monospace';
      ctx.fillText('SURNAME / NOM', 300, 145);
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('MORGAN', 300, 175);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '16px monospace';
      ctx.fillText('GIVEN NAMES / PRENOMS', 300, 215);
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('ALEX JONATHAN', 300, 245);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '16px monospace';
      ctx.fillText('NATIONALITY / NATIONALITE', 300, 285);
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('SPECIMEN / IND', 300, 315);

      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '16px monospace';
      ctx.fillText('DOCUMENT NO.', 620, 285);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('T9842104-X', 620, 315);

      // Security Hologram Watermark Seal
      ctx.save();
      ctx.translate(820, 210);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(2, 132, 199, 0.15)';
      ctx.fill();
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AUTHENTIC', 0, 5);
      ctx.fillText('VALIDATED', 0, 24);
      ctx.restore();

      // MRZ Machine Readable Zone
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(241, 245, 249, 0.8)';
      ctx.fillRect(40, 515, cvs.width - 80, 95);
      ctx.fillStyle = isDark ? '#38bdf8' : '#0f172a';
      ctx.font = 'bold 23px monospace';
      ctx.fillText('P<UTOMORGAN<<ALEX<JONATHAN<<<<<<<<<<<<<<<<<<<', 60, 550);
      ctx.fillText('T9842104<2IND9008154M3110248<<<<<<<<<<<<<<<04', 60, 585);

      const texture = new THREE.CanvasTexture(cvs);
      texture.anisotropy = 8;
      return texture;
    };

    // 4. Main 3D Card Mesh
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cardGeometry = new THREE.BoxGeometry(4.8, 3.0, 0.08);
    const cardTexture = createCardTexture(activeMode);
    
    // Multi-materials for realistic rounded/beveled plastic card
    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: cardTexture,
      roughness: 0.18,
      metalness: 0.1,
      clearcoat: 0.65,
      clearcoatRoughness: 0.15,
      reflectivity: 0.8,
    });

    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0xcbd5e1,
      roughness: 0.5,
      metalness: 0.2
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0xf1f5f9,
      roughness: 0.3
    });

    const materials = [
      edgeMaterial, // right
      edgeMaterial, // left
      edgeMaterial, // top
      edgeMaterial, // bottom
      frontMaterial, // front
      backMaterial  // back
    ];

    const cardMesh = new THREE.Mesh(cardGeometry, materials);
    cardGroup.add(cardMesh);

    // 5. 3D Laser Scanning Beam (Oscillating across surface)
    const laserGeometry = new THREE.CylinderGeometry(0.02, 0.02, 4.9, 16);
    const laserMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.85
    });
    const laserBeam = new THREE.Mesh(laserGeometry, laserMaterial);
    laserBeam.rotation.z = Math.PI / 2;
    laserBeam.position.z = 0.06;
    cardGroup.add(laserBeam);

    // Laser plane glow
    const laserPlaneGeo = new THREE.PlaneGeometry(4.8, 0.3);
    const laserPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const laserGlowPlane = new THREE.Mesh(laserPlaneGeo, laserPlaneMat);
    laserGlowPlane.position.z = 0.06;
    cardGroup.add(laserGlowPlane);

    // 6. Floating 3D Biometric Facial Mesh Landmarks (over the photo)
    const faceMeshGroup = new THREE.Group();
    faceMeshGroup.position.set(-1.45, -0.15, 0.12); // Positioned above portrait
    cardGroup.add(faceMeshGroup);

    // 16 interconnected face points
    const pointsData = [
      [-0.4, 0.45, 0.02], [0, 0.5, 0.05], [0.4, 0.45, 0.02], // Eyebrows
      [-0.3, 0.2, 0.08], [0.3, 0.2, 0.08],                   // Eyes
      [0, 0.05, 0.18],                                       // Nose Bridge
      [-0.15, -0.15, 0.12], [0.15, -0.15, 0.12],             // Nostrils
      [0, -0.3, 0.15],                                       // Upper Lip
      [-0.25, -0.4, 0.08], [0.25, -0.4, 0.08],               // Mouth Corners
      [0, -0.52, 0.1],                                       // Chin
      [-0.55, 0.1, -0.05], [0.55, 0.1, -0.05],              // Cheeks
      [-0.45, -0.35, -0.08], [0.45, -0.35, -0.08]           // Jawline
    ];

    const vertices = [];
    pointsData.forEach(p => vertices.push(...p));
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const pointsMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.065,
      transparent: true,
      opacity: 0.95
    });
    const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
    faceMeshGroup.add(pointsMesh);

    // Connect face landmark lines
    const lineIndices = [
      0,1, 1,2, 0,3, 2,4, 3,5, 4,5, 5,6, 5,7, 6,8, 7,8, 8,9, 8,10, 9,11, 10,11,
      3,12, 4,13, 12,14, 13,15, 14,11, 15,11
    ];
    const linePos = [];
    for (let i = 0; i < lineIndices.length; i += 2) {
      const p1 = pointsData[lineIndices[i]];
      const p2 = pointsData[lineIndices[i + 1]];
      linePos.push(...p1, ...p2);
    }
    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45
    });
    const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
    faceMeshGroup.add(linesMesh);

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, isDark ? 2.2 : 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 1.8, 10);
    pointLight.position.set(-3, 2, 4);
    scene.add(pointLight);

    // 8. Interaction State (Drag, Orbit, Inertia)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    let targetRotation = { x: 0.12, y: -0.25 };
    let currentRotation = { x: 0.12, y: -0.25 };

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDragging) {
        // Subtle tilt on mouse move when hovering
        const rect = container.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / height - 0.5) * 2;
        targetRotation.y = -0.25 + nx * 0.4;
        targetRotation.x = 0.12 - ny * 0.3;
        return;
      }
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotationVelocity.y = dx * 0.008;
      rotationVelocity.x = dy * 0.008;
      targetRotation.y += rotationVelocity.y;
      targetRotation.x += rotationVelocity.x;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Save scene reference to trigger actions externally
    sceneStateRef.current = {
      resetRotation: () => {
        targetRotation = { x: 0.12, y: -0.25 };
      },
      triggerLaserPulse: () => {
        laserBeam.position.y = 1.6;
      },
      updateMode: (newMode) => {
        const newTex = createCardTexture(newMode);
        frontMaterial.map = newTex;
        frontMaterial.needsUpdate = true;
        if (newMode === 'biometric') {
          faceMeshGroup.visible = true;
          pointsMat.opacity = 0.95;
          linesMat.opacity = 0.65;
          laserMaterial.color.setHex(0x38bdf8);
        } else if (newMode === 'tamper') {
          faceMeshGroup.visible = false;
          laserMaterial.color.setHex(0xf43f5e);
          laserPlaneMat.color.setHex(0xf43f5e);
        } else {
          faceMeshGroup.visible = true;
          pointsMat.opacity = 0.7;
          linesMat.opacity = 0.35;
          laserMaterial.color.setHex(0x22d3ee);
          laserPlaneMat.color.setHex(0x06b6d4);
        }
      }
    };

    // 9. Render Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth inertia interpolation
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;

      // Idle float breathing animation
      const floatY = Math.sin(elapsed * 1.5) * 0.06;
      const idleTilt = Math.sin(elapsed * 1.2) * 0.03;

      cardGroup.rotation.x = currentRotation.x + idleTilt;
      cardGroup.rotation.y = currentRotation.y;
      cardGroup.position.y = floatY;

      // Oscillate Laser Scanning Beam
      const laserY = Math.sin(elapsed * 2.2) * 1.35;
      laserBeam.position.y = laserY;
      laserGlowPlane.position.y = laserY;

      // Pulse biometric nodes
      if (faceMeshGroup.visible) {
        const pScale = 1 + Math.sin(elapsed * 4) * 0.04;
        faceMeshGroup.scale.set(pScale, pScale, pScale);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      cardGeometry.dispose();
      frontMaterial.dispose();
      edgeMaterial.dispose();
      backMaterial.dispose();
      renderer.dispose();
    };
  }, [isDark]);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    if (sceneStateRef.current) {
      sceneStateRef.current.updateMode(mode);
    }
  };

  const handleLaserPulse = () => {
    if (sceneStateRef.current) {
      sceneStateRef.current.triggerLaserPulse();
    }
  };

  const handleReset = () => {
    if (sceneStateRef.current) {
      sceneStateRef.current.resetRotation();
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Interactive 3D Canvas Box */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full h-[320px] sm:h-[360px] md:h-[400px] cursor-grab active:cursor-grabbing relative rounded-2xl overflow-hidden flex items-center justify-center"
      >
        {/* Holographic HUD Overlay Badges */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-glow-cyan">
            <Scan className="w-3 h-3 text-cyan-400 animate-spin" />
            3D HOLOGRAPHIC SPECIMEN
          </span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 backdrop-blur-sm">
            Drag to Rotate 360°
          </span>
        </div>

        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md transition-all shadow-sm"
            title="Reset 3D Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleLaserPulse}
            className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white border border-cyan-400/40 backdrop-blur-md transition-all flex items-center gap-1 shadow-glow-cyan"
            title="Fire Forensic Laser Pulse"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-200" />
            <span className="hidden sm:inline">Pulse Laser</span>
          </button>
        </div>

        {/* Live Depth Guide on Bottom Left */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <div className="text-[9px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-1 rounded-md backdrop-blur-md">
            REAL-TIME 3D SHADER • 60 FPS
          </div>
        </div>
      </div>

      {/* Interactive 3D Mode Switcher */}
      <div className="mt-3 w-full flex items-center justify-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg max-w-md">
        <button
          type="button"
          onClick={() => handleModeChange('scan')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'scan'
              ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Forensic Scan</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('biometric')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'biometric'
              ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Biometric Mesh</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('tamper')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'tamper'
              ? 'bg-rose-600 text-white shadow-glow-rose font-extrabold'
              : 'text-slate-400 hover:text-rose-400'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Tamper Heatmap</span>
        </button>
      </div>
    </div>
  );
};
