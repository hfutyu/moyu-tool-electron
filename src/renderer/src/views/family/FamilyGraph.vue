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
            <text y="4" class="node-text">关系</text>
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
<!--
  1、我针对此系统的数据结构和绘图逻辑定义如下概念
  家族内部人员节点：由上一代关系所产生的节点而非通过婚姻关系接入的节点
  外部配偶人员节点：通过婚姻关系接入的节点
  婚姻关系节点：即婚姻节点
  婚姻集合包含：家族内部人员节点(婚姻一方) 婚姻关系节点 外部配偶人物节点(婚姻另一方)
  生育集合包含：婚姻关系(父母婚姻) 家族内部人员节点(孩子)
  同一父系：同一代中由同一关系节点所产生的家族内部人员节点，包含其所在的婚姻集合
  2、绘图应遵守如下规则
  同一代的所有人物节点高度一致，不同代从上到下等高度差
  同一代的所有节点之间相邻俩个节点之间距离相等
  同一父系节点应在一起，不同父系节点不应该出现交叉，不同父系排列的左右顺序应该和其父系节点左右顺序一致
  同一父系内节点顺序遵循，单身在前，婚姻集合在后，同一婚姻集合应在一起，同一婚姻集合内，家族内部人员在前，婚姻关系在中间，外部配偶人员节点在后
  婚姻集合中婚姻关系和双方以实线相连，生育集合中子节点和上级婚姻关系节点虚线相连
-->
<script setup lang="ts">
/**
 *
 * 图谱如何避免出现交叉
 * 下一代的顺序 要 和他们父母的顺序一致 顺序由性别和排行构成 男在前 大伯 大姑 二伯 三伯 ...
 * 筛选内部人 先按父辈顺序排 同父辈顺序再按本人顺序排 循环
 * 每个人push 如果有配偶 关系push 配偶push 这一循环结束
 * 由此得到每一代的顺序 保证每一代的顺序和上一代时一致的 同时还考虑了 婚姻和配偶
 * 绘图时等距离依次绘制，然后在加入连线
 */
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
const svgHeight = ref(1000)   // 画布高度

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


// ==================== 辅助函数 ====================

/**
 * 判断是否家族内部人员
 * @param person - 待检查的人物
 * @returns true 表示该人物由上一代婚姻关系所产生（而非外部配偶）
 *
 * 判断依据：有 birthMarriageId 表示是"被出生"的，是家族内部人员
 * 无 birthMarriageId 表示是"嫁入/入赘"的，是外部配偶
 */
const isInternalPerson = (person: Person) => person.birthMarriageId !== undefined

/** 根据ID获取人物对象 */
const getPersonById = (id: number) => persons.value.find(p => p.id === id)

/**
 * 获取人物的父系ID
 * @param person - 待检查的人物（可能是undefined）
 * @returns birthMarriageId 或 -1（无父系）
 *
 * 用于判断两个人是否属于同一父系（同一祖先的后代）
 */
const getFatherLineage = (person: Person | undefined) => person?.birthMarriageId ?? -1

// ==================== 槽位类型定义 ====================

/**
 * 槽位（Slot）- 图谱布局的基本单元
 *
 * 图谱中每个节点都占用一个槽位，槽位按顺序排列形成一行（同一代）
 * 四种槽位类型：
 * - single: 单身人物（无婚姻）
 * - internal: 家族内部人员（有婚姻，角色可能是丈夫或妻子）
 * - external: 外部配偶人员（有婚姻，从外部接入）
 * - marriage: 婚姻关系（菱形节点）
 *
 * 【布局顺序】
 * 同一父系内：单身在前，婚姻在后
 * 婚姻集合内：内部人员-婚姻-外部人员
 */
interface Slot {
  type: 'single' | 'internal' | 'marriage' | 'external'  // 槽位类型
  gen: number                                             // 所属代数
  personId?: number                                       // 人物ID（single/internal/external时）
  marriageId?: number                                     // 婚姻ID（marriage时）
}

