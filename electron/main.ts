import 'dotenv/config'
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { disconnectDb } from './db'
import { registerReviewHandlers } from './ipc/reviews'
import { registerWordbankHandlers } from './ipc/wordbank'
import { registerConversationHandlers } from './ipc/conversation'
import { registerTomHandlers } from './ipc/tom'
import { registerProfileHandlers } from './ipc/profile'
import { registerCurriculumHandlers } from './ipc/curriculum'
import { registerPragmaticHandlers } from './ipc/pragmatics'
import { registerContextLogHandlers } from './ipc/context-log'
import { registerDashboardHandlers } from './ipc/dashboard'

function createWindow(): void {
  const isMac = process.platform === 'darwin'

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    ...(isMac && {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 18 },
    }),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerReviewHandlers()
  registerWordbankHandlers()
  registerConversationHandlers()
  registerTomHandlers()
  registerProfileHandlers()
  registerCurriculumHandlers()
  registerPragmaticHandlers()
  registerContextLogHandlers()
  registerDashboardHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', async () => {
  await disconnectDb()
})
