import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  DOCUMENT_DISPLAY_SIZE,
  DOCUMENT_MODEL_URL,
  FACTORY_CAMERA_PADDING,
  FACTORY_DISPLAY_SIZE,
  FACTORY_MODEL_URL,
  createTransportModel,
  fitFactoryModel,
  getFactoryCameraFrame,
  prepareFactoryModel,
} from './factory-model';

describe('factory model presentation', () => {
  it('uses the supplied public GLB path', () => {
    expect(FACTORY_MODEL_URL).toBe('/models/factory.glb');
    expect(DOCUMENT_MODEL_URL).toBe('/models/document.glb');
  });

  it('keeps the factory dominant while the document remains a supporting object', () => {
    expect(FACTORY_DISPLAY_SIZE).toBeGreaterThan(5);
    expect(DOCUMENT_DISPLAY_SIZE).toBeLessThan(1.2);
    expect(FACTORY_CAMERA_PADDING).toBeLessThan(1.15);
  });

  it('centers, grounds, and scales an authored model without changing its proportions', () => {
    const model = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 6), new THREE.MeshStandardMaterial());
    mesh.position.set(8, 5, -3);
    model.add(mesh);

    const fitted = fitFactoryModel(model, 5);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());

    expect(fitted.scale).toBeCloseTo(0.5);
    expect(fitted.maxDimension).toBeCloseTo(5);
    expect(bounds.min.y).toBeCloseTo(0.08);
    expect(center.x).toBeCloseTo(0);
    expect(center.z).toBeCloseTo(0);
  });

  it('prepares every authored mesh for the existing lit scene', () => {
    const model = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    model.add(mesh);

    prepareFactoryModel(model);

    expect(model.name).toBe('factory-model');
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });

  it('frames the whole model with extra breathing room', () => {
    const model = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 2), new THREE.MeshBasicMaterial());
    model.position.y = 3;

    const frame = getFactoryCameraFrame(model, 32, 16 / 9, 1.2);

    expect(frame.center.y).toBeCloseTo(3);
    expect(frame.distance).toBeGreaterThan(13);
  });

  it('clones, centers, and independently lights the supplied document model', () => {
    const source = new THREE.Group();
    const sourceMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    source.add(new THREE.Mesh(new THREE.BoxGeometry(4, 2, 1), sourceMaterial));

    const input = createTransportModel(source, 'problem-document', 0x63d1d2, 1);
    const output = createTransportModel(source, 'solution-document', 0xb8dc58, 1);
    const inputMesh = input.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    const outputMesh = output.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    const inputBounds = new THREE.Box3().setFromObject(input);
    const inputCenter = inputBounds.getCenter(new THREE.Vector3());

    expect(input).not.toBe(source);
    expect(input.name).toBe('problem-document');
    expect(inputMesh.material).not.toBe(sourceMaterial);
    expect(inputMesh.material).not.toBe(outputMesh.material);
    expect(inputMesh.material.transparent).toBe(true);
    expect(inputMesh.material.opacity).toBe(0);
    expect(inputMesh.material.emissive.getHex()).toBe(0x63d1d2);
    expect(inputMesh.castShadow).toBe(true);
    expect(inputBounds.getSize(new THREE.Vector3()).x).toBeCloseTo(1);
    expect(inputCenter.length()).toBeCloseTo(0);
  });
});
