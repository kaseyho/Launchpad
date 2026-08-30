'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress } from '../research/autonomous-research';
import { getFactoryProductionView, type FactoryProductionView } from '../presentation/factory-production';
import {
  DOCUMENT_MODEL_URL,
  FACTORY_CAMERA_PADDING,
  FACTORY_DISPLAY_SIZE,
  FACTORY_MODEL_URL,
  createTransportModel,
  fitFactoryModel,
  getFactoryCameraFrame,
  prepareFactoryModel,
} from '../presentation/factory-model';

const INPUT_COLOR = new THREE.Color(0x63d1d2);
const ERROR_COLOR = new THREE.Color(0xec6a62);
const REPLAY_DURATION_MS = 10_000;
const REPLAY_DURATION_SECONDS = REPLAY_DURATION_MS / 1_000;

function transportMaterials(model: THREE.Object3D) {
  const materials: THREE.Material[] = [];
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    materials.push(...(Array.isArray(object.material) ? object.material : [object.material]));
  });
  return materials;
}

function setTransportOpacity(model: THREE.Object3D | undefined, opacity: number) {
  if (!model) return;
  for (const material of transportMaterials(model)) {
    material.opacity = opacity;
    material.depthWrite = opacity > 0.22;
  }
  model.visible = opacity > 0.01;
}

function setTransportAccent(model: THREE.Object3D | undefined, accent: THREE.Color) {
  if (!model) return;
  for (const material of transportMaterials(model)) {
    if (!(material instanceof THREE.MeshStandardMaterial)) continue;
    material.emissive.copy(accent);
  }
}

function addConveyor(
  group: THREE.Group,
  startX: number,
  endX: number,
  y: number,
  z: number,
  material: THREE.Material,
  tieMaterial: THREE.Material,
) {
  const length = Math.abs(endX - startX);
  const conveyor = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.44), material);
  conveyor.position.set((startX + endX) / 2, y, z);
  group.add(conveyor);

  for (let index = 0; index < 6; index += 1) {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.52), tieMaterial);
    tie.position.set(THREE.MathUtils.lerp(startX, endX, index / 5), y + 0.06, z);
    group.add(tie);
  }
}

