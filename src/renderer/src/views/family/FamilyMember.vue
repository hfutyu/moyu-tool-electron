<template>
  <div class="family-container">
<!-- 结婚抽屉 -->
    <el-drawer
      v-model="personInfoFormVisible"
      :title="personInfoDialogTitle"
      direction="rtl"
      size="350px"
      @close="loadData"
    >
      <div class="person-info-content">
        <!-- 个人信息卡片 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">个人信息</span>
              <el-tooltip
                v-if="!infoEdit"
                content="点击编辑个人信息"
                placement="top"
              >
                <el-button :icon="Lock" @click="infoEdit = !infoEdit" circle/>
              </el-tooltip>
              <el-tooltip
                v-else
                content="点击保存个人信息"
                placement="top"
              >
                <el-button type="success" :icon="Check" @click="infoSaveSelfClick" circle />
              </el-tooltip>
            </div>
          </template>
          <div class="person-avatar-section">
            <el-avatar :size="40" :src="currentPerson?.avatar || undefined">
              {{ currentPerson?.name?.charAt(0) || '?' }}
            </el-avatar>
            <div class="person-basic-info" v-if="currentPerson">
              <div class="person-name" v-if="currentPerson">
                <span v-if="!infoEdit">{{ currentPerson?.name }}</span>
                <el-input style="width: 70px;height: 20px" v-else v-model="currentPerson.name"></el-input>
                <el-tag :type="currentPerson.gender === 0 ? 'primary' : 'danger'" size="small">
                  {{ currentPerson.gender === 0 ? '♂ 男' : '♀ 女' }}
                </el-tag>
              </div>
              <p class="person-nickname">乳名：
                <span v-if="!infoEdit">{{ currentPerson.nickName }}</span>
                <el-input class="person-nickname-input" v-else v-model="currentPerson.nickName"></el-input>
              </p>
              <p class="person-generation">辈分：{{ digitMap[currentPerson?.generation || 0] }}代</p>
            </div>
          </div>
          <el-descriptions v-if="currentPerson" :column="1" border size="small" label-width="65px">
            <el-descriptions-item label="出生日期">
              <span v-if="!infoEdit"> {{ currentPerson.birthDate || '未知' }}</span>
              <el-date-picker
                v-else
                :clearable="false"
                value-format="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm:ss"
                v-model="currentPerson.birthDate"
                type="datetime"
                placeholder="选择出生日期"
                style="height: 20px;width: 185px;"
              />
            </el-descriptions-item>
            <el-descriptions-item label="婚姻状态">
              <el-tag :type="currentPerson?.married === 1 ? 'success' : 'info'" size="small">
                {{ currentPerson?.married === 1 ? '已婚' : '未婚' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="简介">
              <span v-if="!infoEdit">{{ currentPerson?.remark || '暂无' }}</span>
              <el-input style="height: 20px;width: 185px;" maxlength="15" v-else v-model="currentPerson.remark"></el-input>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 伴侣信息卡片 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">伴侣信息</span>
              <el-tooltip
                v-if="spouse"
                :content="`跳转到${spouse.name}信息`"
                placement="top"
              >
                <el-button :icon="Connection" circle />
              </el-tooltip>
              <el-tooltip
                v-else
                content="结伴"
                placement="top"
              >
                <el-button type="success" :icon="Plus" @click="openPersonForm(undefined, 2)" circle />
              </el-tooltip>
            </div>
          </template>
          <div class="relation-item" v-if="spouse">
            <el-avatar :size="40" :src="spouse.avatar || undefined">
              {{ spouse.name?.charAt(0) }}
            </el-avatar>
            <div class="relation-info">
              <span class="relation-name">{{ spouse.name }}</span>
              <el-tag type="warning" size="small">{{ spouse.gender === 0 ? '丈夫' : '妻子' }}</el-tag>
            </div>
          </div>
          <el-descriptions :column="1" border size="small" style="margin-top: 15px" v-if="spouse">
            <el-descriptions-item label="结婚日期">
              {{ currentMarriage?.marriageDate || '未知' }}
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="还是个单身狗" :image-size="24" />
        </el-card>

        <!-- 子女信息卡片 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">子女信息</span>
              <span class="count-badge">{{ children.length }}人
                 <el-tooltip
                   content="生育"
                   placement="top"
                 >
                  <el-button :disabled="!spouse" class="add-child-btn" :icon="Plus" @click="openPersonForm(undefined, 3)" circle></el-button>
                 </el-tooltip>
              </span>
            </div>
          </template>
          <div class="children-list" v-if="children.length > 0">
            <div class="child-item" v-for="child in children" :key="child.id">
              <div class="child-avatar">
                <el-avatar :size="40" :src="child.avatar || undefined">
                  {{ child.name?.charAt(0) }}
                </el-avatar>
                <el-tag :type="child.gender === 0 ? 'primary' : 'danger'" size="small" class="gender-tag">
                  {{ child.gender === 0 ? '♂' : '♀' }}
                </el-tag>
              </div>
              <div class="child-info">
                <span class="child-name">{{ child.name }}</span>
                <span class="child-generation">{{ digitMap[child.generation || 0] }}代</span>
              </div>
              <div style="width: 40%;"></div>
              <el-tooltip
                :content="`跳转到${child.name}信息`"
                placement="top"
              >
                <el-button
                  :icon="Connection" circle />
              </el-tooltip>
            </div>
          </div>
          <el-empty v-else description="暂无子女信息" :image-size="60" />
        </el-card>

        <!-- 父母信息卡片 -->
        <el-card class="info-card" shadow="hover" v-if="parents.length">
          <template #header>
            <div class="card-header">
              <span class="card-title">父母信息</span>
              <el-icon><UserFilled /></el-icon>
            </div>
          </template>
          <div class="relation-list">
            <div class="relation-item" v-for="parent in parents" :key="parent.id">
              <el-avatar :size="40" :src="parent.avatar || undefined">
                {{ parent.name?.charAt(0) }}
              </el-avatar>
              <div class="relation-info">
                <span class="relation-name">{{ parent.name }}</span>
                <el-tag :type="parent.gender === 0 ? 'primary' : 'danger'" size="small">
                  {{ parent.gender === 0 ? '父亲' : '母亲' }}
                </el-tag>
              </div>
              <div style="width: 40%;"></div>
              <el-tooltip
                :content="`跳转到${parent.name}信息`"
                placement="top"
              >
                <el-button
                  :icon="Connection" circle />
              </el-tooltip>
            </div>
          </div>
        </el-card>

        <!-- 兄弟姐妹卡片 -->
        <el-card class="info-card" shadow="hover" v-if="siblings.length > 0">
          <template #header>
            <div class="card-header">
              <span class="card-title">兄弟姐妹</span>
              <span class="count-badge">{{ siblings.length }}人</span>
            </div>
          </template>
          <div class="avatar-stack">
            <el-tooltip
              v-for="sibling in siblings"
              :key="sibling.id"
              :content="sibling.name"
              placement="top"
            >
              <el-avatar :size="45" :src="sibling.avatar || undefined" class="stacked-avatar">
                {{ sibling.name?.charAt(0) }}
              </el-avatar>
            </el-tooltip>
          </div>
        </el-card>

      </div>
    </el-drawer>
<!--    直接新增、编辑人员弹窗   -->
    <el-dialog
      v-model="personFormVisible"
      class="custom-transition-dialog"
      :title="personDialogTitleEnum[personDialogTitle]"
      width="30%"
      transition="dialog-fade"
      @close="resetPersonForm"
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
        <el-form-item v-if="personDialogTitle === 2" label="结婚日期" label-position="top">
          <el-date-picker
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            v-model="marriageForm.marriageDate"
            type="datetime"
            placeholder="选择结婚日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="性别" label-position="top">
          <el-radio-group v-model="personForm.gender" :disabled="personDialogTitle === 0||personDialogTitle === 2">
            <el-radio :value="0" border>男</el-radio>
            <el-radio :value="1" border>女</el-radio>
            <el-radio value="10086" border disabled>同</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="简介">
          <el-input show-word-limit maxlength="15" v-model="personForm.remark" type="textarea" />
        </el-form-item>
        <el-form-item style="">
          <el-button style="margin-left: 30%" type="primary" @click="submitPersonForm()">
            {{personDialogTitleEnum[personDialogTitle].slice(0,2)}}
          </el-button>
          <el-button type="info" @click="resetPersonForm()">关闭</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
<!--    新增成员 无辈分 无血亲状态-->
    <el-row class="row-card">
      <el-col :span="16" class="col-card">统计看板</el-col>
      <el-col :span="8" class="col-card">
        <div class="panel-header">
          <h3>关系列表</h3>
        </div>
        <el-table
          :data="marriages"
          :cell-style="{ textAlign: 'center' }"
          :header-cell-style="{ 'text-align': 'center' }">>
          <!--        <el-table-column fixed prop="id" label="编号" width="150" />-->
          <el-table-column prop="name" label="丈夫">
            <template #default="scope">
              {{ getPersonName(scope.row.husbandId) }}
            </template>
          </el-table-column>
          <el-table-column prop="gender" label="妻子">
            <template #default="scope">
              {{ getPersonName(scope.row.wifeId) }}
            </template>
          </el-table-column>
          <el-table-column prop="marriageDate" label="结婚日" width="160"/>
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
          <el-button type="success" @click="openPersonForm(undefined,1)">+ 添加祖辈</el-button>
        </el-tooltip>
      </div>
      <el-table
        :data = "persons"
        max-height="400px"
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
        <el-table-column prop="remark" label="简介" />
        <el-table-column fixed="right" label="行为" width="150">
          <template #default="scope">
            <el-button link type="primary" size="small" @click.prevent="openPersonForm(scope.row, 0)">编辑</el-button>
            <el-button link type="primary" size="small" @click.prevent="openPersonInfoForm(scope.row)">个人信息</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-row>
    <div style="height: 20px;width: 20px;">
<!--      不要同 不要兄弟结合姐妹 不要未婚领养-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UserFilled, Connection, Lock, Check, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPersons,
  getMarriages,
  addPerson,
  updatePerson,
  marriageAddPerson,
  type Person,
  type Marriage, digitMap, addChild
} from './FamilyService'

// 数据
const persons = ref<Person[]>([])
const marriages = ref<Marriage[]>([])

// 成员表单
const personDialogTitleEnum =ref<string[]>([
  '编辑成员','新增成员','新增结婚对象','新增孩子'
])
const personDialogTitle = ref<number>(1)
const personFormVisible = ref(false)
const personForm = ref<Person>({ name: '', generation: 0, id: 0,gender:0})
const marriageForm = ref<Marriage>({ marriageDate: '', generation: 0, childrenIds: [], husbandId: 0, wifeId: 0, id: 0})

// 个人信息表单
const personInfoDialogTitle = ref('个人信息')
const personInfoFormVisible = ref(false)

// 抽屉详情数据
const currentPerson = ref<Person>({ generation: 0, id: 0, name: '' })
const parents = ref<Person[]>([])
const siblings = ref<Person[]>([]) // 兄弟姐妹
const spouse = ref<Person | null>(null) // 配偶
const children = ref<Person[]>([]) // 孩子
const currentMarriage = ref<Marriage | undefined>(undefined)

const infoEdit = ref(false)

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
const openPersonForm = (person?: Person, type: number = 1) => {
  personDialogTitle.value = type
  resetFormData()

  if (type === 0 && person){
    personForm.value = person
  }else if(type === 1){
    // 新增祖辈
    personDialogTitle.value = 1
    personForm.value = { name: '', id: 0,gender:0,generation: 0,married: 0}
  }else if(type === 2 && currentPerson.value){
    // 结婚
    personDialogTitle.value = 2
    personForm.value.gender = currentPerson.value.gender === 0?1:0
  }else if(type === 3 && currentMarriage.value){
    // 生子
    // 新增人员 代 birthMarriageId 关系新增孩子id
    personDialogTitle.value = 3
  }
  personFormVisible.value = true
}
// 新增编辑提交
const submitPersonForm = async () => {
  if (!personForm.value.name) {
    alert('姓名不为空')
    return
  }
  if(personDialogTitle.value === 0){ // 编辑
    await updatePerson(personForm.value.id,personForm.value)
  }else if(personDialogTitle.value === 1){ // 新增
    await addPerson(personForm.value)
  }else if(personDialogTitle.value === 2){ // 结婚
    await marriageAddPerson(currentPerson.value.id,personForm.value,marriageForm.value)
  }else if (personDialogTitle.value === 3 && currentMarriage.value){ // 生子
    await addChild(currentMarriage.value.id,personForm.value)
  }
  await loadData().then(()=>{
    personFormVisible.value = false
    personInfoFormVisible.value = false
  })
}

const resetPersonForm = () => {
  personFormVisible.value = false
  resetFormData()
}

const resetFormData = () => {
  personForm.value = { name: '', generation: 0, id: 0,gender:0}
  marriageForm.value ={ marriageDate: '', generation: 0, childrenIds: [], husbandId: 0, wifeId: 0, id: 0}
}

// 个人信息保存个人
const infoSaveSelfClick = () => {
  ElMessageBox.confirm(
    '确定将修改数据提交？',
    '确认修改',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'success',
    }
  )
    .then( async () => {
      infoEdit.value = false
      if (currentPerson.value){
        await updatePerson(currentPerson.value.id,currentPerson.value)
      }
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消',
      })
    })
}
// 个人信息抽屉打开
const openPersonInfoForm = (person: Person) => {
  infoEdit.value = false
  currentPerson.value = person
  personInfoDialogTitle.value = (person.nickName || person.name) + ' 基本信息'

  // 获取父母信息
  if (person.birthMarriageId) {
    const birthMarriage = marriages.value.find(m => m.id === person.birthMarriageId)
    if (birthMarriage) {
      parents.value = [
        persons.value.find(p => p.id === birthMarriage.husbandId),
        persons.value.find(p => p.id === birthMarriage.wifeId)
      ].filter(Boolean) as Person[]

      // 获取兄弟姐妹（同一父母的其他孩子，排除自己）
      const allChildren = birthMarriage.childrenIds?[...birthMarriage.childrenIds]:[]
      siblings.value = persons.value.filter(p =>
        allChildren.includes(p.id) && p.id !== person.id
      )
    }
  } else {
    parents.value = []
    siblings.value = []
  }

  // 获取伴侣信息
  if (person.marriageId) {
    const marriage = marriages.value.find(m => m.id === person.marriageId)
    if (marriage) {
      currentMarriage.value = marriage
      spouse.value = persons.value.find(p =>
        p.id === (marriage.husbandId === person.id ? marriage.wifeId : marriage.husbandId)
      ) || null

      // 获取子女信息
      children.value = persons.value.filter(p =>
        marriage.childrenIds?.includes(p.id)
      )
    }
  } else {
    spouse.value = null
    currentMarriage.value = undefined
    children.value = []
  }

  personInfoFormVisible.value = true
}

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