// ==================== 核心布局算法 ====================

/**
 * 计算每一代的槽位排列顺序
 *
 * 【核心逻辑】
 * 同一代的节点按从左到右排列，顺序规则：
 * 1. 同一父系（birthMarriageId相同）的节点必须相邻
 * 2. 不同父系按父系顺序排列，避免交叉
 * 3. 同一父系内：单身在前，婚姻在后
 * 4. 婚姻集合内：家族内部人员在左，婚姻在中，外部配偶在右
 *
 * 【示例】
 * 假设第1代有大爹(父系A)、二爹(父系A)、大伯(父系B)，他们的配偶依次是秀、丽、华
 * 布局结果：单身(大爹) 单身(二爹) 大伯-婚姻-华
 *
 * @returns
 * - slotsByGen: Map<代数, 该代所有槽位[]>
 * - generations: 所有代数列表（已排序）
 */
const computeGenerationSlots = () => {
  // 1. 收集所有代数并排序（从第0代开始，第0代是最早的祖先）
  const generations = [...new Set(persons.value.map(p => p.generation ?? 0))].sort((a, b) => a - b)
  const slotsByGen = new Map<number, Slot[]>()

  // 2. 收集所有有配偶的人物ID（用于判断单身）
  const connectedPersonIds = new Set<number>()
  marriages.value.forEach(m => {
    connectedPersonIds.add(m.husbandId)
    connectedPersonIds.add(m.wifeId)
  })

  // 3. 遍历每个代数，为该代构建槽位数组
  generations.forEach(gen => {
    const slots: Slot[] = []

    // 3.1 找出该代的家族内部人员（通过birthMarriageId确定父系）
    const internalPersons = persons.value.filter(p => (p.generation ?? 0) === gen && isInternalPerson(p))
    // 按birthMarriageId分组，得到父系列表（去重、排序）
    const fatherLineages = [...new Set(internalPersons.map(p => p.birthMarriageId))].filter(id => id !== undefined)

    // 3.2 找出该代的所有婚姻和单身人物
    const genMarriages = marriages.value.filter(m => m.generation === gen)                    // 该代婚姻
    const singlePersons = persons.value.filter(p => (p.generation ?? 0) === gen && !connectedPersonIds.has(p.id))  // 该代单身

    // 3.3 按父系顺序处理每个父系
    fatherLineages.forEach(fatherId => {
      // 该父系的所有单身人物（按出生婚姻分组）
      singlePersons.filter(p => p.birthMarriageId === fatherId).forEach(p => {
        slots.push({ type: 'single', gen, personId: p.id })
      })

      // 该父系的所有婚姻（夫妻中至少有一人是该父系的成员）
      const fatherMarriages = genMarriages.filter(m => {
        const husband = getPersonById(m.husbandId)
        const wife = getPersonById(m.wifeId)
        return getFatherLineage(husband) === fatherId || getFatherLineage(wife) === fatherId
      })

      // 为每个婚姻添加三个槽位（丈夫-婚姻-妻子）
      fatherMarriages.forEach(m => addMarriageSlots(slots, gen, m))
    })

    // 3.4 处理外部配偶的婚姻（夫妻都不是家族内部人员）
    // 这些婚姻不属于任何父系，放在该代的最后
    const usedMarriageIds = new Set(fatherLineages.flatMap(fatherId =>
      genMarriages.filter(m => {
        const husband = getPersonById(m.husbandId)
        const wife = getPersonById(m.wifeId)
        return getFatherLineage(husband) === fatherId || getFatherLineage(wife) === fatherId
      }).map(m => m.id)
    ))

    genMarriages.filter(m => !usedMarriageIds.has(m.id)).forEach(m => addMarriageSlots(slots, gen, m))

    slotsByGen.set(gen, slots)
  })

  return { slotsByGen, generations }
}

