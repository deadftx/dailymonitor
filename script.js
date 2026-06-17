// === COMUNICAÇÃO COM O WINDOWS ===
const { ipcRenderer } = require('electron');

// ====== CONFIGURAÇÕES DO SISTEMA ======
let configApp = {
    autostart: false,
    fullscreen: true,
    monitorId: "",
    audioDeviceId: "default",
    audioDeviceIdYt: "default",
    audioDeviceLabelYt: "",
    wallpaperPath: "",
    wallpaperOpacity: 0.5,
    alwaysOn: false
};

// Override native alert to use custom modal
window.alert = function(message) {
    const modal = document.getElementById('modal-system-alert');
    if(modal) {
        document.getElementById('system-alert-message').innerText = message;
        modal.style.display = 'flex';
        document.getElementById('btn-system-alert-ok').onclick = () => {
            modal.style.display = 'none';
        };
    } else {
        console.log("ALERT:", message);
    }
};

// Nova Estrutura para os Lembretes Momentâneos (inclui dados de alarme)
let momentaneas = [];
let gameAlerts = [];

// Variável para controle do editor universal
let idEmEdicao = null;
let tipoEmEdicao = null; // 'recorrente' ou 'momentanea'

async function carregarConfiguracoes() {
    const salvo = localStorage.getItem('tv_config');
    if (salvo) configApp = JSON.parse(salvo);
    if (configApp.fullscreen === undefined) configApp.fullscreen = true;

    ipcRenderer.send('set-autostart', configApp.autostart);
    ipcRenderer.send('set-fullscreen', configApp.fullscreen);
    ipcRenderer.send('set-alwayson', configApp.alwaysOn);

    if (configApp.monitorId) {
        ipcRenderer.send('set-monitor', configApp.monitorId, configApp.fullscreen);
    }

    aplicarWallpaper();
    await carregarMonitoresNoMenu();
    await carregarAudiosNoMenu();
}

function aplicarWallpaper() {
    const bgContainer = document.getElementById('bg-container');
    if (!bgContainer) return;
    bgContainer.innerHTML = '';

    if (configApp.wallpaperPath && configApp.wallpaperPath !== "") {
        try {
            const fs = require('fs');
            const fileBuffer = fs.readFileSync(configApp.wallpaperPath);
            const ext = configApp.wallpaperPath.toLowerCase();
            let opacidade = configApp.wallpaperOpacity || 0.8;

            if (ext.endsWith('.mp4') || ext.endsWith('.webm')) {
                const blob = new Blob([fileBuffer], { type: ext.endsWith('.mp4') ? 'video/mp4' : 'video/webm' });
                const urlVirtual = URL.createObjectURL(blob);
                bgContainer.innerHTML = `<video src="${urlVirtual}" autoplay loop muted style="opacity: ${opacidade}; width: 100vw; height: 100vh; object-fit: fill; position: absolute; top: 0; left: 0;"></video>`;
            } else {
                const base64Image = fileBuffer.toString('base64');
                const mimeType = (ext.endsWith('.png')) ? 'image/png' : 'image/jpeg';
                bgContainer.innerHTML = `<img src="data:${mimeType};base64,${base64Image}" style="opacity: ${opacidade}; width: 100vw; height: 100vh; object-fit: fill; position: absolute; top: 0; left: 0;">`;
            }
        } catch (erro) {
            console.error("❌ Falha fatal ao ler o arquivo pelo Node:", erro);
        }
    }
}

async function carregarMonitoresNoMenu() {
    const selectMonitor = document.getElementById('config-monitor');
    const displays = await ipcRenderer.invoke('get-displays');
    selectMonitor.innerHTML = '<option value="">Monitor Atual</option>';
    displays.forEach(d => {
        selectMonitor.innerHTML += `<option value="${d.id}" ${configApp.monitorId === d.id.toString() ? 'selected' : ''}>${d.label}</option>`;
    });
}

async function carregarAudiosNoMenu() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputDevices = devices.filter(d => d.kind === 'audiooutput');
        const selectAudio = document.getElementById('config-audio');
        const selectAudioYt = document.getElementById('config-audio-yt');
        selectAudio.innerHTML = '<option value="default">Padrão</option>';
        if (selectAudioYt) selectAudioYt.innerHTML = '<option value="default">Padrão</option>';
        outputDevices.forEach(d => {
            if (d.deviceId !== "default" && d.deviceId !== "communications") {
                selectAudio.innerHTML += `<option value="${d.deviceId}" ${configApp.audioDeviceId === d.deviceId ? 'selected' : ''}>${d.label || 'Unknown'}</option>`;
                if (selectAudioYt) selectAudioYt.innerHTML += `<option value="${d.deviceId}" ${configApp.audioDeviceIdYt === d.deviceId ? 'selected' : ''}>${d.label || 'Unknown'}</option>`;
            }
        });
    } catch (e) { }
}

// === LÓGICA DO MODAL DE CONFIGURAÇÃO ===
const modalConfig = document.getElementById('modal-config');
let caminhoWallpaperTemporario = configApp.wallpaperPath;

document.getElementById('btn-configuracoes').onclick = () => {
    document.getElementById('config-autostart').checked = configApp.autostart;
    document.getElementById('config-fullscreen').checked = configApp.fullscreen !== false;
    document.getElementById('config-alwayson').checked = configApp.alwaysOn;
    document.getElementById('config-opacidade').value = configApp.wallpaperOpacity;
    caminhoWallpaperTemporario = configApp.wallpaperPath;
    document.getElementById('nome-arquivo-escolhido').innerText = configApp.wallpaperPath || "Nenhum selecionado";
    modalConfig.style.display = 'flex';
};
document.getElementById('btn-fechar-config').onclick = () => modalConfig.style.display = 'none';
document.getElementById('btn-escolher-wp').onclick = async () => {
    const filePath = await ipcRenderer.invoke('select-wallpaper');
    if (filePath) { caminhoWallpaperTemporario = filePath; document.getElementById('nome-arquivo-escolhido').innerText = filePath; }
};
document.getElementById('btn-limpar-wp').onclick = () => {
    caminhoWallpaperTemporario = ""; document.getElementById('nome-arquivo-escolhido').innerText = "Nenhum selecionado";
};
document.getElementById('btn-salvar-config').onclick = () => {
    configApp.autostart = document.getElementById('config-autostart').checked;
    configApp.fullscreen = document.getElementById('config-fullscreen').checked;
    configApp.alwaysOn = document.getElementById('config-alwayson').checked;
    
    configApp.monitorId = document.getElementById('config-monitor').value;
    configApp.audioDeviceId = document.getElementById('config-audio').value;
    if (document.getElementById('config-audio-yt')) {
        let ytSel = document.getElementById('config-audio-yt');
        configApp.audioDeviceIdYt = ytSel.value;
        configApp.audioDeviceLabelYt = ytSel.options[ytSel.selectedIndex].text;
    }
    configApp.wallpaperPath = caminhoWallpaperTemporario;
    configApp.wallpaperOpacity = document.getElementById('config-opacidade').value;

    localStorage.setItem('tv_config', JSON.stringify(configApp));
    modalConfig.style.display = 'none';

    carregarConfiguracoes();
};

// ====== VARIÁVEIS GLOBAIS DA AGENDA ======
let tarefas = [];
const clockElement = document.getElementById('clock-container');
let currentHourLocal = -1;
let currentMinuteLocal = -1;
let timeOffset = 0;
let alarmesDisparadosHoje = new Set();
let audioCtx;
let beepInterval;

// ====== MOTOR DO RELÓGIO ======
async function syncApiTime() {
    try {
        const response = await fetch('http://worldtimeapi.org/api/timezone/America/Sao_Paulo');
        if (response.ok) {
            const data = await response.json();
            const apiDate = new Date(data.datetime);
            const localDate = new Date();
            timeOffset = apiDate.getTime() - localDate.getTime();
        }
    } catch (e) { console.log("Usando tempo local."); }
}

function tick() {
    const agora = new Date(Date.now() + timeOffset);
    const h = agora.getHours(); const m = agora.getMinutes();
    if (h !== currentHourLocal || m !== currentMinuteLocal) {
        currentHourLocal = h; currentMinuteLocal = m;
        const fh = h.toString().padStart(2, '0'); const fm = m.toString().padStart(2, '0');
        if (clockElement) clockElement.innerText = `${fh}:${fm}`;
        checkAlarms();
        if (h === 0 && m === 0) renderizarShoppingList();
        renderizarTarefas();
        renderizarMomentaneas();
    }
}

// ====== SISTEMA DE ALARMES UNIFICADO ======
async function startBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (audioCtx.setSinkId && configApp.audioDeviceId && configApp.audioDeviceId !== "default") {
        try { await audioCtx.setSinkId(configApp.audioDeviceId); } catch (e) { }
    }
    function playTone() {
        const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
        oscillator.type = 'square'; oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.3);
    }
    playTone(); beepInterval = setInterval(playTone, 1000);
}
function stopBeep() { if (beepInterval) clearInterval(beepInterval); }

function calcularHoraDisparo(horaReal, preAvisoMinutos) {
    if (preAvisoMinutos === "0") return horaReal;
    let [h, m] = horaReal.split(':').map(Number);
    let ds = new Date(); ds.setHours(h, m, 0);
    ds.setMinutes(ds.getMinutes() - parseInt(preAvisoMinutos));
    return `${ds.getHours().toString().padStart(2, '0')}:${ds.getMinutes().toString().padStart(2, '0')}`;
}

