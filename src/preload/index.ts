import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * 自定义 API - 用于渲染进程调用
 * 可在此扩展应用特定的 API 接口
 */
const api = {}

/**
 * 使用 contextBridge APIs 将 Electron API 暴露给渲染进程
 * 仅在启用上下文隔离时可用，否则直接添加到 DOM 全局对象
 */
if (process.contextIsolated) {
  try {
    /**
     * 暴露 electronAPI 到渲染进程的 window 对象
     * 渲染进程可通过 window.electron 调用 IPC 方法
     * 例如：window.electron.ipcRenderer.invoke('window-maximize')
     */
    contextBridge.exposeInMainWorld('electron', electronAPI)

    /**
     * 暴露自定义 api 到渲染进程的 window 对象
     * 渲染进程可通过 window.api 调用自定义方法
     */
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('预加载脚本初始化失败:', error)
  }
} else {
  // 上下文隔离未启用时的兼容处理
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
