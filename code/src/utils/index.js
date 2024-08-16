import * as THREE from 'three';
import { hurdleMinDistance } from '../configs/index';

/**
 * 生成新的跨栏模型并将其添加到场景中。
 *
 * @param {Object} oldModel - 要克隆的原始跨栏模型。
 * @param {Array} hurdleArr - 现有跨栏模型的数组。
 * @param {Object} scene - 要添加新跨栏模型的场景。
 * @return {undefined}
 */
export function generateHurdles(oldModel, hurdleArr, scene) {
    const newModel = oldModel.clone(); // 克隆原始跨栏模型

    const nextPosition =
        hurdleArr[hurdleArr.length - 1].position.x +
        hurdleMinDistance +
        Math.random() * hurdleMinDistance;

    newModel.position.set(nextPosition, 0, 0);
    hurdleArr.push(newModel);
    scene.add(newModel);
}

/**
 * 根据摄像机的位置更新轨道段。
 *
 * @param {Object} camera - 具有位置属性的摄像机对象。
 * @param {Array} trackArr - 具有位置属性的轨道段对象数组。
 * @param {Number} trackWidth - 每个轨道段的宽度。
 * @return {undefined}
 */
export function updateTrack(camera, trackArr, trackWidth) {
    const cameraPositionX = camera.position.x; // 相机的 x 坐标
    // 遍历所有跑道段
    for (let i = 0; i < trackArr.length; i++) {
        const trackSegment = trackArr[i];
        // 提前检测跑道段是否即将超出视野（增加一个提前量，比如半个跑道段的宽度）
        const threshold = cameraPositionX - trackWidth * 1.5;
        if (trackSegment.position.x < threshold) {
            // 找到当前最右边的跑道段
            let maxX = -Infinity;
            for (let j = 0; j < trackArr.length; j++) {
                if (trackArr[j].position.x > maxX) {
                    maxX = trackArr[j].position.x;
                }
            }
            // 将当前跑道段移动到最右边
            trackSegment.position.x = maxX + trackWidth;
        }
    }
}

/**
 * 根据当前动作和动画状态更新角色的位置。
 *
 * @param {Object} animationMixer - 动画混合器对象。
 * @param {Object} clock - 用于获取增量时间的时钟对象。
 * @param {Object} currentAction - 当前正在执行的动作。
 * @param {Object} action - 可用动作的集合。
 * @param {Object} characterGroup - 角色组对象。
 * @return {undefined}
 */
export function updateCharacterPosition(
    animationMixer,
    clock,
    currentAction,
    actions,
    characterGroup
) {
    // 更新动画混合器
    animationMixer.update(clock.getDelta());

    // 检查动画状态并调整位置
    if (currentAction === actions['jump']) {
        // 根据跳跃动画的时间调整人物位置
        const jumpHeight = 0.8; // 你可以调整这个值
        characterGroup.position.y =
            Math.sin(currentAction.time * Math.PI) * jumpHeight;
    } else {
        characterGroup.position.y = 0; // 恢复到地面位置
    }
}

/**
 * 检测角色是否与跨栏发生了碰撞。
 *
 * @param {Object} characterGroup - 角色组对象。
 * @param {Object} characterBoundingBox - 角色的边界框对象。
 * @param {Array} hurdlesBoundingBoxes - 跨栏的边界框数组。
 * @param {Array} hurdleArr - 跨栏对象数组。
 * @return {Boolean} 是否发生了碰撞。
 */
export function checkCollisions(
    characterGroup,
    characterBoundingBox,
    hurdlesBoundingBoxes,
    hurdleArr
) {
    // 更新人物的边界框
    if (characterGroup) {
        characterBoundingBox.setFromObject(characterGroup);
    }

    // 更新跨栏的边界框
    hurdlesBoundingBoxes = hurdleArr.map((hurdle) => {
        const box = new THREE.Box3();
        box.setFromObject(hurdle);
        return box;
    });

    for (let i = 0; i < hurdlesBoundingBoxes.length; i++) {
        if (characterBoundingBox.intersectsBox(hurdlesBoundingBoxes[i])) {
            return true; // 检测到碰撞
        }
    }
    return false; // 没有检测到碰撞
}