function checkAlarms() {
    const horaAtual = `${currentHourLocal.toString().padStart(2, '0')}:${currentMinuteLocal.toString().padStart(2, '0')}`;
    const dataH = new Date(Date.now() + timeOffset);
    const diaHoje = dataH.getDay().toString();
    const stringData = dataH.toLocaleDateString();

    const momentaneasComAlarme = momentaneas.filter(m => !m.arquivado && m.time !== "");
    const gamesAtivos = typeof gameAlerts !== 'undefined' ? gameAlerts.filter(g => g.ativo).map(g => ({...g, category: 'Game', preAviso: "0", isGame: true})) : [];
    let calendarTasks = [];
    if (typeof getEventosParaData === 'function') {
        const evs = getEventosParaData(dataH.getFullYear(), dataH.getMonth(), dataH.getDate());
        evs.forEach(ev => {
            if (ev.dash && ev.time) {
                calendarTasks.push({
                    id: ev.id,
                    title: ev.title,
                    time: ev.time,
                    category: ev.cat || 'Agenda do Dia',
                    ativo: true,
                    isAgenda: true,
                    preAviso: "0",
                    originStr: ev.originStr,
                    notas: ev.notas || ""
                });
            }
        });
    }
    const todasTasks = [...tarefas, ...momentaneasComAlarme, ...gamesAtivos, ...calendarTasks];

    todasTasks.forEach(tarefa => {
        if (!tarefa.ativo) return;
        if (tarefa.dias && !tarefa.dias.includes(diaHoje)) return;

        if (calcularHoraDisparo(tarefa.time, tarefa.preAviso) === horaAtual) {
            const tipo = tarefa.isGame ? 'game' : (tarefa.dias ? 'rec' : 'mom');
            const chaveUnica = `${tipo}-${tarefa.id}-${stringData}-${horaAtual}`;
            if (!alarmesDisparadosHoje.has(chaveUnica)) {
                alarmesDisparadosHoje.add(chaveUnica);
                acionarTelaAlarme(tarefa);
            }
        }
    });
}

function acionarTelaAlarme(tarefa) {
    startBeep();
    const modalAlerta = document.getElementById('modal-alerta');
    document.getElementById('alerta-titulo').innerText = (tarefa.isGame ? '🕹️ ' : '') + tarefa.title;
    document.getElementById('alerta-hora').innerText = tarefa.preAviso !== "0" ? `Evento às ${tarefa.time}!` : `Agora! (${tarefa.time})`;
    document.getElementById('alerta-notas').innerText = tarefa.notas ? `Obs: ${tarefa.notas}` : (tarefa.isGame ? 'Lembrete de Jogo!' : '');
    modalAlerta.style.display = 'flex';

    document.getElementById('btn-parar-alarme').onclick = () => {
        modalAlerta.style.display = 'none';
        stopBeep();

        if (tarefa.isAgenda) {
            if (typeof deletarEventoAgenda === 'function') {
                deletarEventoAgenda(tarefa.id, tarefa.originStr);
            }
        } else if (!tarefa.dias && !tarefa.isGame) {
            console.log(`Auto-arquivando nota rápida concluída: ${tarefa.title}`);
            arquivarLembrete(tarefa.id);
        }
    };
}

// ====== FUNÇÕES DA AGENDA RECORRENTE (Kanban Compacto) ======
function carregarTarefas() {
    const salvo = localStorage.getItem('tv_tarefas');
    tarefas = salvo ? JSON.parse(salvo) : [];
    renderizarTarefas();
}
function salvarTarefas() { localStorage.setItem('tv_tarefas', JSON.stringify(tarefas)); }

function renderizarTarefas() {
    const board = document.getElementById('board-container');
    if (!board) return; board.innerHTML = '';
    
    let combinedTarefas = [...tarefas];
    const hoje = new Date(Date.now() + timeOffset);
    const hAtualStr = hoje.getHours().toString().padStart(2, '0');
    const mAtualStr = hoje.getMinutes().toString().padStart(2, '0');
    const horaLocalStr = `${hAtualStr}:${mAtualStr}`;

    if (typeof getEventosParaData === 'function') {
        const evs = getEventosParaData(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        evs.forEach(ev => {
            if (ev.dash) {
                combinedTarefas.push({
                    id: ev.id,
                    title: ev.title,
                    time: ev.time || 'S/H',
                    category: ev.cat || 'Agenda do Dia',
                    ativo: true,
                    isAgenda: true,
                    originStr: ev.originStr
                });
            }
        });
    }

    // Filtra tarefas que já passaram do horário de hoje
    combinedTarefas = combinedTarefas.filter(t => {
        if (t.time && t.time !== 'S/H') {
            return t.time >= horaLocalStr;
        }
        return true;
    });

    const cats = [...new Set(combinedTarefas.map(t => t.category))];
    cats.forEach(c => {
        const col = document.createElement('div'); col.className = 'category-column';
        const head = document.createElement('div'); head.className = 'category-header'; head.innerText = c;
        col.appendChild(head);
        const list = document.createElement('div'); list.className = 'task-list';
        const tasks = combinedTarefas.filter(t => t.category === c).sort((a, b) => (a.time||'').localeCompare(b.time||''));
        tasks.forEach(t => {
            const card = document.createElement('div'); card.className = `task-card ${t.ativo ? 'ativo' : 'inactive'} ${t.isAgenda ? 'agenda-task' : ''}`;
            if (t.isAgenda) {
                card.style.borderLeft = '4px solid #f39c12';
                card.style.background = 'rgba(243, 156, 18, 0.1)';
            }
            card.innerHTML = `
                <div class="task-click-area" data-id="${t.id}" data-isagenda="${t.isAgenda ? '1' : '0'}" data-origin="${t.originStr || ''}"><div class="task-info"><h3>${t.title}</h3></div></div>
                <div class="task-time">${t.time}</div>
                <button class="delete-btn" data-id="${t.id}" data-isagenda="${t.isAgenda ? '1' : '0'}" data-origin="${t.originStr || ''}">X</button>
            `;
            list.appendChild(card);
        });
        col.appendChild(list); board.appendChild(col);
    });
    
    document.querySelectorAll('.delete-btn').forEach(b => b.onclick = (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        if (e.target.getAttribute('data-isagenda') === '1') {
            const originStr = e.target.getAttribute('data-origin');
            deletarEventoAgenda(id, originStr);
        } else {
            deletarTarefa(id);
        }
    });
    
    document.querySelectorAll('.task-click-area').forEach(a => a.onclick = (e) => {
        if (e.currentTarget.getAttribute('data-isagenda') === '1') {
            // Abrir agenda se for evento
            if (document.getElementById('btn-agenda')) document.getElementById('btn-agenda').click();
        } else {
            abrirEdicaoRecorrente(parseInt(e.currentTarget.getAttribute('data-id')));
        }
    });
}
function deletarTarefa(id) { tarefas = tarefas.filter(t => t.id !== id); salvarTarefas(); renderizarTarefas(); }

// ====== MOTOR DO EDITOR UNIVERSAL ======
const modalEditar = document.getElementById('modal-editar');

function prepararModal(titulo, hideDias) {
    document.getElementById('modal-editar-titulo').innerText = titulo;
    const secaoDias = document.getElementById('secao-edit-dias');
    if (hideDias) secaoDias.classList.add('hidden');
    else secaoDias.classList.remove('hidden');
    modalEditar.style.display = 'flex';
}

function abrirEdicaoRecorrente(id) {
    const t = tarefas.find(x => x.id === id); if (!t) return;
    idEmEdicao = id; tipoEmEdicao = 'recorrente';

    // Preenche campos
    document.getElementById('edit-titulo').value = t.title; document.getElementById('edit-hora').value = t.time;
    document.getElementById('edit-categoria').value = t.category; document.getElementById('edit-ativo').checked = t.ativo;
    document.getElementById('edit-pre-aviso').value = t.preAviso; document.getElementById('edit-notas').value = t.notas;
    document.querySelectorAll('#edit-dias input[type="checkbox"]').forEach(cb => cb.checked = t.dias.includes(cb.value));

    prepararModal("Configurar Alarme Recorrente", false);
}

function abrirEdicaoMomentanea(id) {
    const m = momentaneas.find(x => x.id === id); if (!m) return;
    idEmEdicao = id; tipoEmEdicao = 'momentanea';

    // Preenche campos, usando valores padrão para dados de alarme se vazios
    document.getElementById('edit-titulo').value = m.title;
    document.getElementById('edit-hora').value = m.time || "";
    document.getElementById('edit-categoria').value = m.category || "Momentânea";
    document.getElementById('edit-ativo').checked = m.ativo !== undefined ? m.ativo : true;
    document.getElementById('edit-pre-aviso').value = m.preAviso || "0";
    document.getElementById('edit-notas').value = m.notas || "";

    prepararModal("Configurar Lembrete / Alarme", true); // Esconde dias
}

document.getElementById('btn-fechar-edicao').onclick = () => modalEditar.style.display = 'none';

document.getElementById('btn-salvar-edicao').onclick = () => {
    const titulo = document.getElementById('edit-titulo').value.trim();
    const hora = document.getElementById('edit-hora').value;
    const cat = document.getElementById('edit-categoria').value.trim() || "Geral";
    const ativo = document.getElementById('edit-ativo').checked;
    const pre = document.getElementById('edit-pre-aviso').value;
    const notas = document.getElementById('edit-notas').value;

    if (!titulo) return alert("Preencha o título!");

    if (tipoEmEdicao === 'recorrente') {
        const idx = tarefas.findIndex(t => t.id === idEmEdicao); if (idx === -1) return;
        const dias = Array.from(document.querySelectorAll('#edit-dias input[type="checkbox"]:checked')).map(cb => cb.value);
        if (!hora) return alert("Alarme recorrente precisa de hora!");

        tarefas[idx] = { ...tarefas[idx], title: titulo, time: hora, category: cat, ativo: ativo, preAviso: pre, notas: notas, dias: dias };
        salvarTarefas(); renderizarTarefas();
    }
    else if (tipoEmEdicao === 'momentanea') {
        const idx = momentaneas.findIndex(m => m.id === idEmEdicao); if (idx === -1) return;

        momentaneas[idx] = { ...momentaneas[idx], title: titulo, time: hora, category: cat, ativo: ativo, preAviso: pre, notas: notas };
        salvarMomentaneas(); renderizarMomentaneas();
    }

    modalEditar.style.display = 'none';
    idEmEdicao = null; tipoEmEdicao = null;
};

// ====== MODAL CRIAÇÃO RECORRENTE ======
const modalCriar = document.getElementById('modal-tarefa');
document.getElementById('btn-nova-tarefa').onclick = () => modalCriar.style.display = 'flex';
document.getElementById('btn-fechar-modal').onclick = () => modalCriar.style.display = 'none';
document.getElementById('btn-salvar-tarefa').onclick = () => {
    const t = document.getElementById('input-titulo').value.trim(); const h = document.getElementById('input-hora').value;
    let c = document.getElementById('input-categoria').value.trim() || "Geral";
    if (!t || !h) return alert("Preencha título e hora!");
    tarefas.push({ id: Date.now(), title: t, time: h, category: c, ativo: true, preAviso: "0", dias: ["0", "1", "2", "3", "4", "5", "6"], notas: "" });
    salvarTarefas(); renderizarTarefas(); modalCriar.style.display = 'none';
    document.getElementById('input-titulo').value = ''; document.getElementById('input-hora').value = '';
};

// ====== MOTOR DE TAREFAS MOMENTÂNEAS (Alarmes Suportados) ======
function carregarMomentaneas() {
    const salvas = localStorage.getItem('tv_momentaneas');
    // Normaliza os dados antigos para o novo formato com campos de alarme
    if (salvas) {
        momentaneas = JSON.parse(salvas).map(m => ({
            ...m,
            time: m.time || "", ativo: m.ativo !== undefined ? m.ativo : true, preAviso: m.preAviso || "0", notas: m.notas || "", category: m.category || "Momentânea"
        }));

        const hojeObj = new Date(Date.now() + timeOffset);
        const hAtualStr = hojeObj.getHours().toString().padStart(2, '0');
        const mAtualStr = hojeObj.getMinutes().toString().padStart(2, '0');
        const horaLocalStr = `${hAtualStr}:${mAtualStr}`;

        let mudou = false;
        momentaneas.forEach(m => {
            if (!m.arquivado && m.time && m.time < horaLocalStr) {
                m.arquivado = true;
                mudou = true;
            }
        });
        if (mudou) salvarMomentaneas();

    } else { momentaneas = []; }
    renderizarMomentaneas();
}
function salvarMomentaneas() { localStorage.setItem('tv_momentaneas', JSON.stringify(momentaneas)); }

document.getElementById('input-momentaria').onkeypress = (e) => {
    if (e.key === 'Enter') {
        const txt = e.target.value.trim(); if (!txt) return;
        // Cria estrutura completa, mas com hora vazia
        momentaneas.push({
            id: Date.now(), title: txt, arquivado: false,
            time: "", category: "Momentânea", ativo: true, preAviso: "0", notas: ""
        });
        salvarMomentaneas(); renderizarMomentaneas(); e.target.value = '';
    }
};

function renderizarMomentaneas() {
    const lista = document.getElementById('lista-momentaneas'); if (!lista) return; lista.innerHTML = '';

    const hojeObj = new Date(Date.now() + timeOffset);
    const hAtualStr = hojeObj.getHours().toString().padStart(2, '0');
    const mAtualStr = hojeObj.getMinutes().toString().padStart(2, '0');
    const horaLocalStr = `${hAtualStr}:${mAtualStr}`;

    const ativas = momentaneas.filter(m => {
        if (m.arquivado) return false;
        if (m.time) {
            return m.time >= horaLocalStr;
        }
        return true;
    }).sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));

    ativas.forEach(m => {
        const div = document.createElement('div'); div.className = 'momentary-item';
        // HTML alterado para incluir a hora e o ID no texto clicável
        div.innerHTML = `
            <div class="momentary-content-area" data-id="${m.id}">
                <span class="momentary-item-text">${m.title}</span>
                ${m.time ? `<span class="momentary-item-time">${m.time}</span>` : ''}
            </div>
            <input type="checkbox" class="momentary-checkbox" data-id="${m.id}" ${m.ativo ? '' : 'disabled'}>
        `;
        lista.appendChild(div);
    });
    // Clique na caixinha arquiva
    document.querySelectorAll('.momentary-checkbox').forEach(cb => cb.onchange = (e) => arquivarLembrete(parseInt(e.target.getAttribute('data-id'))));

    // NOVO: Clique na área do conteúdo (texto/hora) abre o editor
    document.querySelectorAll('.momentary-content-area').forEach(area => {
        area.onclick = (e) => {
            if (e.target.className === 'momentary-checkbox') return; // Evita abrir editor ao clicar no checkbox
            abrirEdicaoMomentanea(parseInt(e.currentTarget.getAttribute('data-id')));
        };
    });
}

