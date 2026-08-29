import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { WorkspaceStage } from '../domain/types';
import {
  FACTORY_STATIONS,
  getStationState,
  type FactoryStationKey,
  type FactoryStationState,
} from './factory-stages';

export const FOUNDRY_CORE_COLORS = {
  frame: 0x08070c,
  paper: 0xf3efe8,
  paperShade: 0xcfcbd7,
  violet: 0x9587ff,
  violetDeep: 0x4d456f,
  mint: 0x55e6ad,
  coral: 0xff8174,
  amber: 0xffc56e,
  idle: 0x282537,
};

function roundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  color: number,
  name: string,
  metalness = 0.08,
  roughness = 0.58,
) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, depth, 4, radius),
    new THREE.MeshStandardMaterial({ color, metalness, roughness }),
  );
  mesh.name = name;
  return mesh;
}

function stationMaterial(state: FactoryStationState) {
  const color = state === 'active'
    ? FOUNDRY_CORE_COLORS.violet
    : state === 'complete'
      ? FOUNDRY_CORE_COLORS.mint
      : FOUNDRY_CORE_COLORS.idle;
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: state === 'active' ? 0.42 : state === 'complete' ? 0.13 : 0.018,
    metalness: 0.04,
    roughness: 0.5,
  });
}

function tagStation(object: THREE.Object3D, stationKey: FactoryStationKey) {
  object.userData.stationKey = stationKey;
  object.traverse((child) => { child.userData.stationKey = stationKey; });
}

function addFacePanel(
  group: THREE.Group,
  name: string,
  position: THREE.Vector3,
  rotation: THREE.Euler,
  color: number,
) {
  const panel = roundedBox(0.91, 0.91, 0.1, 0.035, color, name, 0.03, 0.52);
  panel.position.copy(position);
  panel.rotation.copy(rotation);
  group.add(panel);
  return panel;
}

export interface FoundryCoreModel {
  group: THREE.Group;
  stationGroups: THREE.Group[];
  beacon: THREE.Mesh;
  orbitPacket: THREE.Mesh;
}

