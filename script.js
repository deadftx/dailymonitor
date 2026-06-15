// === COMUNICAÇÃO COM O WINDOWS ===
const { ipcRenderer } = require('electron');

// ====== CONFIGURAÇÕES DO SISTEMA ======
let configApp = {
    autostart: false,
    monitorId: "",
    audioDeviceId: "default",
    audioDeviceIdYt: "default",
    audioDeviceLabelYt: "",
    wallpaperPath: "",
    wallpaperOpacity: 0.5
};

// Nova Estrutura para os Lembretes Momentâneos (inclui dados de alarme)
let momentaneas = [];

// Variável para controle do editor universal
let idEmEdicao = null;
let tipoEmEdicao = null; // 'recorrente' ou 'momentanea'

async function carregarConfiguracoes() {
    const salvo = localStorage.getItem('tv_config');
    if (salvo) configApp = JSON.parse(salvo);

    ipcRenderer.send('set-autostart', configApp.autostart);

    if (configApp.monitorId) {
        ipcRenderer.send('set-monitor', configApp.monitorId);
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

    // Combina tarefas recorrentes com momentâneas ativas e que tenham hora definida
    const momentaneasComAlarme = momentaneas.filter(m => !m.arquivado && m.time !== "");
    const todasTasks = [...tarefas, ...momentaneasComAlarme];

    todasTasks.forEach(tarefa => {
        if (!tarefa.ativo) return;
        // Se tiver dias definidos (recorrente), verifica o dia. Se não, é momentânea e deve tocar.
        if (tarefa.dias && !tarefa.dias.includes(diaHoje)) return;

        if (calcularHoraDisparo(tarefa.time, tarefa.preAviso) === horaAtual) {
            // Usa o tipo na chave para não conflitar IDs
            const tipo = tarefa.dias ? 'rec' : 'mom';
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
    document.getElementById('alerta-titulo').innerText = tarefa.title;
    document.getElementById('alerta-hora').innerText = tarefa.preAviso !== "0" ? `Evento às ${tarefa.time}!` : `Agora! (${tarefa.time})`;
    document.getElementById('alerta-notas').innerText = tarefa.notas ? `Obs: ${tarefa.notas}` : '';
    modalAlerta.style.display = 'flex';

    // Configuração do clique de parada
    document.getElementById('btn-parar-alarme').onclick = () => {
        modalAlerta.style.display = 'none';
        stopBeep();

        // NOVO: Se NÃO tiver a propriedade 'dias', sabemos que é uma nota momentânea/rápida
        if (!tarefa.dias) {
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
    const cats = [...new Set(tarefas.map(t => t.category))];
    cats.forEach(c => {
        const col = document.createElement('div'); col.className = 'category-column';
        const head = document.createElement('div'); head.className = 'category-header'; head.innerText = c;
        col.appendChild(head);
        const list = document.createElement('div'); list.className = 'task-list';
        const tasks = tarefas.filter(t => t.category === c).sort((a, b) => a.time.localeCompare(b.time));
        tasks.forEach(t => {
            const card = document.createElement('div'); card.className = `task-card ${t.ativo ? 'ativo' : 'inactive'}`;
            card.innerHTML = `
                <div class="task-click-area" data-id="${t.id}"><div class="task-info"><h3>${t.title}</h3></div></div>
                <div class="task-time">${t.time}</div>
                <button class="delete-btn" data-id="${t.id}">X</button>
            `;
            list.appendChild(card);
        });
        col.appendChild(list); board.appendChild(col);
    });
    document.querySelectorAll('.delete-btn').forEach(b => b.onclick = (e) => deletarTarefa(parseInt(e.target.getAttribute('data-id'))));
    document.querySelectorAll('.task-click-area').forEach(a => a.onclick = (e) => abrirEdicaoRecorrente(parseInt(e.currentTarget.getAttribute('data-id'))));
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
    const ativas = momentaneas.filter(m => !m.arquivado).sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
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
                <span class="fin-item-value-sub">disponível</span>
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
    const projecao = totalGanhos - totalAss;
    const elTotProj = document.getElementById('fin-total-projecao');
    if (elTotProj) {
        elTotProj.innerText = formatCurrency(projecao);
        elTotProj.style.color = projecao >= 0 ? 'var(--accent-color)' : '#ff4444';
    }
    if (document.getElementById('proj-entradas')) document.getElementById('proj-entradas').innerText = formatCurrency(totalGanhos);
    if (document.getElementById('proj-saidas')) document.getElementById('proj-saidas').innerText = `- ${formatCurrency(totalAss)}`;
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
                    if (video && !video.paused) {
                        let titleEl = document.querySelector('yt-formatted-string.title.ytmusic-player-bar');
                        let artistEl = document.querySelector('span.subtitle.ytmusic-player-bar');
                        let imgEl = document.querySelector('ytmusic-player-bar img');
                        
                        return { 
                            title: titleEl ? titleEl.innerText : 'Música', 
                            artist: artistEl ? artistEl.innerText.split('•')[0].trim() : 'Artista', 
                            img: imgEl ? imgEl.src : '', 
                            isPlaying: true 
                        };
                    }
                    return { isPlaying: false };
                } catch(e) { return { isPlaying: false }; }
            })()
        `).then(result => {
            if (result && result.isPlaying) {
                if (nowPlayingContainer.style.display === 'none') {
                    nowPlayingContainer.style.display = 'flex';
                }
                document.getElementById('np-title').innerText = result.title;
                document.getElementById('np-artist').innerText = result.artist;
                if (result.img) {
                    document.getElementById('np-cover').src = result.img;
                }
            } else {
                nowPlayingContainer.style.display = 'none';
            }
        }).catch(err => { });
    }
}, 2000);

// ====== INÍCIO DO SISTEMA ======
carregarTarefas(); carregarMomentaneas(); carregarShoppingList(); carregarFinancas(); carregarConfiguracoes(); syncApiTime(); setInterval(syncApiTime, 3600000); setInterval(tick, 1000); tick();