<template>
  <div class="gomoku-container">
    <h2>五子棋游戏</h2>
    <div class="game-info">
      <p>当前玩家:
        <span :class="currentPlayer === 1 ? 'black' : 'white'">
          {{ currentPlayer === 1 ? '黑棋' : '白棋' }}
        </span>
      </p>
      <button @click="resetGame" class="reset-btn">重新开始</button>
    </div>

    <div class="board-container">
      <canvas
        ref="boardCanvas"
        :width="boardSize * cellSize"
        :height="boardSize * cellSize"
        @click="handleClick"
        class="board-canvas"
      ></canvas>
    </div>

    <div v-if="winner !== null" class="winner-modal">
      <div class="modal-content">
        <h3>游戏结束</h3>
        <p>{{ winner === 0 ? '黑棋' : winner === 1 ? '白棋' : '平局' }}获胜！</p>
        <button @click="resetGame">再来一局</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

// 游戏配置
const boardSize = ref(15); // 棋盘大小 15x15
const cellSize = ref(30);  // 每格像素大小
const board = ref<number[][]>([]); // 棋盘状态：-1空位，0黑棋，1白棋
const currentPlayer = ref<number>(0); // 当前玩家：0黑棋，1白棋
const winner = ref<number | null>(null); // 获胜者：0黑棋，1白棋，-1平局，null未结束
const gameOver = ref(false);

const boardCanvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// 初始化棋盘
const initBoard = () => {
  const newBoard: number[][] = [];
  for (let i = 0; i < boardSize.value; i++) {
    const row: number[] = [];
    for (let j = 0; j < boardSize.value; j++) {
      row.push(-1); // -1表示空位
    }
    newBoard.push(row);
  }
  board.value = newBoard;
};

// 绘制棋盘
const drawBoard = () => {
  if (!ctx.value) return;

  const canvas = ctx.value.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // 清空画布
  ctx.value.clearRect(0, 0, width, height);

  // 绘制网格线
  ctx.value.strokeStyle = '#8B4513'; // 棕色
  ctx.value.lineWidth = 1;

  for (let i = 0; i < boardSize.value; i++) {
    // 水平线
    ctx.value.beginPath();
    ctx.value.moveTo(cellSize.value / 2, i * cellSize.value + cellSize.value / 2);
    ctx.value.lineTo(width - cellSize.value / 2, i * cellSize.value + cellSize.value / 2);
    ctx.value.stroke();

    // 垂直线
    ctx.value.beginPath();
    ctx.value.moveTo(i * cellSize.value + cellSize.value / 2, cellSize.value / 2);
    ctx.value.lineTo(i * cellSize.value + cellSize.value / 2, height - cellSize.value / 2);
    ctx.value.stroke();
  }

  // 绘制天元和星位（围棋规则中的位置）
  const starPoints = [3, 7, 11];
  ctx.value.fillStyle = '#000';
  for (const x of starPoints) {
    for (const y of starPoints) {
      ctx.value.beginPath();
      ctx.value.arc(
        x * cellSize.value + cellSize.value / 2,
        y * cellSize.value + cellSize.value / 2,
        3,
        0,
        Math.PI * 2
      );
      ctx.value.fill();
    }
  }

  // 绘制棋子
  for (let i = 0; i < boardSize.value; i++) {
    for (let j = 0; j < boardSize.value; j++) {
      if (board.value[i][j] !== -1) {
        drawPiece(j, i, board.value[i][j]);
      }
    }
  }
};

// 绘制单个棋子
const drawPiece = (x: number, y: number, player: number) => {
  if (!ctx.value) return;

  const centerX = x * cellSize.value + cellSize.value / 2;
  const centerY = y * cellSize.value + cellSize.value / 2;
  const radius = cellSize.value / 2 - 2;

  ctx.value.beginPath();
  ctx.value.arc(centerX, centerY, radius, 0, Math.PI * 2);

  // 创建渐变效果
  const gradient = ctx.value.createRadialGradient(
    centerX - radius / 3,
    centerY - radius / 3,
    radius / 4,
    centerX,
    centerY,
    radius
  );

  if (player === 0) { // 黑棋
    gradient.addColorStop(0, '#666');
    gradient.addColorStop(1, '#000');
  } else { // 白棋
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ccc');
  }

  ctx.value.fillStyle = gradient;
  ctx.value.fill();

  // 边框
  ctx.value.strokeStyle = '#333';
  ctx.value.lineWidth = 1;
  ctx.value.stroke();
};

// 处理点击事件
const handleClick = (e: MouseEvent) => {
  if (gameOver.value) return;

  const canvas = boardCanvas.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 计算最近的交叉点
  const col = Math.round((x - cellSize.value / 2) / cellSize.value);
  const row = Math.round((y - cellSize.value / 2) / cellSize.value);

  // 检查是否在棋盘范围内且位置为空
  if (
    row >= 0 &&
    row < boardSize.value &&
    col >= 0 &&
    col < boardSize.value &&
    board.value[row][col] === -1
  ) {
    // 放置棋子
    board.value[row][col] = currentPlayer.value;

    // 检查是否获胜
    if (checkWin(row, col, currentPlayer.value)) {
      winner.value = currentPlayer.value;
      gameOver.value = true;
    } else if (isBoardFull()) {
      // 平局
      winner.value = -1;
      gameOver.value = true;
    } else {
      // 切换玩家
      currentPlayer.value = 1 - currentPlayer.value;
    }

    // 重新绘制
    drawBoard();
  }
};

// 检查是否获胜
const checkWin = (row: number, col: number, player: number): boolean => {
  // 四个方向：水平、垂直、左上-右下、右上-左下
  const directions = [
    [0, 1],   // 水平
    [1, 0],   // 垂直
    [1, 1],   // 左上-右下对角线
    [1, -1]   // 右上-左下对角线
  ];

  for (const [dx, dy] of directions) {
    let count = 1; // 包含当前落子

    // 正向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;

      if (
        newRow >= 0 &&
        newRow < boardSize.value &&
        newCol >= 0 &&
        newCol < boardSize.value &&
        board.value[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    // 反向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;

      if (
        newRow >= 0 &&
        newRow < boardSize.value &&
        newCol >= 0 &&
        newCol < boardSize.value &&
        board.value[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 5) {
      return true;
    }
  }

  return false;
};

// 检查棋盘是否已满
const isBoardFull = (): boolean => {
  for (let i = 0; i < boardSize.value; i++) {
    for (let j = 0; j < boardSize.value; j++) {
      if (board.value[i][j] === -1) {
        return false;
      }
    }
  }
  return true;
};

// 重置游戏
const resetGame = () => {
  initBoard();
  currentPlayer.value = 0;
  winner.value = null;
  gameOver.value = false;
  drawBoard();
};

// 初始化
onMounted(() => {
  if (boardCanvas.value) {
    ctx.value = boardCanvas.value.getContext('2d');
    initBoard();
    nextTick(() => {
      drawBoard();
    });
  }
});
</script>

<style scoped>
.gomoku-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.game-info {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.black {
  color: #000;
  font-weight: bold;
}

.white {
  color: #666;
  font-weight: bold;
}

.reset-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reset-btn:hover {
  background-color: #45a049;
}

.board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #8B4513;
  background-color: #DEB887; /* 棋盘背景色 */
  padding: 10px;
  border-radius: 5px;
}

.board-canvas {
  cursor: pointer;
}

.winner-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-content button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