export function createFoundryCore(stage: WorkspaceStage): FoundryCoreModel {
  const core = new THREE.Group();
  core.name = 'foundry-core';
  core.userData.visualLanguage = 'modular-monolith';

  const shell = roundedBox(3.48, 3.48, 3.48, 0.1, FOUNDRY_CORE_COLORS.frame, 'foundry-shell', 0.14, 0.4);
  shell.position.y = 1.93;
  core.add(shell);

  const grid = [-1.08, 0, 1.08];
  const stationGroups: THREE.Group[] = [];

  FACTORY_STATIONS.forEach((station, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const stationGroup = new THREE.Group();
    stationGroup.name = `foundry-module-${station.key}`;
    const panel = new THREE.Mesh(
      new RoundedBoxGeometry(0.91, 0.91, 0.1, 4, 0.035),
      stationMaterial(getStationState(stage, station.key)),
    );
    panel.name = `foundry-panel-${station.key}`;
    panel.position.set(grid[column], 3.01 - row * 1.08, 1.77);
    stationGroup.add(panel);

    if (station.key === 'source') {
      const loadingSlot = roundedBox(0.58, 0.21, 0.075, 0.035, FOUNDRY_CORE_COLORS.frame, 'foundry-loading-slot', 0.02, 0.48);
      loadingSlot.position.set(grid[column], 2.88 - row * 1.08, 1.855);
      stationGroup.add(loadingSlot);
      const intakeLight = roundedBox(0.42, 0.045, 0.04, 0.018, FOUNDRY_CORE_COLORS.mint, 'foundry-intake-light', 0, 0.34);
      intakeLight.position.set(grid[column], 2.88 - row * 1.08, 1.915);
      const intakeMaterial = intakeLight.material as THREE.MeshStandardMaterial;
      intakeMaterial.emissive = new THREE.Color(FOUNDRY_CORE_COLORS.mint);
      intakeMaterial.emissiveIntensity = 0.55;
      stationGroup.add(intakeLight);
    }

    tagStation(stationGroup, station.key);
    core.add(stationGroup);
    stationGroups.push(stationGroup);
  });

  addFacePanel(
    core,
    'foundry-front-utility-a',
    new THREE.Vector3(0, 0.85, 1.77),
    new THREE.Euler(),
    FOUNDRY_CORE_COLORS.paperShade,
  );
  addFacePanel(
    core,
    'foundry-front-utility-b',
    new THREE.Vector3(1.08, 0.85, 1.77),
    new THREE.Euler(),
    FOUNDRY_CORE_COLORS.amber,
  );

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const index = row * 3 + column;
      const colors = [FOUNDRY_CORE_COLORS.coral, 0xc85d69, FOUNDRY_CORE_COLORS.violetDeep];
      const panel = roundedBox(0.1, 0.91, 0.91, 0.035, colors[column], `foundry-side-panel-${index}`, 0.03, 0.52);
      panel.position.set(1.77, 3.01 - row * 1.08, 1.08 - column * 1.08);
      core.add(panel);
    }
  }

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const index = row * 3 + column;
      const panel = roundedBox(
        0.91,
        0.1,
        0.91,
        0.035,
        index === 4 ? FOUNDRY_CORE_COLORS.violet : FOUNDRY_CORE_COLORS.paper,
        `foundry-roof-panel-${index}`,
        0.02,
        0.6,
      );
      panel.position.set(grid[column], 3.73, 1.08 - row * 1.08);
      core.add(panel);
    }
  }

  const chimneyHeights = [0.85, 1.12];
  chimneyHeights.forEach((height, index) => {
    const chimney = roundedBox(0.3, height, 0.3, 0.025, FOUNDRY_CORE_COLORS.frame, `foundry-chimney-${index + 1}`, 0.12, 0.38);
    chimney.position.set(0.56 + index * 0.55, 3.68 + height / 2, -1.03);
    core.add(chimney);

    const cap = roundedBox(0.2, 0.07, 0.2, 0.015, index ? FOUNDRY_CORE_COLORS.coral : FOUNDRY_CORE_COLORS.paper, `foundry-chimney-cap-${index + 1}`, 0.02, 0.42);
    cap.position.set(chimney.position.x, 3.69 + height, chimney.position.z);
    core.add(cap);
  });

  const beaconStem = roundedBox(0.08, 0.33, 0.08, 0.015, FOUNDRY_CORE_COLORS.frame, 'foundry-beacon-stem', 0.08, 0.4);
  beaconStem.position.set(0, 3.96, 0);
  core.add(beaconStem);
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshStandardMaterial({
      color: FOUNDRY_CORE_COLORS.violet,
      emissive: FOUNDRY_CORE_COLORS.violet,
      emissiveIntensity: 0.8,
      metalness: 0.05,
      roughness: 0.28,
    }),
  );
  beacon.name = 'factory-beacon';
  beacon.position.set(0, 4.18, 0);
  core.add(beacon);

  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.72, 0.009, 6, 160),
    new THREE.MeshBasicMaterial({ color: FOUNDRY_CORE_COLORS.violet, transparent: true, opacity: 0.27, depthWrite: false }),
  );
  orbit.name = 'foundry-orbit';
  orbit.position.y = 1.93;
  orbit.rotation.set(1.13, 0.25, 0.18);
  core.add(orbit);

  const orbitPacket = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 12),
    new THREE.MeshBasicMaterial({ color: FOUNDRY_CORE_COLORS.mint }),
  );
  orbitPacket.name = 'foundry-orbit-packet';
  core.add(orbitPacket);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(2.35, 64),
    new THREE.MeshBasicMaterial({ color: 0x050408, transparent: true, opacity: 0.52, depthWrite: false }),
  );
  shadow.name = 'foundry-shadow';
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.x = 1.42;
  shadow.position.y = 0.12;
  core.add(shadow);

  core.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = object !== shadow && object !== orbit && object !== orbitPacket;
    object.receiveShadow = object !== orbit && object !== orbitPacket;
  });

  return { group: core, stationGroups, beacon, orbitPacket };
}
