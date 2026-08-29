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
import { createFoundryCore, FOUNDRY_CORE_COLORS } from '../presentation/foundry-core-model';

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
  const [selection, setSelection] = useState<{ stage: FoundryWorkspace['stage']; key: FactoryStationKey }>(() => ({
    stage: workspace.stage,
    key: getActiveStationKey(workspace.stage),
  }));
  const selectedKey = selection.stage === workspace.stage ? selection.key : getActiveStationKey(workspace.stage);

  const selectedStation = useMemo(
    () => FACTORY_STATIONS.find((station) => station.key === selectedKey) ?? FACTORY_STATIONS[0],
    [selectedKey],
  );
  const selectedMetric = getStationMetric(workspace, selectedStation.key);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    let cancelled = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      queueMicrotask(() => { if (!cancelled) setWebglFailed(true); });
      return () => { cancelled = true; };
    }

    queueMicrotask(() => { if (!cancelled) setWebglFailed(false); });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x12101d, 0.025);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(6.2, 5.45, 8.15);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 2.02, 0);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.28;

    scene.add(new THREE.HemisphereLight(0xe3ddff, 0x17131e, 2.25));
    const keyLight = new THREE.DirectionalLight(0xfffbf5, 4.2);
    keyLight.position.set(4, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(FOUNDRY_CORE_COLORS.violet, 24, 16);
    rimLight.position.set(-3.5, 3.4, -2.5);
    scene.add(rimLight);
    const warmLight = new THREE.PointLight(FOUNDRY_CORE_COLORS.coral, 12, 13);
    warmLight.position.set(4, 2.8, -2.8);
    scene.add(warmLight);

    const foundryCore = createFoundryCore(workspace.stage);
    const factory = foundryCore.group;
    factory.rotation.y = -0.34;
    scene.add(factory);
    const stationGroups = foundryCore.stationGroups;

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
      if (stationKey) setSelection({ stage: workspace.stage, key: stationKey });
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
        foundryCore.beacon.scale.setScalar(0.9 + Math.sin(elapsed * 2.2) * 0.12);
        const orbitAngle = elapsed * 0.42;
        const orbitPoint = new THREE.Vector3(Math.cos(orbitAngle) * 2.72, Math.sin(orbitAngle) * 2.72, 0)
          .applyEuler(new THREE.Euler(1.13, 0.25, 0.18))
          .add(new THREE.Vector3(0, 1.93, 0));
        foundryCore.orbitPacket.position.copy(orbitPoint);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelled = true;
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
        <div className="factory-orbit-hint" aria-hidden="true">Drag to orbit · Select a module</div>
      </div>

      <div className="factory-object-label" aria-hidden="true"><span>Foundry core</span><strong>7 linked modules</strong></div>

      <div className="factory-station-controls" aria-label="Factory stations">
        {FACTORY_STATIONS.map((station) => (
          <button
            type="button"
            key={station.key}
            onClick={() => setSelection({ stage: workspace.stage, key: station.key })}
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
