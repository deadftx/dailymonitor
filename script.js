// === COMUNICAÇÃO COM O WINDOWS ===
const { ipcRenderer } = require('electron');

// ====== CONFIGURAÇÕES DO SISTEMA ======
let configApp = {
    autostart: false,
    monitorId: "",
    audioDeviceId: "default",
    wallpaperPath: "",
    wallpaperOpacity: 0.5
};

async function carregarConfiguracoes() {
    const salvo = localStorage.getItem('tv_config');
    if (salvo) configApp = JSON.parse(salvo);

    // 1. Aplica o arranque automático no Windows
    ipcRenderer.send('set-autostart', configApp.autostart);

    // 2. Atira a aplicação para o monitor certo e mete em Ecrã Inteiro
    if (configApp.monitorId) {
        ipcRenderer.send('set-monitor', configApp.monitorId);
    }

    // 3. Aplica o Wallpaper
    aplicarWallpaper();

    // 4. Preenche os hardwares nos menus
    await carregarMonitoresNoMenu();
    await carregarAudiosNoMenu();
}

function aplicarWallpaper() {
    const bgContainer = document.getElementById('bg-container');
    if (!bgContainer) return;

    bgContainer.innerHTML = '';

    if (configApp.wallpaperPath && configApp.wallpaperPath !== "") {
        try {
            // Invocamos o 'fs' (File System) do Node.js
            const fs = require('fs');

            console.log("Lendo arquivo diretamente do HD pelo Node.js:", configApp.wallpaperPath);

            // O Node lê o arquivo bruto do seu PC, imune a bloqueios de navegador
            const fileBuffer = fs.readFileSync(configApp.wallpaperPath);
            const ext = configApp.wallpaperPath.toLowerCase();
            let opacidade = configApp.wallpaperOpacity || 0.8;

            if (ext.endsWith('.mp4') || ext.endsWith('.webm')) {
                // Para vídeos, transformamos os dados em um Blob (Arquivo Virtual)
                const blob = new Blob([fileBuffer], { type: ext.endsWith('.mp4') ? 'video/mp4' : 'video/webm' });
                const urlVirtual = URL.createObjectURL(blob);

                bgContainer.innerHTML = `<video src="${urlVirtual}" autoplay loop muted style="opacity: ${opacidade}; width: 100vw; height: 100vh; object-fit: fill; position: absolute; top: 0; left: 0;"></video>`;
                console.log("✅ Vídeo injetado com sucesso via Node.js!");
            } else {
                // Para imagens, convertemos para código Base64
                const base64Image = fileBuffer.toString('base64');
                const mimeType = (ext.endsWith('.png')) ? 'image/png' : 'image/jpeg';

                bgContainer.innerHTML = `<img src="data:${mimeType};base64,${base64Image}" style="opacity: ${opacidade}; width: 100vw; height: 100vh; object-fit: fill; position: absolute; top: 0; left: 0;">`;
                console.log("✅ Imagem injetada com sucesso via Node.js!");
            }
        } catch (erro) {
            console.error("❌ Falha fatal ao ler o arquivo pelo Node:", erro);
        }
    }
}

async function carregarMonitoresNoMenu() {
    const selectMonitor = document.getElementById('config-monitor');
    const displays = await ipcRenderer.invoke('get-displays');

    selectMonitor.innerHTML = '<option value="">Deixar no Monitor Atual</option>';
    displays.forEach(d => {
        selectMonitor.innerHTML += `<option value="${d.id}" ${configApp.monitorId === d.id.toString() ? 'selected' : ''}>${d.label}</option>`;
    });
}

async function carregarAudiosNoMenu() {
    try {
        // Pede autorização rápida (no Electron é automática)
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputDevices = devices.filter(d => d.kind === 'audiooutput');

        const selectAudio = document.getElementById('config-audio');
        selectAudio.innerHTML = '<option value="default">Padrão do Sistema</option>';

        outputDevices.forEach(d => {
            if (d.deviceId !== "default" && d.deviceId !== "communications") {
                selectAudio.innerHTML += `<option value="${d.deviceId}" ${configApp.audioDeviceId === d.deviceId ? 'selected' : ''}>${d.label || 'Dispositivo Desconhecido'}</option>`;
            }
        });
    } catch (e) {
        console.error("Erro ao ler saídas de áudio:", e);
    }
}

// === LÓGICA DO MODAL DE CONFIGURAÇÃO ===
const modalConfig = document.getElementById('modal-config');
let caminhoWallpaperTemporario = configApp.wallpaperPath; // Variável para guardar o caminho enquanto o modal está aberto

