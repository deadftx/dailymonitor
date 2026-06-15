const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    // A configuração limpa foi restaurada para o webview herdar o modo de compatibilidade
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
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
    mainWindow.webContents.openDevTools();
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
                { name: 'Mídia (Imagens e Vídeos)', extensions: ['jpg', 'png', 'jpeg', 'mp4', 'webm'] }
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

    ipcMain.on('set-monitor', (event, displayId) => {
        if (!displayId) return;
        const displays = screen.getAllDisplays();
        const targetDisplay = displays.find(d => d.id.toString() === displayId.toString());

        if (targetDisplay && mainWindow) {
            mainWindow.setBounds(targetDisplay.bounds);
            mainWindow.setFullScreen(true);
        }
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