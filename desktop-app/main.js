const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;

let mainWindow = null;
let tray = null;
let server = null;
const PORT = 2919;
const API_PORT = 2920;

// Data file for port names
const DATA_FILE = path.join(app.getPath('userData'), 'port-names.json');

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '{}');
  }
}

// Create Express server for API
function createAPIServer() {
  const apiApp = express();
  apiApp.use(cors());
  apiApp.use(express.json());

  // Port scanning endpoint
  apiApp.get('/api/ports', async (req, res) => {
    exec('lsof -iTCP -sTCP:LISTEN -P -n', (error, stdout, stderr) => {
      if (error) {
        return res.json({ ports: [], error: 'Failed to scan ports' });
      }

      const ports = [];
      const lines = stdout.split('\n').slice(1);
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split(/\s+/);
        if (parts.length < 9) continue;
        
        const processName = parts[0];
        const pid = parts[1];
        const portInfo = parts[8];
        
        const portMatch = portInfo.match(/:(\d+)$/);
        if (portMatch) {
          const port = parseInt(portMatch[1]);
          
          if (port >= 1 && port <= 10000) {
            const existingPort = ports.find(p => p.port === port);
            if (!existingPort) {
              ports.push({
                port,
                process: processName,
                pid,
                protocol: 'TCP'
              });
            }
          }
        }
      }
      
      ports.sort((a, b) => a.port - b.port);
      res.json({ ports });
    });
  });

  // Port names endpoints
  apiApp.get('/api/port-names', async (req, res) => {
    try {
      await ensureDataFile();
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({});
    }
  });

  apiApp.post('/api/port-names', async (req, res) => {
    try {
      await ensureDataFile();
      const { port, name } = req.body;
      
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      const portNames = JSON.parse(data);
      
      if (name && name.trim()) {
        portNames[port] = name.trim();
      } else {
        delete portNames[port];
      }
      
      await fs.writeFile(DATA_FILE, JSON.stringify(portNames, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save port name' });
    }
  });

  server = apiApp.listen(API_PORT, () => {
    console.log(`API server running on port ${API_PORT}`);
  });
}

function createWindow() {
  // Try to load custom icon if it exists
  let iconPath = path.join(__dirname, 'assets', 'icon.png');
  let icon;
  
  try {
    // Check if PNG exists, otherwise try SVG
    if (!require('fs').existsSync(iconPath)) {
      iconPath = path.join(__dirname, 'assets', 'icon.svg');
    }
    if (require('fs').existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
    }
  } catch (e) {
    console.log('Icon not found, using default');
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: icon,
    titleBarStyle: 'hiddenInset',
    show: false
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent window from closing, just hide it
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Create tray icon - try to load custom icon
  let trayIconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  let trayIcon;
  
  try {
    if (!require('fs').existsSync(trayIconPath)) {
      trayIconPath = path.join(__dirname, 'assets', 'tray-icon.svg');
    }
    if (require('fs').existsSync(trayIconPath)) {
      trayIcon = nativeImage.createFromPath(trayIconPath);
      // Make it smaller for menu bar
      trayIcon = trayIcon.resize({ width: 22, height: 22 });
    } else {
      // Create a simple default icon
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('Port Monitor');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Port Monitor',
      click: () => {
        if (!mainWindow) {
          createWindow();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Open at Login',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: true
        });
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Click on tray icon shows window
  tray.on('click', () => {
    if (!mainWindow) {
      createWindow();
    } else {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

app.whenReady().then(() => {
  createAPIServer();
  createTray();
  createWindow();
});

app.on('window-all-closed', () => {
  // Don't quit when all windows are closed (keep in tray)
  if (process.platform !== 'darwin') {
    // Keep app running in tray
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (server) {
    server.close();
  }
});