'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { FoundryWorkspace } from '../domain/types';
import type { AutonomousResearchProgress } from '../research/autonomous-research';
import {
  FACTORY_PRODUCTION_STEPS,
  getFactoryProductionView,
  type FactoryProductionView,
} from '../presentation/factory-production';
import { FACTORY_MODEL_URL, fitFactoryModel, getFactoryCameraFrame, prepareFactoryModel } from '../presentation/factory-model';

const INPUT_COLOR = new THREE.Color(0x63d1d2);
const ERROR_COLOR = new THREE.Color(0xec6a62);

function createPixelParcel(color: number, accent: number) {
  const parcel = new THREE.Group();
  const bodyMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 });
  const accentMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.34, 0.42), bodyMaterial);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.48), accentMaterial);
  cap.position.y = 0.22;
  const seal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.46), accentMaterial);
  parcel.add(body, cap, seal);
  parcel.userData.materials = [bodyMaterial, accentMaterial];
  return parcel;
}

function parcelMaterials(parcel: THREE.Group) {
  return parcel.userData.materials as THREE.MeshBasicMaterial[];
}

function setParcelOpacity(parcel: THREE.Group, opacity: number) {
  for (const material of parcelMaterials(parcel)) material.opacity = opacity;
  parcel.visible = opacity > 0.01;
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
  const [webglFailed, setWebglFailed] = useState(false);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const production = getFactoryProductionView(workspace, researchRun);
  const productionRef = useRef<FactoryProductionView>(production);

  useEffect(() => {
    productionRef.current = production;
  }, [production]);

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
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 1.35, 0);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.24;

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

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 64),
      new THREE.MeshBasicMaterial({ color: 0x070812, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.x = 1.38;
    shadow.position.y = 0.025;
    factory.add(shadow);

    const conveyorMaterial = new THREE.MeshBasicMaterial({ color: 0x252a3b, transparent: true, opacity: 0.82 });
    const conveyorTieMaterial = new THREE.MeshBasicMaterial({ color: 0x5378ce, transparent: true, opacity: 0.58 });
    const inputParcel = createPixelParcel(0x63d1d2, 0xfff1bf);
    inputParcel.name = 'problem-packet';
    const outputParcel = createPixelParcel(0xb8dc58, 0xec6a62);
    outputParcel.name = 'solution-crate';
    productionRig.add(inputParcel, outputParcel);

    const beaconMaterials = FACTORY_PRODUCTION_STEPS.map((step, index) => new THREE.MeshBasicMaterial({
      color: index === FACTORY_PRODUCTION_STEPS.length - 1 ? 0xb8dc58 : index % 2 ? 0xf1bd55 : 0x63d1d2,
      transparent: true,
      opacity: 0.16,
    }));
    const beacons = beaconMaterials.map((material, index) => {
      const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), material);
      beacon.name = `production-stage-${index + 1}`;
      productionRig.add(beacon);
      return beacon;
    });
    const flowMaterials = [0x63d1d2, 0xf1bd55, 0xec6a62, 0xb8dc58].map((color) => new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }));
    const flowVoxels = flowMaterials.map((material) => {
      const voxel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), material);
      productionRig.add(voxel);
      return voxel;
    });

    let loadedModel: THREE.Object3D | undefined;
    let inputStartX = -3.2;
    let inputDockX = -1.15;
    let outputDockX = 1.15;
    let outputEndX = 3.2;
    let parcelY = 0.28;
    let flowZ = 0.25;
    const cameraDirection = new THREE.Vector3();
    const frameLoadedStage = () => {
      if (!loadedModel) return;
      const frameSettings = getFactoryCameraFrame(stage, camera.fov, camera.aspect, 1.12);
      cameraDirection.copy(camera.position).sub(controls.target);
      if (cameraDirection.lengthSq() < 0.001) cameraDirection.set(0.55, 0.36, 0.76);
      cameraDirection.normalize();
      controls.target.copy(frameSettings.center);
      camera.position.copy(frameSettings.center).addScaledVector(cameraDirection, frameSettings.distance);
      camera.near = Math.max(0.05, frameSettings.distance / 100);
      camera.far = Math.max(100, frameSettings.distance * 10);
      camera.updateProjectionMatrix();
      controls.update();
    };

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
        fitFactoryModel(model, 3.65);
        modelAnchor.add(model);
        loadedModel = model;

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        inputStartX = bounds.min.x - 1.35;
        inputDockX = bounds.min.x + Math.min(0.28, size.x * 0.1);
        outputDockX = bounds.max.x - Math.min(0.28, size.x * 0.1);
        outputEndX = bounds.max.x + 1.35;
        parcelY = bounds.min.y + 0.25;
        flowZ = bounds.getCenter(new THREE.Vector3()).z;
        inputParcel.position.set(inputStartX, parcelY, flowZ);
        outputParcel.position.set(outputDockX, parcelY, flowZ);
        addConveyor(productionRig, inputStartX - 0.18, inputDockX, parcelY - 0.2, flowZ, conveyorMaterial, conveyorTieMaterial);
        addConveyor(productionRig, outputDockX, outputEndX + 0.18, parcelY - 0.2, flowZ, conveyorMaterial, conveyorTieMaterial);

        const beaconY = bounds.max.y + 0.15;
        const beaconZ = bounds.max.z + 0.04;
        for (let index = 0; index < beacons.length; index += 1) {
          beacons[index].position.set(
            THREE.MathUtils.lerp(bounds.min.x + 0.25, bounds.max.x - 0.25, index / (beacons.length - 1)),
            beaconY,
            beaconZ,
          );
        }
        frameLoadedStage();
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
      frameLoadedStage();
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

      controls.autoRotate = !reducedMotion && !running;
      if (!reducedMotion) modelAnchor.position.y = running ? Math.sin(elapsed * 2.2) * 0.025 : Math.sin(elapsed * 0.72) * 0.035;

      if (current.status === 'empty') {
        inputParcel.position.x = inputStartX;
        inputParcel.rotation.y = elapsed * 0.25;
        parcelMaterials(inputParcel)[0].color.copy(INPUT_COLOR);
        setParcelOpacity(inputParcel, 0.52 + (reducedMotion ? 0 : Math.sin(elapsed * 2) * 0.12));
      } else if (current.status === 'running') {
        const intakeProgress = THREE.MathUtils.clamp(normalizedProgress / 0.26, 0, 1);
        inputParcel.position.x = THREE.MathUtils.lerp(inputStartX, inputDockX, intakeProgress);
        inputParcel.rotation.y = elapsed * 0.65;
        parcelMaterials(inputParcel)[0].color.copy(INPUT_COLOR);
        setParcelOpacity(inputParcel, normalizedProgress < 0.34 ? THREE.MathUtils.clamp((0.34 - normalizedProgress) / 0.08, 0, 1) : 0);
      } else if (current.status === 'error') {
        inputParcel.position.x = inputStartX;
        parcelMaterials(inputParcel)[0].color.copy(ERROR_COLOR);
        setParcelOpacity(inputParcel, 0.86);
      } else {
        setParcelOpacity(inputParcel, 0);
      }

      const outputProgress = current.status === 'complete'
        ? 1
        : THREE.MathUtils.clamp((normalizedProgress - 0.78) / 0.22, 0, 1);
      outputParcel.position.x = THREE.MathUtils.lerp(outputDockX, outputEndX, outputProgress);
      outputParcel.rotation.y = reducedMotion ? 0 : -elapsed * 0.48;
      setParcelOpacity(outputParcel, current.status === 'complete' ? 1 : running && normalizedProgress > 0.78 ? outputProgress : 0);

      for (let index = 0; index < beacons.length; index += 1) {
        const complete = current.status === 'complete' || index < current.activeIndex;
        const active = current.status === 'running' && index === current.activeIndex;
        beaconMaterials[index].opacity = complete ? 0.92 : active ? 1 : current.status === 'error' ? 0.18 : 0.12;
        const pulse = active && !reducedMotion ? 1 + Math.sin(elapsed * 5) * 0.35 : 1;
        beacons[index].scale.setScalar(pulse);
      }

      for (let index = 0; index < flowVoxels.length; index += 1) {
        const voxel = flowVoxels[index];
        const material = flowMaterials[index];
        if (!running || reducedMotion) {
          material.opacity = 0;
          voxel.visible = false;
          continue;
        }
        const travel = (elapsed * 0.12 + index / flowVoxels.length) % 1;
        voxel.visible = true;
        material.opacity = 0.78;
        voxel.position.set(
          THREE.MathUtils.lerp(inputDockX, outputDockX, travel),
          parcelY + 0.1 + Math.sin(travel * Math.PI) * 0.7,
          flowZ,
        );
        voxel.rotation.x = elapsed * 1.2;
        voxel.rotation.y = elapsed * 1.6;
      }

      rimLight.intensity = running ? 31 + Math.sin(elapsed * 3) * 6 : 21;
      warmLight.intensity = current.status === 'complete' ? 19 : current.status === 'error' ? 24 : 13;
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
    <section className="interactive-factory" aria-label="Interactive research factory" data-production={production.status}>
      <div className="factory-canvas-frame" ref={frameRef} data-production={production.status}>
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="factory-aura" aria-hidden="true" />
        <div className="factory-port factory-port-input" aria-hidden="true"><span>Input</span><i>→</i></div>
        <div className="factory-port factory-port-output" aria-hidden="true"><i>→</i><span>Output</span></div>
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
        <div className="factory-orbit-hint" aria-hidden="true">Drag to inspect · production stays live</div>
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
