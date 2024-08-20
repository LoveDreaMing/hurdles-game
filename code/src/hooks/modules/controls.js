import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * 控制器
*/
export default function (camera, renderer) {
    const orbitControls = new OrbitControls(camera, renderer.domElement); // 轨道控制器
    orbitControls.enabled = false; // 禁用控制器
    orbitControls.update(); // 更新控制器
}