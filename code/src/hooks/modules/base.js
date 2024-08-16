import * as THREE from 'three';

/**
 * 基础代码
 */
export default function () {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5); // 设置相机位置
    const renderer = new THREE.WebGLRenderer({
        antialias: true // 开启抗锯齿
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 加载背景纹理
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('./bg.jpeg', function (texture) {
        // 将纹理设置为场景背景
        scene.background = texture;
    });

    // 适配窗口
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight; // 重置摄像机视锥体的长宽比
        camera.updateProjectionMatrix(); // 更新摄像机投影矩阵
        renderer.setSize(window.innerWidth, window.innerHeight); // 重置画布大小
    });

    return {
        scene,
        camera,
        renderer
    };
}
