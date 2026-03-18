// ========== 辈分 =============
export const digitMap = ['初', '壹','贰','叁','肆','伍','陆','柒','捌','玖'];
export const rankMap = ['东西','大', '二','三','四','五','六','七','八','九'];

// ========== 类型定义 ==========

export interface Person {

  id: number

  generation: number //代
  order?: number //排行


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
  return await (window as any).electron.ipcRenderer.invoke('data-save', FILE_NAME, JSON.parse(JSON.stringify(data)))
  // return await electronAPI.ipcRenderer.invoke('data-save', FILE_NAME, data)
}

// ========== 成员 CRUD ==========

/**
 * 获取所有成员
 */
export const getPersons = async (): Promise<Person[]> => {
  const data = await loadData()
  // 按照辈分排序，generation 从小到大（undefined 视为 0），generation 相同则按 birthOrder 排序（undefined 视为 0）
  data.persons.sort((a, b) => {
    const genA = a.generation ?? 0
    const genB = b.generation ?? 0
    if (genA !== genB) {
      return genA - genB
    }
    const orderA = a.order ?? 0
    const orderB = b.order ?? 0
    return orderA - orderB
  })
  return data.persons
}

/**
 * 添加成员
 */
export const addPerson = async (person: Person): Promise<Person> => {
  // return {
  //   id:1,
  //   name  :'xx',
  //   gender: 0
  // }
  const data = await loadData()
  person.id = data.nextPersonId
  data.persons.push(person)
  data.nextPersonId++
  await saveData(data)
  return person
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

  // 如果更新了 order，同步更新其配偶的 order
  if (updates.order !== undefined) {
    const person = data.persons[index]
    if (person.marriageId) {
      const marriage = data.marriages.find(m => m.id === person.marriageId)
      if (marriage) {
        const spouseId = person.id === marriage.husbandId ? marriage.wifeId : marriage.husbandId
        const spouseIndex = data.persons.findIndex(p => p.id === spouseId)
        if (spouseIndex !== -1) {
          data.persons[spouseIndex] = { ...data.persons[spouseIndex], order: updates.order }
        }
      }
    }
  }

  await saveData(data)
  return data.persons[index]
}
/**
 * 更新成员
 */
export const updateMarriage = async (id: number, updates: Partial<Marriage>): Promise<Marriage> => {
  // return {
  //   id:1,
  //   name  :'xx',
  //   gender: 0
  // }
  const data = await loadData()
  const index = data.marriages.findIndex((p) => p.id === id)
  if (index === -1) throw new Error('关系不存在')
  data.marriages[index] = { ...data.marriages[index], ...updates }
  await saveData(data)
  return data.marriages[index]
}

/**
 * 获取所有关系
 */
export const getMarriages = async (): Promise<Marriage[]> => {
  // return []
  const data = await loadData()
  return data.marriages
}

/**
 * 关系新增成员 新增人 已有人
 */
export const marriageAddPerson = async (curPersonId: number, newPerson:Person, newMarriage: Marriage) => {
  const data = await loadData()
  const curPerson = data.persons.find((p) => p.id === curPersonId)
  if (!curPerson){
    throw new Error('成员不存在')
  }
  curPerson.married = 1
  curPerson.marriageId = data.nextMarriageId
  newPerson.generation = curPerson.generation
  newPerson.id = data.nextPersonId
  newPerson.married = 1
  newPerson.marriageId = data.nextMarriageId
  newMarriage.id = data.nextMarriageId
  newMarriage.generation = curPerson.generation
  if (curPerson.gender === 0){
    newMarriage.husbandId = curPersonId
    newMarriage.wifeId = newPerson.id
  }else{
    newMarriage.husbandId = newPerson.id
    newMarriage.wifeId = curPersonId
  }
  data.marriages.push(newMarriage)
  data.persons.push(newPerson)
  data.nextMarriageId++
  data.nextPersonId++
  await saveData(data)
}

// 关系产生下级
export const addChild = async(curMarriageId: number, newPerson: Person) => {
  const data = await loadData()
  const index = data.marriages.findIndex((m) => m.id === curMarriageId)
  const marriage = data.marriages[index]
  marriage.childrenIds?.push(data.nextPersonId)

  newPerson.generation = marriage.generation + 1
  newPerson.id = data.nextPersonId
  newPerson.birthMarriageId = curMarriageId
  data.persons.push(newPerson)
  data.nextPersonId++
  await saveData(data)
}