/* 结婚抽屉样式 */
.person-info-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-card {
  border-radius: 12px;
}

:deep(.el-card__body) {
  padding: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
:deep(.el-card__header) {
  padding: 10px 12px;
}
.card-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.person-avatar-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.person-basic-info {
  flex: 1;
}

.person-name {
  margin: 0 0 2px 0;
  font-size: 16px;
  color: #303133;
}

.person-nickname,
.person-generation {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.relation-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.relation-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background: #f5f7fa;
  border-radius: 6px;
}

.relation-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.relation-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.count-badge {
  background: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 13px;
}

.avatar-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stacked-avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.stacked-avatar:hover {
  transform: scale(1.1);
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.child-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 6px;
}

.child-avatar {
  position: relative;
}

.gender-tag {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 10px;
  padding: 0 3px;
}

.child-info {
  display: flex;
  flex-direction: column;
}

.child-name {
  font-weight: 500;
  color: #303133;
}

.child-generation {
  font-size: 12px;
  color: #909399;
}
.person-nickname-input{
  width: 70px;
  height: 12px;
}
.person-nickname-input >>> .el-input__inner{
  font-size:11px;
}
.add-child-btn{
  padding-bottom: 10px;
  background-color: rgba(255,255,255,0);
  height: 10px;width: 1px;
  border-color: rgba(255,255,255,0);
  color: white
}
</style>
