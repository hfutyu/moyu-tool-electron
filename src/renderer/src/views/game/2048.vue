<template>
  <div class="game-container">
    <div class="game-header">
      <h1>🎮 2048</h1>
      <div class="score-container">
        <div class="score-box">
          <div class="score-title">分数</div>
          <div class="score">{{ score }}</div>
        </div>
        <button class="new-game-btn" @click="newGame">新游戏</button>
      </div>
    </div>

    <div class="game-intro">
      <p>使用方向键移动方块，相同数字相加！</p>
    </div>

    <div class="game-board" :class="{ 'game-over': gameOver, 'game-won': won }">
      <!-- 使用单一网格布局容器 -->
      <div class="grid-container">
        <!-- 背景网格 -->
        <div
          v-for="row in 4"
          :key="`bg-row-${row}`"
          class="grid-row"
        >
          <div
            v-for="col in 4"
            :key="`bg-col-${col}`"
            class="grid-cell"
          ></div>
        </div>

        <!-- 方块层 -->
        <div
          v-for="tile in tiles"
          :key="tile.id"
          class="tile"
          :class="`tile-${tile.value}`"
          :style="getTileStyle(tile)"
        >
          <div class="tile-inner">
            <span>{{ tile.value }}</span>
          </div>
        </div>
      </div>

      <!-- 游戏消息层 -->
      <div v-if="gameOver" class="game-message game-over-message">
        <p>游戏结束!</p>
        <button @click="newGame">重新开始</button>
      </div>

      <div v-if="won" class="game-message game-won-message">
        <p>恭喜你达到了2048!</p>
        <button @click="keepPlaying">继续游戏</button>
      </div>
    </div>

    <div class="instructions">
      <h3>游戏规则</h3>
      <ul>
        <li>使用键盘方向键 <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> 移动方块</li>
        <li>相同数字的方块碰撞时会合并成一个方块</li>
        <li>不断合并方块，努力获得2048方块！</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 游戏状态
const score = ref(0);
const gameOver = ref(false);
const won = ref(false);

// 方块数组
interface Tile {
  id: number;
  row: number;
  col: number;
  value: number;
}

const tiles = ref<Tile[]>([]);
let nextId = 1;

// 初始化游戏
const initializeGame = () => {
  tiles.value = [];
  score.value = 0;
  gameOver.value = false;
  won.value = false;

  // 添加两个初始方块
  addRandomTile();
  addRandomTile();
};

// 添加随机方块
const addRandomTile = () => {
  if (getEmptyCells().length === 0) return;

  // 随机选择一个空格子
  const emptyCells = getEmptyCells();
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  // 随机值 (90%概率是2, 10%概率是4)
  const value = Math.random() < 0.9 ? 2 : 4;

  tiles.value.push({
    id: nextId++,
    row: randomCell.row,
    col: randomCell.col,
    value: value
  });
};

// 获取空格子
const getEmptyCells = () => {
  const cells:any = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (!tiles.value.some(tile => tile.row === row && tile.col === col)) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
};

// 新游戏
const newGame = () => {
  initializeGame();
};

// 继续游戏
const keepPlaying = () => {
  won.value = false;
};

// 移动逻辑
const move = (direction: 'up' | 'down' | 'left' | 'right') => {
  if (gameOver.value) return;

  // 保存移动前的状态
  const prevState = JSON.parse(JSON.stringify(tiles.value));

  // 执行移动
  switch (direction) {
    case 'up':
      moveUp();
      break;
    case 'down':
      moveDown();
      break;
    case 'left':
      moveLeft();
      break;
    case 'right':
      moveRight();
      break;
  }

  // 检查是否有变化
  const hasChanged = JSON.stringify(prevState) !== JSON.stringify(tiles.value);

  if (hasChanged) {
    // 添加新的随机方块
    addRandomTile();

    // 检查游戏状态
    checkGameState();
  }
};

// 向上移动
const moveUp = () => {
  for (let col = 0; col < 4; col++) {
    const column = tiles.value.filter(tile => tile.col === col).sort((a, b) => a.row - b.row);
    const processedColumn = processLine([...column]);
    updateTilesPosition(processedColumn, col, 'row');
  }
};

