const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');

// 1. Validação de instância nativa (taskkill removido pois matava os child processes do Electron)


// Bloqueio de Múltiplas Instâncias
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

const configPath = path.join(app.getPath('userData'), 'config.json');

function getConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (e) {}
    return { };
}

function saveConfig(key, value) {
    const config = getConfig();
    config[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(config));
}

// Bloqueia APIs Nativas do Chromium que causam popups indesejados (ex: Passkeys, WebAuthn, Bluetooth, USB)
app.commandLine.appendSwitch('disable-features', 'WebBluetooth,WebAuthentication,WebUsb');
app.commandLine.appendSwitch('disable-webusb');
app.commandLine.appendSwitch('disable-webauthn');

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
    const userConfig = getConfig();
    const windowOptions = {
        width: 1280,
        height: 720,
        show: false, // Esconde no começo
        fullscreen: false,
        autoHideMenuBar: true,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true
        }
    };

    mainWindow = new BrowserWindow(windowOptions);



    mainWindow.loadFile('index.html');

    // 2. Validação ao fechar: Se a janela principal for destruída, encerra a aplicação
    mainWindow.on('closed', () => {
        app.quit();
    });

    mainWindow.on('minimize', (e) => {
        if (alwaysOnEnabled) {
            e.preventDefault();
            const wasFullscreen = mainWindow.isFullScreen();
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.restore();
                    mainWindow.show();
                    if (wasFullscreen) {
                        mainWindow.setFullScreen(true);
                    }
                }
            }, 250);
        }
    });

    mainWindow.on('hide', (e) => {
        if (alwaysOnEnabled) {
            e.preventDefault();
            const wasFullscreen = mainWindow.isFullScreen();
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.show();
                    if (wasFullscreen) {
                        mainWindow.setFullScreen(true);
                    }
                }
            }, 250);
        }
    });

    mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            if(splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
            if(mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
        }, 1500); // Tempo rápido no splash final
    });
    
    // Silencia qualquer requisição de Bluetooth ou de Permissões de Dispositivos que o Discord tente fazer
    mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
        event.preventDefault();
        callback(''); // Seleciona nenhum
    });
}

app.whenReady().then(() => {
    require('electron').session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        // Auto-grant to avoid annoying popups
        if (['media', 'mediaKeySystem', 'notifications', 'fullscreen', 'pointerLock'].includes(permission)) {
            return callback(true);
        }
        callback(false);
    });
    require('electron').session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        return true;
    });

    app.on('web-contents-created', (event, contents) => {
        contents.on('select-bluetooth-device', (event, deviceList, callback) => {
            event.preventDefault();
            callback('');
        });
        // Silencia pedido de acesso ao Desktop/Captura de tela
        contents.on('desktop-capturer-get-sources', (event) => {
            event.preventDefault();
        });
        
        // Mata a API de Passkeys/WebAuthn antes da página sequer ter a chance de piscar
        const killWebAuthn = () => {
            contents.executeJavaScript(`
                if (typeof window !== 'undefined') {
                    window.PublicKeyCredential = undefined;
                    if (navigator && navigator.credentials) {
                        navigator.credentials.get = () => new Promise(() => {}); // Fica pendente eternamente ou falha
                        navigator.credentials.create = () => new Promise(() => {});
                    }
                }
            `).catch(() => {});
        };

        contents.on('did-start-navigation', killWebAuthn);
        contents.on('dom-ready', killWebAuthn);
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


    ipcMain.on('restart-app', () => {
        app.relaunch();
        app.exit(0);
    });

    ipcMain.on('set-alwayson', (event, enable) => {
        alwaysOnEnabled = enable;
        if (mainWindow) {
            mainWindow.setSkipTaskbar(false);
            mainWindow.setMinimizable(true);
            if (enable) {
                mainWindow.setAlwaysOnTop(false);
            }
        }
    });

    // --- USB Ejection Logic ---
    function checkUSB() {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        exec('powershell -Command "Get-CimInstance Win32_LogicalDisk | Where-Object DriveType -eq 2 | Select-Object DeviceID, VolumeName | ConvertTo-Json"', (err, stdout) => {
            if (err || !stdout.trim()) {
                mainWindow.webContents.send('usb-detected', []);
                return;
            }
            try {
                let data = JSON.parse(stdout);
                if (!Array.isArray(data)) data = [data];
                const drives = data.map(d => ({ letter: d.DeviceID, name: d.VolumeName || "USB Drive" }));
                mainWindow.webContents.send('usb-detected', drives);
            } catch (e) {
                mainWindow.webContents.send('usb-detected', []);
            }
        });
    }
    
    setInterval(checkUSB, 5000);
    
    ipcMain.handle('eject-usb', async (event, driveLetter) => {
        return new Promise((resolve, reject) => {
            const psCommand = `(New-Object -comObject Shell.Application).Namespace(17).ParseName('${driveLetter}').InvokeVerb('Eject')`;
            exec(`powershell -Command "${psCommand}"`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('before-quit', () => {
    // 3. Validação Extrema ao fechar: aniquila toda a árvore de processos atual
    if (process.platform === 'win32') {
        try { execSync(`taskkill /F /PID ${process.pid} /T`, { stdio: 'ignore' }); } catch (e) {}
        try { execSync(`taskkill /F /IM DailyMonitorLauncher.exe /T`, { stdio: 'ignore' }); } catch (e) {}
    }
});