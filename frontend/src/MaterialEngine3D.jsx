import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTS = [
  { id: "idea", label: "IDEA", x: -2.9, y: 1.95, z: 0.65, r: 0.12 },
  { id: "brand", label: "BRAND", x: 0, y: 2.9, z: 0.9, r: -0.1 },
  { id: "audience", label: "AUDIENCE", x: 2.9, y: 1.95, z: 0.65, r: 0.12 },
  { id: "offer", label: "OFFER", x: -3.0, y: -0.45, z: 0.95, r: -0.08 },
  { id: "distribution", label: "DISTRIBUTION", x: 0, y: -0.15, z: 1.45, r: 0.04 },
  { id: "operations", label: "OPERATIONS", x: 3.0, y: -0.45, z: 0.95, r: 0.08 },
  { id: "revenue", label: "REVENUE", x: 0, y: -2.75, z: 0.8, r: -0.08 },
];

const MATERIALS = {
  denim: {
    background: 0x0a0f16,
    base: 0x2d506a,
    roughness: 0.82,
    metalness: 0.03,
    edge: 0xbad4e2,
    reference: "https://d8j0ntlcm91z4.cloudfront.net/user_3ISPPAbTN1NAmrtXlvreblNTgGK/hf_20260826_164938_489c0a11-fbc2-4428-86d8-6d5a4d9352c9.png",
  },
  blueprint: {
    background: 0x061828,
    base: 0x155487,
    roughness: 0.58,
    metalness: 0.08,
    edge: 0x8ad4ff,
    reference: "https://d8j0ntlcm91z4.cloudfront.net/user_3ISPPAbTN1NAmrtXlvreblNTgGK/hf_20260826_164938_78ac2de7-805a-4908-a158-af7ab0a20331.png",
  },
  paper: {
    background: 0x211d18,
    base: 0xe6dbc5,
    roughness: 0.96,
    metalness: 0.01,
    edge: 0x9a7a4a,
    reference: "https://d8j0ntlcm91z4.cloudfront.net/user_3ISPPAbTN1NAmrtXlvreblNTgGK/hf_20260826_164938_2e38d08a-979a-4d1b-bb19-621ae1a935a2.png",
  },
  pencil: {
    background: 0x211f1b,
    base: 0x4b453c,
    roughness: 0.79,
    metalness: 0.03,
    edge: 0xd5d0c8,
    reference: "https://d8j0ntlcm91z4.cloudfront.net/user_3ISPPAbTN1NAmrtXlvreblNTgGK/hf_20260826_164938_717302ca-f7e2-4fe5-9f37-d86f1bbbffb8.png",
  },
};

function roundedPlate(width, height, depth, radius = 0.14) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: Math.min(0.09, depth * 0.22),
    bevelSize: r * 0.38,
    bevelSegments: 5,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function makeProceduralTexture(kind) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (kind === "denim") {
    ctx.fillStyle = "#2d506a";
    ctx.fillRect(0, 0, size, size);
    for (let i = -size; i < size * 2; i += 8) {
      ctx.strokeStyle = "rgba(220,235,245,.11)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + size, size); ctx.stroke();
      ctx.strokeStyle = "rgba(5,13,22,.16)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(i + 4, 0); ctx.lineTo(i + size + 4, size); ctx.stroke();
    }
  } else if (kind === "blueprint") {
    ctx.fillStyle = "#155487";
    ctx.fillRect(0, 0, size, size);
    for (let p = 0; p <= size; p += 32) {
      ctx.strokeStyle = "rgba(180,230,255,.16)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(210,240,255,.45)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(256, 256, 120, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(90, 390); ctx.lineTo(420, 100); ctx.stroke();
  } else if (kind === "paper") {
    ctx.fillStyle = "#e6dbc5";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 14000; i += 1) {
      const a = Math.random() * 0.05;
      ctx.fillStyle = `rgba(55,42,24,${a})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
    ctx.strokeStyle = "rgba(120,95,54,.12)";
    ctx.lineWidth = 2;
    for (let y = 20; y < size; y += 42) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y + (Math.random() - 0.5) * 2); ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#4b453c";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 110; i += 1) {
      ctx.strokeStyle = `rgba(235,230,220,${0.025 + Math.random() * 0.08})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      const y = Math.random() * size;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y + (Math.random() - 0.5) * 26); ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 2.2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeMetal(color = 0xc99a2e) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.88, roughness: 0.2 });
}

