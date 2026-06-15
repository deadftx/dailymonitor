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
    gold: 100,
    team: [],
    level: 1,
    xp: 0,
    xpMax: 100,
    points: 0 // pontos globais da equipe ou pontos individuais? O usuário pediu: "cada personagem ganha 5 pontos" - vou fazer pontos por personagem.
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
    if (gameState.gold >= 100 && gameState.team.length < 5) {
        gameState.gold -= 100;
        const randomClass = CLASSES[Math.floor(Math.random() * CLASSES.length)];
        
        const newHero = {
            id: Date.now(),
            name: randomClass.name,
            classData: randomClass,
            level: 1,
            unspentPoints: 0,
            stats: { ...randomClass.stats },
            hp: 0
        };
        newHero.hp = getMaxHp(newHero);
        gameState.team.push(newHero);
        
        salvarJogo();
        updateUI();
    } else if (gameState.team.length >= 5) {
        alert("Equipe cheia! Máximo 5 heróis.");
    } else {
        alert("Ouro insuficiente! Necessário 100 💰");
    }
};

function updateUI() {
    document.getElementById('team-gold').innerText = gameState.gold;
    document.getElementById('team-xp').innerText = gameState.xp;
    document.getElementById('team-xp-max').innerText = gameState.xpMax;
    document.getElementById('team-level').innerText = gameState.level;
    
    const list = document.getElementById('character-list');
    list.innerHTML = '';
    
    gameState.team.forEach((hero, index) => {
        const maxHp = getMaxHp(hero);
        const hpPct = Math.max(0, (hero.hp / maxHp) * 100);
        
        const div = document.createElement('div');
        div.className = 'char-card';
        // DiceBear Pixel Art para avatar do heroi baseado na semente (seed)
        div.innerHTML = `
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${hero.classData.seed}&scale=120" class="char-img">
            <div class="char-info">
                <div style="display:flex; justify-content:space-between;">
                    <span class="char-name">${hero.name} (Nv ${hero.level})</span>
                    <button class="btn" style="padding: 2px 5px; font-size: 0.7rem;" onclick="abrirStatus(${index})">Status ${hero.unspentPoints > 0 ? '(!)' : ''}</button>
                </div>
                <span class="char-class">STR:${hero.stats.str} AGI:${hero.stats.agi} DEX:${hero.stats.dex} VIT:${hero.stats.vit} INT:${hero.stats.int}</span>
                <div class="char-hp-bg"><div class="char-hp-fill" style="width: ${hpPct}%"></div></div>
            </div>
        `;
        list.appendChild(div);
    });
}

function gerarInimigo() {
    const tipos = ['Slime', 'Goblin', 'Esqueleto', 'Orc', 'Dragão Menor'];
    const nome = tipos[Math.floor(Math.random() * tipos.length)];
    const hp = 50 * gameState.level;
    currentEnemy = {
        name: `Lvl ${gameState.level} ${nome}`,
        hp: hp,
        maxHp: hp,
        img: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${nome}&backgroundColor=transparent`
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
            // Inimigo ataca
            const target = gameState.team[Math.floor(Math.random() * gameState.team.length)];
            if(target.hp > 0) {
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

carregarJogo();
