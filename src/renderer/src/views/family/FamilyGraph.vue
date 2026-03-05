<template>
  <!-- 整个图谱容器 -->
  <div class="graph-container">
    <!-- 顶部标题栏 -->
    <div class="graph-header">
      <h3>家族关系图谱</h3>
      <button class="btn-refresh" @click="loadData">刷新</button>
    </div>

    <!-- 可滚动的视图区域 -->
    <div class="graph-viewport" ref="viewportRef">
      <!-- SVG画布，绑定缩放和平移事件 -->
      <svg
        :width="svgWidth"
        :height="svgHeight"
        @mousedown="startPan"
        @mousemove="onPan"
        @mouseup="endPan"
        @mouseleave="endPan"
        @wheel="onZoom"
      >
        <!-- 图层组，用于整体移动和缩放 -->
        <g :transform="`translate(${panX}, ${panY}) scale(${scale})`">

          <!-- 连线层 -->
          <g class="links">
            <!-- 循环渲染所有连线 -->
            <line
              v-for="link in allLinks"
              :key="link.key"
              :x1="link.x1"
              :y1="link.y1"
              :x2="link.x2"
              :y2="link.y2"
              :class="['link-line', link.type]"
            />
          </g>

          <!-- ==================== 婚姻节点层 ==================== -->
          <!-- 婚姻关系用菱形表示 -->
          <g
            v-for="node in marriageNodes"
            :key="`m-${node.id}`"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node"
            @click="selectMarriage(node)"
          >
            <!-- 菱形节点 -->
            <polygon
              points="0,-25 35,0 0,25 -35,0"
              class="node-shape marriage"
              :class="{ selected: selectedMarriage?.id === node.id }"
            />
            <text y="4" class="node-text">结婚</text>
          </g>

          <!-- 人物节点层 -->
          <g
            v-for="node in personNodes"
            :key="`p-${node.id}`"
            :transform="`translate(${node.x}, ${node.y})`"
            class="node"
            @click="selectPerson(node)"
          >
            <!-- 圆形节点 -->
            <circle
              r="25"
              :class="['node-shape', node.gender === 0 ? 'male' : 'female', { selected: selectedPerson?.id === node.id }]"
            />
            <text y="4" class="node-text">{{ node.name }}</text>
          </g>
        </g>
      </svg>
    </div>

    <!-- ==================== 信息面板 ==================== -->
    <!-- 点击节点后显示详细信息 -->
    <div v-if="selectedPerson || selectedMarriage" class="info-panel">
      <!-- 选中人物时显示 -->
      <div v-if="selectedPerson" class="person-info">
        <h4>人物信息</h4>
        <p>姓名: {{ selectedPerson.name }}</p>
        <p>性别: {{ selectedPerson.gender === 0 ? '男' : '女' }}</p>
        <p>出生日期: {{ selectedPerson.birthDate || '-' }}</p>
        <button @click="selectedPerson = null">关闭</button>
      </div>
      <!-- 选中婚姻时显示 -->
      <div v-if="selectedMarriage" class="marriage-info">
        <h4>婚姻信息</h4>
        <p>结婚日期: {{ selectedMarriage.marriageDate || '-' }}</p>
        <p>丈夫: {{ getPersonName(selectedMarriage.husbandId) }}</p>
        <p>妻子: {{ getPersonName(selectedMarriage.wifeId) }}</p>
        <p>孩子: {{ getChildrenNames(selectedMarriage.childrenIds) }}</p>
        <button @click="selectedMarriage = null">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ==================== 引入依赖 ====================
// Vue 核心函数
import { ref, computed, onMounted, onUnmounted } from 'vue'
// 从 FamilyService 导入数据操作函数
import { getPersons, getMarriages, type Person, type Marriage } from './FamilyService'


// ==================== 数据定义 ====================

// 人物列表（从JSON文件加载）
const persons = ref<Person[]>([])
const marriages = ref<Marriage[]>([])


// ==================== 视口控制（缩放和平移） ====================

// SVG 画布的尺寸
const viewportRef = ref<HTMLElement | null>(null)  // 获取容器DOM元素
const svgWidth = ref(1200)    // 画布宽度
const svgHeight = ref(800)   // 画布高度

// 缩放比例，1表示原始大小
const scale = ref(1)

// 平移偏移量，控制整个图层的移动
const panX = ref(50)   // 水平偏移
const panY = ref(50)   // 垂直偏移

