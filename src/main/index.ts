import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

/**
 * 窗口最小化
 */
ipcMain.handle('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

/**
 * 窗口最大化/还原切换
 */
ipcMain.handle('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
      return false
    } else {
      win.maximize()
      return true
    }
  }
  return false
})

/**
 * 窗口关闭
 */
ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})

/**
 * 通用数据读取
 */
ipcMain.handle('data-load', (_, fileName: string) => {
  const filePath = getDataFilePath(fileName)
  if (existsSync(filePath)) {
    const data = readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  }
  return null
})

/**
 * 通用数据保存
 */
ipcMain.handle('data-save', (_, fileName: string, data: unknown) => {
  const filePath = getDataFilePath(fileName)
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return true
})

/**
 * 打开数据目录
 */
ipcMain.handle('open-data-folder', () => {
  shell.openPath(app.getPath('userData'))
})


// 应用准备就绪
app.whenReady().then(() => {
  // 设置应用程序的用户模型 ID（用于 Windows）
  electronApp.setAppUserModelId('com.electron')

  // 监听窗口创建，优化窗口快捷键
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC 测试
  ipcMain.on('ping', () => console.log('pong'))

  // 创建主窗口
  mainWindow = createMainWindow()

  // macOS 应用激活处理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    }
  })
})

/**
 * 创建主窗口
 */
function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1350,
    height: 800,
    show: true,
    icon: join(__dirname, '../../resources/icon.ico'),
    autoHideMenuBar: true,
    title: '我的应用程序',
    titleBarStyle: 'hidden',
    webPreferences: {
      webSecurity: false,
      webviewTag: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  // 阻止外部链接在应用内打开，改为使用系统默认浏览器
  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 根据环境加载不同 URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  return window
}


/**
 * 通用数据文件路径
 */
const getDataFilePath = (fileName: string): string => {
  return join(app.getPath('userData'), `${fileName}.json`)
}

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  mainWindow?.show()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