export function InteractiveFactory({
  workspace,
  researchRun,
}: {
  workspace: FoundryWorkspace;
  researchRun: AutonomousResearchProgress;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const replayRequestRef = useRef(0);
  const resetViewRequestRef = useRef(0);
  const motionPausedRef = useRef(false);
  const replayTimerRef = useRef<number | undefined>(undefined);
  const [webglFailed, setWebglFailed] = useState(false);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [replaying, setReplaying] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const production = getFactoryProductionView(workspace, researchRun);
  const productionRef = useRef<FactoryProductionView>(production);

  useEffect(() => {
    productionRef.current = production;
  }, [production]);

  useEffect(() => {
    motionPausedRef.current = motionPaused;
  }, [motionPaused]);

  useEffect(() => () => {
    if (replayTimerRef.current !== undefined) window.clearTimeout(replayTimerRef.current);
  }, []);

  const replayProduction = () => {
    replayRequestRef.current += 1;
    setReplaying(true);
    if (replayTimerRef.current !== undefined) window.clearTimeout(replayTimerRef.current);
    replayTimerRef.current = window.setTimeout(() => {
      setReplaying(false);
      replayTimerRef.current = undefined;
    }, REPLAY_DURATION_MS);
  };

  const resetView = () => {
    resetViewRequestRef.current += 1;
  };

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
    scene.fog = new THREE.FogExp2(0x12131f, 0.018);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(6.6, 4.9, 8.8);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.72;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 1.35, 0);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.11;

    scene.add(new THREE.HemisphereLight(0xfff0c2, 0x131522, 2.25));
    const keyLight = new THREE.DirectionalLight(0xfff6d7, 4.2);
    keyLight.position.set(4, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x63d1d2, 21, 16);
    rimLight.position.set(-3.5, 3.4, -2.5);
    scene.add(rimLight);
    const warmLight = new THREE.PointLight(0xee6b63, 13, 13);
    warmLight.position.set(4, 2.8, -2.8);
    scene.add(warmLight);

    const stage = new THREE.Group();
    stage.name = 'factory-production-stage';
    scene.add(stage);

    const factory = new THREE.Group();
    factory.name = 'authored-factory-asset';
    factory.rotation.y = -0.16;
    stage.add(factory);

    const modelAnchor = new THREE.Group();
    modelAnchor.name = 'factory-model-anchor';
    factory.add(modelAnchor);

    const productionRig = new THREE.Group();
    productionRig.name = 'factory-input-output-rig';
    stage.add(productionRig);

    const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x070812, transparent: true, opacity: 0.5, depthWrite: false });
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 64),
      shadowMaterial,
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.x = 1.38;
    shadow.position.y = 0.025;
    factory.add(shadow);

    const processingRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x63d1d2,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const processingRing = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.82, 64), processingRingMaterial);
    processingRing.name = 'factory-processing-pulse';
    processingRing.rotation.x = -Math.PI / 2;
    processingRing.position.y = 0.04;
    factory.add(processingRing);

    const conveyorMaterial = new THREE.MeshBasicMaterial({ color: 0x252a3b, transparent: true, opacity: 0.82 });
    const conveyorTieMaterial = new THREE.MeshBasicMaterial({ color: 0x5378ce, transparent: true, opacity: 0.58 });

    let loadedModel: THREE.Object3D | undefined;
    let inputDocument: THREE.Object3D | undefined;
    let outputDocument: THREE.Object3D | undefined;
    let inputStartX = -3.2;
    let inputDockX = -1.15;
    let outputDockX = 1.15;
    let outputEndX = 3.2;
    let parcelY = 0.28;
    let flowZ = 0.25;
    let processingRingBaseScale = 1;
    const cameraDirection = new THREE.Vector3();
    const frameLoadedModel = () => {
      if (!loadedModel) return;
      const frameSettings = getFactoryCameraFrame(loadedModel, camera.fov, camera.aspect, FACTORY_CAMERA_PADDING);
      cameraDirection.copy(camera.position).sub(controls.target);
      if (cameraDirection.lengthSq() < 0.001) cameraDirection.set(0.55, 0.36, 0.76);
      cameraDirection.normalize();
      controls.target.copy(frameSettings.center);
      camera.position.copy(frameSettings.center).addScaledVector(cameraDirection, frameSettings.distance);
      camera.near = Math.max(0.05, frameSettings.distance / 100);
      camera.far = Math.max(100, frameSettings.distance * 10);
      camera.updateProjectionMatrix();
      controls.minDistance = frameSettings.distance * 0.68;
      controls.maxDistance = frameSettings.distance * 1.65;
      controls.update();
      controls.saveState();
    };

    let replayStartedAt = -1;
    let replayOnReady = productionRef.current.status === 'complete';
    let seenReplayRequest = replayRequestRef.current;
    let seenResetRequest = resetViewRequestRef.current;
    let previousStatus = productionRef.current.status;
    let userInteracting = false;
    let pointerX = 0;
    let pointerY = 0;
    const markInteractionStart = () => { userInteracting = true; };
    const markInteractionEnd = () => { userInteracting = false; };
    const trackPointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointerX = THREE.MathUtils.clamp(((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1, -1, 1);
      pointerY = THREE.MathUtils.clamp(((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 - 1, -1, 1);
    };
    const clearPointer = () => {
      pointerX = 0;
      pointerY = 0;
    };
    controls.addEventListener('start', markInteractionStart);
    controls.addEventListener('end', markInteractionEnd);
    canvas.addEventListener('pointermove', trackPointer);
    canvas.addEventListener('pointerleave', clearPointer);

    queueMicrotask(() => { if (!cancelled) setModelStatus('loading'); });
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    Promise.all([
      loader.loadAsync(FACTORY_MODEL_URL),
      loader.loadAsync(DOCUMENT_MODEL_URL),
    ]).then(([factoryGltf, documentGltf]) => {
      if (cancelled) return;

      const model = prepareFactoryModel(factoryGltf.scene);
      fitFactoryModel(model, FACTORY_DISPLAY_SIZE);
      modelAnchor.add(model);
      loadedModel = model;

      inputDocument = createTransportModel(documentGltf.scene, 'problem-document', INPUT_COLOR);
      outputDocument = createTransportModel(documentGltf.scene, 'solution-document', 0xb8dc58);
      inputDocument.rotation.set(-0.12, Math.PI / 2, 0.08);
      outputDocument.rotation.set(-0.12, Math.PI / 2, -0.08);
      inputDocument.userData.baseRotationY = inputDocument.rotation.y;
      outputDocument.userData.baseRotationY = outputDocument.rotation.y;
      productionRig.add(inputDocument, outputDocument);

      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const horizontalSize = Math.max(size.x, size.z);
      inputStartX = bounds.min.x - 0.72;
      inputDockX = bounds.min.x + Math.min(0.32, size.x * 0.1);
      outputDockX = bounds.max.x - Math.min(0.32, size.x * 0.1);
      outputEndX = bounds.max.x + 0.72;
      parcelY = bounds.min.y + 0.36;
      flowZ = bounds.getCenter(new THREE.Vector3()).z;
      processingRingBaseScale = Math.max(horizontalSize / 3.6, 1);
      inputDocument.position.set(inputStartX, parcelY, flowZ);
      outputDocument.position.set(outputDockX, parcelY, flowZ);
      addConveyor(productionRig, inputStartX - 0.08, inputDockX, parcelY - 0.22, flowZ, conveyorMaterial, conveyorTieMaterial);
      addConveyor(productionRig, outputDockX, outputEndX + 0.08, parcelY - 0.22, flowZ, conveyorMaterial, conveyorTieMaterial);

      frameLoadedModel();
      replayOnReady = productionRef.current.status === 'complete';
      setModelStatus('ready');
    }).catch(() => {
      if (!cancelled) setModelStatus('failed');
    });

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
      frameLoadedModel();
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
      const current = productionRef.current;
      const normalizedProgress = current.progress / 100;
      const running = current.status === 'running';

      if (seenReplayRequest !== replayRequestRef.current) {
        seenReplayRequest = replayRequestRef.current;
        replayStartedAt = elapsed;
      }
      if (seenResetRequest !== resetViewRequestRef.current) {
        seenResetRequest = resetViewRequestRef.current;
        controls.reset();
      }
      if (loadedModel && replayOnReady) {
        replayOnReady = false;
        replayStartedAt = elapsed;
      }
      if (previousStatus === 'running' && current.status === 'complete') replayStartedAt = elapsed;
      previousStatus = current.status;

      const replayProgress = replayStartedAt >= 0
        ? THREE.MathUtils.clamp((elapsed - replayStartedAt) / REPLAY_DURATION_SECONDS, 0, 1)
        : -1;
      const replayActive = !reducedMotion && replayProgress >= 0 && replayProgress < 1;
      if (!replayActive && replayProgress >= 1) replayStartedAt = -1;
      const flowProgress = replayActive ? replayProgress : normalizedProgress;
      const processing = (replayActive || running) && flowProgress >= 0.32 && flowProgress < 0.74;
      const ambientMotion = !reducedMotion && !motionPausedRef.current;

      controls.autoRotate = ambientMotion && !running && !replayActive && !userInteracting;
      const tiltX = ambientMotion && !userInteracting ? pointerY * 0.028 : 0;
      const tiltY = ambientMotion && !userInteracting ? pointerX * 0.055 : 0;
      stage.rotation.x = THREE.MathUtils.lerp(stage.rotation.x, tiltX, 0.045);
      stage.rotation.y = THREE.MathUtils.lerp(stage.rotation.y, tiltY, 0.045);
      if (ambientMotion) {
        const factoryPulse = processing ? Math.sin(elapsed * 0.92) : Math.sin(elapsed * 0.38);
        modelAnchor.position.y = processing ? factoryPulse * 0.075 : factoryPulse * 0.022;
        modelAnchor.rotation.z = processing ? factoryPulse * 0.009 : 0;
        const modelScale = processing ? 1 + (factoryPulse + 1) * 0.013 : 1;
        modelAnchor.scale.setScalar(modelScale);
      } else {
        modelAnchor.position.y = 0;
        modelAnchor.rotation.z = 0;
        modelAnchor.scale.setScalar(1);
      }

      const processPulse = ambientMotion ? (Math.sin(elapsed * 0.92) + 1) / 2 : 0.5;
      processingRingMaterial.opacity = processing ? 0.24 + processPulse * 0.28 : 0;
      processingRing.scale.setScalar(processingRingBaseScale * (processing ? 0.92 + processPulse * 0.22 : 0.92));
      shadowMaterial.opacity = processing ? 0.62 + processPulse * 0.12 : 0.5;

      if (current.status === 'empty') {
        if (inputDocument) {
          inputDocument.position.x = inputStartX;
          inputDocument.position.y = parcelY + (ambientMotion ? Math.sin(elapsed * 0.82) * 0.055 : 0);
          inputDocument.rotation.y = inputDocument.userData.baseRotationY + (ambientMotion ? Math.sin(elapsed * 0.42) * 0.18 : 0);
        }
        setTransportAccent(inputDocument, INPUT_COLOR);
        setTransportOpacity(inputDocument, 0.84);
      } else if (running || replayActive) {
        const intakeProgress = THREE.MathUtils.smoothstep(flowProgress, 0.02, 0.32);
        if (inputDocument) {
          inputDocument.position.x = THREE.MathUtils.lerp(inputStartX, inputDockX, intakeProgress);
          inputDocument.position.y = parcelY + (ambientMotion ? Math.sin(elapsed * 1.15) * 0.035 : 0);
          inputDocument.rotation.y = inputDocument.userData.baseRotationY + (ambientMotion ? intakeProgress * Math.PI * 0.22 : 0);
        }
        setTransportAccent(inputDocument, INPUT_COLOR);
        setTransportOpacity(inputDocument, flowProgress < 0.38 ? THREE.MathUtils.clamp((0.38 - flowProgress) / 0.08, 0, 1) : 0);
      } else if (current.status === 'error') {
        if (inputDocument) {
          inputDocument.position.x = inputStartX;
          inputDocument.position.y = parcelY;
        }
        setTransportAccent(inputDocument, ERROR_COLOR);
        setTransportOpacity(inputDocument, 0.9);
      } else {
        setTransportOpacity(inputDocument, 0);
      }

      const outputProgress = replayActive
        ? THREE.MathUtils.smoothstep(flowProgress, 0.74, 0.98)
        : current.status === 'complete'
          ? 1
          : THREE.MathUtils.smoothstep(normalizedProgress, 0.74, 0.98);
      if (outputDocument) {
        outputDocument.position.x = THREE.MathUtils.lerp(outputDockX, outputEndX, outputProgress);
        outputDocument.position.y = parcelY + outputProgress * 0.1 + (ambientMotion ? Math.sin(elapsed * 0.74) * 0.045 : 0);
        outputDocument.rotation.y = outputDocument.userData.baseRotationY - (ambientMotion ? outputProgress * Math.PI * 0.28 : 0);
      }
      const outputVisible = replayActive
        ? flowProgress > 0.7
        : current.status === 'complete' || (running && normalizedProgress > 0.7);
      setTransportOpacity(outputDocument, outputVisible ? Math.max(outputProgress, 0.16) : 0);

      rimLight.intensity = processing ? 31 + processPulse * 9 : 21;
      warmLight.intensity = processing ? 18 + processPulse * 7 : current.status === 'complete' ? 19 : current.status === 'error' ? 24 : 13;
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      controls.removeEventListener('start', markInteractionStart);
      controls.removeEventListener('end', markInteractionEnd);
      canvas.removeEventListener('pointermove', trackPointer);
      canvas.removeEventListener('pointerleave', clearPointer);
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
    <section className="interactive-factory" aria-label="Interactive research factory" data-production={production.status}>
      <div className="factory-canvas-frame" ref={frameRef} data-production={production.status}>
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="factory-aura" aria-hidden="true" />
        {webglFailed && (
          <div className="factory-fallback">
            <span>3D unavailable</span>
            <strong>The live production state is still available below.</strong>
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
        <div className="factory-view-controls" aria-label="Factory view controls">
          <button
            type="button"
            onClick={replayProduction}
            disabled={production.status === 'empty' || webglFailed || modelStatus !== 'ready'}
          >
            {replaying ? 'Replaying flow…' : 'Replay flow'}
          </button>
          <button
            type="button"
            onClick={resetView}
            disabled={webglFailed || modelStatus !== 'ready'}
          >
            Reset view
          </button>
          <button
            type="button"
            onClick={() => setMotionPaused((paused) => !paused)}
            disabled={webglFailed || modelStatus !== 'ready'}
            aria-pressed={motionPaused}
          >
            {motionPaused ? 'Resume motion' : 'Pause motion'}
          </button>
        </div>
        <div className="factory-asset-credit">
          <a
            href="https://sketchfab.com/3d-models/diplomascroll3dmodeldoerlorenz-416cd723010c4a09ab971ec0225636b4"
            target="_blank"
            rel="noreferrer"
            aria-label="Document model credit"
          >
            Document model · doerdoerlorenz
          </a>
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>
        </div>
        <div className="factory-orbit-hint" aria-hidden="true">Drag to orbit · scroll to zoom</div>
      </div>

      <div className="factory-production-console" role="status" aria-live="polite">
        <div className="factory-production-node factory-production-input">
          <span>01 / Input</span>
          <strong>{production.inputLabel}</strong>
          <small>{production.inputDetail}</small>
        </div>
        <div className="factory-production-now">
          <div><span>02 / Factory · {production.status === 'empty' ? 'Ready' : `${production.progress}%`}</span><i aria-hidden="true" /></div>
          <strong>{production.activeStation}</strong>
          <small>{production.activeLabel} · {researchRun.message}</small>
          <div className="factory-production-track" aria-label={`${production.progress}% processed`}>
            <span style={{ width: `${production.progress}%` }} />
          </div>
        </div>
        <div className="factory-production-node factory-production-output">
          <span>03 / Output</span>
          <strong>{production.outputLabel}</strong>
          <small>{production.outputDetail}</small>
        </div>
      </div>
    </section>
  );
}
