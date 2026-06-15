const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;
let splashWindow;

function createWindow() {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 350,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true
        }
    });

    splashWindow.loadFile('splash.html');

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false, // Esconde no começo
        fullscreen: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            webviewTag: true
        }
    });

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools(); // Comentado DevTools para ficar limpo para o usuário final

    function sendStatusToWindow(type, message) {
        if(splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.webContents.send('updater-message', type, message);
        }
    }

    autoUpdater.on('checking-for-update', () => sendStatusToWindow('checking'));
    autoUpdater.on('update-available', () => sendStatusToWindow('update-available'));
    autoUpdater.on('update-not-available', () => {
        sendStatusToWindow('update-not-available');
        setTimeout(() => {
            if(splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
            if(mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
        }, 1500);
    });
    autoUpdater.on('error', (err) => {
        sendStatusToWindow('error', err == null ? "unknown" : (err.message || err).toString());
        setTimeout(() => {
            if(splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
            if(mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
        }, 3000);
    });
    autoUpdater.on('download-progress', (progressObj) => {
        let percent = Math.round(progressObj.percent);
        sendStatusToWindow('download-progress', percent);
    });
    autoUpdater.on('update-downloaded', () => {
        sendStatusToWindow('update-downloaded');
        setTimeout(() => {
            // isSilent = true, isForceRunAfter = true
            autoUpdater.quitAndInstall(true, true);
        }, 2000);
    });

    splashWindow.webContents.once('did-finish-load', () => {
        if (!app.isPackaged) {
            // Em modo desenvolvedor, ignora a busca real e apenas finge pra iniciar rápido
            sendStatusToWindow('update-not-available');
            setTimeout(() => {
                if(splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
                if(mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
            }, 1000);
        } else {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });
}

app.whenReady().then(() => {
    require('electron').session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media' || permission === 'mediaKeySystem') {
            return callback(true);
        }
        callback(false);
    });
    require('electron').session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        return true;
    });

    createWindow();

    // NOVO: Chama a janela nativa do Windows para escolher ficheiros
    ipcMain.handle('select-wallpaper', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Selecione o Papel de Parede',
            buttonLabel: 'Usar como Fundo',
            properties: ['openFile'],
            filters: [
                { name: 'Mídia (Imagens e Vídeos)', extensions: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'webm'] }
            ]
        });
        // Se o utilizador não cancelar, devolve o caminho exato
        return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle('get-displays', () => {
        return screen.getAllDisplays().map((d, index) => ({
            id: d.id,
            bounds: d.bounds,
            label: `Monitor ${index + 1} (${d.bounds.width}x${d.bounds.height})`
        }));
    });

    ipcMain.on('set-monitor', (event, displayId, fullscreen = true) => {
        if (!displayId) return;
        const displays = screen.getAllDisplays();
        const targetDisplay = displays.find(d => d.id.toString() === displayId.toString());

        if (targetDisplay && mainWindow) {
            mainWindow.setBounds(targetDisplay.bounds);
            mainWindow.setFullScreen(fullscreen);
        }
    });

    ipcMain.on('set-fullscreen', (event, isFullscreen) => {
        if (mainWindow) {
            mainWindow.setFullScreen(isFullscreen);
        }
    });

    // NOVO: GAME CENTER - IDLE HERO
    let idleHeroWindow = null;
    ipcMain.on('launch-idle-hero', () => {
        if (idleHeroWindow) {
            idleHeroWindow.show();
            idleHeroWindow.focus();
            return;
        }
        
        idleHeroWindow = new BrowserWindow({
            width: 330,
            height: 600,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        idleHeroWindow.loadFile(path.join(__dirname, 'games', 'idle-hero', 'index.html'));
        
        idleHeroWindow.on('closed', () => {
            idleHeroWindow = null;
        });
    });

    ipcMain.on('hide-idle-hero', () => {
        if (idleHeroWindow) idleHeroWindow.hide();
    });

    ipcMain.on('close-idle-hero', () => {
        if (idleHeroWindow) idleHeroWindow.close();
    });

    ipcMain.on('set-autostart', (event, enable) => {
        app.setLoginItemSettings({
            openAtLogin: enable,
            path: app.getPath('exe')
        });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});