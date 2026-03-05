<template>
  <div class="family-container">
    <!-- 成员管理 -->
    <div class="panel">
      <div class="panel-header">
        <h3>成员管理</h3>
        <button class="btn-add" @click="openPersonForm()">+ 添加成员</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>代数</th>
            <th>姓名</th>
            <th>性别</th>
            <th>生日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="person in persons" :key="person.id">
            <td>{{ person.generation || 1 }}代</td>
            <td>{{ person.name }}</td>
            <td>{{ person.gender === 0 ? '男' : '女' }}</td>
            <td>{{ person.birthDate || '-' }}</td>
            <td>
              <button class="btn-edit" @click="openPersonForm(person)">编辑</button>
              <button class="btn-delete" @click="handleDeletePerson(person.id)">删除</button>
            </td>
          </tr>
          <tr v-if="persons.length === 0">
            <td colspan="4" class="empty">暂无成员，请添加</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 关系管理 -->
    <div class="panel">
      <div class="panel-header">
        <h3>关系管理</h3>
        <button class="btn-add" @click="openMarriageForm()">+ 添加关系</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>丈夫</th>
            <th>妻子</th>
            <th>结婚日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="marriage in marriages" :key="marriage.id">
            <td>{{ getPersonName(marriage.husbandId) }}</td>
            <td>{{ getPersonName(marriage.wifeId) }}</td>
            <td>{{ marriage.marriageDate || '-' }}</td>
            <td>
              <button class="btn-edit" @click="openMarriageForm(marriage)">编辑</button>
              <button class="btn-delete" @click="handleDeleteMarriage(marriage.id)">删除</button>
            </td>
          </tr>
          <tr v-if="marriages.length === 0">
            <td colspan="4" class="empty">暂无关系，请添加</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 成员表单弹窗 -->
    <div v-if="personFormVisible" class="modal" @click.self="personFormVisible = false">
      <div class="modal-content">
        <h4>{{ editingPerson ? '编辑成员' : '添加成员' }}</h4>
        <div class="form-group">
          <label>代数</label>
          <input v-model.number="personForm.generation" type="number" min="1" placeholder="请输入代数" />
        </div>
        <div class="form-group">
          <label>姓名</label>
          <input v-model="personForm.name" placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label>性别</label>
          <select v-model="personForm.gender">
            <option :value="0">男</option>
            <option :value="1">女</option>
          </select>
        </div>
        <div class="form-group">
          <label>出生日期</label>
          <input v-model="personForm.birthDate" type="date" />
        </div>
        <div class="form-group">
          <label>备注</label>
          <input v-model="personForm.remark" placeholder="请输入备注" />
        </div>
        <div class="modal-actions">
          <button class="btn-save" @click="savePerson">保存</button>
          <button class="btn-cancel" @click="personFormVisible = false">取消</button>
        </div>
      </div>
    </div>

<!--     关系表单弹窗-->
    <div v-if="marriageFormVisible" class="modal" @click.self="marriageFormVisible = false">
      <div class="modal-content">
        <h4>{{ editingMarriage ? '编辑关系' : '添加关系' }}</h4>
        <div class="form-group">
          <label>丈夫</label>
          <select v-model="marriageForm.husbandId">
            <option :value="0" disabled>请选择丈夫</option>
            <option v-for="p in males" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>妻子</label>
          <select v-model="marriageForm.wifeId">
            <option :value="0" disabled>请选择妻子</option>
            <option v-for="p in females" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>结婚日期</label>
          <input v-model="marriageForm.marriageDate" type="date" />
        </div>

        <!-- 孩子列表 -->
        <div class="form-group">
          <label>孩子</label>
          <div class="children-list">
            <div v-for="childId in marriageForm.childrenIds" :key="childId" class="child-item">
              <span>{{ getPersonName(childId) }}</span>
              <button class="btn-remove-child" @click="removeChild(childId)">×</button>
            </div>
            <div v-if="marriageForm.childrenIds.length === 0" class="no-children">暂无孩子</div>
          </div>
          <div class="child-actions">
            <select v-model="selectedChildId" @change="addExistingChild">
              <option :value="0" disabled>添加已有孩子</option>
              <option v-for="p in availableChildren" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button class="btn-add-child" @click="openPersonForm(undefined, editingMarriage?.id || 0)">+ 新建孩子</button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-save" @click="saveMarriage">保存</button>
          <button class="btn-cancel" @click="marriageFormVisible = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getPersons,
  getMarriages,
  addPerson,
  updatePerson,
  deletePerson,
  addMarriage,
  updateMarriage,
  deleteMarriage,
  type Person,
  type Marriage
} from './FamilyService'

// 数据
const persons = ref<Person[]>([])
const marriages = ref<Marriage[]>([])

// 成员表单
const personFormVisible = ref(false)
const editingPerson = ref<Person | null>(null)
const personForm = ref({
  generation: 1,
  name: '',
  gender: 0 as 0 | 1,
  birthDate: '',
  remark: ''
})
// 标记是否从婚姻表单中新建孩子
const fromMarriageId = ref<number | null>(null)

// 关系表单
const marriageFormVisible = ref(false)
const editingMarriage = ref<Marriage | null>(null)
const marriageForm = ref({
  husbandId: 0,
  wifeId: 0,
  marriageDate: '',
  childrenIds: [] as number[]
})
const selectedChildId = ref(0)

// 添加已有孩子
const addExistingChild = () => {
  if (selectedChildId.value && !marriageForm.value.childrenIds.includes(selectedChildId.value)) {
    marriageForm.value.childrenIds.push(selectedChildId.value)
    selectedChildId.value = 0
  }
}

// 移除孩子
const removeChild = (childId: number) => {
  marriageForm.value.childrenIds = marriageForm.value.childrenIds.filter(id => id !== childId)
}

