<template>
  <div class="game-container">
    <div class="game-header">
      <div class="stats">
        <div class="score">得分: {{ score }}</div>
        <div class="lives">生命: {{ lives }}</div>
      </div>
      <div class="controls">
        <button @click="togglePause" class="control-btn">
          {{ isPaused ? '继续' : '暂停' }}
        </button>
        <button @click="resetGame" class="control-btn">重新开始</button>
      </div>
    </div>

    <div class="game-canvas" ref="gameCanvasRef" @click="handleCanvasClick">
      <!-- 背景 -->
      <div class="background"></div>

      <!-- 玩家飞机 -->
      <div
        class="player-plane"
        :style="{ left: player.x + 'px', top: player.y + 'px' }"
      >
        <div class="plane-body">
          <div class="wing"></div>
          <div class="body"></div>
          <div class="tail"></div>
        </div>
      </div>

      <!-- 子弹 -->
      <div
        v-for="bullet in bullets"
        :key="bullet.id"
        class="bullet"
        :style="{ left: bullet.x + 'px', top: bullet.y + 'px' }"
      ></div>

      <!-- 敌人 -->
      <div
        v-for="enemy in enemies"
        :key="enemy.id"
        class="enemy-plane"
        :style="{ left: enemy.x + 'px', top: enemy.y + 'px' }"
      >
        <div class="enemy-body">
          <div class="enemy-wing"></div>
          <div class="enemy-main"></div>
          <div class="enemy-tail"></div>
        </div>
      </div>

      <!-- 爆炸效果 -->
      <div
        v-for="explosion in explosions"
        :key="explosion.id"
        class="explosion"
        :style="{ left: explosion.x + 'px', top: explosion.y + 'px' }"
      >
        <div class="explosion-circle"></div>
      </div>

      <!-- 游戏状态消息 -->
      <div v-if="gameStatus !== 'playing'" class="game-status">
        <div v-if="gameStatus === 'start'" class="start-screen">
          <h2>纸飞机大战</h2>
          <p>使用方向键移动，空格键射击</p>
          <button @click="startGame" class="start-btn">开始游戏</button>
        </div>
        <div v-if="gameStatus === 'paused'" class="pause-screen">
          <h2>游戏暂停</h2>
          <button @click="togglePause" class="resume-btn">继续游戏</button>
        </div>
        <div v-if="gameStatus === 'over'" class="game-over-screen">
          <h2>游戏结束</h2>
          <p>最终得分: {{ score }}</p>
          <button @click="resetGame" class="restart-btn">重新开始</button>
        </div>
      </div>
    </div>

    <div class="instructions">
      <h3>游戏说明</h3>
      <ul>
        <li>使用 <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> 控制纸飞机移动</li>
        <li>按 <kbd>空格键</kbd> 发射子弹</li>
        <li>躲避敌机，击毁敌机获得分数</li>
        <li>被敌机撞到会失去生命值</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';

// 游戏状态
const gameStatus = ref<'start' | 'playing' | 'paused' | 'over'>('start');
const isPaused = ref(false);
const score = ref(0);
const lives = ref(3);

// 游戏画布引用
const gameCanvasRef = ref<HTMLDivElement | null>(null);

// 玩家飞机
const player = reactive({
  x: 250,
  y: 500,
  width: 40,
  height: 40,
  speed: 5
});

// 子弹数组
const bullets = ref<Array<{ id: number; x: number; y: number; speed: number }>>([]);
let bulletIdCounter = 0;

// 敌人数组
const enemies = ref<Array<{ id: number; x: number; y: number; speed: number; health: number }>>([]);
let enemyIdCounter = 0;

// 爆炸效果数组
const explosions = ref<Array<{ id: number; x: number; y: number; time: number }>>([]);
let explosionIdCounter = 0;

// 游戏循环ID
let gameLoopId: number | null = null;

// 键盘按键状态
const keys = reactive({
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  Space: false
});

// 开始游戏
const startGame = () => {
  gameStatus.value = 'playing';
  resetGame();
};

// 暂停/继续游戏
const togglePause = () => {
  if (gameStatus.value === 'playing') {
    isPaused.value = !isPaused.value;
  }
};

// 处理画布点击（用于移动焦点到游戏区域）
const handleCanvasClick = () => {
  if (gameCanvasRef.value) {
    gameCanvasRef.value.focus();
  }
};