function arquivarLembrete(id) {
    const idx = momentaneas.findIndex(m => m.id === id);
    if (idx !== -1) { momentaneas[idx].arquivado = true; salvarMomentaneas(); renderizarMomentaneas(); if (modalArquivados.style.display === 'flex') renderizarArquivados(); }
}
function desarquivarLembrete(id) {
    const idx = momentaneas.findIndex(m => m.id === id);
    if (idx !== -1) { momentaneas[idx].arquivado = false; salvarMomentaneas(); renderizarMomentaneas(); renderizarArquivados(); }
}

function renderizarArquivados() {
    const container = document.getElementById('lista-arquivados'); if (!container) return; container.innerHTML = '';
    const arq = momentaneas.filter(m => m.arquivado);
    if (arq.length === 0) { container.innerHTML = '<p style="color: #666; text-align: center; font-size:0.9rem;">Vazio.</p>'; return; }
    arq.forEach(m => {
        const div = document.createElement('div'); div.className = 'archived-item';
        div.innerHTML = `<span>${m.title} ${m.time ? `(${m.time})` : ''}</span><button class="btn-unarchive" data-id="${m.id}">Restaurar</button>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.btn-unarchive').forEach(b => b.onclick = (e) => desarquivarLembrete(parseInt(e.target.getAttribute('data-id'))));
}
const modalArquivados = document.getElementById('modal-arquivados');
document.getElementById('btn-arquivados').onclick = () => { renderizarArquivados(); modalArquivados.style.display = 'flex'; };
document.getElementById('btn-fechar-arquivados').onclick = () => modalArquivados.style.display = 'none';

// ====== ROLAGEM MOUSE KANBAN ======
const boardContainer = document.getElementById('board-container');
let isDown = false, startX, scrollLeft;
if (boardContainer) {
    boardContainer.addEventListener('mousedown', (e) => { isDown = true; boardContainer.style.cursor = 'grabbing'; startX = e.pageX - boardContainer.offsetLeft; scrollLeft = boardContainer.scrollLeft; });
    boardContainer.addEventListener('mouseleave', () => { isDown = false; boardContainer.style.cursor = 'grab'; });
    boardContainer.addEventListener('mouseup', () => { isDown = false; boardContainer.style.cursor = 'grab'; });
    boardContainer.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); boardContainer.scrollLeft = scrollLeft - (((e.pageX - boardContainer.offsetLeft) - startX) * 2); });
}

// ====== MOTOR DA LISTA DE COMPRAS ======
let shoppingList = [];
let shopIdEmEdicao = null;
const modalShopping = document.getElementById('modal-shopping');

function carregarShoppingList() {
    const salvo = localStorage.getItem('tv_shopping');
    shoppingList = salvo ? JSON.parse(salvo) : [];
    renderizarShoppingList();
}

function salvarShoppingList() {
    localStorage.setItem('tv_shopping', JSON.stringify(shoppingList));
}

function renderizarShoppingList() {
    const lista = document.getElementById('lista-shopping');
    if (!lista) return;
    lista.innerHTML = '';

    shoppingList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shopping-item';

        let urlClick = item.link ? `onclick="if(!event.target.closest('button')) window.open('${item.link}', '_blank')"` : '';
        let estiloCursor = item.link ? 'cursor: pointer;' : '';

        let classeVencido = '';
        if (item.data) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const partes = item.data.split('-');
            if (partes.length === 3) {
                const dataLimite = new Date(partes[0], partes[1] - 1, partes[2]);
                dataLimite.setHours(0, 0, 0, 0);
                if (hoje >= dataLimite) {
                    classeVencido = 'vencido';
                }
            }
        }

        if (classeVencido) div.classList.add(classeVencido);

        div.innerHTML = `
            <div class="shopping-content-area" ${urlClick} style="${estiloCursor}">
                <div style="display: flex; flex-direction: column;">
                    <span class="shopping-item-text">${item.nome}</span>
                    <span class="shopping-item-details">
                        ${item.valor ? 'R$ ' + item.valor : ''} ${item.qtd ? ' | Qtd: ' + item.qtd : ''}
                        ${item.data ? ' | Data: ' + item.data.split('-').reverse().join('/') : ''}
                    </span>
                </div>
            </div>
            <div class="shopping-actions">
                <button class="btn-edit-shop" data-id="${item.id}">✏️</button>
                <button class="btn-del-shop" data-id="${item.id}">🗑️</button>
            </div>
        `;
        lista.appendChild(div);
    });

    document.querySelectorAll('.btn-edit-shop').forEach(b => b.onclick = (e) => abrirEdicaoShopping(parseInt(e.currentTarget.getAttribute('data-id'))));
    document.querySelectorAll('.btn-del-shop').forEach(b => b.onclick = (e) => deletarShopping(parseInt(e.currentTarget.getAttribute('data-id'))));
}

function deletarShopping(id) {
    shoppingList = shoppingList.filter(s => s.id !== id);
    salvarShoppingList();
    renderizarShoppingList();
}

function abrirEdicaoShopping(id) {
    const s = shoppingList.find(x => x.id === id);
    if (!s) return;
    shopIdEmEdicao = id;

    document.getElementById('modal-shopping-titulo').innerText = "Editar Item";
    document.getElementById('shop-nome').value = s.nome || "";
    document.getElementById('shop-valor').value = s.valor || "";
    document.getElementById('shop-qtd').value = s.qtd || "1";
    document.getElementById('shop-link').value = s.link || "";
    document.getElementById('shop-data').value = s.data || "";

    modalShopping.style.display = 'flex';
}

if (document.getElementById('btn-add-shopping')) {
    document.getElementById('btn-add-shopping').onclick = () => {
        shopIdEmEdicao = null;
        document.getElementById('modal-shopping-titulo').innerText = "Adicionar Item";
        document.getElementById('shop-nome').value = "";
        document.getElementById('shop-valor').value = "";
        document.getElementById('shop-qtd').value = "1";
        document.getElementById('shop-link').value = "";
        document.getElementById('shop-data').value = "";

        modalShopping.style.display = 'flex';
    };
}

if (document.getElementById('btn-fechar-shopping')) {
    document.getElementById('btn-fechar-shopping').onclick = () => modalShopping.style.display = 'none';
}

if (document.getElementById('btn-salvar-shopping')) {
    document.getElementById('btn-salvar-shopping').onclick = () => {
        const nome = document.getElementById('shop-nome').value.trim();
        const valor = document.getElementById('shop-valor').value.trim();
        const qtd = document.getElementById('shop-qtd').value.trim();
        const link = document.getElementById('shop-link').value.trim();
        const data = document.getElementById('shop-data').value;

        if (!nome) return alert("Preencha o nome do item!");

        if (shopIdEmEdicao) {
            const idx = shoppingList.findIndex(s => s.id === shopIdEmEdicao);
            if (idx !== -1) {
                shoppingList[idx] = { ...shoppingList[idx], nome, valor, qtd, link, data };
            }
        } else {
            shoppingList.push({ id: Date.now(), nome, valor, qtd, link, data });
        }

        salvarShoppingList();
        renderizarShoppingList();
        modalShopping.style.display = 'none';
    };
}

// ====== MOTOR DE FINANÇAS ======
let financas = { contas: [], cartoes: [], assinaturas: [], ganhos: [] };
let finEditId = null;
let finEditType = null; // 'conta', 'cartao', 'assinatura', 'ganho'

const modalFinancas = document.getElementById('modal-financas');

function carregarFinancas() {
    const salvo = localStorage.getItem('tv_financas');
    if (salvo) {
        financas = JSON.parse(salvo);
        if (!financas.ganhos) financas.ganhos = [];
    }
    renderizarFinancas();
}

function salvarFinancas() {
    localStorage.setItem('tv_financas', JSON.stringify(financas));
}

function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function getInitialsAndColor(name) {
    if (!name) return { initial: '?', color: '#555' };
    const n = name.toUpperCase();
    const initial = n.charAt(0);
    const colors = ['#8A05BE', '#FF5A5F', '#00A86B', '#1DA1F2', '#E1306C', '#FF0000', '#F5A623', '#4A90E2'];
    const idx = n.charCodeAt(0) % colors.length;
    return { initial, color: colors[idx] };
}

window.assinaturasExpandidas = false;
function toggleAssinaturas() {
    window.assinaturasExpandidas = !window.assinaturasExpandidas;
    renderizarFinancas();
}

function renderizarFinancas() {
    // Atualizar Mês
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const hoje = new Date();
    const mesText = `${meses[hoje.getMonth()]} ${hoje.getFullYear()}`;
    const elMes = document.getElementById('fin-mes-atual');
    if (elMes) elMes.innerText = mesText;

    // CONTAS
    let totalContas = 0;
    const listaContas = document.getElementById('lista-contas');
    if (listaContas) listaContas.innerHTML = '';
    financas.contas.forEach(c => {
        totalContas += parseFloat(c.saldo || 0);
        const { initial, color } = getInitialsAndColor(c.nome);
        const div = document.createElement('div'); div.className = 'fin-item';
        div.innerHTML = `
            <div class="fin-item-left">
                <div class="fin-icon" style="background-color: ${color};">${initial}</div>
                <div class="fin-item-info">
                    <span class="fin-item-name">${c.nome}</span>
                    <span class="fin-item-sub">${c.tipo}</span>
                </div>
            </div>
            <div class="fin-item-value-box">
                <span class="fin-item-value">${formatCurrency(c.saldo)}</span>
                <div class="fin-actions-hover">
                    <button class="btn-fin-edit" onclick="abrirEditFin('conta', ${c.id})">✏️</button>
                    <button class="btn-fin-del" onclick="deletarFin('conta', ${c.id})">🗑️</button>
                </div>
            </div>
        `;
        if (listaContas) listaContas.appendChild(div);
    });
    const elTotContas = document.getElementById('fin-total-contas');
    if (elTotContas) elTotContas.innerHTML = `${formatCurrency(totalContas)} <span class="fin-subtext">saldo total</span>`;
    const elCountContas = document.getElementById('fin-contas-count');
    if (elCountContas) elCountContas.innerText = `${financas.contas.length} contas`;

    // CARTÕES
    let totalLimiteDisp = 0;
    let totalLimiteReal = 0;
    const listaCartoes = document.getElementById('lista-cartoes');
    if (listaCartoes) listaCartoes.innerHTML = '';
    financas.cartoes.forEach(c => {
        totalLimiteDisp += parseFloat(c.limiteDisp || 0);
        totalLimiteReal += parseFloat(c.limiteTotal || 0);
        const { initial, color } = getInitialsAndColor(c.nome);
        const div = document.createElement('div'); div.className = 'fin-item';
        div.innerHTML = `
            <div class="fin-item-left">
                <div class="fin-icon" style="background-color: ${color};">${initial}</div>
                <div class="fin-item-info">
                    <span class="fin-item-name">${c.nome}</span>
                    <span class="fin-item-sub">${c.sub}</span>
                </div>
            </div>
            <div class="fin-item-value-box">
                <span class="fin-item-value">${formatCurrency(c.limiteDisp)}</span>
                <span class="fin-item-value-sub">a pagar</span>
                <div class="fin-actions-hover">
                    <button class="btn-fin-edit" onclick="abrirEditFin('cartao', ${c.id})">✏️</button>
                    <button class="btn-fin-del" onclick="deletarFin('cartao', ${c.id})">🗑️</button>
                </div>
            </div>
        `;
        if (listaCartoes) listaCartoes.appendChild(div);
    });
    const elTotLimite = document.getElementById('fin-total-limite');
    if (elTotLimite) elTotLimite.innerText = formatCurrency(totalLimiteDisp);
    const elDescLimite = document.getElementById('fin-limite-desc');
    if (elDescLimite) elDescLimite.innerText = `de ${formatCurrency(totalLimiteReal)} de limite total`;

    // ASSINATURAS E DÍVIDAS
    let totalAss = 0;
    const listaAss = document.getElementById('lista-assinaturas');
    if (listaAss) listaAss.innerHTML = '';
    financas.assinaturas.forEach(a => {
        totalAss += parseFloat(a.valor || 0);
    });

    const maxMostrar = 3;
    const itensMostrar = window.assinaturasExpandidas ? financas.assinaturas : financas.assinaturas.slice(0, maxMostrar);

    itensMostrar.forEach(a => {
        const { initial, color } = getInitialsAndColor(a.nome);
        const div = document.createElement('div'); div.className = 'fin-item';
        div.innerHTML = `
            <div class="fin-item-left">
                <div class="fin-icon" style="background-color: ${color};">${initial}</div>
                <div class="fin-item-info">
                    <span class="fin-item-name">${a.nome}</span>
                    <span class="fin-item-sub">🗓️ ${a.sub}</span>
                </div>
            </div>
            <div class="fin-item-value-box">
                <span class="fin-item-value">${formatCurrency(a.valor)}</span>
                <div class="fin-actions-hover">
                    <button class="btn-fin-edit" onclick="abrirEditFin('assinatura', ${a.id})">✏️</button>
                    <button class="btn-fin-del" onclick="deletarFin('assinatura', ${a.id})">🗑️</button>
                </div>
            </div>
        `;
        if (listaAss) listaAss.appendChild(div);
    });

    const elTotAss = document.getElementById('fin-total-assinaturas');
    if (elTotAss) elTotAss.innerHTML = `${formatCurrency(totalAss)} <span class="fin-subtext" style="margin-left:10px;">/mês • ${financas.assinaturas.length} ativas</span>`;
    const elCountAss = document.getElementById('fin-assinaturas-count');
    if (elCountAss) elCountAss.innerText = `${financas.assinaturas.length} assinaturas/dívidas`;

    document.querySelectorAll('.btn-ver-todas-assinaturas').forEach(btn => {
        if (financas.assinaturas.length <= maxMostrar) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'inline-block';
            btn.innerText = window.assinaturasExpandidas ? 'ver menos ↙' : 'ver todas ↗';
        }
    });

    // GANHOS
    let totalGanhos = 0;
    const listaGanhos = document.getElementById('lista-ganhos');
    if (listaGanhos) listaGanhos.innerHTML = '';
    financas.ganhos.forEach(g => {
        totalGanhos += parseFloat(g.valor || 0);
        const { initial, color } = getInitialsAndColor(g.nome);
        const div = document.createElement('div'); div.className = 'fin-item';
        div.innerHTML = `
            <div class="fin-item-left">
                <div class="fin-icon" style="background-color: ${color};">${initial}</div>
                <div class="fin-item-info">
                    <span class="fin-item-name">${g.nome}</span>
                    <span class="fin-item-sub">💰 ${g.sub}</span>
                </div>
            </div>
            <div class="fin-item-value-box">
                <span class="fin-item-value">${formatCurrency(g.valor)}</span>
                <div class="fin-actions-hover">
                    <button class="btn-fin-edit" onclick="abrirEditFin('ganho', ${g.id})">✏️</button>
                    <button class="btn-fin-del" onclick="deletarFin('ganho', ${g.id})">🗑️</button>
                </div>
            </div>
        `;
        if (listaGanhos) listaGanhos.appendChild(div);
    });
    const elTotGanhos = document.getElementById('fin-total-ganhos');
    if (elTotGanhos) elTotGanhos.innerHTML = `${formatCurrency(totalGanhos)} <span class="fin-subtext">total de receitas</span>`;

    // PROJEÇÃO DO MÊS
    const totalSaidas = totalAss + totalLimiteDisp;
    const projecao = totalContas + totalGanhos - totalSaidas;
    const elTotProj = document.getElementById('fin-total-projecao');
    if (elTotProj) {
        elTotProj.innerText = formatCurrency(projecao);
        elTotProj.style.color = projecao >= 0 ? 'var(--accent-color)' : '#ff4d4d';
    }
    if (document.getElementById('proj-entradas')) document.getElementById('proj-entradas').innerText = formatCurrency(totalContas + totalGanhos);
    if (document.getElementById('proj-saidas')) document.getElementById('proj-saidas').innerText = `- ${formatCurrency(totalSaidas)}`;
}

function deletarFin(tipo, id) {
    if (tipo === 'conta') financas.contas = financas.contas.filter(x => x.id !== id);
    if (tipo === 'cartao') financas.cartoes = financas.cartoes.filter(x => x.id !== id);
    if (tipo === 'assinatura') financas.assinaturas = financas.assinaturas.filter(x => x.id !== id);
    if (tipo === 'ganho') financas.ganhos = financas.ganhos.filter(x => x.id !== id);
    salvarFinancas();
    renderizarFinancas();
}

function abrirEditFin(tipo, id) {
    finEditType = tipo;
    finEditId = id;
    let item = null;

    if (tipo === 'conta') {
        if (id) item = financas.contas.find(x => x.id === id);
        document.getElementById('modal-conta-titulo').innerText = id ? "Editar Conta" : "Adicionar Conta";
        document.getElementById('fin-conta-nome').value = item ? item.nome : "";
        document.getElementById('fin-conta-tipo').value = item ? item.tipo : "";
        document.getElementById('fin-conta-saldo').value = item ? item.saldo : "0.00";
        document.getElementById('modal-edit-conta').style.display = 'flex';
    } else if (tipo === 'cartao') {
        if (id) item = financas.cartoes.find(x => x.id === id);
        document.getElementById('modal-cartao-titulo').innerText = id ? "Editar Cartão" : "Adicionar Cartão";
        document.getElementById('fin-cartao-nome').value = item ? item.nome : "";
        document.getElementById('fin-cartao-sub').value = item ? item.sub : "";
        document.getElementById('fin-cartao-limite-total').value = item ? item.limiteTotal : "0.00";
        document.getElementById('fin-cartao-limite-disp').value = item ? item.limiteDisp : "0.00";
        document.getElementById('modal-edit-cartao').style.display = 'flex';
    } else if (tipo === 'assinatura') {
        if (id) item = financas.assinaturas.find(x => x.id === id);
        document.getElementById('modal-assinatura-titulo').innerText = id ? "Editar Assinatura" : "Adicionar Assinatura";
        document.getElementById('fin-ass-nome').value = item ? item.nome : "";
        document.getElementById('fin-ass-sub').value = item ? item.sub : "";
        document.getElementById('fin-ass-valor').value = item ? item.valor : "0.00";
        document.getElementById('modal-edit-assinatura').style.display = 'flex';
    } else if (tipo === 'ganho') {
        if (id) item = financas.ganhos.find(x => x.id === id);
        document.getElementById('modal-ganho-titulo').innerText = id ? "Editar Receita" : "Adicionar Receita";
        document.getElementById('fin-ganho-nome').value = item ? item.nome : "";
        document.getElementById('fin-ganho-sub').value = item ? item.sub : "";
        document.getElementById('fin-ganho-valor').value = item ? item.valor : "0.00";
        document.getElementById('modal-edit-ganho').style.display = 'flex';
    }
}

// Botões para abrir modais de adição
if (document.getElementById('btn-add-conta')) document.getElementById('btn-add-conta').onclick = () => abrirEditFin('conta', null);
if (document.getElementById('btn-add-cartao')) document.getElementById('btn-add-cartao').onclick = () => abrirEditFin('cartao', null);
if (document.getElementById('btn-add-assinatura')) document.getElementById('btn-add-assinatura').onclick = () => abrirEditFin('assinatura', null);
if (document.getElementById('btn-add-ganho')) document.getElementById('btn-add-ganho').onclick = () => abrirEditFin('ganho', null);

// Fechar modais
if (document.getElementById('btn-fechar-conta')) document.getElementById('btn-fechar-conta').onclick = () => document.getElementById('modal-edit-conta').style.display = 'none';
if (document.getElementById('btn-fechar-cartao')) document.getElementById('btn-fechar-cartao').onclick = () => document.getElementById('modal-edit-cartao').style.display = 'none';
if (document.getElementById('btn-fechar-assinatura')) document.getElementById('btn-fechar-assinatura').onclick = () => document.getElementById('modal-edit-assinatura').style.display = 'none';
if (document.getElementById('btn-fechar-ganho')) document.getElementById('btn-fechar-ganho').onclick = () => document.getElementById('modal-edit-ganho').style.display = 'none';

// Salvar Conta
if (document.getElementById('btn-salvar-conta')) {
    document.getElementById('btn-salvar-conta').onclick = () => {
        const nome = document.getElementById('fin-conta-nome').value.trim();
        const tipo = document.getElementById('fin-conta-tipo').value.trim();
        const saldo = parseFloat(document.getElementById('fin-conta-saldo').value || 0);
        if (!nome) return alert("Preencha o nome!");

        if (finEditId) {
            const idx = financas.contas.findIndex(x => x.id === finEditId);
            if (idx !== -1) financas.contas[idx] = { id: finEditId, nome, tipo, saldo };
        } else {
            financas.contas.push({ id: Date.now(), nome, tipo, saldo });
        }
        salvarFinancas(); renderizarFinancas(); document.getElementById('modal-edit-conta').style.display = 'none';
    };
}

// Salvar Cartão
if (document.getElementById('btn-salvar-cartao')) {
    document.getElementById('btn-salvar-cartao').onclick = () => {
        const nome = document.getElementById('fin-cartao-nome').value.trim();
        const sub = document.getElementById('fin-cartao-sub').value.trim();
        const limiteTotal = parseFloat(document.getElementById('fin-cartao-limite-total').value || 0);
        const limiteDisp = parseFloat(document.getElementById('fin-cartao-limite-disp').value || 0);
        if (!nome) return alert("Preencha o nome!");

        if (finEditId) {
            const idx = financas.cartoes.findIndex(x => x.id === finEditId);
            if (idx !== -1) financas.cartoes[idx] = { id: finEditId, nome, sub, limiteTotal, limiteDisp };
        } else {
            financas.cartoes.push({ id: Date.now(), nome, sub, limiteTotal, limiteDisp });
        }
        salvarFinancas(); renderizarFinancas(); document.getElementById('modal-edit-cartao').style.display = 'none';
    };
}

// Salvar Assinatura
if (document.getElementById('btn-salvar-assinatura')) {
    document.getElementById('btn-salvar-assinatura').onclick = () => {
        const nome = document.getElementById('fin-ass-nome').value.trim();
        const sub = document.getElementById('fin-ass-sub').value.trim();
        const valor = parseFloat(document.getElementById('fin-ass-valor').value || 0);
        if (!nome) return alert("Preencha o nome!");

        if (finEditId) {
            const idx = financas.assinaturas.findIndex(x => x.id === finEditId);
            if (idx !== -1) financas.assinaturas[idx] = { id: finEditId, nome, sub, valor };
        } else {
            financas.assinaturas.push({ id: Date.now(), nome, sub, valor });
        }
        salvarFinancas(); renderizarFinancas(); document.getElementById('modal-edit-assinatura').style.display = 'none';
    };
}

// Salvar Ganho
if (document.getElementById('btn-salvar-ganho')) {
    document.getElementById('btn-salvar-ganho').onclick = () => {
        const nome = document.getElementById('fin-ganho-nome').value.trim();
        const sub = document.getElementById('fin-ganho-sub').value.trim();
        const valor = parseFloat(document.getElementById('fin-ganho-valor').value || 0);
        if (!nome) return alert("Preencha o nome!");

        if (finEditId) {
            const idx = financas.ganhos.findIndex(x => x.id === finEditId);
            if (idx !== -1) financas.ganhos[idx] = { id: finEditId, nome, sub, valor };
        } else {
            financas.ganhos.push({ id: Date.now(), nome, sub, valor });
        }
        salvarFinancas(); renderizarFinancas(); document.getElementById('modal-edit-ganho').style.display = 'none';
    };
}

// Lógica de Menu Finanças
if (document.getElementById('btn-financas')) {
    document.getElementById('btn-financas').onclick = () => {
        renderizarFinancas();
        modalFinancas.style.display = 'flex';
    };
}
if (document.getElementById('btn-fechar-financas')) {
    document.getElementById('btn-fechar-financas').onclick = () => {
        modalFinancas.style.display = 'none';
    };
}

// ====== YOUTUBE MUSIC ======
const modalYtMusic = document.getElementById('modal-ytmusic');
const ytWebview = document.getElementById('yt-webview');
const nowPlayingContainer = document.getElementById('now-playing-container');

if (document.getElementById('btn-ytmusic')) {
    document.getElementById('btn-ytmusic').onclick = () => {
        modalYtMusic.style.display = 'flex';
    };
}

if (document.getElementById('btn-fechar-ytmusic')) {
    document.getElementById('btn-fechar-ytmusic').onclick = () => {
        modalYtMusic.style.display = 'none';
    };
}

setInterval(() => {
    if (ytWebview && ytWebview.executeJavaScript) {
        ytWebview.executeJavaScript(`
            (function() {
                try {
                    let video = document.querySelector('video');
                    if (video && typeof video.setSinkId === 'function') {
                        let targetId = '${configApp.audioDeviceIdYt || 'default'}';
                        let targetLabel = '${configApp.audioDeviceLabelYt || ''}';
                        if (video.sinkId !== targetId) {
                            video.setSinkId(targetId).catch(err => {
                                navigator.mediaDevices.enumerateDevices().then(devices => {
                                    let dev = devices.find(d => d.label === targetLabel);
                                    if(dev && video.sinkId !== dev.deviceId) {
                                        video.setSinkId(dev.deviceId).catch(e => {});
                                    }
                                }).catch(e => {});
                            });
                        }
                    }
                    let titleEl = document.querySelector('yt-formatted-string.title.ytmusic-player-bar');
                    if (titleEl && titleEl.innerText) {
                        let artistEl = document.querySelector('span.subtitle.ytmusic-player-bar');
                        let imgEl = document.querySelector('ytmusic-player-bar img');
                        let isPaused = video ? video.paused : true;
                        
                        return { 
                            title: titleEl.innerText, 
                            artist: artistEl ? artistEl.innerText.split('•')[0].trim() : 'Artista', 
                            img: imgEl ? imgEl.src : '', 
                            isPlaying: !isPaused 
                        };
                    }
                    return null;
                } catch(e) { return null; }
            })()
        `).then(result => {
            if (result) {
                if (nowPlayingContainer.style.display === 'none') {
                    nowPlayingContainer.style.display = 'flex';
                }
                document.getElementById('np-title').innerText = result.title;
                document.getElementById('np-artist').innerText = result.artist;
                if (result.img && document.getElementById('np-cover').src !== result.img) {
                    document.getElementById('np-cover').src = result.img;
                }
                
                let playPauseBtn = document.getElementById('btn-yt-playpause');
                let anim = document.querySelector('.playing-animation');
                
                if (result.isPlaying) {
                    if (anim) anim.style.opacity = '1';
                    if (playPauseBtn) playPauseBtn.innerText = '⏸️';
                } else {
                    if (anim) anim.style.opacity = '0.3';
                    if (playPauseBtn) playPauseBtn.innerText = '▶️';
                }
            } else {
                nowPlayingContainer.style.display = 'none';
            }
        }).catch(err => { });
    }
}, 2000);

// Controles do Miniplayer
if (document.getElementById('btn-yt-prev')) {
    document.getElementById('btn-yt-prev').onclick = () => {
        if(ytWebview) ytWebview.executeJavaScript(`
            var prevBtn = document.querySelector('tp-yt-paper-icon-button.previous-button') || document.querySelector('.previous-button');
            if(prevBtn) prevBtn.click();
        `);
    };
    document.getElementById('btn-yt-next').onclick = () => {
        if(ytWebview) ytWebview.executeJavaScript(`
            var nextBtn = document.querySelector('tp-yt-paper-icon-button.next-button') || document.querySelector('.next-button');
            if(nextBtn) nextBtn.click();
        `);
    };
    document.getElementById('btn-yt-playpause').onclick = () => {
        if(ytWebview) ytWebview.executeJavaScript(`
            var ppBtn = document.getElementById('play-pause-button');
            if(ppBtn) {
                ppBtn.click();
            } else {
                var v = document.querySelector('video');
                if(v) v.paused ? v.play() : v.pause();
            }
        `);
    };
    if (document.getElementById('yt-volume')) {
        document.getElementById('yt-volume').oninput = (e) => {
            let vol = e.target.value / 100;
            if (ytWebview) ytWebview.executeJavaScript(`
                var v = document.querySelector('video');
                if(v) v.volume = ${vol};
            `);
        };
    }
}

// ====== MONITOR DE CLIMA ======
async function buscarClima() {
    try {
        document.getElementById('weather-desc').innerText = 'Buscando...';
        // Usar ipinfo.io que é mais confiável e não tem limite de requests chatos
        const geoRes = await fetch('https://ipinfo.io/json');
        const geoData = await geoRes.json();
        
        if (!geoData.loc) throw new Error("Sem lat/lon");
        
        const [lat, lon] = geoData.loc.split(',');

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();
        
        if (weatherData.current_weather) {
            const temp = Math.round(weatherData.current_weather.temperature);
            const code = weatherData.current_weather.weathercode;
            document.getElementById('weather-temp').innerText = temp + '°C';
            
            let icon = '🌤️'; let desc = 'Nublado';
            if (code === 0) { icon = '☀️'; desc = 'Céu limpo'; }
            else if (code <= 3) { icon = '⛅'; desc = 'Parcialmente nublado'; }
            else if (code <= 48) { icon = '🌫️'; desc = 'Neblina'; }
            else if (code <= 67) { icon = '🌧️'; desc = 'Chuva'; }
            else if (code <= 77) { icon = '❄️'; desc = 'Neve'; }
            else if (code <= 82) { icon = '🌦️'; desc = 'Pancadas de chuva'; }
            else if (code >= 95) { icon = '⛈️'; desc = 'Tempestade'; }
            
            document.getElementById('weather-icon').innerText = icon;
            document.getElementById('weather-desc').innerText = desc + ` (${geoData.city})`;
        }
    } catch (e) {
        console.error('Erro clima', e);
        document.getElementById('weather-desc').innerText = 'Indisponível';
    }
}

if(document.getElementById('weather-widget')) {
    document.getElementById('weather-widget').onclick = buscarClima;
    buscarClima();
    setInterval(buscarClima, 1800000); // Atualiza a cada 30 min
}

// ====== CENTRAL DE ALERTAS GAMERS ======
const modalGamers = document.getElementById('modal-gamers');
if (document.getElementById('btn-alertas-games')) {
    document.getElementById('btn-alertas-games').onclick = () => {
        carregarGameAlerts();
        modalGamers.style.display = 'flex';
    };
}
if (document.getElementById('btn-fechar-gamers')) {
    document.getElementById('btn-fechar-gamers').onclick = () => modalGamers.style.display = 'none';
}

function carregarGameAlerts() {
    const salvo = localStorage.getItem('tv_gamers');
    gameAlerts = salvo ? JSON.parse(salvo) : [];
    renderizarGameAlerts();
}

function salvarGameAlerts() {
    localStorage.setItem('tv_gamers', JSON.stringify(gameAlerts));
}

function renderizarGameAlerts() {
    const lista = document.getElementById('lista-gamers');
    if (!lista) return;
    lista.innerHTML = '';
    
    gameAlerts.sort((a,b) => a.time.localeCompare(b.time)).forEach(g => {
        const div = document.createElement('div');
        div.className = 'fin-item';
        div.style = 'border: 1px solid #9b59b6; background: rgba(155, 89, 182, 0.1); flex-direction: column; align-items: flex-start; gap: 10px; width: 100%; box-sizing: border-box;';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <span style="font-weight: bold; color: #fff;">🕹️ ${g.title}</span>
                <button class="btn-fin-del" onclick="deletarGameAlert(${g.id})" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">🗑️</button>
            </div>
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <span style="color: #9b59b6; font-size: 1.2rem; font-weight: bold;">⏰ ${g.time}</span>
                <label style="display:flex; align-items:center; gap:5px; font-size: 0.8rem; cursor:pointer;">
                    <input type="checkbox" ${g.ativo ? 'checked' : ''} onchange="toggleGameAlert(${g.id}, this.checked)"> Ativo
                </label>
            </div>
        `;
        lista.appendChild(div);
    });
}