document.getElementById('btn-configuracoes').onclick = () => {
    document.getElementById('config-autostart').checked = configApp.autostart;
    document.getElementById('config-opacidade').value = configApp.wallpaperOpacity;

    // Mostra o arquivo atual ou texto vazio
    caminhoWallpaperTemporario = configApp.wallpaperPath;
    document.getElementById('nome-arquivo-escolhido').innerText = configApp.wallpaperPath || "Nenhum arquivo selecionado";

    modalConfig.style.display = 'flex';
};

document.getElementById('btn-fechar-config').onclick = () => modalConfig.style.display = 'none';

// O Novo Botão de Procurar Arquivo (Chama o Windows)
document.getElementById('btn-escolher-wp').onclick = async () => {
    const filePath = await ipcRenderer.invoke('select-wallpaper');
    if (filePath) {
        caminhoWallpaperTemporario = filePath;
        document.getElementById('nome-arquivo-escolhido').innerText = filePath;
    }
};

document.getElementById('btn-limpar-wp').onclick = () => {
    caminhoWallpaperTemporario = "";
    document.getElementById('nome-arquivo-escolhido').innerText = "Nenhum arquivo selecionado";
};

// O Novo Botão de Salvar
document.getElementById('btn-salvar-config').onclick = () => {
    configApp.autostart = document.getElementById('config-autostart').checked;
    configApp.monitorId = document.getElementById('config-monitor').value;
    configApp.audioDeviceId = document.getElementById('config-audio').value;
    configApp.wallpaperOpacity = document.getElementById('config-opacidade').value;

    // Salva o caminho exato que o Windows entregou
    configApp.wallpaperPath = caminhoWallpaperTemporario;

    console.log("Salvando configurações:", configApp);
    localStorage.setItem('tv_config', JSON.stringify(configApp));

    // Atualiza imediatamente na tela
    carregarConfiguracoes();
    modalConfig.style.display = 'none';
};

// ====== 1. VARIÁVEIS GLOBAIS ======
let tarefas = [];
let idEmEdicao = null;
const clockElement = document.getElementById('clock-container');

// Variáveis do motor de tempo
let currentHourLocal = -1;
let currentMinuteLocal = -1;
let timeOffset = 0; // Diferença entre o seu PC e Brasília

// Variáveis de controle de alarme
let alarmesDisparadosHoje = new Set();
let audioCtx;
let beepInterval;

// ====== 2. O NOVO MOTOR DO RELÓGIO ======

// Puxa a hora da internet apenas para calcular a diferença (offset)
async function syncApiTime() {
    try {
        const response = await fetch('http://worldtimeapi.org/api/timezone/America/Sao_Paulo');
        if (response.ok) {
            const data = await response.json();
            const apiDate = new Date(data.datetime);
            const localDate = new Date();
            timeOffset = apiDate.getTime() - localDate.getTime();
        }
    } catch (e) {
        console.log("Mantendo tempo local da máquina.");
    }
}

// Esta função roda 1 vez por segundo. É impossível perder a virada do minuto agora.
function tick() {
    const agora = new Date(Date.now() + timeOffset);
    const h = agora.getHours();
    const m = agora.getMinutes();

    // Se o minuto virou de verdade, atualiza a tela e checa os alarmes
    if (h !== currentHourLocal || m !== currentMinuteLocal) {
        currentHourLocal = h;
        currentMinuteLocal = m;

        const formattedHours = currentHourLocal.toString().padStart(2, '0');
        const formattedMinutes = currentMinuteLocal.toString().padStart(2, '0');
        if (clockElement) clockElement.innerText = `${formattedHours}:${formattedMinutes}`;

        // Exatamente no instante que o minuto vira, ele dispara a checagem
        checkAlarms();
    }
}

// ====== 3. SISTEMA DE ALARMES (SOM E VISUAL) ======

// Sintetizador de Som Beep Eletrônico
async function startBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Força o áudio a sair pelo dispositivo escolhido nas configurações
    if (audioCtx.setSinkId && configApp.audioDeviceId && configApp.audioDeviceId !== "default") {
        try {
            await audioCtx.setSinkId(configApp.audioDeviceId);
        } catch (e) {
            console.error("Erro ao direcionar o áudio para o dispositivo selecionado:", e);
        }
    }

    function playTone() {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }

    playTone();
    beepInterval = setInterval(playTone, 1000);
}

function stopBeep() {
    if (beepInterval) clearInterval(beepInterval);
}

