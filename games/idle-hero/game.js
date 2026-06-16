const { ipcRenderer } = require('electron');

const CLASSES = [
    { name: 'Arqueiro',   stats: { str: 4, agi: 3, dex: 5, vit: 2, int: 1 }, seed: 'Archer', skills: [
        { name: 'Tiro Rápido', icon: '🏹', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Olho de Águia', icon: '👁️', level: 6, type: 'dmg', mult: 2.0 },
        { name: 'Chuva de Flechas', icon: '🌧️', level: 9, type: 'aoe', mult: 1.2 },
        { name: 'Flecha Venenosa', icon: '🐍', level: 12, type: 'dmg', mult: 2.5 },
        { name: 'Tiro Perfurante', icon: '🎯', level: 15, type: 'dmg', mult: 3.0 },
        { name: 'Fúria da Natureza', icon: '🌪️', level: 18, type: 'dmg', mult: 5.0 }
    ] },
    { name: 'Guerreiro',  stats: { str: 5, agi: 2, dex: 3, vit: 4, int: 1 }, seed: 'Warrior', skills: [
        { name: 'Golpe Firme', icon: '🗡️', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Investida', icon: '🦬', level: 6, type: 'dmg', mult: 2.0 },
        { name: 'Grito de Guerra', icon: '🗣️', level: 9, type: 'dmg', mult: 1.5 },
        { name: 'Corte Duplo', icon: '⚔️', level: 12, type: 'dmg', mult: 2.5 },
        { name: 'Tornado de Lâminas', icon: '🌀', level: 15, type: 'aoe', mult: 1.5 },
        { name: 'Golpe Final', icon: '☠️', level: 18, type: 'dmg', mult: 5.0 }
    ] },
    { name: 'Mago',       stats: { str: 1, agi: 4, dex: 3, vit: 2, int: 5 }, seed: 'Mage', skills: [
        { name: 'Míssil Mágico', icon: '✨', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Bola de Fogo', icon: '🔥', level: 6, type: 'dmg', mult: 2.0 },
        { name: 'Nevasca', icon: '❄️', level: 9, type: 'aoe', mult: 1.2 },
        { name: 'Raio Arcano', icon: '⚡', level: 12, type: 'dmg', mult: 2.5 },
        { name: 'Meteoro', icon: '☄️', level: 15, type: 'aoe', mult: 2.0 },
        { name: 'Explosão Arcana', icon: '💥', level: 18, type: 'dmg', mult: 5.0 }
    ] },
    { name: 'Assassino',  stats: { str: 3, agi: 5, dex: 4, vit: 1, int: 2 }, seed: 'Assassin', skills: [
        { name: 'Ataque Furtivo', icon: '🥷', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Lâmina Venenosa', icon: '🧪', level: 6, type: 'dmg', mult: 2.0 },
        { name: 'Chuva de Adagas', icon: '🗡️', level: 9, type: 'aoe', mult: 1.2 },
        { name: 'Assassinar', icon: '🩸', level: 12, type: 'dmg', mult: 3.0 },
        { name: 'Passo das Sombras', icon: '🌑', level: 15, type: 'dmg', mult: 2.5 },
        { name: 'Dança das Lâminas', icon: '💃', level: 18, type: 'dmg', mult: 5.0 }
    ] },
    { name: 'Paladino',   stats: { str: 4, agi: 1, dex: 2, vit: 5, int: 3 }, seed: 'Paladin', skills: [
        { name: 'Golpe Divino', icon: '🔨', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Luz Sagrada', icon: '✨', level: 6, type: 'heal', mult: 1.5 },
        { name: 'Julgamento', icon: '⚖️', level: 9, type: 'dmg', mult: 2.0 },
        { name: 'Consagração', icon: '🔥', level: 12, type: 'aoe', mult: 1.2 },
        { name: 'Escudo Sagrado', icon: '🛡️', level: 15, type: 'heal', mult: 2.5 },
        { name: 'Fúria dos Céus', icon: '⚡', level: 18, type: 'dmg', mult: 4.0 }
    ] },
    { name: 'Bardo',      stats: { str: 1, agi: 3, dex: 4, vit: 2, int: 5 }, seed: 'Bard', skills: [
        { name: 'Acorde Dissonante', icon: '🎵', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Canção de Cura', icon: '🎶', level: 6, type: 'heal', mult: 1.5 },
        { name: 'Melodia Hipnótica', icon: '🌀', level: 9, type: 'aoe', mult: 1.0 },
        { name: 'Solo Épico', icon: '🎸', level: 12, type: 'dmg', mult: 2.5 },
        { name: 'Hino da Batalha', icon: '🎺', level: 15, type: 'heal', mult: 2.0 },
        { name: 'Réquiem', icon: '🪦', level: 18, type: 'dmg', mult: 5.0 }
    ] },
    { name: 'Necromante', stats: { str: 1, agi: 2, dex: 3, vit: 4, int: 5 }, seed: 'Necromancer', skills: [
        { name: 'Toque Sombrio', icon: '🦇', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Drenar Vida', icon: '🧛', level: 6, type: 'heal', mult: 1.5 },
        { name: 'Invocar Esqueleto', icon: '💀', level: 9, type: 'dmg', mult: 2.0 },
        { name: 'Explosão de Ossos', icon: '💥', level: 12, type: 'aoe', mult: 1.5 },
        { name: 'Ceifar Alma', icon: '👻', level: 15, type: 'dmg', mult: 3.0 },
        { name: 'Exército dos Mortos', icon: '🧟', level: 18, type: 'aoe', mult: 3.0 }
    ] },
    { name: 'Monge',      stats: { str: 4, agi: 5, dex: 2, vit: 3, int: 1 }, seed: 'Monk', skills: [
        { name: 'Soco Direto', icon: '👊', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Chute Voador', icon: '🦶', level: 6, type: 'dmg', mult: 2.0 },
        { name: 'Onda de Chi', icon: '🌊', level: 9, type: 'aoe', mult: 1.2 },
        { name: 'Palma de Ferro', icon: '✋', level: 12, type: 'dmg', mult: 2.5 },
        { name: 'Mantra de Cura', icon: '🧘', level: 15, type: 'heal', mult: 2.0 },
        { name: 'Punhos Furiosos', icon: '💢', level: 18, type: 'dmg', mult: 5.0 }
    ] },
    { name: 'Berserker',  stats: { str: 5, agi: 4, dex: 2, vit: 3, int: 1 }, seed: 'Berserker', skills: [
        { name: 'Corte Brutal', icon: '🪓', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Sede de Sangue', icon: '🩸', level: 6, type: 'dmg', mult: 2.0 },
        { name: 'Giro Mortal', icon: '🌪️', level: 9, type: 'aoe', mult: 1.5 },
        { name: 'Investida Selvagem', icon: '🐗', level: 12, type: 'dmg', mult: 2.5 },
        { name: 'Golpe Esmagador', icon: '🔨', level: 15, type: 'dmg', mult: 3.0 },
        { name: 'Ira Incontrolável', icon: '😡', level: 18, type: 'dmg', mult: 6.0 }
    ] },
    { name: 'Clérigo',    stats: { str: 2, agi: 1, dex: 3, vit: 5, int: 4 }, seed: 'Cleric', skills: [
        { name: 'Punição', icon: '⚡', level: 3, type: 'dmg', mult: 1.5 },
        { name: 'Cura Menor', icon: '🩹', level: 6, type: 'heal', mult: 2.0 },
        { name: 'Escudo Divino', icon: '🛡️', level: 9, type: 'heal', mult: 1.5 },
        { name: 'Fogo Purificador', icon: '🔥', level: 12, type: 'dmg', mult: 2.0 },
        { name: 'Cura Maior', icon: '💖', level: 15, type: 'heal', mult: 3.0 },
        { name: 'Ressurreição', icon: '👼', level: 18, type: 'heal', mult: 5.0 }
    ] }
];

let gameState = {
    gold: 300,
    team: [],
    level: 1,
    xp: 0,
    xpMax: 100,
    points: 0,
    autoBoss: false,
    fightingBoss: false,
    skillTree: { pointsAvailable: 0, unlockedNodes: [] }
};

let currentEnemy = null;
let combatInterval = null;
let selectedHeroIndex = null;

function carregarJogo() {
    const salvo = localStorage.getItem('idle_hero_save');
    if (salvo) {
        gameState = JSON.parse(salvo);
        if (gameState.autoBoss === undefined) gameState.autoBoss = false;
        if (gameState.fightingBoss === undefined) gameState.fightingBoss = false;
        if (gameState.skillTree === undefined) gameState.skillTree = { pointsAvailable: 0, unlockedNodes: [] };
        
        // Retrocompatibilidade: reconectar classData para skills funcionarem
        if (gameState.team && gameState.team.length > 0) {
            gameState.team.forEach(hero => {
                const baseClass = CLASSES.find(c => c.name === hero.name);
                if (baseClass) {
                    hero.classData = baseClass;
                }
            });
        }
    }
    updateUI();
    iniciarCombate();
}

function salvarJogo() {
    localStorage.setItem('idle_hero_save', JSON.stringify(gameState));
}

function getAvailableTreePoints() {
    if (!gameState.team || gameState.team.length === 0) return 0;
    let sum = 0;
    gameState.team.forEach(h => sum += h.level);
    let avgLevel = sum / gameState.team.length;
    let totalPoints = Math.floor(avgLevel / 5);
    let usedPoints = gameState.skillTree.unlockedNodes.length;
    return Math.max(0, totalPoints - usedPoints);
}

function getMaxHp(hero) {
    let base = hero.stats.vit * 5 + (hero.level * 10);
    if (gameState.skillTree.unlockedNodes.includes(2)) base *= 1.2;
    return Math.floor(base);
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
        if (gameState.team.some(h => h.name === cls.name)) return;
        
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
    
    let isBoss = false;
    let actualLevelForEnemy = gameState.level;

    let bossPanel = document.getElementById('boss-panel');
    if (bossPanel) {
        if (gameState.level > 0 && gameState.level % 50 === 0) {
            if (gameState.fightingBoss || gameState.autoBoss) {
                isBoss = true;
                gameState.fightingBoss = true;
                bossPanel.style.display = 'none';
            } else {
                actualLevelForEnemy = gameState.level - 1;
                bossPanel.style.display = 'block';
                document.getElementById('boss-cost').innerText = Math.max(500, (gameState.level / 50) * 500);
                document.getElementById('chk-autoboss').checked = gameState.autoBoss;
            }
        } else {
            bossPanel.style.display = 'none';
        }
    }

    let hp = 50 * actualLevelForEnemy;
    let attackBase = 5 * actualLevelForEnemy;
    
    if (isBoss) {
        hp *= 10;
        attackBase *= 3;
    }

    currentEnemy = {
        name: isBoss ? `BOSS ${nome} REI` : `Lvl ${actualLevelForEnemy} ${nome}`,
        hp: hp,
        maxHp: hp,
        attackBase: attackBase,
        isBoss: isBoss,
        img: `https://api.dicebear.com/7.x/bottts/svg?seed=${nome}&baseColor=e74c3c,c0392b`
    };
    
    document.getElementById('enemy-display').style.display = 'block';
    document.getElementById('enemy-name').innerText = currentEnemy.name;
    document.getElementById('enemy-name').style.color = isBoss ? 'gold' : 'white';
    document.getElementById('enemy-img').src = currentEnemy.img;
    document.getElementById('enemy-img').style.transform = isBoss ? 'scale(1.5)' : 'scale(1)';
    document.getElementById('enemy-hp').style.width = '100%';
    document.getElementById('combat-log').innerHTML = isBoss ? `<span style="color:red; font-weight:bold;">O terrível ${currentEnemy.name} surgiu!</span>` : `Um ${currentEnemy.name} apareceu!`;
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
        let combatLogHtml = [];
        
        let treeDmgMult = gameState.skillTree.unlockedNodes.includes(1) ? 1.2 : 1.0;
        let treeBossDmgMult = gameState.skillTree.unlockedNodes.includes(4) ? 1.3 : 1.0;
        let treeMobDmgMult = gameState.skillTree.unlockedNodes.includes(6) ? 1.3 : 1.0;
        let treeHealPassMult = gameState.skillTree.unlockedNodes.includes(7) ? 1.5 : 1.0;
        let treeVampirism = gameState.skillTree.unlockedNodes.includes(9) ? 0.1 : 0;

        gameState.team.forEach(hero => {
            if(hero.hp > 0 && currentEnemy.hp - totalDamage > 0) {
                // Initialize cooldowns if not present
                if (!hero.cds) hero.cds = {};
                if (hero.gcd === undefined) hero.gcd = 0;

                // Decrease cooldowns
                if (hero.gcd > 0) hero.gcd--;
                for (let sName in hero.cds) {
                    if (hero.cds[sName] > 0) hero.cds[sName]--;
                }

                let baseDmg = hero.stats.str * 2 + hero.stats.int * 2;
                let critChance = 0.05 + (hero.stats.dex * 0.02);
                let isCrit = Math.random() < critChance;
                
                let finalHeroDmg = baseDmg;
                let finalHeroHeal = 0;
                let attackName = "Ataque Básico";
                let usedSkill = null;

                // Tenta usar uma skill
                if (hero.gcd === 0 && hero.classData && hero.classData.skills) {
                    let availableSkills = hero.classData.skills.filter(s => hero.level >= s.level && (!hero.cds[s.name] || hero.cds[s.name] === 0));
                    if (availableSkills.length > 0) {
                        availableSkills.sort((a,b) => b.level - a.level);
                        usedSkill = availableSkills[0];
                    }
                }

                if (usedSkill) {
                    attackName = `${usedSkill.icon} ${usedSkill.name}`;
                    hero.cds[usedSkill.name] = 10; // 10s cooldown
                    hero.gcd = 4; // 4s global cooldown
                    
                    if (usedSkill.type === 'dmg' || usedSkill.type === 'aoe' || usedSkill.type === 'dot') {
                        finalHeroDmg = baseDmg * (1 + usedSkill.mult);
                    } else if (usedSkill.type === 'heal') {
                        finalHeroHeal = usedSkill.mult * (hero.stats.int + hero.stats.vit);
                        finalHeroDmg = 0; // Heal não dá dano base (simplificação)
                    }
                }
                
                if (isCrit && finalHeroDmg > 0) {
                    finalHeroDmg *= 2;
                }

                finalHeroDmg *= treeDmgMult;
                if (currentEnemy.isBoss) finalHeroDmg *= treeBossDmgMult;
                else finalHeroDmg *= treeMobDmgMult;
                
                totalDamage += finalHeroDmg;
                if (finalHeroHeal > 0) {
                    let realHeal = finalHeroHeal * treeHealPassMult;
                    gameState.team.forEach(h => {
                        if (h.hp > 0) h.hp = Math.min(getMaxHp(h), h.hp + realHeal);
                    });
                }

                // Vampirismo isolado do heroi
                if (treeVampirism > 0 && finalHeroDmg > 0) {
                    hero.hp = Math.min(getMaxHp(hero), hero.hp + (finalHeroDmg * treeVampirism));
                }

                // Log Individual
                let logLine = `[${attackName}] ${hero.name}`;
                if (finalHeroDmg > 0) logLine += ` causou <b style="color:#e74c3c">${Math.floor(finalHeroDmg)}</b>`;
                if (finalHeroHeal > 0) logLine += ` curou <b style="color:#2ecc71">${Math.floor(finalHeroHeal)}</b>`;
                if (isCrit && finalHeroDmg > 0) logLine += ` <span style="color:#f1c40f; font-weight:bold;">(CRÍTICO!)</span>`;
                
                if (currentEnemy.hp - totalDamage <= 0 && finalHeroDmg > 0) {
                    logLine += ` <span style="color:#fff; font-weight:bold; background:red; padding: 0 4px; border-radius:3px;">HITKILL</span>`;
                }

                combatLogHtml.push(`<div style="margin-bottom:2px;">${logLine}</div>`);
            }
        });
        
        currentEnemy.hp -= totalDamage;
        
        let logDiv = document.getElementById('combat-log');
        logDiv.innerHTML = combatLogHtml.join('');
        // Auto-scroll para baixo
        logDiv.scrollTop = logDiv.scrollHeight;
        
        if (currentEnemy.hp <= 0) {
            // Matou inimigo
            let treeXpMult = gameState.skillTree.unlockedNodes.includes(8) ? 1.5 : 1.0;
            let treeGoldMult = gameState.skillTree.unlockedNodes.includes(5) ? 1.5 : 1.0;
            
            const xpGained = Math.floor(20 * gameState.level * treeXpMult * (currentEnemy.isBoss ? 5 : 1));
            const goldGained = Math.floor(10 * gameState.level * treeGoldMult * (currentEnemy.isBoss ? 5 : 1));
            
            gameState.xp += xpGained;
            gameState.gold += goldGained;
            logDiv.innerHTML += `<div style="color:#2ecc71; margin-top:5px; text-align:center;">Vitória! +${xpGained}XP +${goldGained}💰</div>`;
            logDiv.scrollTop = logDiv.scrollHeight;
            
            if (currentEnemy.isBoss) {
                gameState.fightingBoss = false;
                gameState.level++;
            }
            
            // Check level up global
            let levelsGained = 0;
            while (gameState.xp >= gameState.xpMax) {
                gameState.level++;
                levelsGained++;
                gameState.xp -= gameState.xpMax;
                gameState.xpMax = Math.floor(gameState.xpMax * 1.5);
            }
            
            if (levelsGained > 0) {
                gameState.team.forEach(h => {
                    h.level += levelsGained;
                    h.unspentPoints += 5 * levelsGained;
                    h.hp = getMaxHp(h);
                });
                logDiv.innerHTML += `<div style="color:gold; text-align:center; font-weight:bold;">🌟 LEVEL UP DA EQUIPE!</div>`;
                logDiv.scrollTop = logDiv.scrollHeight;
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
                let bossCritChance = currentEnemy.isBoss ? 0.15 : 0;
                let isBossCrit = Math.random() < bossCritChance;
                let enemyDmg = currentEnemy.attackBase;
                if (isBossCrit) enemyDmg *= 2;

                let treeDefMult = gameState.skillTree.unlockedNodes.includes(3) ? 1.2 : 1.0;
                let def = target.stats.vit * 1 * treeDefMult;
                let danoFinal = Math.max(1, enemyDmg - def);
                target.hp -= danoFinal;
                
                let msg = `${currentEnemy.name} causou ${Math.floor(danoFinal)} a ${target.name}!`;
                if (isBossCrit) msg = `<span style="color:#e74c3c; font-weight:bold;">🔥 CRÍTICO DO BOSS!</span> ${msg}`;
                
                document.getElementById('combat-log').innerHTML += `<br>${msg}`;
            }
        }
        
        // Verifica Wipe
        let vivosConfirm = 0;
        gameState.team.forEach(h => { if (h.hp > 0) vivosConfirm++; });
        if (vivosConfirm === 0 && currentEnemy.isBoss) {
            gameState.fightingBoss = false;
            gameState.autoBoss = false;
            document.getElementById('combat-log').innerHTML += `<br><span style="color:red; font-weight:bold;">☠️ O Boss aniquilou a equipe...</span>`;
            gerarInimigo();
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
    
    let skillsDiv = document.getElementById('modal-char-skills');
    if (skillsDiv) {
        skillsDiv.innerHTML = '';
        if (hero.classData && hero.classData.skills) {
            hero.classData.skills.forEach(skill => {
                let isUnlocked = hero.level >= skill.level;
                skillsDiv.innerHTML += `
                    <div class="hero-skill-badge ${isUnlocked ? 'unlocked' : ''}" title="${skill.type}: +${skill.mult}">
                        <div class="skill-icon">${skill.icon}</div>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight:bold;">${skill.name}</span>
                            <span style="font-size:0.6rem;">Nv. ${skill.level}</span>
                        </div>
                    </div>
                `;
            });
        }
    }
    
    document.getElementById('modal-status').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('modal-status').style.display = 'none';
};

window.abrirSkillTree = function() {
    let pts = getAvailableTreePoints();
    document.getElementById('tree-points').innerText = pts;
    for(let i=1; i<=9; i++) {
        let btn = document.getElementById(`btn-tree-${i}`);
        if(!btn) continue;
        
        // Remove classes unlocked e locked para resetar o estado
        btn.classList.remove('unlocked', 'locked');
        
        let isBlocked = false;
        if (i===1 && gameState.skillTree.unlockedNodes.includes(3)) isBlocked = true;
        if (i===3 && gameState.skillTree.unlockedNodes.includes(1)) isBlocked = true;
        if (i===4 && gameState.skillTree.unlockedNodes.includes(6)) isBlocked = true;
        if (i===6 && gameState.skillTree.unlockedNodes.includes(4)) isBlocked = true;
        if (i===7 && gameState.skillTree.unlockedNodes.includes(9)) isBlocked = true;
        if (i===9 && gameState.skillTree.unlockedNodes.includes(7)) isBlocked = true;
        
        if (gameState.skillTree.unlockedNodes.includes(i)) {
            btn.classList.add('unlocked');
        } else if (isBlocked) {
            btn.classList.add('locked');
        }
    }
    document.getElementById('modal-skilltree').style.display = 'flex';
};

window.buyTreeNode = function(id) {
    if (gameState.skillTree.unlockedNodes.includes(id)) return; 
    
    if (id===1 && gameState.skillTree.unlockedNodes.includes(3)) return;
    if (id===3 && gameState.skillTree.unlockedNodes.includes(1)) return;
    if (id===4 && gameState.skillTree.unlockedNodes.includes(6)) return;
    if (id===6 && gameState.skillTree.unlockedNodes.includes(4)) return;
    if (id===7 && gameState.skillTree.unlockedNodes.includes(9)) return;
    if (id===9 && gameState.skillTree.unlockedNodes.includes(7)) return;
    
    if (getAvailableTreePoints() > 0) {
        gameState.skillTree.unlockedNodes.push(id);
        
        if (id === 2) {
            gameState.team.forEach(h => {
                let max = getMaxHp(h);
                if (h.hp > 0) h.hp = max;
            });
        }
        
        salvarJogo();
        updateUI();
        abrirSkillTree();
    } else {
        alert("Sem Pontos de Talento!");
    }
};

window.enfrentarBoss = function() {
    let cost = Math.max(500, (gameState.level / 50) * 500);
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.fightingBoss = true;
        document.getElementById('boss-panel').style.display = 'none';
        salvarJogo();
        gerarInimigo();
    } else {
        alert("Ouro insuficiente para enfrentar o boss!");
    }
};

window.toggleAutoBoss = function() {
    gameState.autoBoss = document.getElementById('chk-autoboss').checked;
    salvarJogo();
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