function deletarGameAlert(id) {
    gameAlerts = gameAlerts.filter(x => x.id !== id);
    salvarGameAlerts();
    renderizarGameAlerts();
}

window.toggleGameAlert = function(id, ativo) {
    const idx = gameAlerts.findIndex(x => x.id === id);
    if(idx !== -1) {
        gameAlerts[idx].ativo = ativo;
        salvarGameAlerts();
    }
};

if (document.getElementById('btn-add-game-alert')) {
    document.getElementById('btn-add-game-alert').onclick = () => {
        const title = document.getElementById('game-alert-name').value.trim();
        const time = document.getElementById('game-alert-time').value;
        if (!title || !time) return alert("Preencha o nome e a hora!");
        gameAlerts.push({ id: Date.now(), title, time, ativo: true });
        document.getElementById('game-alert-name').value = '';
        document.getElementById('game-alert-time').value = '';
        salvarGameAlerts();
        renderizarGameAlerts();
    };
}

// ====== AGENDA MENSAL ======
let agendaEvents = {}; // formato: { "YYYY-MM-DD": [ {id, title, time} ] }
let agendaCurrentDate = new Date();
let selectedDateString = null;
const modalAgenda = document.getElementById('modal-agenda');
const modalAgendaEvento = document.getElementById('modal-agenda-evento');

