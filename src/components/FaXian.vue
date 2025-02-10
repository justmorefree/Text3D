<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
    Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, SceneLoader, StandardMaterial, Color3,
    DirectionalLight, PBRMaterial, PointLight, ShaderMaterial, Effect, BackgroundMaterial, Texture, MeshBuilder
} from '@babylonjs/core';
import '@babylonjs/loaders/OBJ';
import { OBJFileLoader } from "@babylonjs/loaders/OBJ/objFileLoader";

const canvasRef = ref<HTMLCanvasElement | null>(null);

defineOptions({
    name: 'FaXian'
})

onMounted(() => {
    if (!canvasRef.value) return;

    const engine = new Engine(canvasRef.value, true);
    const scene = new Scene(engine);


    OBJFileLoader.COMPUTE_NORMALS = true;


    // Camera setup
    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 4, 5, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.value, true);

    // Light setup
    const skylight = new HemisphericLight('skylight', new Vector3(-1, 1, 0), scene);
    skylight.diffuse = new Color3(0.2, 0.2, 0.2);

    const dirlight = new DirectionalLight('dirlight', new Vector3(0, -1, -2), scene);
    dirlight.diffuse = new Color3(1, 1, 1);
    //const light = new PointLight('light', new Vector3(3, 0, 0), scene);
    //light.intensity = 2;


    // 创建一个背景材质
    // var backgroundMaterial = new BackgroundMaterial("backgroundMaterial", scene);
    // backgroundMaterial.diffuseTexture = new Texture("./background.png", scene);

    // // 创建一个大的平面作为背景
    // var backgroundPlane = MeshBuilder.CreatePlane("backgroundPlane", { size: 100 }, scene);
    // backgroundPlane.material = backgroundMaterial;

    // // 将背景平面放置在相机后面
    // backgroundPlane.position.z = 0;




    SceneLoader.ImportMesh('', '/models/', 'render.obj', scene, function (meshes) {



        Effect.ShadersStore["customVertexShader"] =
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

        Effect.ShadersStore["customFragmentShader"] =
            "\r\n"
            + "precision highp float;\r\n"
            + "varying vec3 vNormal;\r\n"
            + "void main(void) {\r\n"
            + "    gl_FragColor = vec4(vNormal*vec3(0.5,0.5,-0.5) + vec3(0.5), 1.0);\r\n"
            + "}\r\n";

        const shaderMaterial = new ShaderMaterial(
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



        meshes.forEach(mesh => {
            mesh.material = shaderMaterial;
        });
    });

    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener('resize', () => {
        engine.resize();
    });
});
</script>

<template>
    <canvas ref="canvasRef" style="width: 100%; height: 100%;background-color: transparent;"></canvas>
</template>