// Calcular quando deve avisar
function calcularHoraDisparo(horaReal, preAvisoMinutos) {
    if (preAvisoMinutos === "0") return horaReal;
    let [h, m] = horaReal.split(':').map(Number);
    let dataSimulada = new Date();
    dataSimulada.setHours(h, m, 0);
    dataSimulada.setMinutes(dataSimulada.getMinutes() - parseInt(preAvisoMinutos));
    return `${dataSimulada.getHours().toString().padStart(2, '0')}:${dataSimulada.getMinutes().toString().padStart(2, '0')}`;
}

// A checagem à prova de falhas
function checkAlarms() {
    if (!tarefas || tarefas.length === 0) return;

    const horaAtual = `${currentHourLocal.toString().padStart(2, '0')}:${currentMinuteLocal.toString().padStart(2, '0')}`;
    const dataDeHoje = new Date(Date.now() + timeOffset);
    const diaHoje = dataDeHoje.getDay().toString(); // 0 a 6
    const stringData = dataDeHoje.toLocaleDateString();

    tarefas.forEach(tarefa => {
        if (!tarefa.ativo) return;
        if (!tarefa.dias.includes(diaHoje)) return;

        const horaDeAvisar = calcularHoraDisparo(tarefa.time, tarefa.preAviso);

        // Se for a hora exata
        if (horaDeAvisar === horaAtual) {
            // Cria uma "chave" única para esse disparo para nunca tocar duplicado no mesmo minuto
            const chaveUnica = `${tarefa.id}-${stringData}-${horaAtual}`;

            if (!alarmesDisparadosHoje.has(chaveUnica)) {
                alarmesDisparadosHoje.add(chaveUnica);
                acionarTelaAlarme(tarefa, horaDeAvisar);
            }
        }
    });
}

function acionarTelaAlarme(tarefa, horaAcionada) {
    startBeep();

    const modalAlerta = document.getElementById('modal-alerta');
    document.getElementById('alerta-titulo').innerText = tarefa.title;

    if (tarefa.preAviso !== "0") {
        document.getElementById('alerta-hora').innerText = `O evento será às ${tarefa.time}!`;
    } else {
        document.getElementById('alerta-hora').innerText = `Marcado para Agora! (${tarefa.time})`;
    }

    document.getElementById('alerta-notas').innerText = tarefa.notas ? `Anotação: ${tarefa.notas}` : '';

    modalAlerta.style.display = 'flex';

    document.getElementById('btn-parar-alarme').onclick = () => {
        modalAlerta.style.display = 'none';
        stopBeep();
    };
}


// ====== 4. FUNÇÕES DA AGENDA E RENDERIZAÇÃO ======
function carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tv_tarefas');
    if (tarefasSalvas) {
        let tarefasCruas = JSON.parse(tarefasSalvas);
        tarefas = tarefasCruas.map(t => ({
            ...t,
            ativo: t.ativo !== undefined ? t.ativo : true,
            preAviso: t.preAviso || "0",
            dias: t.dias || ["0", "1", "2", "3", "4", "5", "6"],
            notas: t.notas || ""
        }));
    } else {
        tarefas = [];
    }
    renderizarTarefas();
}

function salvarTarefas() {
    localStorage.setItem('tv_tarefas', JSON.stringify(tarefas));
}

function renderizarTarefas() {
    const board = document.getElementById('board-container');
    if (!board) return;
    board.innerHTML = '';

    const categoriasUnicas = [...new Set(tarefas.map(t => t.category))];

    categoriasUnicas.forEach(categoria => {
        const colDiv = document.createElement('div');
        colDiv.className = 'category-column';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-header';
        headerDiv.innerText = categoria;
        colDiv.appendChild(headerDiv);

        const listDiv = document.createElement('div');
        listDiv.className = 'task-list';

        const tarefasDaCategoria = tarefas.filter(t => t.category === categoria);
        tarefasDaCategoria.sort((a, b) => a.time.localeCompare(b.time));

        tarefasDaCategoria.forEach(tarefa => {
            const card = document.createElement('div');
            card.className = `task-card ${tarefa.ativo ? 'ativo' : 'inativo'}`;
            card.innerHTML = `
                <div class="task-click-area" data-id="${tarefa.id}">
                    <div class="task-info">
                        <h3>${tarefa.title}</h3>
                    </div>
                </div>
                <div class="task-time">${tarefa.time}</div>
                <button class="delete-btn" data-id="${tarefa.id}">X</button>
            `;
            listDiv.appendChild(card);
        });

        colDiv.appendChild(listDiv);
        board.appendChild(colDiv);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => deletarTarefa(parseInt(e.target.getAttribute('data-id')));
    });

    document.querySelectorAll('.task-click-area').forEach(area => {
        area.onclick = (e) => abrirEdicao(parseInt(e.currentTarget.getAttribute('data-id')));
    });
}