if (document.getElementById('btn-agenda')) {
    document.getElementById('btn-agenda').onclick = () => {
        carregarAgenda();
        agendaCurrentDate = new Date();
        renderizarCalendario();
        modalAgenda.style.display = 'flex';
    };
}
if (document.getElementById('btn-fechar-agenda')) {
    document.getElementById('btn-fechar-agenda').onclick = () => modalAgenda.style.display = 'none';
}
if (document.getElementById('btn-fechar-evento')) {
    document.getElementById('btn-fechar-evento').onclick = () => modalAgendaEvento.style.display = 'none';
}
if (document.getElementById('btn-agenda-prev')) {
    document.getElementById('btn-agenda-prev').onclick = () => {
        agendaCurrentDate.setMonth(agendaCurrentDate.getMonth() - 1);
        renderizarCalendario();
    };
}
if (document.getElementById('btn-agenda-next')) {
    document.getElementById('btn-agenda-next').onclick = () => {
        agendaCurrentDate.setMonth(agendaCurrentDate.getMonth() + 1);
        renderizarCalendario();
    };
}

function carregarAgenda() {
    const salvo = localStorage.getItem('tv_agenda');
    agendaEvents = salvo ? JSON.parse(salvo) : {};
    renderizarProximosEventosAgenda();
    if (typeof renderizarTarefas === 'function') renderizarTarefas(); // Atualiza dashboard
}

