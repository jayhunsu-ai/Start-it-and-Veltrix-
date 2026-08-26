import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTS = [
  { id: "idea", label: "IDEA", x: -2.7, y: 1.8, z: 0.2, r: 0.18 },
  { id: "brand", label: "BRAND", x: 0, y: 2.65, z: 0.6, r: -0.2 },
  { id: "audience", label: "AUDIENCE", x: 2.7, y: 1.8, z: 0.2, r: 0.14 },
  { id: "offer", label: "OFFER", x: -2.75, y: -0.35, z: 0.9, r: -0.16 },
  { id: "distribution", label: "DISTRIBUTION", x: 0, y: -0.1, z: 1.25, r: 0.08 },
  { id: "operations", label: "OPERATIONS", x: 2.75, y: -0.35, z: 0.9, r: 0.13 },
  { id: "revenue", label: "REVENUE", x: 0, y: -2.55, z: 0.5, r: -0.1 },
];

const MATERIALS = {
  denim: { background: "#0b1119", base: "#31506b", roughness: 0.88, metalness: 0.04, edge: 0xc7d8e4 },
  blueprint: { background: "#061a2f", base: "#0b4e83", roughness: 0.55, metalness: 0.12, edge: 0x78c8ff },
  paper: { background: "#1b1814", base: "#e8deca", roughness: 0.96, metalness: 0.01, edge: 0x8e7347 },
  pencil: { background: "#24211c", base: "#403b34", roughness: 0.78, metalness: 0.06, edge: 0xd2cdc3 },
};