// 可选的孩子列表（排除夫妻双方）
const availableChildren = computed(() => {
  const excludeIds = [marriageForm.value.husbandId, marriageForm.value.wifeId, ...marriageForm.value.childrenIds]
  return persons.value.filter(p => !excludeIds.includes(p.id))
})

// 计算属性
const males = computed(() => persons.value.filter((p) => p.gender === 0))
const females = computed(() => persons.value.filter((p) => p.gender === 1))

// //加载数据
const loadData = async () => {
  persons.value = await getPersons()
  marriages.value = await getMarriages()
}

// 获取成员姓名
const getPersonName = (id: number) => {
  return persons.value.find((p) => p.id === id)?.name || '-'
}

// 成员操作
const openPersonForm = (person?: Person, marriageId?: number) => {
  if (person) {
    editingPerson.value = person
    personForm.value = {
      generation: person.generation || 1,
      name: person.name,
      gender: person.gender,
      birthDate: person.birthDate || '',
      remark: person.remark || ''
    }
    fromMarriageId.value = null
  } else {
    editingPerson.value = null
    personForm.value = {
      generation: 1,
      name: '',
      gender: 0,
      birthDate: '',
      remark: ''
    }
    fromMarriageId.value = marriageId ?? null
  }
  personFormVisible.value = true
}
//
const savePerson = async () => {
  if (!personForm.value.name.trim()) {
    alert('请输入姓名')
    return
  }
  if (editingPerson.value) {
    await updatePerson(editingPerson.value.id, personForm.value)
  } else {
    const newPerson = await addPerson(personForm.value)

    // 如果是从婚姻表单新建的孩子，添加到婚姻中
    if (fromMarriageId.value && editingMarriage.value) {
      const marriage = marriages.value.find(m => m.id === editingMarriage.value?.id)
      if (marriage) {
        const updatedMarriage = JSON.parse(JSON.stringify(marriage))
        updatedMarriage.childrenIds.push(newPerson.id)
        await updateMarriage(marriage.id, updatedMarriage)
      }
    } else if (fromMarriageId.value) {
      // 新建婚姻时创建的孩子
      marriageForm.value.childrenIds.push(newPerson.id)
    }
  }
  personFormVisible.value = false
  fromMarriageId.value = null
  loadData()
}

const handleDeletePerson = async (id: number) => {
  if (confirm('确定删除该成员？')) {
    await deletePerson(id)
    loadData()
  }
}

// 关系操作
const openMarriageForm = (marriage?: Marriage) => {
  if (marriage) {
    editingMarriage.value = marriage
    marriageForm.value = {
      husbandId: marriage.husbandId,
      wifeId: marriage.wifeId,
      marriageDate: marriage.marriageDate || '',
      childrenIds: [...(marriage.childrenIds || [])]
    }
  } else {
    editingMarriage.value = null
    marriageForm.value = {
      husbandId: 0,
      wifeId: 0,
      marriageDate: '',
      childrenIds: []
    }
  }
  selectedChildId.value = 0
  marriageFormVisible.value = true
}

const saveMarriage = async () => {
  if (!marriageForm.value.husbandId || !marriageForm.value.wifeId) {
    alert('请选择丈夫和妻子')
    return
  }
  if (marriageForm.value.husbandId === marriageForm.value.wifeId) {
    alert('丈夫和妻子不能是同一个人')
    return
  }
  if (editingMarriage.value) {
    // 转换为普通对象，避免 IPC 序列化失败
    const formData = JSON.parse(JSON.stringify(marriageForm.value))
    await updateMarriage(editingMarriage.value.id, formData)
  } else {
    const formData = JSON.parse(JSON.stringify(marriageForm.value))
    await addMarriage(formData)
  }
  marriageFormVisible.value = false
  loadData()
}

const handleDeleteMarriage = async (id: number) => {
  if (confirm('确定删除该关系？')) {
    await deleteMarriage(id)
    loadData()
  }
}

onMounted(loadData)
</script>

<style scoped>
.family-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.panel {
  flex: 1;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
  flex: 1;
}

th,
td {
  border: 1px solid #eee;
  padding: 10px 8px;
  text-align: left;
  font-size: 14px;
}

th {
  background: #f5f5f5;
  font-weight: 500;
  color: #666;
}

td {
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px !important;
}

button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  margin-right: 5px;
  transition: all 0.2s;
}

.btn-add {
  background: #4caf50;
  color: white;
}

.btn-add:hover {
  background: #45a049;
}

.btn-edit {
  background: #2196f3;
  color: white;
}

.btn-edit:hover {
  background: #1976d2;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #d32f2f;
}

.btn-save {
  background: #4caf50;
  color: white;
}

.btn-save:hover {
  background: #45a049;
}

.btn-cancel {
  background: #9e9e9e;
  color: white;
}

.btn-cancel:hover {
  background: #757575;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 8px;
  min-width: 350px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #2196f3;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.modal-actions button {
  flex: 1;
  padding: 10px;
}

/* 孩子列表样式 */
.children-list {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  min-height: 60px;
  max-height: 120px;
  overflow-y: auto;
}

.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 5px;
}

.child-item:last-child {
  margin-bottom: 0;
}

.btn-remove-child {
  background: #f44336;
  color: white;
  padding: 2px 8px;
  font-size: 12px;
}

.btn-remove-child:hover {
  background: #d32f2f;
}

.no-children {
  color: #999;
  text-align: center;
  padding: 10px;
}

.child-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.child-actions select {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-add-child {
  background: #2196f3;
  color: white;
  padding: 8px 12px;
  white-space: nowrap;
}

.btn-add-child:hover {
  background: #1976d2;
}
</style>