// 拖拽状态
const isPanning = ref(false)   // 是否正在拖拽
const lastPanX = ref(0)       // 上一次鼠标X位置
const lastPanY = ref(0)       // 上一次鼠标Y位置


// ==================== 选中状态 ====================

// 当前选中的节点（人物或婚姻）
const selectedPerson = ref<Person | null>(null)
const selectedMarriage = ref<Marriage | null>(null)


// ==================== 类型定义 ====================

/**
 * 图节点接口 - 用于在图谱中显示的节点
 * 包含位置信息和相关数据
 */
interface GraphNode {
  id: number           // 节点唯一ID
  x: number            // X坐标（水平位置）
  y: number            // Y坐标（垂直位置）
  name?: string        // 人物姓名（人物节点用）
  gender?: number      // 性别：0=男，1=女（人物节点用）
  marriageDate?: string // 结婚日期（婚姻节点用）
  husbandId?: number   // 丈夫ID（婚姻节点用）
  wifeId?: number     // 妻子ID（婚姻节点用）
  childrenIds?: number[] // 孩子ID列表（婚姻节点用）
  isMarriage?: boolean // 是否是婚姻节点
}

/**
 * 连线接口 - 连接两个节点的线段
 */
interface Link {
  key: string          // 连线唯一标识
  x1: number           // 起点X坐标
  y1: number           // 起点Y坐标
  x2: number           // 终点X坐标
  y2: number           // 终点Y坐标
  type: string         // 连线类型：'spouse'=夫妻，'child'=亲子
}


// ==================== 计算属性（自动计算节点位置） ====================

/**
 * 人物节点位置计算
 *
 * 布局规则：
 * - 每对夫妻占一行，按婚姻顺序垂直排列
 * - 丈夫在左边，婚姻在中间，妻子在右边
 * - 孩子显示在婚姻节点的下方
 *
 * 示例布局：
 *   丈夫 -- 婚姻 -- 妻子
 *            |
 *           孩子1  孩子2
 */
const personNodes = computed((): GraphNode[] => {
  const nodes: GraphNode[] = []
  // 用 Map 记录每个人物的位置，避免重复
  const posMap = new Map<number, { x: number; y: number }>()

  // 第一步：先处理所有婚姻中的丈夫和妻子（婚姻优先）
  marriages.value.forEach((marriage, mIndex) => {
    const baseY = mIndex * 180 + 80
    const centerX = 400

    // 丈夫
    const husband = persons.value.find((p) => p.id === marriage.husbandId)
    if (husband && !posMap.has(husband.id)) {
      nodes.push({
        id: husband.id,
        x: centerX - 80,
        y: baseY,
        name: husband.name,
        gender: husband.gender,
        birthDate: husband.birthDate
      })
      posMap.set(husband.id, { x: centerX - 80, y: baseY })
    }

    // 妻子
    const wife = persons.value.find((p) => p.id === marriage.wifeId)
    if (wife && !posMap.has(wife.id)) {
      nodes.push({
        id: wife.id,
        x: centerX + 80,
        y: baseY,
        name: wife.name,
        gender: wife.gender,
        birthDate: wife.birthDate
      })
      posMap.set(wife.id, { x: centerX + 80, y: baseY })
    }
  })

  // 第二步：处理孩子（只处理还没有位置的人物）
  marriages.value.forEach((marriage, mIndex) => {
    const baseY = mIndex * 180 + 80
    const centerX = 400

    if (marriage.childrenIds && marriage.childrenIds.length > 0) {
      const childCount = marriage.childrenIds.length
      const childSpacing = 70
      const totalWidth = (childCount - 1) * childSpacing

      marriage.childrenIds.forEach((childId, cIndex) => {
        const child = persons.value.find((p) => p.id === childId)
        // 只处理还没有位置的孩子（排除已经是丈夫/妻子的人）
        if (child && !posMap.has(child.id)) {
          const childX = centerX - totalWidth / 2 + cIndex * childSpacing
          const childY = baseY + 120
          nodes.push({
            id: child.id,
            x: childX,
            y: childY,
            name: child.name,
            gender: child.gender,
            birthDate: child.birthDate
          })
          posMap.set(child.id, { x: childX, y: childY })
        }
      })
    }
  })

  // 第三步：处理没有婚姻关系的人物
  const connectedIds = new Set(marriages.value.flatMap(m =>
    [m.husbandId, m.wifeId, ...(m.childrenIds || [])]
  ))
  const unconnected = persons.value.filter(p => !connectedIds.has(p.id))
  unconnected.forEach((person, index) => {
    nodes.push({
      id: person.id,
      x: 100 + index * 70,
      y: 50,
      name: person.name,
      gender: person.gender,
      birthDate: person.birthDate
    })
  })

  return nodes
})

