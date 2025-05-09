// main.js
const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const path = require('path');
const AsaQuery = require('asa-query');
const sound = require('sound-play');
const config = require('./config');
const fs = require('fs');
const os = require('os');

const extractIfNeeded = (filename) => {
  const tempPath = path.join(app.getPath('userData'), filename);
  if (!fs.existsSync(tempPath)) {
    const buffer = fs.readFileSync(path.join(__dirname, filename));
    fs.writeFileSync(tempPath, buffer);
  }
  return tempPath;
}

//const onlineSound = path.join(__dirname, 'online.wav');
//const offlineSound = path.join(__dirname, 'offline.wav');
const onlineSound = extractIfNeeded('online.wav');
const offlineSound = extractIfNeeded('offline.wav');

let previousStatus = null;
let tray = null;
let checkStatusInterval = null;

let win;
let configWindow = null;

// Function to refresh the window transparency properly
function refreshWindowTransparency() {
  if (!win) return;
  
  // Force reset of background color
  win.setBackgroundColor('#00000000');
  
  // Send a refresh event to the renderer
  win.webContents.send('refresh-overlay');
  
  // Force a redraw by toggling a property
  const pos = win.getPosition();
  win.setPosition(pos[0], pos[1]);
}

function createWindow() {
  win = new BrowserWindow({
    width: 500,
    height: 100,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile('index.html');
  win.setTitle('');
  
  // Prevent white flash on reload
  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });
  
  // Handle content changes
  win.webContents.on('did-finish-load', () => {
    refreshWindowTransparency();
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  
  const updateContextMenu = () => {
    updateTray();
  };
  
  tray.setToolTip('ARK Status Overlay');
  updateContextMenu();
  
  // Update context menu when configuration changes
  ipcMain.on('config-updated', updateContextMenu);
}

function updateTray() {
  const serverNames = config.get('serverNames');
  const checkInterval = config.get('checkInterval');
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'ARK Status Overlay', enabled: false },
    { type: 'separator' },
    { 
      label: 'Show/Hide Overlay', 
      click: () => win.isVisible() ? win.hide() : win.show() 
    },
    { type: 'separator' },
    { 
      label: 'Edit Servers', 
      click: () => editServers() 
    },
    { 
      label: `Check Interval: ${checkInterval}s`, 
      submenu: [
        { label: '30s', click: () => updateCheckInterval(30) },
        { label: '1m', click: () => updateCheckInterval(60) },
        { label: '2m', click: () => updateCheckInterval(120) },
        { label: '5m', click: () => updateCheckInterval(300) }
      ]
    },
    { 
      label: 'Check Now', 
      click: () => {
        checkStatus();
        // Refresh transparency after status check
        setTimeout(refreshWindowTransparency, 100);
      }
    },
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function editServers() {
  // Don't create multiple config windows
  if (configWindow) {
    configWindow.focus();
    return;
  }
  
  // Create a modal dialog window for editing server names
  configWindow = new BrowserWindow({
    width: 500,
    height: 400,
    parent: win,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'config-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  configWindow.loadFile('config.html');
  configWindow.once('ready-to-show', () => {
    configWindow.show();
    configWindow.webContents.send('load-config', config.getAll());
  });
  
  // Clean up the configWindow reference when closed
  configWindow.on('closed', () => {
    configWindow = null;
    
    // Refresh transparency when config window closes
    refreshWindowTransparency();
  });
}

function updateCheckInterval(seconds) {
  config.set('checkInterval', seconds);
  
  // Restart the check interval with the new timing
  clearInterval(checkStatusInterval);
  checkStatusInterval = setInterval(() => {
    checkStatus();
  }, seconds * 1000);
  
  // Refresh transparency after interval change
  setTimeout(refreshWindowTransparency, 100);
  updateTray();
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Initial status check
  checkStatus();
  
  // Set up interval based on config
  const checkInterval = config.get('checkInterval') || 60;
  checkStatusInterval = setInterval(() => {
    checkStatus();
  }, checkInterval * 1000);

  ipcMain.on('save-config', (event, newConfig) => {
    config.setAll(newConfig);
    // Let the app know the config has been updated
    event.sender.send('config-saved');
    
    // Instead of sending an update to the window immediately,
    // wait until the config window is closed
    if (configWindow) {
      configWindow.close();
    }
    
    // Update the check interval
    if (checkStatusInterval) {
      clearInterval(checkStatusInterval);
      checkStatusInterval = setInterval(() => {
        checkStatus();
      }, config.get('checkInterval') * 1000);
    }
    
    // Delay the check and refresh
    setTimeout(() => {
      checkStatus();
      refreshWindowTransparency();
    }, 300);
  });
});

app.on('window-all-closed', (e) => {
  // Prevent app from closing when window is closed
  e.preventDefault();
});

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  win.setIgnoreMouseEvents(ignore, options);
});

// Handle window position requests
ipcMain.handle('get-window-position', (event) => {
  const position = win.getPosition();
  return { x: position[0], y: position[1] };
});

ipcMain.on('set-window-position', (event, x, y) => {
  win.setPosition(x, y);
});

async function checkStatus() {
  const serverNames = config.get('serverNames');
  
  for (const name of serverNames) {
    const query = new AsaQuery();
    try {
      const res = await query.official().serverNameContains(name).exec();
      let ci = 0;

      if (res.count && res.count > 1) {
        let curPlayers = 0, serverIndex = 0;
        for (let i = 0; i < res.sessions.length; i++) {
          let players = res.sessions[i].totalPlayers || 0;
          if (players > curPlayers) {
            curPlayers = players;
            serverIndex = i;
          }
        }
        ci = serverIndex;
      }

      if (res.sessions && res.sessions.length > 0) {
        const serverInfo = res.sessions[ci];
        let serverName = serverInfo.attributes.CUSTOMSERVERNAME_s || "Unknown Server";
        let serverMaxPlayers = serverInfo.settings.maxPublicPlayers || 0;
        let serverCurrentPlayers = serverInfo.totalPlayers || 0;
        let serverPing = serverInfo.attributes.EOSSERVERPING_l || 0;
        let message = `${serverName} ONLINE [${serverCurrentPlayers}/${serverMaxPlayers} @ ${serverPing}ms]`;

        if (previousStatus !== true && config.get('notifications').sound) {
          sound.play(onlineSound).catch(err => console.log("Sound error:", err));
        }
        previousStatus = true;
        win.webContents.send('server-status', { status: true, message });
        tray.setToolTip(`ARK Status: ONLINE [${serverCurrentPlayers}/${serverMaxPlayers}]`);

      } else {
        let message = `${name} OFFLINE`;

        if (previousStatus !== false && config.get('notifications').sound) {
          sound.play(offlineSound).catch(err => console.log("Sound error:", err));
        }
        previousStatus = false;
        win.webContents.send('server-status', { status: false, message });
        tray.setToolTip('ARK Status: OFFLINE');
      }

    } catch (err) {
      console.error("Query error:", err);
      win.webContents.send('server-status', { 
        status: false, 
        message: `Error checking server: ${err.message}` 
      });
    }
  }
  
  // Refresh transparency after every status update
  refreshWindowTransparency();
}