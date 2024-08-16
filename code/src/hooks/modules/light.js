import * as THREE from 'three';

/**
 * 灯光
 */
export default function (scene) {
    const ambientLight = new THREE.AmbientLight(0x404040, 20); // 环境光
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 5); // 平行光
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 5); // 平行光
    directionalLight2.position.set(0, -10, -5);
    scene.add(directionalLight2);
}