function salvarAgenda() {
    localStorage.setItem('tv_agenda', JSON.stringify(agendaEvents));
    renderizarProximosEventosAgenda();
    if (typeof renderizarTarefas === 'function') renderizarTarefas();
}

function getEventosParaData(targetAno, targetMes, targetDia) {
    const targetDateStr = `${targetAno}-${(targetMes+1).toString().padStart(2,'0')}-${targetDia.toString().padStart(2,'0')}`;
    const targetDate = new Date(targetAno, targetMes, targetDia);
    const result = [];
    
    for (const dataStr in agendaEvents) {
        const [oAno, oMes, oDia] = dataStr.split('-');
        const originDate = new Date(oAno, oMes - 1, oDia);
        
        agendaEvents[dataStr].forEach(ev => {
            const rec = ev.rec || 'none';
            if (targetDate < originDate) return;
            
            if (rec === 'none' && targetDateStr === dataStr) {
                result.push({...ev, originStr: dataStr});
            } else if (rec === 'daily') {
                result.push({...ev, originStr: dataStr});
            } else if (rec === 'weekdays') {
                const w = targetDate.getDay();
                if (w >= 1 && w <= 5) result.push({...ev, originStr: dataStr});
            } else if (rec === 'weekends') {
                const w = targetDate.getDay();
                if (w === 0 || w === 6) result.push({...ev, originStr: dataStr});
            } else if (rec === 'weekly') {
                if (targetDate.getDay() === originDate.getDay()) result.push({...ev, originStr: dataStr});
            } else if (rec === 'biweekly') {
                if (targetDate.getDay() === originDate.getDay()) {
                    const diffTime = Math.abs(targetDate - originDate);
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays % 14 === 0) result.push({...ev, originStr: dataStr});
                }
            } else if (rec === 'monthly') {
                if (targetDate.getDate() === originDate.getDate()) result.push({...ev, originStr: dataStr});
            }
        });
    }
    return result;
}