function deletarTarefa(id) {
    tarefas = tarefas.filter(t => t.id !== id);
    salvarTarefas();
    renderizarTarefas();
}

// ====== 5. INTERFACE DOS MODAIS ======
const modalCriar = document.getElementById('modal-tarefa');
const modalEditar = document.getElementById('modal-editar');

// Modal Criar
document.getElementById('btn-nova-tarefa').onclick = () => modalCriar.style.display = 'flex';
document.getElementById('btn-fechar-modal').onclick = () => modalCriar.style.display = 'none';
document.getElementById('btn-salvar-tarefa').onclick = () => {
    const titulo = document.getElementById('input-titulo').value.trim();
    const hora = document.getElementById('input-hora').value;
    let categoria = document.getElementById('input-categoria').value.trim() || "Geral";

    if (!titulo || !hora) return alert("Preencha o título e a hora!");

    tarefas.push({
        id: Date.now(), title: titulo, time: hora, category: categoria,
        ativo: true, preAviso: "0", dias: ["0", "1", "2", "3", "4", "5", "6"], notas: ""
    });

    salvarTarefas(); renderizarTarefas();
    modalCriar.style.display = 'none';
    document.getElementById('input-titulo').value = '';
    document.getElementById('input-hora').value = '';
};

// Modal Editar
function abrirEdicao(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (!tarefa) return;
    idEmEdicao = id;

    document.getElementById('edit-titulo').value = tarefa.title;
    document.getElementById('edit-hora').value = tarefa.time;
    document.getElementById('edit-categoria').value = tarefa.category;
    document.getElementById('edit-ativo').checked = tarefa.ativo;
    document.getElementById('edit-pre-aviso').value = tarefa.preAviso;
    document.getElementById('edit-notas').value = tarefa.notas;

    document.querySelectorAll('#edit-dias input[type="checkbox"]').forEach(cb => {
        cb.checked = tarefa.dias.includes(cb.value);
    });

    modalEditar.style.display = 'flex';
}

document.getElementById('btn-fechar-edicao').onclick = () => modalEditar.style.display = 'none';
document.getElementById('btn-salvar-edicao').onclick = () => {
    const index = tarefas.findIndex(t => t.id === idEmEdicao);
    if (index === -1) return;

    const checkboxesMarcadas = document.querySelectorAll('#edit-dias input[type="checkbox"]:checked');
    const diasSelecionados = Array.from(checkboxesMarcadas).map(cb => cb.value);

    tarefas[index].title = document.getElementById('edit-titulo').value.trim();
    tarefas[index].time = document.getElementById('edit-hora').value;
    tarefas[index].category = document.getElementById('edit-categoria').value.trim() || "Geral";
    tarefas[index].ativo = document.getElementById('edit-ativo').checked;
    tarefas[index].preAviso = document.getElementById('edit-pre-aviso').value;
    tarefas[index].notas = document.getElementById('edit-notas').value;
    tarefas[index].dias = diasSelecionados;

    salvarTarefas(); renderizarTarefas();
    modalEditar.style.display = 'none'; idEmEdicao = null;
};

// ====== 6. ROLAGEM COM O MOUSE ======
const boardContainer = document.getElementById('board-container');
let isDown = false, startX, scrollLeft;
if (boardContainer) {
    boardContainer.addEventListener('mousedown', (e) => {
        isDown = true; boardContainer.style.cursor = 'grabbing';
        startX = e.pageX - boardContainer.offsetLeft; scrollLeft = boardContainer.scrollLeft;
    });
    boardContainer.addEventListener('mouseleave', () => { isDown = false; boardContainer.style.cursor = 'grab'; });
    boardContainer.addEventListener('mouseup', () => { isDown = false; boardContainer.style.cursor = 'grab'; });
    boardContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return; e.preventDefault();
        boardContainer.scrollLeft = scrollLeft - (((e.pageX - boardContainer.offsetLeft) - startX) * 2);
    });
}

// ====== 7. INÍCIO DO SISTEMA ======
carregarTarefas();
carregarConfiguracoes()
syncApiTime(); // Puxa o fuso horário da internet 1 vez
setInterval(syncApiTime, 3600000); // Resincroniza a cada 1 hora para evitar desvios
setInterval(tick, 1000); // Motor principal bate a cada segundo cravado
tick(); // Chama instantaneamente na abertura