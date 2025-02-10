<template>
    <div class="container">
        <canvas class="canvas" ref="canvasRef"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as Babylon from '@babylonjs/core';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let engine: Babylon.Engine | null;

defineOptions({
    name: 'Demo',
});

onMounted(() => {
    engine = new Babylon.Engine(canvasRef.value, true);
    startRender();
});

const createScene = () => {

    const scene = new Babylon.Scene(engine);
    const camera = new Babylon.FreeCamera('camera', new Babylon.Vector3(0, 5, -10), scene);
    camera.setTarget(Babylon.Vector3.Zero());
    camera.attachControl(canvasRef.value, true);

    const light = new Babylon.HemisphericLight('light', new Babylon.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const box = Babylon.MeshBuilder.CreateBox('box', { size: 2 }, scene);
    box.position.y = 1;

    const material = new Babylon.StandardMaterial('material', scene);
    material.diffuseColor = new Babylon.Color3(0, 1, 0);
    box.material = material;

    return scene;
};

const startRender = () => {

    const scene = createScene();
    engine.runRenderLoop(() => {
        scene.render();
    });
};

</script>

<style scoped>
.container {
    width: 100%;
    height: 100vh;
}

.canvas {
    width: 100%;
    height: 100%;
    touch-action: none;
}
</style>
