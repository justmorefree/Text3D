<script setup lang="ts">
import { onMounted, ref, watch, markRaw } from 'vue';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/OBJ';
import { OBJFileLoader } from "@babylonjs/loaders/OBJ/objFileLoader";

// import "@babylonjs/loaders/glTF/2.0";

import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { MaterialManager } from './MaterialManager';
registerBuiltInLoaders();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const loadMeshes = ref<BABYLON.Mesh[]>([]);
const materialType = ref<'white' | 'normal'>('white');
let scene: BABYLON.Scene;

let materialManager: MaterialManager;

onMounted(async () => {
  if (!canvasRef.value) return;

  OBJFileLoader.COMPUTE_NORMALS = true;


  const engine = new BABYLON.Engine(canvasRef.value, true);
  scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2, 3, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvasRef.value, true);
  camera.lowerRadiusLimit = 1.3;
  camera.upperRadiusLimit = 5;
  camera.minZ = 0.1;
  camera.maxZ = 100;


  const skylight1 = new BABYLON.HemisphericLight('skylight', new BABYLON.Vector3(0, 1, 0), scene);
  skylight1.intensity = 1
  skylight1.groundColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  skylight1.diffuse = new BABYLON.Color3(0.6, 0.6, 0.6);

  const skylight2 = new BABYLON.HemisphericLight('skylight', new BABYLON.Vector3(-1, -2, -1), scene);
  skylight2.intensity = 1
  skylight2.diffuse = new BABYLON.Color3(0.6, 0.6, 0.6);

  // // 平行光
  const dirlight = new BABYLON.DirectionalLight('dirlight', new BABYLON.Vector3(1, -1, 1), scene);
  dirlight.intensity = 1
  dirlight.diffuse = new BABYLON.Color3(0.6, 0.6, 0.6);


  const scence = await BABYLON.SceneLoader.AppendAsync('/models/tripo.glb', null, scene);

  loadMeshes.value = scence.meshes;
  materialManager = new MaterialManager(scence.meshes)

  scence.meshes.forEach((mesh: any) => {
    if (!mesh.material) return;
    mesh.material.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95); // 设置基础颜色
    mesh.material.metallic = 0.3; // 设置金属度
    mesh.material.roughness = 0.5; // 设置粗糙度

    mesh.material.environmentIntensity = 0.7;
    mesh.material.reflectivityColor = new BABYLON.Color3(0.9, 0.9, 0.9);
  });


  // 3. 添加后处理效果
  const pipeline = new BABYLON.DefaultRenderingPipeline(
    "defaultPipeline",
    true,
    scene,
    [camera]
  );

  // 调整图像处理效果
  pipeline.imageProcessing.contrast = 1.1;
  pipeline.imageProcessing.exposure = 1.2;

  // 添加环境光遮蔽(SSAO)
  const ssao = new BABYLON.SSAO2RenderingPipeline(
    "ssao",
    scene,
    0.5
  );
  ssao.radius = 0.03;
  ssao.totalStrength = 1.0;
  ssao.expensiveBlur = true;



  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});



const setMaterial = (meshes: BABYLON.Mesh[], material: BABYLON.Material) => {
  meshes.forEach(mesh => {
    mesh.material = material;
  });
}

const getWhiteMaterial = () => {
  const pbrMaterial = new BABYLON.PBRMaterial("pbrMaterial", scene);
  pbrMaterial.albedoColor = new BABYLON.Color3(1, 1, 1); // 设置基础颜色
  pbrMaterial.metallic = 0.0; // 设置金属度
  pbrMaterial.roughness = 1.0; // 设置粗糙度
  return pbrMaterial;
}

const getFaxianMaterial = () => {
  BABYLON.Effect.ShadersStore["customVertexShader"] =
    "\r\n" +
    "precision highp float;\r\n" +
    "// Attributes\r\n" +
    "attribute vec3 position;\r\n" +
    "attribute vec3 normal;\r\n" +
    "// Uniforms\r\n" +
    "uniform mat4 worldViewProjection;\r\n" +
    "uniform mat4 worldView;\r\n" +
    "// Varying\r\n" +
    "varying vec3 vNormal;\r\n" +
    "void main(void) {\r\n" +
    "    gl_Position = worldViewProjection * vec4(position, 1.0);\r\n" +
    "    vNormal = (worldView * vec4(normal, 0.0)).xyz;\r\n" +
    "}\r\n";

  BABYLON.Effect.ShadersStore["customFragmentShader"] =
    "\r\n"
    + "precision highp float;\r\n"
    + "varying vec3 vNormal;\r\n"
    + "void main(void) {\r\n"
    + "    gl_FragColor = vec4(vNormal*vec3(0.5,0.5,-0.5) + vec3(0.5), 1.0);\r\n"
    + "}\r\n";

  const shaderMaterial = new BABYLON.ShaderMaterial(
    "shader",
    scene,
    {
      vertex: "custom",
      fragment: "custom",
    },
    {
      attributes: ["position", "normal"],
      uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
    },
  );

  return shaderMaterial;
}

watch([loadMeshes, materialType], () => {
  if (loadMeshes.value.length > 0) {
    if (materialType.value === "white") {
      // materialManager.restoreOriginal()
      // materialManager.applyNewMaterial(getWhiteMaterial())
    } else {
      materialManager.applyNewMaterial(getFaxianMaterial())
    }

  }
}, { immediate: true });
</script>

<template>
  <div class="box">
    <canvas ref="canvasRef" class="canvas"></canvas>
    <button @click="materialType = 'normal'" class="btn-1">法线</button>
    <button @click="materialType = 'white'" class="btn-2">白膜</button>
  </div>

</template>

<style scoped>
.box {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.canvas {
  width: 100%;
  height: 100%;

  &:active {
    border: 1px solid transparent;
  }

  &:focus {
    outline: none;
  }
}

.btn-1 {
  margin: 10px;
  position: absolute;
  top: 0;
  left: 0;
}

.btn-2 {
  margin: 10px;
  position: absolute;
  top: 0;
  left: 100px;
}
</style>