<template>
  <div class="pic-convert-tool">
    <h2>🖼️ 图片格式转换工具</h2>

    <div class="upload-section">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :show-file-list="false"
        accept=".webp,.jpg,.jpeg,.png,.gif"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 WebP、JPG、PNG、GIF 格式
          </div>
        </template>
      </el-upload>
    </div>

    <div v-if="originalImage" class="preview-section">
      <h3>原图预览</h3>
      <img :src="originalImage" alt="原图" class="preview-image" />
    </div>

    <div v-if="originalImage" class="convert-section">
      <h3>转换设置</h3>
      <div class="format-selector">
        <el-radio-group v-model="targetFormat">
          <el-radio label="png">PNG</el-radio>
          <el-radio label="jpg">JPG</el-radio>
          <el-radio label="webp">WebP</el-radio>
        </el-radio-group>
      </div>

      <el-button
        type="primary"
        @click="convertImage"
        :loading="converting"
        size="large"
      >
        {{ converting ? '转换中...' : '开始转换' }}
      </el-button>
    </div>

    <div v-if="convertedImage" class="result-section">
      <h3>转换结果</h3>
      <img :src="convertedImage" alt="转换后" class="preview-image" />
      <div class="download-section">
        <el-button
          type="success"
          @click="downloadImage"
          size="large"
        >
          下载转换后的图片
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const originalImage = ref<string>('')
const convertedImage = ref<string>('')
const targetFormat = ref<string>('png')
const converting = ref<boolean>(false)
const fileName = ref<string>('')

// 处理文件上传
const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    originalImage.value = e.target?.result as string
    fileName.value = file.name.replace(/\.[^/.]+$/, '') // 移除扩展名
  }
  reader.readAsDataURL(file.raw)
}

// 转换图片格式
const convertImage = async () => {
  if (!originalImage.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  converting.value = true

  try {
    // 创建canvas元素
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 设置canvas尺寸
      canvas.width = img.width
      canvas.height = img.height

      // 绘制图片到canvas
      ctx?.drawImage(img, 0, 0)

      // 转换为指定格式
      let mimeType = 'image/png'
      if (targetFormat.value === 'jpg') mimeType = 'image/jpeg'
      if (targetFormat.value === 'webp') mimeType = 'image/webp'

      // 生成转换后的图片数据
      convertedImage.value = canvas.toDataURL(mimeType, 0.9)
      converting.value = false

      ElMessage.success('转换成功！')
    }

    img.src = originalImage.value
  } catch (error) {
    ElMessage.error('转换失败：' + (error as Error).message)
    converting.value = false
  }
}

// 下载转换后的图片
const downloadImage = () => {
  if (!convertedImage.value) return

  const link = document.createElement('a')
  link.download = `${fileName.value}.${targetFormat.value}`
  link.href = convertedImage.value
  link.click()

  ElMessage.success('下载开始')
}
</script>

<style scoped>
.pic-convert-tool {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.upload-section {
  margin-bottom: 30px;
}

.preview-section, .convert-section, .result-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.format-selector {
  margin: 20px 0;
}

.download-section {
  margin-top: 20px;
  text-align: center;
}

h2 {
  text-align: center;
  color: #303133;
  margin-bottom: 30px;
}

h3 {
  color: #606266;
  margin-bottom: 15px;
}
</style>
