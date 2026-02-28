# 摸鱼工具箱

一个使用 Electron + Vue 3 + TypeScript 构建的桌面工具箱应用，在上班摸鱼开发，由全栈主后端开发人员借助AI工具开发而成。

## 功能列表

### 常用工具
- **API 调试** - HTTP 接口调试工具
- **图片转换器** - 图片格式转换处理
- **Unicode 转换器** - Unicode 字符编码转换
- **JSON 解析** - JSON 格式化与解析
- **时间戳工具** - Unix 时间戳转换
- **进制转换** - 数字进制转换（二进制、八进制、十进制、十六进制）

### 休闲娱乐
- **2048** - 经典数字益智游戏
- **纸飞机** - 投掷纸飞机小游戏
- **五子棋** - 人机对战五子棋

### 赛博系列
- **赛博魔镜** - AI 对话工具（集成千问）
- **赛博祭祖** - 数字纪念先人
- **赛博宠物猫** - 虚拟宠物养成

### 其他功能
- **备忘录** - 日常记录
- **个人中心** - 用户中心

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **桌面框架**: Electron
- **构建工具**: electron-vite
- **UI 组件**: Element Plus
- **网络请求**: Axios
- **路由**: Vue Router

## 开发

### 环境要求
- Node.js 18+
- npm 9+

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建安装包
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 项目结构

```
my-app/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # 预加载脚本
│   └── renderer/       # Vue 渲染进程
│       └── src/
│           ├── views/     # 页面组件
│           ├── components/# 公共组件
│           ├── router/    # 路由配置
│           └── utils/     # 工具函数
├── resources/         # 静态资源
└── build/            # 构建配置
```

## License

MIT
