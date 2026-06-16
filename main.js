const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;
let splashWindow;
let patcherWindow;
let alwaysOnEnabled = false;

function createPatcherWindow() {
    patcherWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        center: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    patcherWindow.loadFile('patcher.html');

    function sendStatusToPatcher(type, message) {
        if(patcherWindow && !patcherWindow.isDestroyed()) {
            patcherWindow.webContents.send('updater-message', type, message);
        }
    }

    autoUpdater.on('checking-for-update', () => sendStatusToPatcher('checking'));
    autoUpdater.on('update-available', () => sendStatusToPatcher('update-available'));
    autoUpdater.on('update-not-available', () => {
        sendStatusToPatcher('update-not-available');
        setTimeout(() => {
            if(patcherWindow && !patcherWindow.isDestroyed()) patcherWindow.close();
            createSplashWindow();
        }, 2000); // Dá um tempo para o usuário ver o 100%
    });
    autoUpdater.on('error', (err) => {
        sendStatusToPatcher('error', err == null ? "unknown" : (err.message || err).toString());
        setTimeout(() => {
            if(patcherWindow && !patcherWindow.isDestroyed()) patcherWindow.close();
            createSplashWindow();
        }, 3000);
    });
    autoUpdater.on('download-progress', (progressObj) => {
        let percent = Math.round(progressObj.percent);
        sendStatusToPatcher('download-progress', percent);
    });
    autoUpdater.on('update-downloaded', () => {
        sendStatusToPatcher('update-downloaded');
        setTimeout(() => {
            autoUpdater.quitAndInstall(true, true);
        }, 2000);
    });

    patcherWindow.webContents.once('did-finish-load', () => {
        if (!app.isPackaged) {
            // Em modo desenvolvedor, ignora a busca real e apenas simula rápido
            sendStatusToPatcher('checking');
            setTimeout(() => {
                sendStatusToPatcher('update-not-available');
                setTimeout(() => {
                    if(patcherWindow && !patcherWindow.isDestroyed()) patcherWindow.close();
                    createSplashWindow();
                }, 2000);
            }, 1000);
        } else {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });
}

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 350,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        center: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splashWindow.loadFile('splash.html');

    splashWindow.webContents.once('did-finish-load', () => {
        splashWindow.webContents.send('updater-message', 'loading-modules');
        createMainWindow();
    });
}

function createMainWindow() {
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

    mainWindow.on('minimize', (e) => {
        if (alwaysOnEnabled) {
            e.preventDefault();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.restore();
            }
        }
    });

    // Hack para driblar o Windows+D que joga o Desktop por cima de tudo
    mainWindow.on('blur', () => {
        if (alwaysOnEnabled && mainWindow && !mainWindow.isDestroyed()) {
            // Força a janela a subir acima do Desktop, e logo em seguida
            // remove o status de "Always on Top" para permitir que 
            // outras janelas abram na frente dela normalmente.
            mainWindow.setAlwaysOnTop(true, 'normal');
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.setAlwaysOnTop(false);
                }
            }, 50);
        }
    });

    mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            if(splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
            if(mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
        }, 1500); // Tempo rápido no splash final
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

    createPatcherWindow();

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
            const wasFullscreen = mainWindow.isFullScreen();
            if (wasFullscreen) {
                mainWindow.setFullScreen(false);
                setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.setBounds(targetDisplay.bounds);
                        setTimeout(() => {
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.setFullScreen(true);
                            }
                        }, 150);
                    }
                }, 150);
            } else {
                mainWindow.setBounds(targetDisplay.bounds);
                if (fullscreen) {
                    setTimeout(() => {
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.setFullScreen(true);
                        }
                    }, 150);
                }
            }
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

    ipcMain.on('set-alwayson', (event, enable) => {
        alwaysOnEnabled = enable;
        if (mainWindow) {
            mainWindow.setSkipTaskbar(enable);
            mainWindow.setMinimizable(!enable);
            if (enable) {
                mainWindow.setAlwaysOnTop(false);
                // Trick to force it to show up if DWM hid it
                mainWindow.showInactive();
            }
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});