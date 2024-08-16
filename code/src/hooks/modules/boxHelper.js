import * as THREE from 'three';

/**
 * 线框盒子
 */
export default function (object, scene) {
    const boxHelper = new THREE.BoxHelper(object, 0xff0000);
    scene.add(boxHelper);

    return boxHelper;
}