/**
 * 为婚姻添加三个槽位（内部-婚姻-外部）
 *
 * 【布局规则】
 * - 家族内部人员放在左边（更靠近家族中心）
 * - 外部配偶放在右边（从外部接入）
 * - 婚姻关系节点放中间
 *
 * @param slots - 槽位数组（会被修改）
 * @param gen - 代数
 * @param m - 婚姻对象
 */
const addMarriageSlots = (slots: Slot[], gen: number, m: Marriage) => {
  const wife = getPersonById(m.wifeId)
  const wifeInternal = isInternalPerson(wife!)

  // 确定左边是谁（内部人员优先），右边是谁（外部人员）
  // 内部人员在左，外部人员在右，婚姻在中间
  let leftId: number, rightId: number
  if (wifeInternal) {
    leftId = m.wifeId; rightId = m.husbandId            // 丈夫在左
  } else {
    leftId = m.husbandId; rightId = m.wifeId          // 默认：丈夫在左
  }

  // 统一 push：内部-婚姻-外部
  slots.push({ type: 'internal', gen, personId: leftId, marriageId: m.id })
  slots.push({ type: 'marriage', gen, marriageId: m.id })
  slots.push({ type: 'external', gen, personId: rightId, marriageId: m.id })
}

// ==================== 节点和连线计算 ====================

/**
 * 合并计算所有节点位置和连线
 *
 * 【计算流程】
 * 1. 调用 computeGenerationSlots() 获取槽位布局
 * 2. 计算每代的Y坐标（代际间距）和X起始位置（居中）
 * 3. 第一遍遍历：渲染当前代的所有节点（人物+婚姻）
 *    - 同时建立 posMap（人物位置）和 marriagePosMap（婚姻位置）
 * 4. 第二遍遍历：渲染下一代的子节点 + 生成所有连线
 *    - 从 marriagePosMap 获取父母婚姻位置
 *    - 从 posMap 获取配偶和孩子的位置
 *    - 生成 spouse 类型连线（实线）和 child 类型连线（虚线）
 *
 * 【性能优化】
 * - 使用 Map 直接查找位置，O(1) 复杂度
 * - 节点和连线一次计算完成，避免重复遍历
 *
 * @returns 包含 nodes（所有节点）和 links（所有连线）的对象
 */
