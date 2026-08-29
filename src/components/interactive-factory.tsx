'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { FoundryWorkspace } from '../domain/types';
import {
  FACTORY_STATIONS,
  getActiveStationKey,
  getStationMetric,
  getStationState,
  type FactoryStationKey,
} from '../presentation/factory-stages';

const COLORS = {
  ink: 0x11101b,
  steel: 0x56536f,
  paper: 0xece9f4,
  violet: 0x8c7cff,
  mint: 0x8fffd0,
  muted: 0x302e42,
  coral: 0xff8174,
};

function material(color: number, metalness = 0.48, roughness = 0.48) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function box(width: number, height: number, depth: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color));
}

function cylinder(radius: number, height: number, color: number) {
  return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 18), material(color, 0.56, 0.38));
}

function tagStation(object: THREE.Object3D, stationKey: FactoryStationKey) {
  object.userData.stationKey = stationKey;
  object.traverse((child) => { child.userData.stationKey = stationKey; });
}

function addStationModel(group: THREE.Group, key: FactoryStationKey, index: number) {
  const base = box(1.12, 0.13, 1.02, COLORS.muted);
  base.position.y = 0.07;
  group.add(base);

  if (key === 'source') {
    const warehouse = box(0.84, 0.58, 0.72, COLORS.steel);
    warehouse.position.y = 0.42;
    group.add(warehouse);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.32, 4), material(COLORS.paper, 0.3, 0.66));
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.75;
    roof.position.y = 0.86;
    group.add(roof);
  } else if (key === 'evidence') {
    const lab = box(0.85, 0.66, 0.72, COLORS.steel);
    lab.position.y = 0.46;
    group.add(lab);
    const skylight = box(0.5, 0.07, 0.52, COLORS.paper);
    skylight.position.y = 0.83;
    group.add(skylight);
    for (const x of [-0.24, 0, 0.24]) {
      const windowMesh = box(0.13, 0.2, 0.025, COLORS.violet);
      windowMesh.position.set(x, 0.5, 0.374);
      group.add(windowMesh);
    }
  } else if (key === 'review') {
    for (const x of [-0.25, 0.25]) {
      const tank = cylinder(0.21, 0.67, COLORS.steel);
      tank.position.set(x, 0.49, 0);
      group.add(tank);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), material(COLORS.paper));
      cap.position.set(x, 0.825, 0);
      group.add(cap);
    }
  } else if (key === 'signal') {
    const tower = box(0.48, 0.78, 0.48, COLORS.steel);
    tower.position.y = 0.53;
    group.add(tower);
    const antenna = cylinder(0.045, 0.56, COLORS.paper);
    antenna.position.y = 1.17;
    group.add(antenna);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), material(COLORS.violet, 0.15, 0.25));
    beacon.name = 'factory-beacon';
    beacon.position.y = 1.49;
    group.add(beacon);
  } else if (key === 'idea') {
    const forge = box(0.88, 0.62, 0.76, COLORS.steel);
    forge.position.y = 0.44;
    group.add(forge);
    for (const x of [-0.26, 0.26]) {
      const stack = cylinder(0.1, 0.7, COLORS.paper);
      stack.position.set(x, 1.05, -0.16);
      group.add(stack);
    }
    const door = box(0.26, 0.32, 0.03, COLORS.coral);
    door.position.set(0, 0.34, 0.395);
    group.add(door);
  } else if (key === 'stress') {
    const chamber = cylinder(0.42, 0.78, COLORS.steel);
    chamber.rotation.z = Math.PI / 2;
    chamber.position.y = 0.52;
    group.add(chamber);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.045, 10, 24), material(COLORS.coral));
    band.rotation.y = Math.PI / 2;
    band.position.y = 0.52;
    group.add(band);
  } else {
    const bay = box(0.92, 0.66, 0.78, COLORS.steel);
    bay.position.y = 0.46;
    group.add(bay);
    const sheet = box(0.52, 0.04, 0.38, COLORS.paper);
    sheet.rotation.x = -0.16;
    sheet.position.set(0, 0.88, 0.08);
    group.add(sheet);
  }

  group.position.set((index - 3) * 1.24, 0, index % 2 === 0 ? 0.2 : -0.18);
  tagStation(group, key);
}

function findStationKey(object: THREE.Object3D | null): FactoryStationKey | undefined {
  let current = object;
  while (current) {
    if (current.userData.stationKey) return current.userData.stationKey as FactoryStationKey;
    current = current.parent;
  }
  return undefined;
}

