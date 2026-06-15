const { ipcRenderer } = require('electron');

const CLASSES = [
    { name: 'Arqueiro',   stats: { str: 4, agi: 3, dex: 5, vit: 2, int: 1 }, seed: 'Archer' },
    { name: 'Guerreiro',  stats: { str: 5, agi: 2, dex: 3, vit: 4, int: 1 }, seed: 'Warrior' },
    { name: 'Mago',       stats: { str: 1, agi: 4, dex: 3, vit: 2, int: 5 }, seed: 'Mage' },
    { name: 'Assassino',  stats: { str: 3, agi: 5, dex: 4, vit: 1, int: 2 }, seed: 'Assassin' },
    { name: 'Paladino',   stats: { str: 4, agi: 1, dex: 2, vit: 5, int: 3 }, seed: 'Paladin' },
    { name: 'Bardo',      stats: { str: 1, agi: 3, dex: 4, vit: 2, int: 5 }, seed: 'Bard' },
    { name: 'Necromante', stats: { str: 1, agi: 2, dex: 3, vit: 4, int: 5 }, seed: 'Necromancer' },
    { name: 'Monge',      stats: { str: 4, agi: 5, dex: 2, vit: 3, int: 1 }, seed: 'Monk' },
    { name: 'Berserker',  stats: { str: 5, agi: 4, dex: 2, vit: 3, int: 1 }, seed: 'Berserker' },
    { name: 'Clérigo',    stats: { str: 2, agi: 1, dex: 3, vit: 5, int: 4 }, seed: 'Cleric' }
];

let gameState = {
    gold: 300,
    team: [],
    level: 1,
    xp: 0,
    xpMax: 100,
    points: 0
};

let currentEnemy = null;
let combatInterval = null;
let selectedHeroIndex = null;

function carregarJogo() {
    const salvo = localStorage.getItem('idle_hero_save');
    if (salvo) {
        gameState = JSON.parse(salvo);
    }
    updateUI();
    iniciarCombate();
}

function salvarJogo() {
    localStorage.setItem('idle_hero_save', JSON.stringify(gameState));
}

function getMaxHp(hero) {
    return hero.stats.vit * 5 + (hero.level * 10);
}

document.getElementById('btn-recruit').onclick = () => {
    abrirTaverna();
};