function makeTexture(kind) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (kind === "blueprint") {
    ctx.fillStyle = "#092847";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(120,200,255,.15)";
    ctx.lineWidth = 1;
    for (let p = 0; p <= size; p += 32) {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(170,225,255,.28)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(22, 186); ctx.lineTo(230, 58); ctx.stroke();
  } else if (kind === "denim") {
    ctx.fillStyle = "#31506b";
    ctx.fillRect(0, 0, size, size);
    for (let i = -size; i < size * 2; i += 7) {
      ctx.strokeStyle = "rgba(190,220,240,.08)";
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + size, size); ctx.stroke();
      ctx.strokeStyle = "rgba(4,12,20,.13)";
      ctx.beginPath(); ctx.moveTo(i + 3, 0); ctx.lineTo(i + size + 3, size); ctx.stroke();
    }
  } else if (kind === "paper") {
    ctx.fillStyle = "#e8deca";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 5000; i += 1) {
      ctx.fillStyle = `rgba(80,60,35,${Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
    ctx.strokeStyle = "rgba(151,105,38,.12)";
    for (let p = 10; p < size; p += 28) {
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#403b34";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 40; i += 1) {
      ctx.strokeStyle = `rgba(210,205,195,${0.025 + Math.random() * 0.06})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      const y = Math.random() * size;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y + (Math.random() - 0.5) * 16); ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 2.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function MaterialEngine3D({ material = "denim", exploded = false, onPartSelect }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ exploded, material, onPartSelect });

  useEffect(() => {
    stateRef.current = { exploded, material, onPartSelect };
  }, [exploded, material, onPartSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.5, 12.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xf2ead8, 0x080b10, 1.9);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(5, 8, 10);
    scene.add(key);
    const rim = new THREE.PointLight(0xc99a2e, 18, 18, 2);
    rim.position.set(-5, 3, 6);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6.2, 96),
      new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.96, metalness: 0.04 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.25;
    scene.add(floor);

    const root = new THREE.Group();
    root.rotation.x = -0.14;
    root.rotation.y = 0.24;
    scene.add(root);

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.48, 0.72, 64),
      new THREE.MeshStandardMaterial({ color: 0xc99a2e, metalness: 0.72, roughness: 0.25 })
    );
    core.rotation.x = Math.PI / 2;
    root.add(core);

    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.86, 0.76, 64),
      new THREE.MeshStandardMaterial({ color: 0x12161d, metalness: 0.5, roughness: 0.3 })
    );
    inner.rotation.x = Math.PI / 2;
    inner.position.z = 0.06;
    root.add(inner);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.055, 12, 96),
      new THREE.MeshStandardMaterial({ color: 0xc99a2e, metalness: 0.85, roughness: 0.2, emissive: 0x2b1b03 })
    );
    ring.rotation.x = Math.PI / 2;
    root.add(ring);

    const textures = Object.fromEntries(Object.keys(MATERIALS).map((key) => [key, makeTexture(key)]));
    const meshes = [];

    PARTS.forEach((part, index) => {
      const group = new THREE.Group();
      group.userData.part = part;
      const geometry = new THREE.BoxGeometry(1.65, 0.5, 1.2);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: textures.denim,
        roughness: MATERIALS.denim.roughness,
        metalness: MATERIALS.denim.metalness,
        clearcoat: 0.24,
        clearcoatRoughness: 0.58,
      });
      const mesh = new THREE.Mesh(geometry, mat);
      group.add(mesh);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: MATERIALS.denim.edge, transparent: true, opacity: 0.48 })
      );
      group.add(edge);
      group.rotation.z = part.r;
      group.userData.index = index;
      root.add(group);
      meshes.push(group);
    });

    const connectors = PARTS.map(() => {
      const line = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0xc99a2e, metalness: 0.7, roughness: 0.28, emissive: 0x241700, transparent: true })
      );
      root.add(line);
      return line;
    });

    let appliedMaterial = null;
    const applyMaterial = (kind) => {
      const key = MATERIALS[kind] ? kind : "denim";
      const def = MATERIALS[key];
      scene.background = new THREE.Color(def.background);
      meshes.forEach((group) => {
        const mesh = group.children[0];
        const edge = group.children[1];
        mesh.material.map = textures[key];
        mesh.material.color.set(def.base);
        mesh.material.roughness = def.roughness;
        mesh.material.metalness = def.metalness;
        mesh.material.clearcoat = key === "paper" ? 0.02 : key === "blueprint" ? 0.38 : 0.22;
        mesh.material.needsUpdate = true;
        edge.material.color.set(def.edge);
      });
      appliedMaterial = key;
    };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let dragging = false;
    let lastX = 0;
    const down = (e) => { dragging = true; lastX = e.clientX; renderer.domElement.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (!dragging) return;
      root.rotation.y += (e.clientX - lastX) * 0.008;
      lastX = e.clientX;
    };
    const up = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const click = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshes, true);
      const hitGroup = hits.find((hit) => hit.object.parent?.userData?.part)?.object.parent;
      if (hitGroup) stateRef.current.onPartSelect?.(hitGroup.userData.part);
    };
    renderer.domElement.addEventListener("click", click);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const s = stateRef.current;
      if (s.material !== appliedMaterial) applyMaterial(s.material);

      root.rotation.y += dragging ? 0 : 0.0018;
      meshes.forEach((group, i) => {
        const part = PARTS[i];
        const target = s.exploded ? new THREE.Vector3(part.x, part.y, part.z) : new THREE.Vector3(0, 0, 0);
        group.position.lerp(target, 0.075);
        group.position.z += Math.sin(t * 1.3 + i) * 0.006;
        group.rotation.x = 0.14 + Math.sin(t * 0.8 + i) * 0.02;
      });

      connectors.forEach((line, i) => {
        const a = meshes[i].position;
        const b = new THREE.Vector3(0, 0, 0);
        const midpoint = a.clone().lerp(b, 0.5);
        line.position.copy(midpoint);
        line.scale.set(1, a.distanceTo(b), 1);
        line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize());
        line.material.opacity = s.exploded ? 0.4 : 0.1;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("click", click);
      Object.values(textures).forEach((texture) => texture.dispose());
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="material-engine-3d" aria-label="Real-time 3D business engine" />;
}
