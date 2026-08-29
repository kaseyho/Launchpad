import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FACTORY_MODEL_URL, fitFactoryModel, getFactoryCameraFrame, prepareFactoryModel } from './factory-model';

describe('factory model presentation', () => {
  it('uses the supplied public GLB path', () => {
    expect(FACTORY_MODEL_URL).toBe('/models/factory.glb');
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
});