// 发射子弹
const shootBullet = () => {
  bullets.value.push({
    id: ++bulletIdCounter,
    x: player.x + player.width / 2 - 2,
    y: player.y,
    speed: 7
  });
};
let enemySpawnTimer: number | null = null;
// 生成敌人
// 生成敌人
const spawnEnemy = () => {
  if (gameStatus.value !== 'playing' || isPaused.value) return;

  const canvasWidth = gameCanvasRef.value?.clientWidth || 500;
  const x = Math.random() * (canvasWidth - 40);

  enemies.value.push({
    id: ++enemyIdCounter,
    x,
    y: -40,
    speed: 2 + Math.random() * 2,
    health: 1
  });

  // 设置下次生成敌人的时间
  const nextSpawnTime = 500 + Math.random() * 1000;
  enemySpawnTimer = window.setTimeout(spawnEnemy, nextSpawnTime);
};

// 重置游戏
const resetGame = () => {
  // 重置游戏状态
  score.value = 0;
  lives.value = 3;
  gameStatus.value = 'playing';
  isPaused.value = false;

  // 重置玩家位置
  player.x = 250;
  player.y = 500;

  // 清空数组
  bullets.value = [];
  enemies.value = [];
  explosions.value = [];

  // 清除之前的定时器
  if (enemySpawnTimer) {
    clearTimeout(enemySpawnTimer);
    enemySpawnTimer = null;
  }

  // 启动游戏循环
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
  }
  gameLoopId = requestAnimationFrame(gameLoop);

  // 开始生成敌人
  enemySpawnTimer = window.setTimeout(spawnEnemy, 1000);
};

// 检测碰撞
const checkCollisions = () => {
  // 检测子弹与敌人的碰撞
  for (let i = bullets.value.length - 1; i >= 0; i--) {
    const bullet = bullets.value[i];

    for (let j = enemies.value.length - 1; j >= 0; j--) {
      const enemy = enemies.value[j];

      // 简单的矩形碰撞检测
      if (
        bullet.x < enemy.x + 40 &&
        bullet.x + 4 > enemy.x &&
        bullet.y < enemy.y + 40 &&
        bullet.y + 10 > enemy.y
      ) {
        // 移除子弹和敌人
        bullets.value.splice(i, 1);
        enemies.value.splice(j, 1);

        // 增加分数
        score.value += 10;

        // 创建爆炸效果
        createExplosion(enemy.x + 20, enemy.y + 20);

        break; // 退出内层循环
      }
    }
  }

  // 检测玩家与敌人的碰撞
  for (let i = enemies.value.length - 1; i >= 0; i--) {
    const enemy = enemies.value[i];

    if (
      player.x < enemy.x + 40 &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + 40 &&
      player.y + player.height > enemy.y
    ) {
      // 玩家被击中
      lives.value--;
      enemies.value.splice(i, 1);

      // 创建爆炸效果
      createExplosion(player.x + player.width / 2, player.y + player.height / 2);

      // 检查游戏是否结束
      if (lives.value <= 0) {
        gameStatus.value = 'over';
      }
    }
  }
};

// 创建爆炸效果
const createExplosion = (x: number, y: number) => {
  explosions.value.push({
    id: ++explosionIdCounter,
    x: x - 25,
    y: y - 25,
    time: 15 // 爆炸持续帧数
  });
};

// 游戏主循环
const gameLoop = () => {
  if (gameStatus.value !== 'playing' || isPaused.value) {
    gameLoopId = requestAnimationFrame(gameLoop);
    return;
  }

  // 处理玩家移动
  if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
  if (keys.ArrowRight && player.x < (gameCanvasRef.value?.clientWidth || 500) - player.width) player.x += player.speed;
  if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
  if (keys.ArrowDown && player.y < (gameCanvasRef.value?.clientHeight || 600) - player.height) player.y += player.speed;

  // 处理子弹移动
  for (let i = bullets.value.length - 1; i >= 0; i--) {
    const bullet = bullets.value[i];
    bullet.y -= bullet.speed;

    // 移除超出屏幕的子弹
    if (bullet.y < 0) {
      bullets.value.splice(i, 1);
    }
  }

  // 处理敌人移动
  for (let i = enemies.value.length - 1; i >= 0; i--) {
    const enemy = enemies.value[i];
    enemy.y += enemy.speed;

    // 移除超出屏幕的敌人
    if (enemy.y > (gameCanvasRef.value?.clientHeight || 600)) {
      enemies.value.splice(i, 1);
    }
  }

  // 处理爆炸效果
  for (let i = explosions.value.length - 1; i >= 0; i--) {
    const explosion = explosions.value[i];
    explosion.time--;

    if (explosion.time <= 0) {
      explosions.value.splice(i, 1);
    }
  }

  // 检测碰撞
  checkCollisions();

  // 继续游戏循环
  gameLoopId = requestAnimationFrame(gameLoop);
};