function addBolt(parent, x, y, z, scale = 1) {
  const bolt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065 * scale, 0.065 * scale, 0.035 * scale, 20),
    makeMetal(0xd2b061)
  );
  bolt.rotation.x = Math.PI / 2;
  bolt.position.set(x, y, z);
  parent.add(bolt);
}

export default function MaterialEngine3D({ material = "denim", exploded = false, selectedPartId = null, onPartSelect }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ exploded, material, selectedPartId, onPartSelect });

  useEffect(() => {
    stateRef.current = { exploded, material, selectedPartId, onPartSelect };
  }, [exploded, material, selectedPartId, onPartSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(0, 0.8, 14.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xf5ede0, 0x06080c, 2.2);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 4.8);
    key.position.set(6, 10, 12);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8db9d8, 1.7);
    fill.position.set(-8, 2, 6);
    scene.add(fill);
    const rim = new THREE.PointLight(0xc99a2e, 22, 22, 2);
    rim.position.set(-5, 4, 7);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6.6, 128),
      new THREE.MeshStandardMaterial({ color: 0x080b10, roughness: 0.95, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.35;
    scene.add(floor);

    const root = new THREE.Group();
    root.rotation.x = -0.2;
    root.rotation.y = 0.26;
    scene.add(root);

    const core = new THREE.Group();
    root.add(core);

    const coreOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.55, 0.7, 96),
      new THREE.MeshPhysicalMaterial({ color: 0x151a21, metalness: 0.78, roughness: 0.22, clearcoat: 0.45 })
    );
    coreOuter.rotation.x = Math.PI / 2;
    core.add(coreOuter);

    const coreMiddle = new THREE.Mesh(
      new THREE.CylinderGeometry(1.08, 1.12, 0.86, 96),
      new THREE.MeshPhysicalMaterial({ color: 0xc99a2e, metalness: 0.85, roughness: 0.19, clearcoat: 0.6 })
    );
    coreMiddle.rotation.x = Math.PI / 2;
    coreMiddle.position.z = 0.08;
    core.add(coreMiddle);

    const coreInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.76, 0.92, 96),
      new THREE.MeshStandardMaterial({ color: 0x0c1016, metalness: 0.5, roughness: 0.28 })
    );
    coreInner.rotation.x = Math.PI / 2;
    coreInner.position.z = 0.12;
    core.add(coreInner);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.065, 18, 128),
      makeMetal(0xc99a2e)
    );
    ring.rotation.x = Math.PI / 2;
    core.add(ring);

    addBolt(core, 0.94, 0.82, 0.48, 1.0);
    addBolt(core, -0.94, 0.82, 0.48, 1.0);
    addBolt(core, 0.94, -0.82, 0.48, 1.0);
    addBolt(core, -0.94, -0.82, 0.48, 1.0);

    const textures = Object.fromEntries(Object.keys(MATERIALS).map((key) => [key, makeProceduralTexture(key)]));
    const referenceState = {};
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    Object.entries(MATERIALS).forEach(([key, def]) => {
      loader.load(def.reference, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        referenceState[key] = tex;
      });
    });

    const meshes = [];
    // Selection halo: a soft gold "glow plate" sized just past each part's
    // body, sitting behind it. Opacity/emissive are driven per-frame below
    // so clicking (or the guided tour selecting) a part is actually visible
    // in the scene itself, not just in the text panel underneath it.
    const halos = [];
    PARTS.forEach((part, index) => {
      const group = new THREE.Group();
      group.userData.part = part;
      group.userData.index = index;

      const bodyGeo = roundedPlate(1.78, 0.82, 0.34, 0.16);
      const body = new THREE.Mesh(
        bodyGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          map: textures.denim,
          roughness: MATERIALS.denim.roughness,
          metalness: MATERIALS.denim.metalness,
          clearcoat: 0.34,
          clearcoatRoughness: 0.48,
          emissive: 0xc99a2e,
          emissiveIntensity: 0,
        })
      );
      group.add(body);

      const insetGeo = roundedPlate(1.42, 0.48, 0.10, 0.1);
      const inset = new THREE.Mesh(
        insetGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0x11161d,
          map: textures.denim,
          roughness: 0.92,
          metalness: 0.02,
          clearcoat: 0.15,
        })
      );
      inset.position.z = 0.22;
      group.add(inset);

      const trim = new THREE.LineSegments(
        new THREE.EdgesGeometry(bodyGeo),
        new THREE.LineBasicMaterial({ color: MATERIALS.denim.edge, transparent: true, opacity: 0.68 })
      );
      group.add(trim);

      const halo = new THREE.Mesh(
        roundedPlate(2.06, 1.1, 0.02, 0.24),
        new THREE.MeshBasicMaterial({ color: 0xe0b54c, transparent: true, opacity: 0, side: THREE.DoubleSide })
      );
      halo.position.z = -0.32;
      group.add(halo);
      halos.push(halo);

      addBolt(group, -0.63, 0.28, 0.24, 0.72);
      addBolt(group, 0.63, 0.28, 0.24, 0.72);
      addBolt(group, -0.63, -0.28, 0.24, 0.72);
      addBolt(group, 0.63, -0.28, 0.24, 0.72);

      group.rotation.z = part.r;
      root.add(group);
      meshes.push(group);
    });

    const connectorMaterial = new THREE.MeshStandardMaterial({
      color: 0xc99a2e,
      metalness: 0.8,
      roughness: 0.22,
      emissive: 0x241700,
      transparent: true,
    });
    const connectors = PARTS.map(() => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 10), connectorMaterial.clone());
      root.add(mesh);
      return mesh;
    });

    const applyMaterial = (kind) => {
      const key = MATERIALS[kind] ? kind : "denim";
      const def = MATERIALS[key];
      scene.background = new THREE.Color(def.background);
      meshes.forEach((group) => {
        const body = group.children[0];
        const inset = group.children[1];
        const trim = group.children[2];
        body.material.color.set(def.base);
        body.material.map = textures[key];
        body.material.roughness = def.roughness;
        body.material.metalness = def.metalness;
        body.material.clearcoat = key === "paper" ? 0.08 : key === "blueprint" ? 0.48 : 0.34;
        inset.material.color.set(key === "paper" ? 0x9e8f76 : key === "pencil" ? 0x26231e : 0x0f151c);
        inset.material.map = textures[key];
        inset.material.roughness = Math.min(1, def.roughness + 0.06);
        trim.material.color.set(def.edge);
      });
    };

    let appliedMaterial = "";
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
    let lastY = 0;
    const down = (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      root.rotation.y += (e.clientX - lastX) * 0.008;
      root.rotation.x = THREE.MathUtils.clamp(root.rotation.x + (e.clientY - lastY) * 0.004, -0.6, 0.35);
      lastX = e.clientX;
      lastY = e.clientY;
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
    const zero = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const state = stateRef.current;
      const activeMaterial = MATERIALS[state.material] ? state.material : "denim";
      if (activeMaterial !== appliedMaterial) {
        applyMaterial(activeMaterial);
        appliedMaterial = activeMaterial;
      }

      if (!dragging) root.rotation.y += 0.0013;

      meshes.forEach((group, i) => {
        const part = PARTS[i];
        const target = state.exploded ? tmp.set(part.x, part.y, part.z) : zero;
        group.position.lerp(target, 0.085);
        group.position.z += Math.sin(t * 1.1 + i * 0.8) * 0.004;
        group.rotation.x = 0.07 + Math.sin(t * 0.65 + i) * 0.018;

        // Selection feedback: the part currently chosen (by click or by
        // the guided tour) gets a gently pulsing gold halo, a warm
        // emissive glow on the body itself, and a small scale-up — so
        // "selected" is something you can actually see on the model,
        // not just read below it.
        const isSelected = state.selectedPartId === part.id;
        const pulse = 0.85 + Math.sin(t * 3.1 + i) * 0.15;
        const targetScale = isSelected ? 1.07 : 1;
        group.scale.x += (targetScale - group.scale.x) * 0.15;
        group.scale.y += (targetScale - group.scale.y) * 0.15;
        group.scale.z += (targetScale - group.scale.z) * 0.15;

        const halo = halos[i];
        const targetHaloOpacity = isSelected ? 0.5 * pulse : 0;
        halo.material.opacity += (targetHaloOpacity - halo.material.opacity) * 0.14;

        const body = group.children[0];
        const targetEmissive = isSelected ? 0.32 * pulse : 0;
        body.material.emissiveIntensity += (targetEmissive - body.material.emissiveIntensity) * 0.16;
      });

      connectors.forEach((line, i) => {
        const a = meshes[i].position;
        const delta = a.clone().sub(zero);
        const dist = Math.max(0.001, delta.length());
        line.position.copy(a).multiplyScalar(0.5);
        line.scale.set(1, dist, 1);
        line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
        line.material.opacity = state.exploded ? 0.42 : 0.08;
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
      Object.values(referenceState).forEach((texture) => texture.dispose());
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="material-engine-3d"
      aria-label="Real-time physical 3D business engine"
      data-reference-materials="higgsfield"
    />
  );
}
