'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { FoundryWorkspace } from '../domain/types';
import {
  FACTORY_STATIONS,
  getActiveStationKey,
  getStationMetric,
} from '../presentation/factory-stages';
import { FACTORY_MODEL_URL, fitFactoryModel, prepareFactoryModel } from '../presentation/factory-model';

export function InteractiveFactory({ workspace }: { workspace: FoundryWorkspace }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const activeKey = getActiveStationKey(workspace.stage);
  const activeStation = FACTORY_STATIONS.find((station) => station.key === activeKey) ?? FACTORY_STATIONS[0];
  const activeMetric = getStationMetric(workspace, activeStation.key);

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x12101d, 0.025);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(5.7, 4.5, 7.6);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 1.35, 0);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.28;

    scene.add(new THREE.HemisphereLight(0xe3ddff, 0x17131e, 2.25));
    const keyLight = new THREE.DirectionalLight(0xfffbf5, 4.2);
    keyLight.position.set(4, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x9587ff, 24, 16);
    rimLight.position.set(-3.5, 3.4, -2.5);
    scene.add(rimLight);
    const warmLight = new THREE.PointLight(0xff8174, 12, 13);
    warmLight.position.set(4, 2.8, -2.8);
    scene.add(warmLight);

    const factory = new THREE.Group();
    factory.name = 'authored-factory-stage';
    factory.rotation.y = -0.16;
    scene.add(factory);

    const modelAnchor = new THREE.Group();
    modelAnchor.name = 'factory-model-anchor';
    factory.add(modelAnchor);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 64),
      new THREE.MeshBasicMaterial({ color: 0x050408, transparent: true, opacity: 0.42, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.x = 1.38;
    shadow.position.y = 0.025;
    factory.add(shadow);

    queueMicrotask(() => { if (!cancelled) setModelStatus('loading'); });
    const loader = new GLTFLoader();
    loader.load(
      FACTORY_MODEL_URL,
      (gltf) => {
        if (cancelled) {
          gltf.scene.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((item) => item.dispose());
          });
          return;
        }
        const model = prepareFactoryModel(gltf.scene);
        const fitted = fitFactoryModel(model, 4.65);
        modelAnchor.add(model);
        controls.target.set(0, Math.max(0.7, fitted.height * 0.46), 0);
        controls.update();
        setModelStatus('ready');
      },
      undefined,
      () => { if (!cancelled) setModelStatus('failed'); },
    );

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
      if (!reducedMotion) modelAnchor.position.y = Math.sin(elapsed * 0.72) * 0.035;
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((item) => item.dispose());
      });
      renderer.dispose();
    };
  }, []);

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
        {!webglFailed && modelStatus === 'loading' && (
          <div className="factory-model-loading" role="status">Loading factory model</div>
        )}
        {!webglFailed && modelStatus === 'failed' && (
          <div className="factory-fallback" role="status">
            <span>Model unavailable</span>
            <strong>The research workflow is still available below.</strong>
          </div>
        )}
        <div className="factory-orbit-hint" aria-hidden="true">Drag to orbit</div>
      </div>

      <div className="factory-caption" role="status" aria-live="polite">
        <span><i aria-hidden="true" /> Current station</span>
        <strong>{activeStation.name}</strong>
        <small>{activeMetric.value} {activeMetric.label}</small>
      </div>
    </section>
  );
}