// 向下移动
const moveDown = () => {
  for (let col = 0; col < 4; col++) {
    const column = tiles.value.filter(tile => tile.col === col).sort((a, b) => b.row - a.row);
    const processedColumn = processLine([...column]);
    updateTilesPosition(processedColumn, col, 'row', true);
  }
};

// 向左移动
const moveLeft = () => {
  for (let row = 0; row < 4; row++) {
    const rowTiles = tiles.value.filter(tile => tile.row === row).sort((a, b) => a.col - b.col);
    const processedRow = processLine([...rowTiles]);
    updateTilesPosition(processedRow, row, 'col');
  }
};

// 向右移动
const moveRight = () => {
  for (let row = 0; row < 4; row++) {
    const rowTiles = tiles.value.filter(tile => tile.row === row).sort((a, b) => b.col - a.col);
    const processedRow = processLine([...rowTiles]);
    updateTilesPosition(processedRow, row, 'col');
  }
};

// 处理一行/列的移动
const processLine = (line: Tile[]): Tile[] => {
  // 移除空位
  const nonEmpty = line.filter(tile => tile.value !== 0);

  // 合并相同数值
  const merged: Tile[] = [];
  let skipNext = false;

  for (let i = 0; i < nonEmpty.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    if (i < nonEmpty.length - 1 && nonEmpty[i].value === nonEmpty[i + 1].value) {
      // 合并
      const newValue = nonEmpty[i].value * 2;
      score.value += newValue;

      // 检查是否达到2048
      if (newValue === 2048 && !won.value) {
        won.value = true;
      }

      merged.push({
        ...nonEmpty[i],
        value: newValue
      });
      skipNext = true;
    } else {
      merged.push({...nonEmpty[i]});
    }
  }

  // 填充空位
  while (merged.length < 4) {
    merged.push({ id: -1, row: -1, col: -1, value: 0 });
  }

  return merged;
};

// 更新方块位置
const updateTilesPosition = (
  line: Tile[],
  fixedIndex: number,
  variableKey: 'row' | 'col',
  reverse = false
) => {
  const validTiles = line.filter(tile => tile.value !== 0);

  // 清除当前行/列的所有方块
  tiles.value = tiles.value.filter(tile => {
    if (variableKey === 'row') {
      return tile.col !== fixedIndex;
    } else {
      return tile.row !== fixedIndex;
    }
  });

  // 重新添加处理后的方块
  for (let i = 0; i < validTiles.length; i++) {
    const newIndex = reverse ? 3 - i : i;
    tiles.value.push({
      ...validTiles[i],
      [variableKey]: newIndex
    });
  }
};

// 检查游戏状态
const checkGameState = () => {
  // 检查是否还有空格
  if (getEmptyCells().length === 0) {
    // 检查是否还能移动
    if (!canMove()) {
      gameOver.value = true;
    }
  }
};

// 检查是否还能移动
const canMove = (): boolean => {
  // 检查水平方向
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const current = tiles.value.find(tile => tile.row === row && tile.col === col)?.value || 0;
      const next = tiles.value.find(tile => tile.row === row && tile.col === col + 1)?.value || 0;
      if (current === next && current !== 0) {
        return true;
      }
    }
  }

  // 检查垂直方向
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) {
      const current = tiles.value.find(tile => tile.row === row && tile.col === col)?.value || 0;
      const next = tiles.value.find(tile => tile.row === row + 1 && tile.col === col)?.value || 0;
      if (current === next && current !== 0) {
        return true;
      }
    }
  }

  return false;
};

// 获取方块样式 - 使用CSS Grid定位
const getTileStyle = (tile: { row: number; col: number }) => {
  return {
    gridRow: tile.row + 1,
    gridColumn: tile.col + 1
  };
};

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      move('up');
      break;
    case 'ArrowDown':
      e.preventDefault();
      move('down');
      break;
    case 'ArrowLeft':
      e.preventDefault();
      move('left');
      break;
    case 'ArrowRight':
      e.preventDefault();
      move('right');
      break;
  }
};

// 初始化游戏
onMounted(() => {
  initializeGame();
  window.addEventListener('keydown', handleKeyDown);

  // 监听窗口大小变化重新计算位置
  window.addEventListener('resize', () => {
    // 触发视图更新
    setTimeout(() => {}, 100);
  });
});

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.game-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  box-sizing: border-box;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.game-header h1 {
  font-size: 60px;
  color: #776e65;
  margin: 0;
}

