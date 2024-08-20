import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
    trackNum, // 初始跑道数量
    hurdleInterval, // 跨栏之间的间隔帧数
    moveSpeed // 人物移动的速度
} from '../configs/index';
import base from './modules/base'; // 基础代码
import controls from './modules/controls'; // 控制器
import light from './modules/light'; // 灯光
import {
    generateHurdles, // 生成跨栏
    updateTrack, // 更新跑道
    updateCharacterPosition, // 更新人物位置
    checkCollisions // 碰撞检测
} from '../utils/index';
import { Modal } from 'ant-design-vue';

export default function () {
    // 基础代码
    const { scene, camera, renderer } = base();

    // 控制器
    controls(camera, renderer);

    // 灯光
    light(scene);

    // 全局对象
    const global = {
        characterGroup: new THREE.Group(), // 人物组，用于控制人物朝向和位置
        hurdleGroup: new THREE.Group(), // 跨栏组，用于控制跨栏位置
        trackGroup: new THREE.Group(), // 跑道组，用于控制跑道位置
        animationMixer: null, // 动画混合器
        actions: {}, // 人物动作集合 idle: 待机、running: 跑步、jump: 跳跃、death: 死亡
        currentAction: null, // 当前动作
        previousAction: null, // 前一个动作
        trackWidth: 0, // 跑道宽度
        trackArr: [], // 跑道数组
        hurdleArr: [], // 跨栏数组
        hurdleCountFrame: 0, // 跨栏计算帧数
        isDeath: false, // 是否死亡
        characterBoundingBox: new THREE.Box3(), // 人物包围盒
        hurdlesBoundingBoxes: [], // 跨栏包围盒数组
        clock: new THREE.Clock(), // 用于计算动画时间
        frame: null // 帧动画id
    };

    // 加载人物模型
    const loader = new GLTFLoader();
    loader.load('./models/group.glb', function (gltf) {
        const children = [...gltf.scene.children];

        // 初始化人物模型
        global.characterGroup.add(children[0]);
        global.characterGroup.rotation.set(0, Math.PI / 2, 0); // 改变人物朝向
        scene.add(global.characterGroup);

        // 初始化跨栏模型
        global.hurdleGroup.add(children[1]);
        global.hurdleGroup.scale.set(0.7, 0.7, 0.7); // 缩小跨栏
        global.hurdleGroup.rotation.set(0, Math.PI / 2, 0); // 改变跨栏朝向
        global.hurdleGroup.position.set(3, 0, 0); // 设置第一个跨栏位置
        global.hurdleArr.push(global.hurdleGroup); // 添加第一个跨栏触发碰撞检测
        scene.add(global.hurdleGroup);

        // 初始化跑道模型
        global.trackGroup.add(children[2]);
        global.trackGroup.rotation.set(0, Math.PI / 2, 0); // 改变跑道朝向
        scene.add(global.trackGroup);

        // 获取跑道宽度
        const boundingBox = new THREE.Box3().setFromObject(global.trackGroup); // 创建包围盒
        const size = new THREE.Vector3(); // 计算包围盒的尺寸
        boundingBox.getSize(size);
        global.trackWidth = size.x - 2; // 跑道宽度不是特别准确，需要模糊计算
        // 默认使用trackNum个跑道拼接
        for (let i = 0; i < trackNum; i++) {
            const newTrackModel = global.trackGroup.clone(); // 克隆原始跑道模型
            newTrackModel.position.x = i * global.trackWidth; // 按照宽度依次排列
            scene.add(newTrackModel);
            global.trackArr.push(newTrackModel); // 保存引用
        }

        // 创建动画混合器
        global.animationMixer = new THREE.AnimationMixer(global.characterGroup);

        // 将每个动画剪辑存储在actions对象中
        gltf.animations.forEach((clip) => {
            global.actions[clip.name] = global.animationMixer.clipAction(clip);
        });

        // 播放默认的 idle 动作
        global.currentAction = global.actions['idle'];
        global.currentAction.play();

        // 开始循环渲染
        animate();
    });

    function animate() {
        global.frame = requestAnimationFrame(animate); // 开启帧循环

        global.animationMixer.update(global.clock.getDelta()); // 更新动画混合器

        // 检查 jump 动作是否完成，并恢复到 running 动作
        if (
            global.currentAction === global.actions['jump'] &&
            global.currentAction.time >= global.currentAction.getClip().duration
        ) {
            switchAction('running', 0.3);
        }

        // 当处于 running 动作时，移动相机
        if (
            global.currentAction === global.actions['running'] ||
            global.currentAction === global.actions['jump']
        ) {
            global.characterGroup.position.x += moveSpeed;
            camera.position.x = global.characterGroup.position.x;

            // 间隔随机帧数生成跨栏
            if (
                global.hurdleCountFrame++ >
                hurdleInterval + Math.random() * hurdleInterval
            ) {
                generateHurdles(global.hurdleGroup, global.hurdleArr, scene); // 生成跨栏
                global.hurdleCountFrame = 0;
            }
        }

        // 更新跑道位置
        updateTrack(camera, global.trackArr, global.trackWidth);

        // 当人物处于跳跃动作时，更新人物位置
        updateCharacterPosition(
            global.animationMixer,
            global.clock,
            global.currentAction,
            global.actions,
            global.characterGroup
        );

        // 碰撞检测
        if (
            checkCollisions(
                global.characterGroup,
                global.characterBoundingBox,
                global.hurdlesBoundingBoxes,
                global.hurdleArr
            )
        ) {
            switchAction('death');
            global.isDeath = true;
        }

        // 如果 death 动作完成了，则停止帧动画
        if (
            global.currentAction === global.actions['death'] &&
            !global.currentAction.isRunning()
        ) {
            Modal.error({
                title: 'Game Over',
                width: 300
            });
            cancelAnimationFrame(global.frame);
        }

        // 渲染场景
        renderer.render(scene, camera);
    }

    // 切换动作函数
    function switchAction(newActionName, fadeDuration = 0.5) {
        const newAction = global.actions[newActionName];
        if (newAction && global.currentAction !== newAction) {
            global.previousAction = global.currentAction; // 保留当前的动作
            // 淡出前一个动作
            if (global.previousAction) {
                global.previousAction.fadeOut(fadeDuration);
            }

            // 如果切换到 jump 动作，设置播放一次并在结束后停止
            if (newActionName === 'jump') {
                newAction.loop = THREE.LoopOnce;
                newAction.clampWhenFinished = true; // 停止在最后一帧
            }

            // 如果切换到 death 动作，设置播放一次并在结束后停止
            if (newActionName === 'death') {
                newAction.loop = THREE.LoopOnce;
                newAction.clampWhenFinished = true; // 停止在最后一帧
            }
            global.currentAction = newAction; // 设置新的活动动作

            // 复位并淡入新动作
            global.currentAction.reset();
            global.currentAction.setEffectiveTimeScale(1);
            global.currentAction.setEffectiveWeight(1);
            global.currentAction.fadeIn(fadeDuration).play();
        }
    }

    // 键盘事件监听
    window.addEventListener('keydown', (event) => {
        if (global.isDeath) {
            return;
        }
        switch (event.code) {
            case 'keyD':
            case 'ArrowRight':
                switchAction('running');
                break;
            case 'keyA':
            case 'ArrowLeft':
                switchAction('idle');
                break;
            case 'keyW':
            case 'ArrowUp':
                switchAction('jump');
                break;
        }
    });
}