const graphData = computed(() => {
  const nodes: GraphNode[] = []
  const links: Link[] = []
  const posMap = new Map<number, { x: number; y: number }>()      // 人物ID -> 位置
  const marriagePosMap = new Map<number, { x: number; y: number }>() // 婚姻ID -> 位置
  const nodeGap = 80      // 节点间距
  const rowHeight = 180   // 代际间距（两代之间的垂直距离）
  const startY = 80       // 第一代的Y坐标

  // 获取槽位布局（每代的节点排列顺序）
  const { slotsByGen, generations } = computeGenerationSlots()

  // 计算每代的Y坐标：第0代在startY，第1代在startY+rowHeight，以此类推
  const generationYMap = new Map<number, number>()
  generations.forEach((gen, index) => {
    generationYMap.set(gen, startY + index * rowHeight)
  })

  // 计算每代的起始X坐标（使该代节点在画布上居中）
  // 公式：居中偏移 + (槽位数-1)*间距/2
  const genStartX = new Map<number, number>()
  generations.forEach(gen => {
    const slots = slotsByGen.get(gen) || []
    const totalWidth = (slots.length - 1) * nodeGap + 80  // 80是节点宽度
    genStartX.set(gen, 400 - totalWidth / 2 + 40)
  })

  // ========== 第一遍：渲染当前代的节点 ==========
  generations.forEach(gen => {
    const slots = slotsByGen.get(gen) || []
    const baseY = generationYMap.get(gen) ?? startY
    const startX = genStartX.get(gen) ?? 400

    slots.forEach((slot, index) => {
      // 计算该槽位的X坐标
      const x = startX + index * nodeGap

      if (slot.type === 'marriage') {
        // 婚姻节点（菱形）
        const marriage = marriages.value.find(m => m.id === slot.marriageId)
        if (marriage) {
          marriagePosMap.set(marriage.id, { x, y: baseY })
          nodes.push({
            id: marriage.id,
            x, y: baseY,
            marriageDate: marriage.marriageDate,
            husbandId: marriage.husbandId,
            wifeId: marriage.wifeId,
            childrenIds: marriage.childrenIds,
            isMarriage: true
          })
        }
      } else if (slot.personId) {
        // 人物节点（圆形）：single | internal | external
        const person = getPersonById(slot.personId)
        if (person && !posMap.has(person.id)) {
          posMap.set(person.id, { x, y: baseY })
          nodes.push({ id: person.id, x, y: baseY, name: person.name, gender: person.gender })
        }
      }
    })
  })

  // ========== 第二遍：渲染下一代节点 + 生成连线 ==========
  marriages.value.forEach(marriage => {
    const marriagePos = marriagePosMap.get(marriage.id)
    if (!marriagePos) return  // 找不到该婚姻的位置（应该不会发生）

    const husbandPos = posMap.get(marriage.husbandId)
    const wifePos = posMap.get(marriage.wifeId)

    // 生成夫妻-婚姻连线（实线）
    if (husbandPos) {
      links.push({
        key: `h-${marriage.id}`,
        x1: husbandPos.x, y1: husbandPos.y,
        x2: marriagePos.x, y2: marriagePos.y,
        type: 'spouse'
      })
    }
    if (wifePos) {
      links.push({
        key: `w-${marriage.id}`,
        x1: marriagePos.x, y1: marriagePos.y,
        x2: wifePos.x, y2: wifePos.y,
        type: 'spouse'
      })
    }

    // 生成孩子节点和亲子连线
    if (marriage.childrenIds?.length) {
      const gen = marriage.generation ?? 0
      const childGen = gen + 1  // 孩子在下一代
      // 下一代的Y坐标（如果该代没有人，则动态计算）
      const childBaseY = generationYMap.get(childGen) ?? (startY + (gen + 1) * rowHeight)

      // 孩子在该代从婚姻节点下方开始横向排列
      const childSpacing = 90    // 孩子间距
      const totalWidth = (marriage.childrenIds.length - 1) * childSpacing
      const childStartX = marriagePos.x + 40 - totalWidth / 2  // 居中对齐

      marriage.childrenIds.forEach((childId, cIndex) => {
        const child = getPersonById(childId)
        if (child && !posMap.has(child.id)) {
          // 该孩子还没被渲染过（避免重复）
          const childX = childStartX + cIndex * childSpacing
          posMap.set(child.id, { x: childX, y: childBaseY })
          nodes.push({ id: child.id, x: childX, y: childBaseY, name: child.name, gender: child.gender })
        }
        const childPos = posMap.get(childId)
        if (childPos) {
          // 生成婚姻-孩子连线（虚线）
          links.push({
            key: `c-${marriage.id}-${childId}`,
            x1: marriagePos.x, y1: marriagePos.y,
            x2: childPos.x, y2: childPos.y,
            type: 'child'
          })
        }
      })
    }
  })

  return { nodes, links }
})

// 导出单独的节点和连线（保持接口兼容）
const personNodes = computed(() => graphData.value.nodes.filter(n => !n.isMarriage))
const marriageNodes = computed(() => graphData.value.nodes.filter(n => n.isMarriage))
const allLinks = computed(() => graphData.value.links)


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
const getChildrenNames = (ids?: number[]) => {
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
<!--

最小一代开始绘制、每一代人分为单身、有配偶、单身先画每个等距，有配偶的将关系节点和配偶节点加入这一代中依然等距绘制，配偶关系中，由上级产生的在左，结婚加入进来的再右面

  -->
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
