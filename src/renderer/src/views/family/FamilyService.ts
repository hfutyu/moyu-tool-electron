// ========== 辈分 =============
export const digitMap = ['初', '壹','贰','叁','肆','伍','陆','柒','捌','玖'];

// ========== 类型定义 ==========

export interface Person {

  id: number

  generation: number //代


  // 基本信息
  name: string  // 姓名
  nickName?: string  // 乳名
  gender?: 0 | 1 // 0-男 1-女性别
  birthDate?: string // 出生日期 (ISO 8601格式)
  deathDate?: string // 死亡日期 (可选)

  // 关系引用
  birthMarriageId?: number // 出生对应的婚姻关系节点ID (表示从哪里出生)
  married?: number // 1已婚 其他 未婚
  marriageId?: number // 结婚对应的婚姻关系节点ID (表示与谁结婚)

  avatar?: string // 头像URL
  remark?: string  // 简介
}

export interface Marriage {
  id: number

  generation: number //代

  // 婚姻信息
  marriageDate: string // 结婚日期
  divorceDate?: string // 离婚日期 (可选)

  // 夫妻双方孩子 - 引用人物节点ID
  husbandId: number // 丈夫
  wifeId: number  // 妻子
  childrenIds?: number[] // 从这段婚姻中生育的人物节点列表
}

export interface FamilyData {
  persons: Person[]
  marriages: Marriage[]
  nextPersonId: number
  nextMarriageId: number
}

// ========== 通用数据读写 ==========

const FILE_NAME = 'family-data'

/**
 * 读取数据
 */
export const loadData = async (): Promise<FamilyData> => {
  // return {
  //   persons: [],
  //   marriages: [],
  //   nextPersonId: 1,
  //   nextMarriageId: 1
  // }
  const data = await (window as any).electron.ipcRenderer.invoke('data-load', FILE_NAME)
  if (!data) {
    // 初始化空数据
    return {
      persons: [],
      marriages: [],
      nextPersonId: 1,
      nextMarriageId: 1
    }
  }
  return data
}

/**
 * 保存数据
 */
export const saveData = async (data: FamilyData): Promise<boolean> => {
  return await (window as any).electron.ipcRenderer.invoke('data-save', FILE_NAME, data)
  // return await electronAPI.ipcRenderer.invoke('data-save', FILE_NAME, data)
}

// ========== 成员 CRUD ==========

/**
 * 获取所有成员
 */
export const getPersons = async (): Promise<Person[]> => {
  const data = await loadData()
  // 按照辈分排序
  data.persons.sort((a,b) => {
    if (!a.generation){
      return -1
    }else if (!b.generation){
      return 1
    }else{
      return a.generation - b.generation
    }
  })
  return data.persons
}

/**
 * 添加成员
 */
export const addPerson = async (person: Omit<Person, 'id'>): Promise<Person> => {
  // return {
  //   id:1,
  //   name  :'xx',
  //   gender: 0
  // }
  const data = await loadData()
  const newPerson: Person = { id: data.nextPersonId++, ...person }
  data.persons.push(newPerson)
  await saveData(data)
  return newPerson
}

/**
 * 更新成员
 */
export const updatePerson = async (id: number, updates: Partial<Person>): Promise<Person> => {
  // return {
  //   id:1,
  //   name  :'xx',
  //   gender: 0
  // }
  const data = await loadData()
  const index = data.persons.findIndex((p) => p.id === id)
  if (index === -1) throw new Error('成员不存在')
  data.persons[index] = { ...data.persons[index], ...updates }
  await saveData(data)
  return data.persons[index]
}

/**
 * 删除成员
 */
export const deletePerson = async (id: number): Promise<void> => {
  const data = await loadData()
  data.persons = data.persons.filter((p) => p.id !== id)
  await saveData(data)
}

// ========== 关系 CRUD ==========

/**
 * 获取所有关系
 */
export const getMarriages = async (): Promise<Marriage[]> => {
  // return []
  const data = await loadData()
  return data.marriages
}

/**
 * 添加关系
 */
export const addMarriage = async (marriage: Omit<Marriage, 'id'>): Promise<Marriage> => {
  // return []
  const data = await loadData()
  const newMarriage: Marriage = { id: data.nextMarriageId++, ...marriage }
  data.marriages.push(newMarriage)

  // 更新成员的婚姻关系
  const husband = data.persons.find((p) => p.id === marriage.husbandId)
  const wife = data.persons.find((p) => p.id === marriage.wifeId)
  if (husband) husband.marriageId = newMarriage.id
  if (wife) wife.marriageId = newMarriage.id

  // 更新孩子的出生婚姻关系
  if (marriage.childrenIds && marriage.childrenIds.length > 0) {
    marriage.childrenIds.forEach((childId) => {
      const child = data.persons.find((p) => p.id === childId)
      if (child) child.birthMarriageId = newMarriage.id
    })
  }

  await saveData(data)
  return newMarriage
}

/**
 * 更新关系
 */
export const updateMarriage = async (
  id: number,
  updates: Partial<Marriage>
): Promise<Marriage> => {
  // return {
  //   id:1,
  //   husbandId: 2,
  //   wifeId:3,
  //   childrenIds: []
  // }
  const data = await loadData()
  const index = data.marriages.findIndex((m) => m.id === id)
  if (index === -1) throw new Error('关系不存在')

  // 获取更新前的孩子列表
  const oldChildrenIds = data.marriages[index].childrenIds || []
  const newChildrenIds = updates.childrenIds || []

  // 更新婚姻关系
  data.marriages[index] = { ...data.marriages[index], ...updates }

  // 更新新增孩子的出生婚姻关系
  const addedChildren = newChildrenIds.filter((cid) => !oldChildrenIds.includes(cid))
  addedChildren.forEach((childId) => {
    const child = data.persons.find((p) => p.id === childId)
    if (child) child.birthMarriageId = id
  })

  // 清除已移除孩子的出生婚姻关系
  const removedChildren = oldChildrenIds.filter((cid) => !newChildrenIds.includes(cid))
  removedChildren.forEach((childId) => {
    const child = data.persons.find((p) => p.id === childId)
    if (child && child.birthMarriageId === id) child.birthMarriageId = undefined
  })

  await saveData(data)
  return data.marriages[index]
}

/**
 * 删除关系
 */
export const deleteMarriage = async (id: number): Promise<void> => {
  const data = await loadData()
  const marriage = data.marriages.find((m) => m.id === id)

  // 清除成员的婚姻关系
  if (marriage) {
    const husband = data.persons.find((p) => p.id === marriage.husbandId)
    const wife = data.persons.find((p) => p.id === marriage.wifeId)
    if (husband) husband.marriageId = undefined
    if (wife) wife.marriageId = undefined
  }

  data.marriages = data.marriages.filter((m) => m.id !== id)
  await saveData(data)
}