/**
 * 婚姻节点位置计算
 * 婚姻节点位于每对夫妻的中间
 */
const marriageNodes = computed((): GraphNode[] => {
  return marriages.value.map((marriage, mIndex) => {
    const baseY = mIndex * 180 + 80
    const centerX = 400
    return {
      id: marriage.id,
      x: centerX,
      y: baseY,
      marriageDate: marriage.marriageDate,
      husbandId: marriage.husbandId,
      wifeId: marriage.wifeId,
      childrenIds: marriage.childrenIds,
      isMarriage: true
    }
  })
})

/**
 * 计算所有连线
 * 包括：丈夫-婚姻、妻子-婚姻、婚姻-孩子
 */
const allLinks = computed((): Link[] => {
  const links: Link[] = []

  // 遍历每个婚姻关系，生成相关连线
  marriages.value.forEach((marriage) => {
    // 找到丈夫、妻子、婚姻节点的位置
    const husbandPos = personNodes.value.find(p => p.id === marriage.husbandId)
    const wifePos = personNodes.value.find(p => p.id === marriage.wifeId)
    const marriagePos = marriageNodes.value.find(m => m.id === marriage.id)

    // 丈夫到婚姻的连线
    if (husbandPos && marriagePos) {
      links.push({
        key: `h-${marriage.id}`,
        x1: husbandPos.x,
        y1: husbandPos.y,
        x2: marriagePos.x,
        y2: marriagePos.y,
        type: 'spouse'
      })
    }

    // 婚姻到妻子的连线
    if (wifePos && marriagePos) {
      links.push({
        key: `w-${marriage.id}`,
        x1: marriagePos.x,
        y1: marriagePos.y,
        x2: wifePos.x,
        y2: wifePos.y,
        type: 'spouse'
      })
    }

    // 婚姻到每个孩子的连线
    if (marriage.childrenIds && marriagePos) {
      marriage.childrenIds.forEach(childId => {
        const childPos = personNodes.value.find(p => p.id === childId)
        if (childPos) {
          links.push({
            key: `c-${marriage.id}-${childId}`,
            x1: marriagePos.x,
            y1: marriagePos.y,
            x2: childPos.x,
            y2: childPos.y,
            type: 'child'
          })
        }
      })
    }
  })

  return links
})


// ==================== 方法函数 ====================

/**
 * 加载数据 - 从JSON文件读取人物和婚姻数据
 */
const loadData = async () => {
  persons.value = await getPersons()
  marriages.value = await getMarriages()
}

/**
 * 根据ID获取人物姓名
 * @param id - 人物ID
 */
const getPersonName = (id: number) => {
  return persons.value.find(p => p.id === id)?.name || '-'
}

/**
 * 获取所有孩子的姓名
 * @param ids - 孩子ID数组
 */
const getChildrenNames = (ids: number[]) => {
  if (!ids || ids.length === 0) return '无'
  return ids.map(id => getPersonName(id)).join(', ')
}

/**
 * 选中人物节点
 * @param node - 点击的节点
 */
const selectPerson = (node: GraphNode) => {
  selectedPerson.value = persons.value.find(p => p.id === node.id) || null
  selectedMarriage.value = null
}

/**
 * 选中婚姻节点
 * @param node - 点击的节点
 */
const selectMarriage = (node: GraphNode) => {
  selectedMarriage.value = marriages.value.find(m => m.id === node.id) || null
  selectedPerson.value = null
}


// ==================== 缩放功能 ====================

/**
 * 鼠标滚轮缩放
 * @param e - 鼠标事件
 *
 * 逻辑：
 * - 向上滚动(deltaY<0) -> 放大 -> scale增大
 * - 向下滚动(deltaY>0) -> 缩小 -> scale减小
 * - 限制缩放范围：0.3 ~ 3倍
 */
const onZoom = (e: WheelEvent) => {
  e.preventDefault()  // 阻止默认滚动行为
  const delta = e.deltaY > 0 ? 0.9 : 1.1  // 缩小或放大10%
  scale.value = Math.max(0.3, Math.min(3, scale.value * delta))
}


