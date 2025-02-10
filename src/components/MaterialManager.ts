import * as BABYLON from "@babylonjs/core";

export class MaterialManager {
  meshs: BABYLON.Mesh[];
  originalState: Map<string, BABYLON.Material>;
  constructor(meshs: BABYLON.Mesh[]) {
    this.meshs = meshs;
    this.originalState = this.saveOriginalState();
  }

  saveOriginalState() {
    const state = new Map();
    if (this.meshs.length > 0) {
      this.meshs.forEach((mesh) => {
        state.set(mesh.uniqueId, mesh.material ? mesh.material.clone() : null);
      });
    }
    return state;
  }

  applyNewMaterial(newMaterial: BABYLON.Mesh) {
    if (this.meshs.length > 0) {
      this.meshs.forEach((mesh) => {
        mesh.material = newMaterial.clone();
      });
    }
  }

  restoreOriginal() {
    if (this.meshs.length > 0) {
      this.meshs.forEach((mesh) => {
        mesh.material = this.originalState.get(mesh.uniqueId)
          ? this.originalState.get(mesh.uniqueId).clone()
          : null;
      });
    }
  }
}