function renderizarProximosEventosAgenda() {
    const listaPreview = document.getElementById('lista-agenda-preview');
    if(!listaPreview) return;
    listaPreview.innerHTML = '';
    
    let todosEventos = [];
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    // Para simplificar, vamos projetar os próximos 30 dias para pegar as recorrências futuras
    for (let i = 0; i < 30; i++) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
        const evs = getEventosParaData(d.getFullYear(), d.getMonth(), d.getDate());
        evs.forEach(ev => {
            todosEventos.push({
                dateObj: d,
                dateStr: `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`,
                title: ev.title,
                time: ev.time || ''
            });
        });
    }
    
    todosEventos.sort((a, b) => {
        if(a.dateObj.getTime() !== b.dateObj.getTime()) return a.dateObj.getTime() - b.dateObj.getTime();
        return a.time.localeCompare(b.time);
    });
    
    const proximos = todosEventos.slice(0, 5);
    
    if (proximos.length === 0) {
        listaPreview.innerHTML = '<div style="color: #aaa; font-size: 0.8rem; padding: 5px;">Nenhum evento futuro.</div>';
        return;
    }
    
    proximos.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'momentary-item';
        div.style.padding = '6px 8px';
        div.style.flexShrink = '0';
        div.style.cursor = 'pointer';
        div.onclick = () => {
            const mNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const ano = ev.dateObj.getFullYear();
            const mes = ev.dateObj.getMonth();
            const dia = ev.dateObj.getDate();
            const dataOriginalStr = `${ano}-${(mes+1).toString().padStart(2,'0')}-${dia.toString().padStart(2,'0')}`;
            
            modalAgenda.style.display = 'flex';
            carregarAgenda();
            agendaCurrentDate = new Date(ano, mes, 1);
            renderizarCalendario();
            abrirDia(dataOriginalStr, dia, mNames[mes]);
        };
        div.innerHTML = `
            <div class="momentary-item-text" style="color: #fff; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center; gap: 5px;">
                <span style="color: #2ecc71;">[${ev.dateStr}]</span> 
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${ev.title}</span>
            </div>
            ${ev.time ? `<div class="momentary-item-time" style="font-size: 0.75rem; opacity: 0.8; white-space: nowrap;">${ev.time}</div>` : ''}
        `;
        listaPreview.appendChild(div);
    });
}

function renderizarCalendario() {
    const grid = document.getElementById('agenda-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const year = agendaCurrentDate.getFullYear();
    const month = agendaCurrentDate.getMonth();
    const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('agenda-month-year').innerText = `${mesesNomes[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.style = 'background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);';
        grid.appendChild(div);
    }
    
    const hojeDate = new Date();
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
        const isHoje = hojeDate.getDate() === d && hojeDate.getMonth() === month && hojeDate.getFullYear() === year;
        
        const div = document.createElement('div');
        div.className = 'agenda-day-cell';
        let bg = isHoje ? 'rgba(46, 204, 113, 0.3)' : 'rgba(0,0,0,0.3)';
        let border = isHoje ? 'border: 2px solid #2ecc71;' : 'border: 1px solid rgba(255,255,255,0.1);';
        
        div.style = `background: ${bg}; ${border} border-radius: 8px; padding: 5px; cursor: pointer; display: flex; flex-direction: column; transition: 0.2s; min-height: 80px; position: relative;`;
        div.onmouseover = () => div.style.backgroundColor = 'rgba(255,255,255,0.1)';
        div.onmouseout = () => div.style.backgroundColor = bg;
        div.onclick = () => abrirDia(dateStr, d, mesesNomes[month]);
        
        div.innerHTML = `<div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">${d}</div>`;
        
        const evs = getEventosParaData(year, month, d);
        if (evs.length > 0) {
            const evContainer = document.createElement('div');
            evContainer.style = 'display: flex; flex-direction: column; gap: 2px; overflow: hidden;';
            evs.slice(0,3).forEach(ev => {
                const badge = document.createElement('div');
                badge.style = 'font-size: 0.65rem; background: #2ecc71; color: #000; border-radius: 3px; padding: 1px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: bold;';
                badge.innerText = (ev.time ? ev.time + ' ' : '') + ev.title;
                evContainer.appendChild(badge);
            });
            if(evs.length > 3) {
                const more = document.createElement('div');
                more.style = 'font-size: 0.65rem; color: #aaa; text-align: center;';
                more.innerText = `+${evs.length - 3} eventos`;
                evContainer.appendChild(more);
            }
            div.appendChild(evContainer);
        }
        grid.appendChild(div);
    }
}

function abrirDia(dateStr, d, mName) {
    selectedDateString = dateStr;
    document.getElementById('modal-agenda-titulo').innerText = `Eventos: ${d} de ${mName}`;
    document.getElementById('agenda-evento-title').value = '';
    document.getElementById('agenda-evento-time').value = '';
    document.getElementById('agenda-evento-cat').value = '';
    document.getElementById('agenda-evento-rec').value = 'none';
    document.getElementById('agenda-evento-dash').checked = false;
    renderizarEventosDia();
    modalAgendaEvento.style.display = 'flex';
}

function renderizarEventosDia() {
    const lista = document.getElementById('lista-eventos-dia');
    lista.innerHTML = '';
    if (!selectedDateString) return;
    
    const [a, m, d] = selectedDateString.split('-');
    const evs = getEventosParaData(parseInt(a), parseInt(m)-1, parseInt(d));
    if (evs.length === 0) {
        lista.innerHTML = '<div style="color:#aaa; text-align:center; font-size:0.9rem;">Nenhum evento neste dia.</div>';
        return;
    }
    
    evs.sort((a,b) => (a.time||'24:00').localeCompare(b.time||'24:00')).forEach(ev => {
        const div = document.createElement('div');
        div.style = 'background: rgba(255,255,255,0.1); margin-bottom: 5px; padding: 5px 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;';
        
        // Build recurrence string
        const recMap = { 'none': '', 'daily': ' (Diário)', 'weekdays': ' (Dias Úteis)', 'weekends': ' (Fim de Sem.)', 'weekly': ' (Semanal)', 'biweekly': ' (Quinzenal)', 'monthly': ' (Mensal)' };
        const recStr = recMap[ev.rec || 'none'] || '';

        div.innerHTML = `
            <div>
                <span style="font-weight: bold; color: #2ecc71;">${ev.time ? ev.time+' - ' : ''}</span>
                <span>${ev.title}${recStr}</span>
                ${ev.cat ? `<span style="font-size: 0.7rem; background: #e67e22; color: #000; padding: 2px 5px; border-radius: 4px; margin-left: 5px;">${ev.cat}</span>` : ''}
            </div>
            <button onclick="deletarEventoAgenda(${ev.id}, '${ev.originStr}')" style="background: none; border: none; cursor: pointer;">❌</button>
        `;
        lista.appendChild(div);
    });
}

function deletarEventoAgenda(id, originStr) {
    if(!originStr) return;
    agendaEvents[originStr] = agendaEvents[originStr].filter(x => x.id !== id);
    if(agendaEvents[originStr].length === 0) delete agendaEvents[originStr];
    salvarAgenda();
    renderizarEventosDia();
    renderizarCalendario();
}

