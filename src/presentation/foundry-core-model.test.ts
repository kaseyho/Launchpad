import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createFoundryCore } from './foundry-core-model';

describe('createFoundryCore', () => {
  it('builds one modular monolith with seven selectable workflow panels', () => {
    const model = createFoundryCore('EVIDENCE_REVIEW');
    const stationKeys = model.stationGroups.map((group) => group.userData.stationKey);

    expect(model.group.name).toBe('foundry-core');
    expect(model.group.userData.visualLanguage).toBe('modular-monolith');
    expect(stationKeys).toEqual(['source', 'evidence', 'review', 'signal', 'idea', 'stress', 'blueprint']);
    expect(new Set(stationKeys).size).toBe(7);
    expect(model.group.getObjectByName('foundry-shell')).toBeTruthy();
    expect(model.group.getObjectByName('foundry-loading-slot')).toBeTruthy();
    expect(model.group.getObjectByName('foundry-chimney-1')).toBeTruthy();
    expect(model.group.getObjectByName('foundry-orbit')).toBeTruthy();
  });

  it('keeps active, completed, and idle modules visually distinct without animation', () => {
    const model = createFoundryCore('CANDIDATES_READY');
    const materialFor = (key: string) => {
      const group = model.group.getObjectByName(`foundry-module-${key}`) as THREE.Group;
      const panel = group.children[0] as THREE.Mesh;
      return panel.material as THREE.MeshStandardMaterial;
    };

    expect(materialFor('review').emissiveIntensity).toBeGreaterThan(0.1);
    expect(materialFor('idea').emissiveIntensity).toBeGreaterThan(materialFor('review').emissiveIntensity);
    expect(materialFor('stress').emissiveIntensity).toBeLessThan(0.1);
  });
});
