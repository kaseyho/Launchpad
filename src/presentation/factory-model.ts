import * as THREE from 'three';

export const FACTORY_MODEL_URL = '/models/factory.glb';

export interface FittedFactoryModel {
  height: number;
  maxDimension: number;
  scale: number;
}

export interface FactoryCameraFrame {
  center: THREE.Vector3;
  distance: number;
}

export function fitFactoryModel(model: THREE.Object3D, targetSize = 4.5): FittedFactoryModel {
  model.updateMatrixWorld(true);
  const initialBounds = new THREE.Box3().setFromObject(model);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  const initialMaxDimension = Math.max(initialSize.x, initialSize.y, initialSize.z);

  if (!Number.isFinite(initialMaxDimension) || initialMaxDimension <= 0) {
    return { height: 0, maxDimension: 0, scale: 1 };
  }

  const scale = targetSize / initialMaxDimension;
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(model);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y += 0.08 - scaledBounds.min.y;
  model.updateMatrixWorld(true);

  const fittedBounds = new THREE.Box3().setFromObject(model);
  const fittedSize = fittedBounds.getSize(new THREE.Vector3());

  return {
    height: fittedSize.y,
    maxDimension: Math.max(fittedSize.x, fittedSize.y, fittedSize.z),
    scale,
  };
}

export function prepareFactoryModel(model: THREE.Object3D) {
  model.name = 'factory-model';
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = true;
  });
  return model;
}

export function getFactoryCameraFrame(
  model: THREE.Object3D,
  verticalFovDegrees: number,
  aspect: number,
  padding = 1.2,
): FactoryCameraFrame {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  const verticalFov = THREE.MathUtils.degToRad(verticalFovDegrees);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(aspect, 0.1));
  const limitingFov = Math.max(Math.min(verticalFov, horizontalFov), THREE.MathUtils.degToRad(5));
  const radius = Number.isFinite(sphere.radius) ? sphere.radius : 0;

  return {
    center: sphere.center,
    distance: radius > 0 ? (radius / Math.sin(limitingFov / 2)) * padding : 8,
  };
}