.score-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.score-box {
  text-align: center;
  background: #bbada0;
  padding: 10px 20px;
  border-radius: 6px;
  color: white;
  min-width: 100px;
}

.score-title {
  font-size: 14px;
  margin-bottom: 5px;
}

.score {
  font-size: 24px;
  font-weight: bold;
}

.new-game-btn {
  background: #8f7a66;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.new-game-btn:hover {
  background: #7c6b5a;
}

.game-intro p {
  color: #776e65;
  font-size: 18px;
  margin: 0 0 20px;
  text-align: center;
}

.game-board {
  position: relative;
  background: #bbada0;
  border-radius: 10px;
  padding: 15px;
  width: 100%;
  max-width: 465px;
  height: 465px;
  margin: 0 auto 30px;
  box-sizing: border-box;
  aspect-ratio: 1/1;
}

.grid-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 15px;
  padding: 0;
  box-sizing: border-box;
}

.grid-row {
  display: contents; /* 使内部元素成为网格项目 */
}

.grid-cell {
  background: rgba(238, 228, 218, 0.35);
  border-radius: 6px;
  width: 100%;
  height: 100%;
}

.tile {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  transition: all 0.15s ease-in-out;
  z-index: 10;
}

.tile-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-weight: bold;
  font-size: 32px;
  border-radius: 6px;
}

/* 方块颜色 */
.tile-2 .tile-inner { background: #eee4da; color: #776e65; }
.tile-4 .tile-inner { background: #ede0c8; color: #776e65; }
.tile-8 .tile-inner { background: #f2b179; color: #f9f6f2; }
.tile-16 .tile-inner { background: #f59563; color: #f9f6f2; }
.tile-32 .tile-inner { background: #f67c5f; color: #f9f6f2; }
.tile-64 .tile-inner { background: #f65e3b; color: #f9f6f2; }
.tile-128 .tile-inner {
  background: #edcf72;
  color: #f9f6f2;
  font-size: 28px;
  box-shadow: 0 0 10px rgba(243, 215, 116, 0.5);
}
.tile-256 .tile-inner {
  background: #edcc61;
  color: #f9f6f2;
  font-size: 28px;
  box-shadow: 0 0 10px rgba(243, 215, 116, 0.5);
}
.tile-512 .tile-inner {
  background: #edc850;
  color: #f9f6f2;
  font-size: 28px;
  box-shadow: 0 0 10px rgba(243, 215, 116, 0.5);
}
.tile-1024 .tile-inner {
  background: #edc53f;
  color: #f9f6f2;
  font-size: 24px;
  box-shadow: 0 0 10px rgba(243, 215, 116, 0.5);
}
.tile-2048 .tile-inner {
  background: #edc22e;
  color: #f9f6f2;
  font-size: 24px;
  box-shadow: 0 0 10px rgba(243, 215, 116, 0.5);
}

.game-message {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  z-index: 100;
  text-align: center;
}

.game-over-message {
  color: #776e65;
}

.game-won-message {
  color: #776e65;
}

.game-message button {
  margin-top: 20px;
  padding: 10px 20px;
  background: #8f7a66;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
}

.instructions {
  text-align: center;
  color: #776e65;
}

.instructions h3 {
  margin-bottom: 10px;
}

.instructions ul {
  list-style-type: none;
  padding: 0;
  text-align: left;
}

.instructions li {
  margin: 8px 0;
}

kbd {
  display: inline-block;
  padding: 3px 5px;
  font-size: 11px;
  line-height: 10px;
  color: #444d56;
  vertical-align: middle;
  background-color: #fafbfc;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 #d1d5da;
}

/* 响应式设计 */
@media (max-width: 500px) {
  .game-container {
    padding: 10px;
  }

  .game-header {
    flex-direction: column;
    gap: 15px;
  }

  .game-board {
    height: 320px;
  }

  .tile-inner {
    font-size: 24px;
  }

  .tile-128 .tile-inner,
  .tile-256 .tile-inner,
  .tile-512 .tile-inner {
    font-size: 20px;
  }

  .tile-1024 .tile-inner,
  .tile-2048 .tile-inner {
    font-size: 18px;
  }
}
</style>