if(document.getElementById('btn-salvar-evento')) {
    document.getElementById('btn-salvar-evento').onclick = () => {
        const title = document.getElementById('agenda-evento-title').value.trim();
        const time = document.getElementById('agenda-evento-time').value;
        const cat = document.getElementById('agenda-evento-cat').value.trim();
        const rec = document.getElementById('agenda-evento-rec').value;
        const dash = document.getElementById('agenda-evento-dash').checked;
        
        if(!title) return alert("Preencha o título do evento!");
        
        if(!agendaEvents[selectedDateString]) agendaEvents[selectedDateString] = [];
        agendaEvents[selectedDateString].push({ id: Date.now(), title, time, cat, rec, dash });
        salvarAgenda();
        
        renderizarEventosDia();
        renderizarCalendario();
    };
}

// ====== POMODORO FOCUS ======
let pomoInterval = null;
let pomoTimeLeft = 25 * 60;
let isPomoRunning = false;
let isPomoBreak = false;
const POMO_WORK = 25 * 60;
const POMO_BREAK = 5 * 60;

const modalPomo = document.getElementById('modal-pomodoro');
const pomoCircle = document.getElementById('pomodoro-circle');
const pomoTimeEl = document.getElementById('pomodoro-time');
const pomoStatusEl = document.getElementById('pomodoro-status');
const btnPomoStart = document.getElementById('btn-pomo-start');
const btnPomoPause = document.getElementById('btn-pomo-pause');

if (document.getElementById('btn-pomodoro')) {
    document.getElementById('btn-pomodoro').onclick = () => {
        modalPomo.style.display = 'flex';
        updatePomoUI();
    };
}
if (document.getElementById('btn-fechar-pomodoro')) {
    document.getElementById('btn-fechar-pomodoro').onclick = () => modalPomo.style.display = 'none';
}

function updatePomoUI() {
    const total = isPomoBreak ? POMO_BREAK : POMO_WORK;
    const pct = pomoTimeLeft / total;
    const offset = 879.64 - (pct * 879.64);
    pomoCircle.style.strokeDashoffset = offset;
    
    const m = Math.floor(pomoTimeLeft / 60).toString().padStart(2, '0');
    const s = (pomoTimeLeft % 60).toString().padStart(2, '0');
    pomoTimeEl.innerText = `${m}:${s}`;
    
    if(isPomoBreak) {
        pomoStatusEl.innerText = "PAUSA";
        pomoStatusEl.style.color = "#2ecc71";
        pomoStatusEl.style.textShadow = "0 0 20px #2ecc71";
        pomoCircle.style.stroke = "#2ecc71";
    } else {
        pomoStatusEl.innerText = "FOCUS";
        pomoStatusEl.style.color = "#ff4757";
        pomoStatusEl.style.textShadow = "0 0 20px #ff4757";
        pomoCircle.style.stroke = "#ff4757";
    }
}

if(btnPomoStart) {
    btnPomoStart.onclick = () => {
        if(isPomoRunning) return;
        isPomoRunning = true;
        btnPomoStart.style.display = 'none';
        btnPomoPause.style.display = 'block';
        
        pomoInterval = setInterval(() => {
            pomoTimeLeft--;
            if(pomoTimeLeft <= 0) {
                clearInterval(pomoInterval);
                isPomoRunning = false;
                startBeep();
                setTimeout(stopBeep, 3000);
                
                isPomoBreak = !isPomoBreak;
                pomoTimeLeft = isPomoBreak ? POMO_BREAK : POMO_WORK;
                btnPomoStart.style.display = 'block';
                btnPomoPause.style.display = 'none';
            }
            updatePomoUI();
        }, 1000);
    };
}

if(btnPomoPause) {
    btnPomoPause.onclick = () => {
        isPomoRunning = false;
        clearInterval(pomoInterval);
        btnPomoStart.style.display = 'block';
        btnPomoPause.style.display = 'none';
    };
}

if(document.getElementById('btn-pomo-reset')) {
    document.getElementById('btn-pomo-reset').onclick = () => {
        isPomoRunning = false;
        clearInterval(pomoInterval);
        isPomoBreak = false;
        pomoTimeLeft = POMO_WORK;
        btnPomoStart.style.display = 'block';
        btnPomoPause.style.display = 'none';
        updatePomoUI();
    };
}

// ====== GAME CENTER ======
const modalGameCenter = document.getElementById('modal-game-center');
if (document.getElementById('btn-game-center')) {
    document.getElementById('btn-game-center').onclick = () => {
        modalGameCenter.style.display = 'flex';
    };
}
if (document.getElementById('btn-fechar-game-center')) {
    document.getElementById('btn-fechar-game-center').onclick = () => {
        modalGameCenter.style.display = 'none';
    };
}
if (document.getElementById('btn-launch-idle-hero')) {
    document.getElementById('btn-launch-idle-hero').onclick = () => {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('launch-idle-hero');
        modalGameCenter.style.display = 'none';
    };
}

// ====== INÍCIO DO SISTEMA ======
carregarTarefas(); carregarMomentaneas(); carregarGameAlerts(); carregarAgenda(); carregarShoppingList(); carregarFinancas(); carregarConfiguracoes(); syncApiTime(); setInterval(syncApiTime, 3600000); setInterval(tick, 1000); tick();

// Verifica Auto-Start do Idle Hero
if (localStorage.getItem('idle_hero_autostart') === 'true') {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('launch-idle-hero');
}

// ====== WIDGET DE MENSAGENS (WHATSAPP/DISCORD) ======
const modalMensagens = document.getElementById('modal-mensagens');
const btnMensagens = document.getElementById('btn-mensagens');
const btnFecharMensagens = document.getElementById('btn-fechar-mensagens');
const tabWhatsapp = document.getElementById('tab-whatsapp');
const tabDiscord = document.getElementById('tab-discord');
const viewWhatsapp = document.getElementById('whatsapp-webview');
const viewDiscord = document.getElementById('discord-webview');

if (btnMensagens) {
    btnMensagens.onclick = () => {
        modalMensagens.style.display = 'flex';
    };
}
if (btnFecharMensagens) {
    btnFecharMensagens.onclick = () => {
        modalMensagens.style.display = 'none';
    };
}

if (tabWhatsapp && tabDiscord) {
    tabWhatsapp.onclick = () => {
        tabWhatsapp.className = "btn-success";
        tabWhatsapp.style.background = "#25D366";
        tabWhatsapp.style.borderColor = "#25D366";
        tabDiscord.className = "btn-icon";
        tabDiscord.style.background = "#5865F2";
        viewWhatsapp.style.display = "flex";
        viewDiscord.style.display = "none";
    };
    tabDiscord.onclick = () => {
        tabDiscord.className = "btn-success";
        tabDiscord.style.background = "#5865F2";
        tabDiscord.style.borderColor = "#5865F2";
        tabWhatsapp.className = "btn-icon";
        tabWhatsapp.style.background = "#25D366";
        viewDiscord.style.display = "flex";
        viewWhatsapp.style.display = "none";
    };
}

// Lógica de Notificações
let wppHasMsg = false;
let discordHasMsg = false;

function updateMsgBadges() {
    const mainBadge = document.getElementById('msg-badge');
    const wppBadge = document.getElementById('tab-whatsapp-badge');
    const discordBadge = document.getElementById('tab-discord-badge');
    
    if (mainBadge) mainBadge.style.display = (wppHasMsg || discordHasMsg) ? 'block' : 'none';
    if (wppBadge) wppBadge.style.display = wppHasMsg ? 'block' : 'none';
    if (discordBadge) discordBadge.style.display = discordHasMsg ? 'block' : 'none';
}

if (viewWhatsapp) {
    viewWhatsapp.addEventListener('page-title-updated', (e) => {
        // WhatsApp mostra (1) WhatsApp na barra de título quando há notificação
        if (e.title && e.title.match(/^\(\d+\)/)) {
            wppHasMsg = true;
        } else {
            wppHasMsg = false;
        }
        updateMsgBadges();
    });
}

if (viewDiscord) {
    viewDiscord.addEventListener('page-title-updated', (e) => {
        // Discord usa • ou (1) no título da aba
        if (e.title && (e.title.includes('•') || e.title.match(/^\(\d+\)/) || e.title.toLowerCase().includes('nova'))) {
            discordHasMsg = true;
        } else {
            discordHasMsg = false;
        }
        updateMsgBadges();
    });
}

// ====== USB EJECTION ======
const usbWidget = document.getElementById('usb-widget');
ipcRenderer.on('usb-detected', (event, drives) => {
    if (!drives || drives.length === 0) {
        usbWidget.style.display = 'none';
        usbWidget.innerHTML = '';
        return;
    }
    usbWidget.style.display = 'flex';
    usbWidget.innerHTML = '';
    drives.forEach(d => {
        const btn = document.createElement('button');
        btn.className = 'btn-icon';
        btn.style = 'background: rgba(243, 156, 18, 0.3); border-color: #f39c12; color: #fff; font-size: 0.9rem; padding: 5px 10px;';
        btn.innerHTML = `⏏️ Ejetar ${d.name} (${d.letter})`;
        btn.onclick = async () => {
            btn.innerHTML = '⌛ Ejetando...';
            try {
                await ipcRenderer.invoke('eject-usb', d.letter);
                alert(`${d.name} (${d.letter}) ejetado com sucesso! Você já pode removê-lo.`);
            } catch (e) {
                alert(`Erro ao ejetar ${d.letter}: ${e.message}`);
                btn.innerHTML = `⏏️ Ejetar ${d.name} (${d.letter})`;
            }
        };
        usbWidget.appendChild(btn);
    });
});