export function InteractiveFactory({ workspace }: { workspace: FoundryWorkspace }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [selectedKey, setSelectedKey] = useState<FactoryStationKey>(() => getActiveStationKey(workspace.stage));

  useEffect(() => {
    setSelectedKey(getActiveStationKey(workspace.stage));
  }, [workspace.stage]);

  const selectedStation = useMemo(
    () => FACTORY_STATIONS.find((station) => station.key === selectedKey) ?? FACTORY_STATIONS[0],
    [selectedKey],
  );
  const selectedMetric = getStationMetric(workspace, selectedStation.key);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setWebglFailed(true);
      return;
    }

    setWebglFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x12101d, 0.075);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(6.7, 5.3, 8.6);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 0.4, 0);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.38;

    scene.add(new THREE.HemisphereLight(0xcac3ff, 0x17131e, 2.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
    keyLight.position.set(3, 7, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(COLORS.violet, 22, 16);
    rimLight.position.set(-3, 2.5, -2.5);
    scene.add(rimLight);

    const factory = new THREE.Group();
    factory.rotation.y = -0.22;
    scene.add(factory);

    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(5.3, 5.65, 0.2, 64),
      new THREE.MeshStandardMaterial({ color: 0x1b1927, metalness: 0.4, roughness: 0.7 }),
    );
    ground.position.y = -0.12;
    ground.receiveShadow = true;
    factory.add(ground);

    const conveyor = box(7.6, 0.12, 0.35, 0x292638);
    conveyor.position.set(0, 0.22, 0.78);
    factory.add(conveyor);
    const packets: THREE.Mesh[] = [];
    for (let index = 0; index < 7; index += 1) {
      const packet = box(0.25, 0.2, 0.25, index % 2 ? COLORS.mint : COLORS.violet);
      packet.position.set((index - 3) * 1.12, 0.39, 0.78);
      packet.userData.originX = packet.position.x;
      factory.add(packet);
      packets.push(packet);
    }

    const stationGroups: THREE.Group[] = [];
    FACTORY_STATIONS.forEach((station, index) => {
      const group = new THREE.Group();
      addStationModel(group, station.key, index);
      const stationState = getStationState(workspace.stage, station.key);
      const stateColor = stationState === 'active' ? COLORS.violet : stationState === 'complete' ? COLORS.mint : COLORS.muted;
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.castShadow = true;
        child.receiveShadow = true;
        const meshMaterial = child.material as THREE.MeshStandardMaterial;
        if (meshMaterial?.isMeshStandardMaterial && child !== group.children[0]) {
          meshMaterial.emissive = new THREE.Color(stateColor);
          meshMaterial.emissiveIntensity = stationState === 'active' ? 0.34 : stationState === 'complete' ? 0.12 : 0.015;
        }
      });
      factory.add(group);
      stationGroups.push(group);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerUp = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(stationGroups, true)[0];
      const stationKey = findStationKey(hit?.object ?? null);
      if (stationKey) setSelectedKey(stationKey);
    };
    canvas.addEventListener('pointerup', onPointerUp);

    let visible = true;
    const intersectionObserver = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersectionObserver?.observe(frame);

    const resize = () => {
      const width = Math.max(frame.clientWidth, 1);
      const height = Math.max(frame.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(frame);

    let frameId = 0;
    const clock = new THREE.Clock();
    const render = () => {
      frameId = window.requestAnimationFrame(render);
      if (!visible) return;
      const elapsed = clock.getElapsedTime();
      if (!reducedMotion) {
        packets.forEach((packet, index) => {
          packet.position.x = ((packet.userData.originX + elapsed * 0.2 + index * 0.04 + 4.5) % 9) - 4.5;
        });
        const beacon = scene.getObjectByName('factory-beacon');
        if (beacon) beacon.scale.setScalar(0.9 + Math.sin(elapsed * 2.2) * 0.12);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((item) => item.dispose());
      });
      renderer.dispose();
    };
  }, [workspace.stage]);

  return (
    <section className="interactive-factory" aria-label="Interactive research factory">
      <div className="factory-canvas-frame" ref={frameRef}>
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="factory-aura" aria-hidden="true" />
        {webglFailed && (
          <div className="factory-fallback">
            <span>3D unavailable</span>
            <strong>The factory state is still available below.</strong>
          </div>
        )}
        <div className="factory-orbit-hint" aria-hidden="true">Drag to orbit · Select a station</div>
      </div>

      <div className="factory-station-controls" aria-label="Factory stations">
        {FACTORY_STATIONS.map((station) => (
          <button
            type="button"
            key={station.key}
            onClick={() => setSelectedKey(station.key)}
            aria-label={`${station.name}, ${getStationMetric(workspace, station.key).value} ${getStationMetric(workspace, station.key).label}`}
            aria-pressed={selectedKey === station.key}
            data-state={getStationState(workspace.stage, station.key)}
          >
            <span aria-hidden="true" />
            {station.shortName}
          </button>
        ))}
      </div>

      <div className="factory-station-detail" role="status" aria-live="polite">
        <div>
          <span>{selectedStation.name}</span>
          <strong>{selectedMetric.value} {selectedMetric.label}</strong>
        </div>
        <p>{selectedStation.description}</p>
      </div>
    </section>
  );
}