function abrirTaverna() {
    if (gameState.team.length >= 5) {
        alert("Sua equipe já está cheia! (Máx: 5)");
        return;
    }
    const list = document.getElementById('tavern-list');
    list.innerHTML = '';
    
    CLASSES.forEach((cls, index) => {
        const div = document.createElement('div');
        div.className = 'tavern-item';
        div.onclick = () => comprarHeroi(index);
        div.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${cls.seed}&scale=100" style="width:40px; height:40px; border-radius:4px; background:radial-gradient(circle, #333, #111); border:1px solid #b8860b;">
                <div>
                    <div class="tavern-item-name">${cls.name}</div>
                    <div class="tavern-item-stats">STR:${cls.stats.str} AGI:${cls.stats.agi} DEX:${cls.stats.dex} VIT:${cls.stats.vit} INT:${cls.stats.int}</div>
                </div>
            </div>
            <div style="color:gold; font-size:0.9rem; font-weight:bold;">100 💰</div>
        `;
        list.appendChild(div);
    });
    
    document.getElementById('modal-tavern').style.display = 'flex';
}

window.closeTavern = function() {
    document.getElementById('modal-tavern').style.display = 'none';
};

function comprarHeroi(classIndex) {
    if (gameState.gold >= 100 && gameState.team.length < 5) {
        gameState.gold -= 100;
        const cls = CLASSES[classIndex];
        
        const newHero = {
            id: Date.now(),
            name: cls.name,
            classData: cls,
            level: 1,
            unspentPoints: 0,
            stats: { ...cls.stats },
            hp: 0
        };
        newHero.hp = getMaxHp(newHero);
        gameState.team.push(newHero);
        
        salvarJogo();
        updateUI();
        closeTavern();
    } else if (gameState.team.length >= 5) {
        alert("Equipe cheia! Máximo 5 heróis.");
    } else {
        alert("Ouro insuficiente! Vá batalhar por mais 💰.");
    }
}

function updateUI() {
    document.getElementById('team-gold').innerText = gameState.gold;
    document.getElementById('team-xp').innerText = gameState.xp;
    document.getElementById('team-xp-max').innerText = gameState.xpMax;
    document.getElementById('team-level').innerText = gameState.level;
    
    // Nova barra de XP geral
    let xpPct = Math.min(100, (gameState.xp / gameState.xpMax) * 100);
    document.getElementById('team-xp-fill').style.width = `${xpPct}%`;
    
    // Total de pontos disponíveis da equipe (Soma)
    let totalPoints = 0;
    gameState.team.forEach(h => totalPoints += h.unspentPoints);
    document.getElementById('team-points').innerText = totalPoints;
    
    const list = document.getElementById('character-list');
    list.innerHTML = '';
    
    gameState.team.forEach((hero, index) => {
        const maxHp = getMaxHp(hero);
        const hpPct = Math.max(0, (hero.hp / maxHp) * 100);
        
        const div = document.createElement('div');
        div.className = 'char-card';
        div.innerHTML = `
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${hero.classData.seed}&scale=100" class="char-img">
            <div class="char-info">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="char-name">${hero.name} (Nv ${hero.level})</span>
                    <button class="btn-stat" style="width:20px; height:20px; border-radius:4px; font-size:0.7rem;" onclick="abrirStatus(${index})">
                        ${hero.unspentPoints > 0 ? '✨' : 'ℹ️'}
                    </button>
                </div>
                <span class="char-class">STR:${hero.stats.str} AGI:${hero.stats.agi} DEX:${hero.stats.dex} VIT:${hero.stats.vit} INT:${hero.stats.int}</span>
                <div class="char-hp-bg"><div class="char-hp-fill" style="width: ${hpPct}%"></div></div>
            </div>
        `;
        list.appendChild(div);
    });
}

function gerarInimigo() {
    const tipos = ['Demonio', 'Dragon', 'Vampire', 'Lich', 'Behemoth', 'Titan'];
    const nome = tipos[Math.floor(Math.random() * tipos.length)];
    const hp = 50 * gameState.level;
    currentEnemy = {
        name: `Lvl ${gameState.level} ${nome}`,
        hp: hp,
        maxHp: hp,
        img: `https://api.dicebear.com/7.x/bottts/svg?seed=${nome}&baseColor=e74c3c,c0392b`
    };
    
    document.getElementById('enemy-display').style.display = 'block';
    document.getElementById('enemy-name').innerText = currentEnemy.name;
    document.getElementById('enemy-img').src = currentEnemy.img;
    document.getElementById('enemy-hp').style.width = '100%';
    document.getElementById('combat-log').innerText = `Um ${currentEnemy.name} selvagem apareceu!`;
}

function iniciarCombate() {
    if(!currentEnemy) gerarInimigo();
    
    if(combatInterval) clearInterval(combatInterval);
    
    combatInterval = setInterval(() => {
        if(gameState.team.length === 0) {
            document.getElementById('combat-log').innerText = "Recrute um herói para lutar!";
            return;
        }
        
        // Curar herois mortos lentamente
        let vivos = 0;
        gameState.team.forEach(h => {
            if (h.hp <= 0) {
                h.hp += getMaxHp(h) * 0.1; // Revive 10% por turno
            } else {
                vivos++;
            }
        });
        
        if (vivos === 0) {
            document.getElementById('combat-log').innerText = "Equipe aniquilada... Descansando.";
            updateUI();
            return;
        }

        // Ataque dos Heróis
        let totalDamage = 0;
        gameState.team.forEach(hero => {
            if(hero.hp > 0) {
                // Cálculo de dano super simples para MVP:
                // STR = Dano Físico, INT = Dano Mágico. DEX = Chance acerto
                let dmg = hero.stats.str * 2 + hero.stats.int * 2;
                totalDamage += dmg;
            }
        });
        
        currentEnemy.hp -= totalDamage;
        document.getElementById('combat-log').innerText = `Equipe causou ${totalDamage} de dano!`;
        
        if (currentEnemy.hp <= 0) {
            // Matou inimigo
            const xpGained = 20 * gameState.level;
            const goldGained = 10 * gameState.level;
            gameState.xp += xpGained;
            gameState.gold += goldGained;
            document.getElementById('combat-log').innerText = `Inimigo derrotado! +${xpGained}XP +${goldGained}💰`;
            
            // Check level up global
            if (gameState.xp >= gameState.xpMax) {
                gameState.level++;
                gameState.xp -= gameState.xpMax;
                gameState.xpMax = Math.floor(gameState.xpMax * 1.5);
                
                // Dar 5 pontos para cada heroi
                gameState.team.forEach(h => {
                    h.level++;
                    h.unspentPoints += 5;
                    h.hp = getMaxHp(h); // cura total
                });
                document.getElementById('combat-log').innerText += `\n🌟 LEVEL UP DA EQUIPE!`;
            }
            
            gerarInimigo();
        } else {
            // Inimigo ataca (Alvo é o herói VIVO com MAIOR Armadura/VIT)
            let target = null;
            let maxVit = -1;
            gameState.team.forEach(h => {
                if (h.hp > 0 && h.stats.vit > maxVit) {
                    maxVit = h.stats.vit;
                    target = h;
                }
            });
            
            if(target) {
                const enemyDmg = 5 * gameState.level;
                // Defesa (VIT * 1)
                const def = target.stats.vit * 1;
                let danoFinal = Math.max(1, enemyDmg - def);
                target.hp -= danoFinal;
                document.getElementById('combat-log').innerText += `\n${currentEnemy.name} causou ${danoFinal} a ${target.name}!`;
            }
        }
        
        // Atualiza barra HP do inimigo
        const pct = Math.max(0, (currentEnemy.hp / currentEnemy.maxHp) * 100);
        document.getElementById('enemy-hp').style.width = `${pct}%`;
        
        salvarJogo();
        updateUI();
        
    }, 2000); // Turno a cada 2 segundos
}

// ====== MODAL STATUS ======
window.abrirStatus = function(index) {
    selectedHeroIndex = index;
    const hero = gameState.team[index];
    document.getElementById('modal-char-name').innerText = hero.name + ` (Nv ${hero.level})`;
    document.getElementById('modal-points').innerText = hero.unspentPoints;
    
    document.getElementById('stat-str').innerText = hero.stats.str;
    document.getElementById('stat-agi').innerText = hero.stats.agi;
    document.getElementById('stat-dex').innerText = hero.stats.dex;
    document.getElementById('stat-vit').innerText = hero.stats.vit;
    document.getElementById('stat-int').innerText = hero.stats.int;
    
    document.getElementById('modal-status').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('modal-status').style.display = 'none';
};

window.addStat = function(statName) {
    if(selectedHeroIndex === null) return;
    const hero = gameState.team[selectedHeroIndex];
    if(hero.unspentPoints > 0) {
        hero.unspentPoints--;
        hero.stats[statName]++;
        if(statName === 'vit') {
            hero.hp += 5; // Aumenta HP max na hora
        }
        salvarJogo();
        updateUI();
        abrirStatus(selectedHeroIndex);
    }
};

// ====== ARRASTAR E FECHAR JANELA ======
document.getElementById('btn-close').onclick = () => {
    const isBg = localStorage.getItem('idle_hero_background') === 'true';
    if (isBg) {
        ipcRenderer.send('hide-idle-hero');
    } else {
        ipcRenderer.send('close-idle-hero');
    }
};

document.getElementById('btn-settings').onclick = () => {
    document.getElementById('chk-autostart').checked = localStorage.getItem('idle_hero_autostart') === 'true';
    document.getElementById('chk-background').checked = localStorage.getItem('idle_hero_background') === 'true';
    document.getElementById('modal-settings').style.display = 'flex';
};

window.saveSettings = function() {
    localStorage.setItem('idle_hero_autostart', document.getElementById('chk-autostart').checked);
    localStorage.setItem('idle_hero_background', document.getElementById('chk-background').checked);
    document.getElementById('modal-settings').style.display = 'none';
};

window.confirmarReset = function() {
    const input = document.getElementById('input-reset').value;
    if (input === 'CERTEZA') {
        localStorage.removeItem('idle_hero_save');
        location.reload(); // Recarrega a janela do jogo para começar limpo
    } else {
        alert("Palavra incorreta. O progresso NÃO foi apagado.");
        document.getElementById('modal-reset').style.display = 'none';
        document.getElementById('input-reset').value = '';
    }
};

carregarJogo();