// 键盘按下事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
  if (e.key === 'ArrowRight') keys.ArrowRight = true;
  if (e.key === 'ArrowUp') keys.ArrowUp = true;
  if (e.key === 'ArrowDown') keys.ArrowDown = true;
  if (e.key === ' ') {
    e.preventDefault(); // 防止空格键滚动页面
    keys.Space = true;
    if (gameStatus.value === 'playing' && !isPaused.value) {
      shootBullet();
    }
  }
};

// 键盘释放事件
const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
  if (e.key === 'ArrowRight') keys.ArrowRight = false;
  if (e.key === 'ArrowUp') keys.ArrowUp = false;
  if (e.key === 'ArrowDown') keys.ArrowDown = false;
  if (e.key === ' ') keys.Space = false;
};

// 组件挂载时启动游戏
onMounted(() => {
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // 设置画布点击事件
  if (gameCanvasRef.value) {
    gameCanvasRef.value.tabIndex = 0; // 使元素可获得焦点
    gameCanvasRef.value.focus();
  }

  // 开始生成敌人
  setTimeout(spawnEnemy, 1000);
});

// 组件卸载时清理
onUnmounted(() => {
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);

  // 取消动画帧
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
  }
  // 清除敌人生成定时器
  if (enemySpawnTimer) {
    clearTimeout(enemySpawnTimer);
  }
});

</script>

<style scoped>
.game-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  background: #f0f8ff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background: #4a90e2;
  border-radius: 8px;
  color: white;
}

.stats {
  display: flex;
  gap: 20px;
}

.score, .lives {
  font-size: 18px;
  font-weight: bold;
}

.controls {
  display: flex;
  gap: 10px;
}

.control-btn {
  padding: 8px 16px;
  background: #fff;
  color: #4a90e2;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.control-btn:hover {
  background: #e6f0ff;
}

.game-canvas {
  position: relative;
  width: 100%;
  height: 600px;
  background: linear-gradient(to bottom, #87CEEB, #E0F7FA);
  border: 2px solid #4a90e2;
  border-radius: 8px;
  overflow: hidden;
  outline: none;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 2px, transparent 2px),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 2px, transparent 2px),
    radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 2px, transparent 2px);
  background-size: 100px 100px;
  animation: float 20s infinite linear;
}

@keyframes float {
  0% { background-position: 0 0; }
  100% { background-position: 100px 100px; }
}

.player-plane {
  position: absolute;
  width: 40px;
  height: 40px;
  transition: transform 0.1s;
}

.plane-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.wing {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 30px;
  height: 8px;
  background: #4a90e2;
  border-radius: 4px;
  box-shadow: 0 0 5px rgba(74, 144, 226, 0.7);
}

.body {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 30px;
  background: #357abd;
  border-radius: 5px;
}

.tail {
  position: absolute;
  top: 80%;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 20px;
  height: 6px;
  background: #357abd;
  border-radius: 3px;
}

.bullet {
  position: absolute;
  width: 4px;
  height: 10px;
  background: #ff6b6b;
  border-radius: 2px;
  box-shadow: 0 0 5px #ff6b6b;
}

.enemy-plane {
  position: absolute;
  width: 40px;
  height: 40px;
}

.enemy-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.enemy-wing {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  width: 30px;
  height: 8px;
  background: #e74c3c;
  border-radius: 4px;
}

.enemy-main {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 30px;
  background: #c0392b;
  border-radius: 5px;
}

.enemy-tail {
  position: absolute;
  top: 80%;
  left: 50%;
  transform: translateX(-50%) rotate(-45deg);
  width: 20px;
  height: 6px;
  background: #c0392b;
  border-radius: 3px;
}

.explosion {
  position: absolute;
  width: 50px;
  height: 50px;
  pointer-events: none;
}

.explosion-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, #ff9800 0%, #ff5722 70%, transparent 100%);
  animation: explode 0.3s forwards;
}

@keyframes explode {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

.game-status {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 100;
  flex-direction: column;
}

.start-screen, .pause-screen, .game-over-screen {
  text-align: center;
  padding: 30px;
  background: rgba(74, 144, 226, 0.9);
  border-radius: 10px;
  max-width: 80%;
}

.start-screen h2, .pause-screen h2, .game-over-screen h2 {
  margin-top: 0;
  color: white;
}

.start-btn, .resume-btn, .restart-btn {
  padding: 12px 24px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.3s;
}

.start-btn:hover, .resume-btn:hover, .restart-btn:hover {
  background: #27ae60;
}

.instructions {
  margin-top: 20px;
  padding: 15px;
  background: #e3f2fd;
  border-radius: 8px;
}

.instructions h3 {
  margin-top: 0;
  color: #1976d2;
}

.instructions ul {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
}

kbd {
  display: inline-block;
  padding: 3px 6px;
  font-size: 12px;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  font-family: monospace;
}
</style>
