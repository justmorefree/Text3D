<script setup lang="ts">
import { onMounted, ref, watch, markRaw } from 'vue';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/OBJ';
import { OBJFileLoader } from "@babylonjs/loaders/OBJ/objFileLoader";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { MaterialManager } from './MaterialManager';
registerBuiltInLoaders();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const loadMeshes = ref<BABYLON.Mesh[]>([]);
const materialType = ref<"texture" | "white" | "faxian">('texture');
let scene: BABYLON.Scene;
let pipeline: BABYLON.DefaultRenderingPipeline;
let materialManager: MaterialManager;

let skylight1: BABYLON.HemisphericLight;
let pointlight: BABYLON.PointLight;

onMounted(async () => {
  if (!canvasRef.value) return;

  OBJFileLoader.COMPUTE_NORMALS = true;

  const engine = new BABYLON.Engine(canvasRef.value, true);
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)
	
  // Environment Texture
  const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("studio_small_08_1k.env", scene);
  envTexture.level = 0.8;

  const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2, 4, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvasRef.value, true);
  camera.lowerRadiusLimit = 1.3;
  camera.upperRadiusLimit = 5;
  camera.minZ = 0.1;
  camera.maxZ = 100;

  skylight1 = new BABYLON.HemisphericLight('skylight', new BABYLON.Vector3(0, 1, 0), scene);
  skylight1.intensity = 1.0;
  skylight1.groundColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  skylight1.diffuse = new BABYLON.Color3(0.51, 0.81, 1.0);

  pointlight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(2, 0, 2), scene);
  pointlight.intensity = 5;
  pointlight.diffuse = new BABYLON.Color3(0.92, 0.577, 0.28);


  const sceneObj = await BABYLON.SceneLoader.AppendAsync('/models/case/img1.glb', null, scene);
  loadMeshes.value = sceneObj.meshes;


  // 加载模型后，对材质特殊设置
  sceneObj.meshes.forEach((mesh: any) => {
    if (!mesh.material) return;

    if (!mesh.material.albedoTexture) {
      mesh.material.albedoColor = new BABYLON.Color3(0.95, 0.95, 0.95); // 设置基础颜色
    }

    if (!mesh.material.metallicTexture) {
      mesh.material.metallic = 0.3; // 设置金属度
      if (mesh.material.useRoughnessFromMetallicTextureGreen || mesh.material.useRoughnessFromMetallicTextureAlpha)
        mesh.material.roughness = 0.5; // 设置粗糙度
    }

    mesh.material.reflectionTexture = envTexture;
  });

  // 初始化材质管理类
  materialManager = new MaterialManager(sceneObj.meshes)


  // 3. 添加后处理效果
  pipeline = new BABYLON.DefaultRenderingPipeline(
    "defaultPipeline",
    true,
    scene,
    [camera]
  );
  
  pipeline.bloomEnabled = false;
  pipeline.chromaticAberrationEnabled = false;
  pipeline.depthOfFieldEnabled = false;
  pipeline.fxaaEnabled = false;
  pipeline.grainEnabled = false;
  pipeline.sharpenEnabled = false;
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.contrast = 1.8;
  pipeline.imageProcessing.colorCurvesEnabled = false;
  pipeline.imageProcessing.colorGradingEnabled = false;
  pipeline.imageProcessing.toneMappingEnabled = false;
  pipeline.imageProcessing.ditheringEnabled = false;
  pipeline.imageProcessing.vignetteEnabled = false;
  pipeline.samples = 4;

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});


const getWhiteMaterial = () => {
  if (!scene) throw new Error('Scene not initialized');
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
    if (materialType.value === "texture") {
      materialManager.restoreOriginal()
      pipeline.imageProcessingEnabled = true;
    } else if (materialType.value === "faxian") {
      pipeline.imageProcessingEnabled = false;
      materialManager.applyNewMaterial(getFaxianMaterial())
    } else {
      //白膜亮度
      skylight1.intensity = 1.8;
      pointlight.intensity = 1.8;
      materialManager.applyNewMaterial(getWhiteMaterial())
    }

  }
}, { immediate: true });
</script>

<template>
  <div class="box">
    <canvas ref="canvasRef" class="canvas"></canvas>
    <button @click="materialType = 'faxian'" class="btn-1">法线</button>
    <button @click="materialType = 'white'" class="btn-2">白膜</button>
    <button @click="materialType = 'texture'" class="btn-3">纹理</button>
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
  background: #333;
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

.btn-3 {
  margin: 10px;
  position: absolute;
  top: 0;
  left: 200px;
}
</style>