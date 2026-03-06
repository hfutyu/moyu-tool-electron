<template>
  <div class="family-container">
    <el-dialog
      v-model="personFormVisible"
      class="custom-transition-dialog"
      :title="personDialogTitle"
      width="30%"
      transition="dialog-fade"
      @close="resetForm"
      :close-on-click-modal = false
    >
      <el-form
        label-position="top"
        label-width="auto"
        :model="personForm"
        style="max-width: 1000px;padding: 10px"
      >
<!--姓名 性别 出生日期 乳名 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" label-position="top">
              <el-input v-model="personForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="乳名" label-position="top">
              <el-input v-model="personForm.nickName" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="出生日期" label-position="top">
          <el-date-picker
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            v-model="personForm.birthDate"
            type="datetime"
            placeholder="选择出生日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="性别" label-position="top">
          <el-radio-group v-model="personForm.gender" :disabled="personDialogTitle.slice(0,2) === '编辑'">
            <el-radio :value="0" border>男</el-radio>
            <el-radio :value="1" border>女</el-radio>
            <el-radio value="10086" border disabled>同</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="简介">
          <el-input show-word-limit maxlength="30" v-model="personForm.remark" type="textarea" />
        </el-form-item>
        <el-form-item style="">
          <el-button style="margin-left: 25%" type="primary" @click="submitPersonForm()">
            {{personDialogTitle.slice(0,2)}}
          </el-button>
          <el-button type="info" @click="resetForm()">关闭</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
<!--    新增成员 无辈分 无血亲状态-->
    <el-row class="row-card">
      <el-col :span="16" class="col-card">统计看板</el-col>
      <el-col :span="8" class="col-card">
        <div class="panel-header">
          <h3>良缘列表</h3>
        </div>
        <el-table :data="marriages">
          <!--        <el-table-column fixed prop="id" label="编号" width="150" />-->
          <el-table-column prop="name" label="丈夫" width="120">
            <template #default="scope">
              {{ getPersonName(scope.row.husbandId) }}
            </template>
          </el-table-column>
          <el-table-column prop="gender" label="妻子" width="120">
            <template #default="scope">
              {{ getPersonName(scope.row.wifeId) }}
            </template>
          </el-table-column>
          <el-table-column prop="married" label="结婚日" width="120" />
        </el-table>
      </el-col>
    </el-row>
    <el-row class="row-card">
      <div class="panel-header">
        <h3>成员列表</h3>
        <el-tooltip
          class="box-item"
          effect="dark"
          content="只有无上级关系的祖辈节点从此处增加，其他节点由生育或结婚增加"
          placement="top-start"
        >
          <el-button type="success" @click="openPersonForm()">+ 添加祖辈</el-button>
        </el-tooltip>
      </div>
      <el-table
        :data = "persons"
        max-height="350px"
        :cell-style="{ textAlign: 'center' }"
        :header-cell-style="{ 'text-align': 'center' }">
        <el-table-column fixed prop="generation" label="辈分" width="120">
          <template #default="scope">
            {{digitMap[scope.row.generation]}}代
          </template>
        </el-table-column>
<!--        显示乳名-->
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="scope">
            <el-tooltip
              class="box-item"
              effect="dark"
              :content="scope.row.nickName ? `小名：${scope.row.nickName}` : '小名：未知'"
              placement="top-start"
            >
              {{scope.row.name}}
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.gender === 0">♂</el-tag>
            <el-tag style="color:rgb(224, 115, 224);border-color: rgb(242, 225, 229);background-color:rgb(252, 240, 252)" v-else-if="scope.row.gender === 1">♀</el-tag>
            <el-tag v-else>⚧</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="married" label="婚姻状态" width="120">
          <template #default="scope">
<!--            married-->
            <span v-if="scope.row.married === 1">已婚</span>
            <span v-else>未婚</span>
          </template>
        </el-table-column>
        <el-table-column prop="birthDate" label="出生日期" width="200" />
        <el-table-column prop="remark" label="简介" width="200" />
        <el-table-column fixed="right" label="行为" min-width="200">
          <template #default="scope">
            <el-button link type="primary" size="small" @click.prevent="openPersonForm(scope.row)">编辑</el-button>
            <el-button link type="primary" size="small" @click.prevent="openMarryForm(scope.row)" :disabled="scope.row.married === 1 ">结婚</el-button>
            <el-button link type="primary" size="small" @click.prevent="openBirthForm(scope.row)" :disabled="scope.row.married !== 1 ">生育</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-row>
    <div>
<!--      不要同 不要兄弟结合姐妹 不要未婚领养-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getPersons,
  getMarriages,
  addPerson,
  updatePerson,
  // deletePerson,
  // addMarriage,
  // updateMarriage,
  // deleteMarriage,
  type Person,
  type Marriage, digitMap
} from './FamilyService'

