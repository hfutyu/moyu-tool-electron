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


// ==================== 计算属性（自动计算节点位置） ====================

/**
 * 人物节点位置计算
 *
 * 布局规则：
 * - 同一代人（generation相同）在同一行，高度一致
 * - 同一代的所有人物（包括有婚姻和无婚姻）统一排布，不重叠
 * - 有婚姻的：丈夫在左，婚姻在中，妻子在右（占280宽）
 * - 无婚姻的：单独占位（占80宽）
 * - 孩子显示在婚姻节点的下方（下一代）
 *
 * 示例布局（第1代）:
 *   大爹  老六--婚姻--秀  二爹
 */
const personNodes = computed((): GraphNode[] => {
  const nodes: GraphNode[] = []
  const posMap = new Map<number, { x: number; y: number }>()

  // 获取所有代数
  const generations = [...new Set(persons.value.map(p => p.generation ?? 0))].sort((a, b) => a - b)
  const generationYMap = new Map<number, number>()

  // 每一行的Y坐标
  const rowHeight = 180
  const startY = 80
  generations.forEach((gen, index) => {
    generationYMap.set(gen, startY + index * rowHeight)
  })

  // 常量
  const nodeGap = 80  // 相邻节点之间的距离

  // 婚姻的代数
  const marriageGenMap = new Map<number, number>()
  marriages.value.forEach(m => {
    const husband = persons.value.find(p => p.id === m.husbandId)
    const wife = persons.value.find(p => p.id === m.wifeId)
    marriageGenMap.set(m.id, husband?.generation ?? wife?.generation ?? 0)
  })

  // 已连接的人物
  const connectedPersonIds = new Set<number>()
  marriages.value.forEach(m => {
    connectedPersonIds.add(m.husbandId)
    connectedPersonIds.add(m.wifeId)
  })

  // 每一代的所有"槽位"：单身人物、丈夫、关系、妻子
  // 用于计算总宽度和居中
  interface Slot {
    type: 'single' | 'husband' | 'marriage' | 'wife'
    gen: number
    personId?: number
    marriageId?: number
  }

  const slotsByGen = new Map<number, Slot[]>()

  generations.forEach(gen => {
    const slots: Slot[] = []

    // 获取这一代所有家族内部人员（由上一代关系产生的）
    const internalPersons = persons.value.filter(p =>
      (p.generation ?? 0) === gen && p.birthMarriageId !== undefined
    )
    // 按 birthMarriageId 分组，得到父系顺序
    const fatherLineages = [...new Set(internalPersons.map(p => p.birthMarriageId))].filter(id => id !== undefined)

    // 获取这一代的所有婚姻
    const genMarriages = marriages.value.filter(m => marriageGenMap.get(m.id) === gen)

    // 获取这一代的所有单身人物
    const singlePersons = persons.value.filter(p =>
      (p.generation ?? 0) === gen && !connectedPersonIds.has(p.id)
    )

    // 按父系顺序依次处理：每组先放单身，再放婚姻
    fatherLineages.forEach(fatherId => {
      // 该父系的单身人物
      const fatherSingles = singlePersons.filter(p => p.birthMarriageId === fatherId)
      fatherSingles.forEach(p => {
        slots.push({ type: 'single', gen, personId: p.id })
      })

      // 该父系的婚姻
      const fatherMarriages = genMarriages.filter(m => {
        const husband = persons.value.find(p => p.id === m.husbandId)
        const wife = persons.value.find(p => p.id === m.wifeId)
        const fatherIdThis = husband?.birthMarriageId ?? wife?.birthMarriageId ?? -1
        return fatherIdThis === fatherId
      })

      fatherMarriages.forEach(m => {
        slots.push({ type: 'husband', gen, personId: m.husbandId, marriageId: m.id })
        slots.push({ type: 'marriage', gen, marriageId: m.id })
        slots.push({ type: 'wife', gen, personId: m.wifeId, marriageId: m.id })
      })
    })

    // 处理没有 birthMarriageId 的人员（外部配偶）和没有对应婚姻的
    // 外部配偶的婚姻
    const usedMarriageIds = new Set<number>()
    fatherLineages.forEach(fatherId => {
      const fatherMarriages = genMarriages.filter(m => {
        const husband = persons.value.find(p => p.id === m.husbandId)
        const wife = persons.value.find(p => p.id === m.wifeId)
        const fatherIdThis = husband?.birthMarriageId ?? wife?.birthMarriageId ?? -1
        return fatherIdThis === fatherId
      })
      fatherMarriages.forEach(m => usedMarriageIds.add(m.id))
    })

    // 外部配偶对应的婚姻（排最后）
    const externalMarriages = genMarriages.filter(m => !usedMarriageIds.has(m.id))
    externalMarriages.forEach(m => {
      slots.push({ type: 'husband', gen, personId: m.husbandId, marriageId: m.id })
      slots.push({ type: 'marriage', gen, marriageId: m.id })
      slots.push({ type: 'wife', gen, personId: m.wifeId, marriageId: m.id })
    })

    slotsByGen.set(gen, slots)
  })

  // 计算每一代的起始X位置（居中）
  const genStartX = new Map<number, number>()
  generations.forEach(gen => {
    const slots = slotsByGen.get(gen) || []
    const totalWidth = (slots.length - 1) * nodeGap + 80 // 80是第一个节点的起始偏移
    genStartX.set(gen, 400 - totalWidth / 2 + 40)
  })

  // 绘制人物节点
  generations.forEach(gen => {
    const slots = slotsByGen.get(gen) || []
    const baseY = generationYMap.get(gen) ?? startY

    slots.forEach((slot, index) => {
      const startX = genStartX.get(gen) ?? 400
      const x = startX + index * nodeGap

      // 单身、丈夫、妻子需要渲染人物节点
      if (slot.type !== 'marriage' && slot.personId) {
        const person = persons.value.find(p => p.id === slot.personId)
        if (person && !posMap.has(person.id)) {
          nodes.push({
            id: person.id,
            x: x,
            y: baseY,
            name: person.name,
            gender: person.gender,
          })
          posMap.set(person.id, { x, y: baseY })
        }
      }
    })
  })

  // 处理孩子（下一代）
  marriages.value.forEach(marriage => {
    const gen = marriageGenMap.get(marriage.id) ?? 0
    const slots = slotsByGen.get(gen) || []

    // 找到关系节点在这一代slots中的位置
    const marriageSlotIndex = slots.findIndex(s => s.marriageId === marriage.id && s.type === 'marriage')
    if (marriageSlotIndex === -1) return

    const startX = genStartX.get(gen) ?? 400
    const marriageX = startX + marriageSlotIndex * nodeGap

    if (marriage.childrenIds && marriage.childrenIds.length > 0) {
      const childCount = marriage.childrenIds.length
      const childSpacing = 90
      const totalWidth = (childCount - 1) * childSpacing

      // 孩子在下一行，从关系节点中心开始
      const childGen = gen + 1
      const childBaseY = generationYMap.get(childGen) ?? (startY + (gen + 1) * rowHeight)
      const childStartX = marriageX + 80 / 2 - totalWidth / 2

      marriage.childrenIds.forEach((childId, cIndex) => {
        const child = persons.value.find(p => p.id === childId)
        if (child && !posMap.has(child.id)) {
          const childX = childStartX + cIndex * childSpacing
          nodes.push({
            id: child.id,
            x: childX,
            y: childBaseY,
            name: child.name,
            gender: child.gender,
          })
          posMap.set(child.id, { x: childX, y: childBaseY })
        }
      })
    }
  })

  return nodes
})