// ==================== 平移功能（拖拽） ====================

/**
 * 开始拖拽
 * @param e - 鼠标按下事件
 */
const startPan = (e: MouseEvent) => {
  isPanning.value = true  // 标记开始拖拽
  lastPanX.value = e.clientX      // 记录鼠标位置
  lastPanY.value = e.clientY
}

/**
 * 拖拽中 - 更新偏移量
 * @param e - 鼠标移动事件
 */
const onPan = (e: MouseEvent) => {
  if (!isPanning.value) return    // 如果没有在拖拽，直接返回
  // 计算鼠标移动的距离
  panX.value += e.clientX - lastPanX.value
  panY.value += e.clientY - lastPanY.value
  // 更新鼠标位置
  lastPanX.value = e.clientX
  lastPanY.value = e.clientY
}

/**
 * 结束拖拽
 */
const endPan = () => {
  isPanning.value = false
}


// ==================== 窗口大小调整 ====================

/**
 * 处理窗口大小变化
 * 让SVG画布始终填满容器
 */
const handleResize = () => {
  if (viewportRef.value) {
    svgWidth.value = viewportRef.value.clientWidth
    svgHeight.value = viewportRef.value.clientHeight
  }
}


// ==================== 生命周期钩子 ====================

// 组件挂载时执行
onMounted(() => {
  loadData()           // 加载数据
  handleResize()       // 调整画布大小
  window.addEventListener('resize', handleResize)  // 监听窗口变化
})

// 组件卸载时执行
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)  // 移除监听
})
</script>

<!-- ==================== 样式 ==================== -->
<style scoped>
/* 整个容器：垂直布局，充满父容器 */
.graph-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* 头部：左右排列 */
.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.graph-header h3 {
  margin: 0;
}

/* 刷新按钮 */
.btn-refresh {
  background: #2196f3;  /* 蓝色背景 */
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

/* 视图区域：可拖拽的画布容器 */
.graph-viewport {
  flex: 1;                      /* 占据剩余空间 */
  border: 1px solid #ddd;       /* 灰色边框 */
  border-radius: 8px;            /* 圆角 */
  overflow: hidden;              /* 隐藏溢出内容 */
  background: #fafafa;          /* 浅灰背景 */
  cursor: grab;                  /* 手型光标 */
}

/* 拖拽时显示抓取光标 */
.graph-viewport:active {
  cursor: grabbing;
}

/* SVG 默认块级显示 */
svg {
  display: block;
}

/* 连线基础样式 */
.link-line {
  stroke: #999;       /* 灰色 */
  stroke-width: 2;    /* 2像素粗 */
}

/* 亲子连线：虚线 */
.link-line.child {
  stroke: #bbb;
  stroke-dasharray: 4, 4;  /* 虚线模式：4像素实线，4像素空白 */
}

/* 节点基础样式 */
.node {
  cursor: pointer;     /* 手指光标 */
}

/* 节点形状基础样式 */
.node-shape {
  fill: white;        /* 白色填充 */
  stroke-width: 2;    /* 边框宽度 */
  transition: all 0.2s;  /* 0.2秒过渡动画 */
}

/* 男性节点：蓝色边框+浅蓝填充 */
.node-shape.male {
  stroke: #2196f3;
  fill: #e3f2fd;
}

/* 女性节点：粉色边框+浅粉填充 */
.node-shape.female {
  stroke: #e91e63;
  fill: #fce4ec;
}

/* 婚姻节点：橙色边框+浅橙填充 */
.node-shape.marriage {
  stroke: #ff9800;
  fill: #fff3e0;
}

/* 悬停效果：稍微变暗 */
.node-shape:hover {
  filter: brightness(0.95);
}

/* 选中状态：边框加粗 */
.node-shape.selected {
  stroke-width: 3;
}

/* 节点文字 */
.node-text {
  font-size: 11px;
  text-anchor: middle;
  fill: #333;
  pointer-events: none;
}

/* 信息面板：右侧浮动显示 */
.info-panel {
  position: fixed;
  right: 40px;
  top: 120px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);  /* 阴影效果 */
  min-width: 200px;
  z-index: 100;
}

.info-panel h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.info-panel p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.info-panel button {
  margin-top: 10px;
  padding: 6px 12px;
  background: #9e9e9e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