// 数据
const persons = ref<Person[]>([])
const marriages = ref<Marriage[]>([])

// 成员表单
const personDialogTitle = ref('新增成员')
const personFormVisible = ref(false)
const personForm = ref<Person>({id: 0,gender:0})

// // 婚姻表单
// const marryFormVisible = ref(false)
// const marryForm = ref({})
//
// // 婚姻表单
// const birthFormVisible = ref(false)
// const birthForm = ref({})

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
// 编辑新增
const openPersonForm = (person?: Person) => {
  if (person) { // 编辑
    personDialogTitle.value = '编辑成员'
    personForm.value = person
  } else { // 新增
    personDialogTitle.value = '新增成员'
    personForm.value = {id: 0,gender:0}
  }
  personFormVisible.value = true
}
const submitPersonForm = async () => {
  if (!personForm.value.name) {
    alert('请输入姓名')
    return
  }
  if (personForm.value.id !== 0) {
    // 编辑
    await updatePerson(personForm.value.id,personForm.value)
  } else {
    // 新增祖辈
    personForm.value.generation = 0
    await addPerson(personForm.value)
  }
  await loadData().then(()=>{
    personFormVisible.value = false
  })
}
// 结婚新增人员
const openMarryForm = (person?:Person) => {
  console.log(person)
}

// 出生新增人员
const openBirthForm = (person?:Person) => {
  console.log(person)
}
const resetForm = () => {
  personFormVisible.value = false
  personForm.value = {id: 0,gender:0}
}

//
// const savePerson = async () => {
//   if (!personForm.value.name) {
//     alert('请输入姓名')
//     return
//   }
//   if (editingPerson.value) {
//     await updatePerson(personForm.value)
//   } else {
//     const newPerson = await addPerson(personForm.value)
//
//     // 如果是从婚姻表单新建的孩子，添加到婚姻中
//     if (fromMarriageId.value && editingMarriage.value) {
//       const marriage = marriages.value.find(m => m.id === editingMarriage.value?.id)
//       if (marriage) {
//         const updatedMarriage = JSON.parse(JSON.stringify(marriage))
//         updatedMarriage.childrenIds.push(newPerson.id)
//         await updateMarriage(marriage.id, updatedMarriage)
//       }
//     } else if (fromMarriageId.value) {
//       // 新建婚姻时创建的孩子
//       marriageForm.value.childrenIds.push(newPerson.id)
//     }
//   }
//   personFormVisible.value = false
//   fromMarriageId.value = null
//   loadData()
// }
//
// const handleDeletePerson = async (id: number) => {
//   if (confirm('确定删除该成员？')) {
//     await deletePerson(id)
//     loadData()
//   }
// }
//
// // 关系操作
// const openMarriageForm = (marriage?: Marriage) => {
//   if (marriage) {
//     editingMarriage.value = marriage
//     marriageForm.value = {
//       husbandId: marriage.husbandId,
//       wifeId: marriage.wifeId,
//       marriageDate: marriage.marriageDate || '',
//       childrenIds: [...(marriage.childrenIds || [])]
//     }
//   } else {
//     editingMarriage.value = null
//     marriageForm.value = {
//       husbandId: 0,
//       wifeId: 0,
//       marriageDate: '',
//       childrenIds: []
//     }
//   }
//   selectedChildId.value = 0
//   marriageFormVisible.value = true
// }
//
// const saveMarriage = async () => {
//   if (!marriageForm.value.husbandId || !marriageForm.value.wifeId) {
//     alert('请选择丈夫和妻子')
//     return
//   }
//   if (marriageForm.value.husbandId === marriageForm.value.wifeId) {
//     alert('丈夫和妻子不能是同一个人')
//     return
//   }
//   if (editingMarriage.value) {
//     // 转换为普通对象，避免 IPC 序列化失败
//     const formData = JSON.parse(JSON.stringify(marriageForm.value))
//     await updateMarriage(editingMarriage.value.id, formData)
//   } else {
//     const formData = JSON.parse(JSON.stringify(marriageForm.value))
//     await addMarriage(formData)
//   }
//   marriageFormVisible.value = false
//   loadData()
// }
//
// const handleDeleteMarriage = async (id: number) => {
//   if (confirm('确定删除该关系？')) {
//     await deleteMarriage(id)
//     loadData()
//   }
// }

onMounted(loadData)
</script>

<style scoped>
.family-container {
  gap: 20px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.panel-header {
  width: 100%;
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

.row-card{
  width: 100%;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 8px;
  flex: 1;
  background: #fff;
  display: flex;
}
.col-card{
  border: 1px solid rgba(163, 163, 163, 0.1);
  padding: 15px;
  border-radius: 8px;
}
</style>