/**
 * 婚姻节点位置计算
 * 婚姻节点位于每对夫妻的中间，与丈夫妻子同代同高度
 */
const marriageNodes = computed((): GraphNode[] => {
  // 获取所有代数
  const generations = [...new Set(persons.value.map(p => p.generation ?? 0))].sort((a, b) => a - b)
  const generationYMap = new Map<number, number>()

  // 每一行的Y坐标
  const rowHeight = 180
  const startY = 80
  generations.forEach((gen, index) => {
    generationYMap.set(gen, startY + index * rowHeight)
  })

  // 常量
  const nodeGap = 80  // 相邻节点之间的距离

  // 婚姻的代数
  const marriageGenMap = new Map<number, number>()
  marriages.value.forEach(m => {
    const husband = persons.value.find(p => p.id === m.husbandId)
    const wife = persons.value.find(p => p.id === m.wifeId)
    marriageGenMap.set(m.id, husband?.generation ?? wife?.generation ?? 0)
  })

  // 已连接的人物
  const connectedPersonIds = new Set<number>()
  marriages.value.forEach(m => {
    connectedPersonIds.add(m.husbandId)
    connectedPersonIds.add(m.wifeId)
  })

  // 每一代的槽位
  interface Slot {
    type: 'single' | 'husband' | 'marriage' | 'wife'
    gen: number
    personId?: number
    marriageId?: number
  }

  const slotsByGen = new Map<number, Slot[]>()

  generations.forEach(gen => {
    const slots: Slot[] = []

    // 获取这一代所有家族内部人员（由上一代关系产生的）
    const internalPersons = persons.value.filter(p =>
      (p.generation ?? 0) === gen && p.birthMarriageId !== undefined
    )
    // 按 birthMarriageId 分组，得到父系顺序
    const fatherLineages = [...new Set(internalPersons.map(p => p.birthMarriageId))].filter(id => id !== undefined)

    // 获取这一代的所有婚姻
    const genMarriages = marriages.value.filter(m => marriageGenMap.get(m.id) === gen)

    // 获取这一代的所有单身人物
    const singlePersons = persons.value.filter(p =>
      (p.generation ?? 0) === gen && !connectedPersonIds.has(p.id)
    )

    // 按父系顺序依次处理：每组先放单身，再放婚姻
    fatherLineages.forEach(fatherId => {
      // 该父系的单身人物
      const fatherSingles = singlePersons.filter(p => p.birthMarriageId === fatherId)
      fatherSingles.forEach(p => {
        slots.push({ type: 'single', gen, personId: p.id })
      })

      // 该父系的婚姻
      const fatherMarriages = genMarriages.filter(m => {
        const husband = persons.value.find(p => p.id === m.husbandId)
        const wife = persons.value.find(p => p.id === m.wifeId)
        const fatherIdThis = husband?.birthMarriageId ?? wife?.birthMarriageId ?? -1
        return fatherIdThis === fatherId
      })

      fatherMarriages.forEach(m => {
        slots.push({ type: 'husband', gen, personId: m.husbandId, marriageId: m.id })
        slots.push({ type: 'marriage', gen, marriageId: m.id })
        slots.push({ type: 'wife', gen, personId: m.wifeId, marriageId: m.id })
      })
    })

    // 处理没有 birthMarriageId 的人员（外部配偶）和没有对应婚姻的
    // 外部配偶的婚姻
    const usedMarriageIds = new Set<number>()
    fatherLineages.forEach(fatherId => {
      const fatherMarriages = genMarriages.filter(m => {
        const husband = persons.value.find(p => p.id === m.husbandId)
        const wife = persons.value.find(p => p.id === m.wifeId)
        const fatherIdThis = husband?.birthMarriageId ?? wife?.birthMarriageId ?? -1
        return fatherIdThis === fatherId
      })
      fatherMarriages.forEach(m => usedMarriageIds.add(m.id))
    })

    // 外部配偶对应的婚姻（排最后）
    const externalMarriages = genMarriages.filter(m => !usedMarriageIds.has(m.id))
    externalMarriages.forEach(m => {
      slots.push({ type: 'husband', gen, personId: m.husbandId, marriageId: m.id })
      slots.push({ type: 'marriage', gen, marriageId: m.id })
      slots.push({ type: 'wife', gen, personId: m.wifeId, marriageId: m.id })
    })

    slotsByGen.set(gen, slots)
  })

  // 计算每一代的起始X位置
  const genStartX = new Map<number, number>()
  generations.forEach(gen => {
    const slots = slotsByGen.get(gen) || []
    const totalWidth = (slots.length - 1) * nodeGap + 80
    genStartX.set(gen, 400 - totalWidth / 2 + 40)
  })

  return marriages.value.map((marriage) => {
    const gen = marriageGenMap.get(marriage.id) ?? 0
    const baseY = generationYMap.get(gen) ?? startY

    // 找到关系(slot)在slots中的位置
    const slots = slotsByGen.get(gen) || []
    const marriageSlotIndex = slots.findIndex(s => s.marriageId === marriage.id && s.type === 'marriage')

    if (marriageSlotIndex === -1) {
      return {
        id: marriage.id,
        x: 400,
        y: baseY,
        marriageDate: marriage.marriageDate,
        husbandId: marriage.husbandId,
        wifeId: marriage.wifeId,
        childrenIds: marriage.childrenIds,
        isMarriage: true
      }
    }

    const startX = genStartX.get(gen) ?? 400
    // 关系节点的位置就是marriage slot的位置
    const centerX = startX + marriageSlotIndex * nodeGap

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
