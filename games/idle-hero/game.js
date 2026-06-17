const { ipcRenderer } = require('electron');

const CLASSES = [
    { name: 'Arqueiro',   stats: { str: 4, agi: 3, dex: 5, vit: 2, int: 1 }, seed: 'Archer', skills: [
        { id: 'arq_3_1', name: 'Tiro Rápido', icon: '🏹', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'arq_3_2', name: 'Armadilha', icon: '🪤', level: 3, type: 'aoe', mult: 1.0 },
        { id: 'arq_6_1', name: 'Olho de Águia', icon: '👁️', level: 6, type: 'dmg', mult: 2.0 },
        { id: 'arq_6_2', name: 'Esquiva', icon: '💨', level: 6, type: 'heal', mult: 1.5 },
        { id: 'arq_9_1', name: 'Chuva de Flechas', icon: '🌧️', level: 9, type: 'aoe', mult: 1.2 },
        { id: 'arq_9_2', name: 'Fogo Cruzado', icon: '🔥', level: 9, type: 'dmg', mult: 2.2 },
        { id: 'arq_12_1', name: 'Flecha Venenosa', icon: '🐍', level: 12, type: 'dmg', mult: 2.5 },
        { id: 'arq_12_2', name: 'Flecha Gélida', icon: '❄️', level: 12, type: 'aoe', mult: 1.8 },
        { id: 'arq_15_1', name: 'Tiro Perfurante', icon: '🎯', level: 15, type: 'dmg', mult: 3.0 },
        { id: 'arq_15_2', name: 'Instinto', icon: '🐺', level: 15, type: 'heal', mult: 2.5 },
        { id: 'arq_18_1', name: 'Fúria da Natureza', icon: '🌪️', level: 18, type: 'dmg', mult: 5.0 },
        { id: 'arq_18_2', name: 'Flecha do Fim', icon: '☄️', level: 18, type: 'dmg', mult: 6.0 }
    ] },
    { name: 'Guerreiro',  stats: { str: 5, agi: 2, dex: 3, vit: 4, int: 1 }, seed: 'Warrior', skills: [
        { id: 'war_3_1', name: 'Golpe Firme', icon: '🗡️', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'war_3_2', name: 'Provocação', icon: '🛡️', level: 3, type: 'heal', mult: 1.5 },
        { id: 'war_6_1', name: 'Investida', icon: '🦬', level: 6, type: 'dmg', mult: 2.0 },
        { id: 'war_6_2', name: 'Pisão', icon: '👣', level: 6, type: 'aoe', mult: 1.2 },
        { id: 'war_9_1', name: 'Grito de Guerra', icon: '🗣️', level: 9, type: 'dmg', mult: 1.5 },
        { id: 'war_9_2', name: 'Pele de Ferro', icon: '🦾', level: 9, type: 'heal', mult: 2.0 },
        { id: 'war_12_1', name: 'Corte Duplo', icon: '⚔️', level: 12, type: 'dmg', mult: 2.5 },
        { id: 'war_12_2', name: 'Sangramento', icon: '🩸', level: 12, type: 'dmg', mult: 2.8 },
        { id: 'war_15_1', name: 'Tornado de Lâminas', icon: '🌀', level: 15, type: 'aoe', mult: 1.5 },
        { id: 'war_15_2', name: 'Fôlego', icon: '🌬️', level: 15, type: 'heal', mult: 3.0 },
        { id: 'war_18_1', name: 'Golpe Final', icon: '☠️', level: 18, type: 'dmg', mult: 5.0 },
        { id: 'war_18_2', name: 'Fúria Titã', icon: '👹', level: 18, type: 'aoe', mult: 3.5 }
    ] },
    { name: 'Mago',       stats: { str: 1, agi: 4, dex: 3, vit: 2, int: 5 }, seed: 'Mage', skills: [
        { id: 'mag_3_1', name: 'Míssil Mágico', icon: '✨', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'mag_3_2', name: 'Escudo Arcano', icon: '🔮', level: 3, type: 'heal', mult: 1.5 },
        { id: 'mag_6_1', name: 'Bola de Fogo', icon: '🔥', level: 6, type: 'dmg', mult: 2.0 },
        { id: 'mag_6_2', name: 'Eletrocutar', icon: '⚡', level: 6, type: 'dmg', mult: 2.2 },
        { id: 'mag_9_1', name: 'Nevasca', icon: '❄️', level: 9, type: 'aoe', mult: 1.2 },
        { id: 'mag_9_2', name: 'Prisão Gelo', icon: '🧊', level: 9, type: 'heal', mult: 2.0 },
        { id: 'mag_12_1', name: 'Raio Arcano', icon: '⚡', level: 12, type: 'dmg', mult: 2.5 },
        { id: 'mag_12_2', name: 'Chamas Negras', icon: '🌑', level: 12, type: 'aoe', mult: 1.8 },
        { id: 'mag_15_1', name: 'Meteoro', icon: '☄️', level: 15, type: 'aoe', mult: 2.0 },
        { id: 'mag_15_2', name: 'Aura Mágica', icon: '🌟', level: 15, type: 'heal', mult: 3.0 },
        { id: 'mag_18_1', name: 'Explosão Arcana', icon: '💥', level: 18, type: 'dmg', mult: 5.0 },
        { id: 'mag_18_2', name: 'Singularidade', icon: '🌌', level: 18, type: 'aoe', mult: 4.0 }
    ] },
    { name: 'Assassino',  stats: { str: 3, agi: 5, dex: 4, vit: 1, int: 2 }, seed: 'Assassin', skills: [
        { id: 'ass_3_1', name: 'Ataque Furtivo', icon: '🥷', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'ass_3_2', name: 'Cortina Fumaça', icon: '💨', level: 3, type: 'heal', mult: 1.5 },
        { id: 'ass_6_1', name: 'Lâmina Venenosa', icon: '🧪', level: 6, type: 'dmg', mult: 2.0 },
        { id: 'ass_6_2', name: 'Garganta', icon: '🗡️', level: 6, type: 'dmg', mult: 2.5 },
        { id: 'ass_9_1', name: 'Chuva de Adagas', icon: '🗡️', level: 9, type: 'aoe', mult: 1.2 },
        { id: 'ass_9_2', name: 'Bomba', icon: '💣', level: 9, type: 'aoe', mult: 1.5 },
        { id: 'ass_12_1', name: 'Assassinar', icon: '🩸', level: 12, type: 'dmg', mult: 3.0 },
        { id: 'ass_12_2', name: 'Clone', icon: '👯', level: 12, type: 'heal', mult: 2.5 },
        { id: 'ass_15_1', name: 'Passo das Sombras', icon: '🌑', level: 15, type: 'dmg', mult: 2.5 },
        { id: 'ass_15_2', name: 'Marca Mortal', icon: '👁️', level: 15, type: 'dmg', mult: 3.5 },
        { id: 'ass_18_1', name: 'Dança Lâminas', icon: '💃', level: 18, type: 'dmg', mult: 5.0 },
        { id: 'ass_18_2', name: 'Decapitar', icon: '🪓', level: 18, type: 'dmg', mult: 7.0 }
    ] },
    { name: 'Paladino',   stats: { str: 4, agi: 1, dex: 2, vit: 5, int: 3 }, seed: 'Paladin', skills: [
        { id: 'pal_3_1', name: 'Golpe Divino', icon: '🔨', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'pal_3_2', name: 'Aura Defesa', icon: '🛡️', level: 3, type: 'heal', mult: 1.2 },
        { id: 'pal_6_1', name: 'Luz Sagrada', icon: '✨', level: 6, type: 'heal', mult: 1.5 },
        { id: 'pal_6_2', name: 'Punição', icon: '⚡', level: 6, type: 'dmg', mult: 2.0 },
        { id: 'pal_9_1', name: 'Julgamento', icon: '⚖️', level: 9, type: 'dmg', mult: 2.0 },
        { id: 'pal_9_2', name: 'Bênção', icon: '🕊️', level: 9, type: 'heal', mult: 2.2 },
        { id: 'pal_12_1', name: 'Consagração', icon: '🔥', level: 12, type: 'aoe', mult: 1.2 },
        { id: 'pal_12_2', name: 'Martelo Luz', icon: '🔨', level: 12, type: 'aoe', mult: 1.5 },
        { id: 'pal_15_1', name: 'Escudo Sagrado', icon: '🛡️', level: 15, type: 'heal', mult: 2.5 },
        { id: 'pal_15_2', name: 'Vingança', icon: '⚔️', level: 15, type: 'dmg', mult: 3.5 },
        { id: 'pal_18_1', name: 'Fúria dos Céus', icon: '⚡', level: 18, type: 'dmg', mult: 4.0 },
        { id: 'pal_18_2', name: 'Anjo Guardião', icon: '👼', level: 18, type: 'heal', mult: 5.0 }
    ] },
    { name: 'Bardo',      stats: { str: 1, agi: 3, dex: 4, vit: 2, int: 5 }, seed: 'Bard', skills: [
        { id: 'bar_3_1', name: 'Acorde Dissonante', icon: '🎵', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'bar_3_2', name: 'Nota Aguda', icon: '🎶', level: 3, type: 'dmg', mult: 1.8 },
        { id: 'bar_6_1', name: 'Canção de Cura', icon: '🎶', level: 6, type: 'heal', mult: 1.5 },
        { id: 'bar_6_2', name: 'Motivação', icon: '👏', level: 6, type: 'heal', mult: 1.8 },
        { id: 'bar_9_1', name: 'Melodia Hipnótica', icon: '🌀', level: 9, type: 'aoe', mult: 1.0 },
        { id: 'bar_9_2', name: 'Sinfonia', icon: '🎼', level: 9, type: 'aoe', mult: 1.5 },
        { id: 'bar_12_1', name: 'Solo Épico', icon: '🎸', level: 12, type: 'dmg', mult: 2.5 },
        { id: 'bar_12_2', name: 'Batida', icon: '🥁', level: 12, type: 'dmg', mult: 3.0 },
        { id: 'bar_15_1', name: 'Hino Batalha', icon: '🎺', level: 15, type: 'heal', mult: 2.0 },
        { id: 'bar_15_2', name: 'Refrão', icon: '🎤', level: 15, type: 'heal', mult: 3.0 },
        { id: 'bar_18_1', name: 'Réquiem', icon: '🪦', level: 18, type: 'dmg', mult: 5.0 },
        { id: 'bar_18_2', name: 'Ópera', icon: '🎭', level: 18, type: 'aoe', mult: 4.0 }
    ] },
    { name: 'Necromante', stats: { str: 1, agi: 2, dex: 3, vit: 4, int: 5 }, seed: 'Necromancer', skills: [
        { id: 'nec_3_1', name: 'Toque Sombrio', icon: '🦇', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'nec_3_2', name: 'Maldição', icon: '🕷️', level: 3, type: 'dmg', mult: 1.8 },
        { id: 'nec_6_1', name: 'Drenar Vida', icon: '🧛', level: 6, type: 'heal', mult: 1.5 },
        { id: 'nec_6_2', name: 'Pacto', icon: '📜', level: 6, type: 'heal', mult: 2.0 },
        { id: 'nec_9_1', name: 'Invocar Esqueleto', icon: '💀', level: 9, type: 'dmg', mult: 2.0 },
        { id: 'nec_9_2', name: 'Gargula', icon: '🗿', level: 9, type: 'dmg', mult: 2.5 },
        { id: 'nec_12_1', name: 'Explosão Ossos', icon: '💥', level: 12, type: 'aoe', mult: 1.5 },
        { id: 'nec_12_2', name: 'Miasma', icon: '💨', level: 12, type: 'aoe', mult: 1.8 },
        { id: 'nec_15_1', name: 'Ceifar Alma', icon: '👻', level: 15, type: 'dmg', mult: 3.0 },
        { id: 'nec_15_2', name: 'Prisão Almas', icon: '⛓️', level: 15, type: 'heal', mult: 2.5 },
        { id: 'nec_18_1', name: 'Exército Mortos', icon: '🧟', level: 18, type: 'aoe', mult: 3.0 },
        { id: 'nec_18_2', name: 'Lich Form', icon: '🧙', level: 18, type: 'dmg', mult: 6.0 }
    ] },
    { name: 'Monge',      stats: { str: 4, agi: 5, dex: 2, vit: 3, int: 1 }, seed: 'Monk', skills: [
        { id: 'mon_3_1', name: 'Soco Direto', icon: '👊', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'mon_3_2', name: 'Defesa Chi', icon: '🧘', level: 3, type: 'heal', mult: 1.5 },
        { id: 'mon_6_1', name: 'Chute Voador', icon: '🦶', level: 6, type: 'dmg', mult: 2.0 },
        { id: 'mon_6_2', name: 'Rasteira', icon: '🥋', level: 6, type: 'aoe', mult: 1.2 },
        { id: 'mon_9_1', name: 'Onda Chi', icon: '🌊', level: 9, type: 'aoe', mult: 1.2 },
        { id: 'mon_9_2', name: 'Rajada', icon: '💨', level: 9, type: 'dmg', mult: 2.5 },
        { id: 'mon_12_1', name: 'Palma Ferro', icon: '✋', level: 12, type: 'dmg', mult: 2.5 },
        { id: 'mon_12_2', name: 'Ponto Vital', icon: '🎯', level: 12, type: 'dmg', mult: 3.0 },
        { id: 'mon_15_1', name: 'Mantra Cura', icon: '🧘', level: 15, type: 'heal', mult: 2.0 },
        { id: 'mon_15_2', name: 'Meditação', icon: '🙏', level: 15, type: 'heal', mult: 3.0 },
        { id: 'mon_18_1', name: 'Punhos Furiosos', icon: '💢', level: 18, type: 'dmg', mult: 5.0 },
        { id: 'mon_18_2', name: 'Avatar', icon: '🌟', level: 18, type: 'aoe', mult: 4.0 }
    ] },
    { name: 'Berserker',  stats: { str: 5, agi: 4, dex: 2, vit: 3, int: 1 }, seed: 'Berserker', skills: [
        { id: 'ber_3_1', name: 'Corte Brutal', icon: '🪓', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'ber_3_2', name: 'Rosnado', icon: '🐻', level: 3, type: 'heal', mult: 1.0 },
        { id: 'ber_6_1', name: 'Sede Sangue', icon: '🩸', level: 6, type: 'dmg', mult: 2.0 },
        { id: 'ber_6_2', name: 'Ignorar Dor', icon: '💪', level: 6, type: 'heal', mult: 2.0 },
        { id: 'ber_9_1', name: 'Giro Mortal', icon: '🌪️', level: 9, type: 'aoe', mult: 1.5 },
        { id: 'ber_9_2', name: 'Terremoto', icon: '🌍', level: 9, type: 'aoe', mult: 1.8 },
        { id: 'ber_12_1', name: 'Investida Selv.', icon: '🐗', level: 12, type: 'dmg', mult: 2.5 },
        { id: 'ber_12_2', name: 'Esmagar', icon: '💥', level: 12, type: 'dmg', mult: 3.0 },
        { id: 'ber_15_1', name: 'Golpe Esmagador', icon: '🔨', level: 15, type: 'dmg', mult: 3.0 },
        { id: 'ber_15_2', name: 'Raiva Infinita', icon: '🔥', level: 15, type: 'heal', mult: 3.0 },
        { id: 'ber_18_1', name: 'Ira Incontrol.', icon: '😡', level: 18, type: 'dmg', mult: 6.0 },
        { id: 'ber_18_2', name: 'Aniquilação', icon: '☄️', level: 18, type: 'aoe', mult: 4.0 }
    ] },
    { name: 'Clérigo',    stats: { str: 2, agi: 1, dex: 3, vit: 5, int: 4 }, seed: 'Cleric', skills: [
        { id: 'cle_3_1', name: 'Punição', icon: '⚡', level: 3, type: 'dmg', mult: 1.5 },
        { id: 'cle_3_2', name: 'Luz Ofuscante', icon: '☀️', level: 3, type: 'aoe', mult: 1.0 },
        { id: 'cle_6_1', name: 'Cura Menor', icon: '🩹', level: 6, type: 'heal', mult: 2.0 },
        { id: 'cle_6_2', name: 'Barreira', icon: '🛡️', level: 6, type: 'heal', mult: 1.5 },
        { id: 'cle_9_1', name: 'Escudo Divino', icon: '🛡️', level: 9, type: 'heal', mult: 1.5 },
        { id: 'cle_9_2', name: 'Santuário', icon: '⛪', level: 9, type: 'heal', mult: 2.5 },
        { id: 'cle_12_1', name: 'Fogo Purificador', icon: '🔥', level: 12, type: 'dmg', mult: 2.0 },
        { id: 'cle_12_2', name: 'Chama Sagrada', icon: '🔥', level: 12, type: 'aoe', mult: 1.8 },
        { id: 'cle_15_1', name: 'Cura Maior', icon: '💖', level: 15, type: 'heal', mult: 3.0 },
        { id: 'cle_15_2', name: 'Graça', icon: '🕊️', level: 15, type: 'heal', mult: 4.0 },
        { id: 'cle_18_1', name: 'Ressurreição', icon: '👼', level: 18, type: 'heal', mult: 5.0 },
        { id: 'cle_18_2', name: 'Julg. Final', icon: '⚖️', level: 18, type: 'dmg', mult: 5.0 }
    ] }
];

const SHOP_ITEMS = [
    { id: 'w1', name: 'Espada de Ferro', type: 'weapon', stat: 'dmg', value: 5, price: 100, icon: '🗡️' },
    { id: 'w2', name: 'Cajado Aprendiz', type: 'weapon', stat: 'heal', value: 5, price: 100, icon: '🪄' },
    { id: 'a1', name: 'Armadura de Couro', type: 'armor', stat: 'hp', value: 20, price: 150, icon: '🥋' },
    { id: 'r1', name: 'Anel do Vigia', type: 'accessory', stat: 'crit', value: 10, price: 200, icon: '💍' },
    { id: 'w3', name: 'Lâmina Rúnica', type: 'weapon', stat: 'dmg', value: 15, price: 500, icon: '⚔️' },
    { id: 'w4', name: 'Livro Sagrado', type: 'weapon', stat: 'heal', value: 15, price: 500, icon: '📖' },
    { id: 'a2', name: 'Placa de Aço', type: 'armor', stat: 'hp', value: 50, price: 600, icon: '🛡️' },
    { id: 'r2', name: 'Amuleto Rubi', type: 'accessory', stat: 'dmg', value: 10, price: 800, icon: '📿' },
    { id: 'w5', name: 'Excalibur', type: 'weapon', stat: 'dmg', value: 50, price: 2500, icon: '🔥' },
    { id: 'a3', name: 'Manto Celestial', type: 'armor', stat: 'hp', value: 150, price: 3000, icon: '✨' },
    // Novas Camadas 2x Melhores / 4x Mais Caras
    { id: 'w1_2', name: 'Montante Bárbaro', type: 'weapon', stat: 'dmg', value: 10, price: 400, icon: '🗡️' },
    { id: 'w2_2', name: 'Cajado do Magus', type: 'weapon', stat: 'heal', value: 10, price: 400, icon: '🪄' },
    { id: 'a1_2', name: 'Couro de Wyvern', type: 'armor', stat: 'hp', value: 40, price: 600, icon: '🥋' },
    { id: 'r1_2', name: 'Anel do Caçador', type: 'accessory', stat: 'crit', value: 20, price: 800, icon: '💍' },
    { id: 'w3_2', name: 'Lâmina do Caos', type: 'weapon', stat: 'dmg', value: 30, price: 2000, icon: '⚔️' },
    { id: 'w4_2', name: 'Tomo dos Deuses', type: 'weapon', stat: 'heal', value: 30, price: 2000, icon: '📖' },
    { id: 'a2_2', name: 'Placa de Mithril', type: 'armor', stat: 'hp', value: 100, price: 2400, icon: '🛡️' },
    { id: 'r2_2', name: 'Amuleto Titã', type: 'accessory', stat: 'dmg', value: 20, price: 3200, icon: '📿' },
    { id: 'w5_2', name: 'Ragnarok', type: 'weapon', stat: 'dmg', value: 100, price: 10000, icon: '☄️' },
    { id: 'a3_2', name: 'Armadura Divina', type: 'armor', stat: 'hp', value: 300, price: 12000, icon: '🌟' }
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
    skillTree: { pointsAvailable: 0, unlockedNodes: [] },
    inventory: []
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
        if (gameState.inventory === undefined) gameState.inventory = [];
        if (gameState.shopEconomy === undefined) gameState.shopEconomy = { weapon: 1.0, armor: 1.0, accessory: 1.0 };
        if (gameState.tactics === undefined) gameState.tactics = [];
        if (gameState.nodes === undefined) {
            gameState.nodes = {
                'mina_ferro': { name: 'Mina de Ferro', owned: false, yield: 2, invasion: false, price: 1000 },
                'floresta': { name: 'Floresta Élfica', owned: false, yield: 5, invasion: false, price: 5000 },
                'caverna': { name: 'Caverna do Dragão', owned: false, yield: 25, invasion: false, price: 30000 }
            };
        }
        if (gameState.defendingNode === undefined) gameState.defendingNode = null;
        
        // Retrocompatibilidade: reconectar classData para skills funcionarem e adicionar equipamentos/skills
        if (gameState.team && gameState.team.length > 0) {
            gameState.team.forEach(hero => {
                if (!hero.equipment) hero.equipment = { weapon: null, armor: null, accessory: null };
                if (!hero.learnedSkills) hero.learnedSkills = [];
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
    if (hero.equipment && hero.equipment.armor && hero.equipment.armor.stat === 'hp') {
        base += hero.equipment.armor.value;
    }
    if (gameState.skillTree.unlockedNodes.includes(2)) base *= 1.2;
    return Math.floor(base);
}

document.getElementById('btn-recruit').onclick = () => {
    abrirTaverna();
};

function abrirTaverna() {
    if (gameState.team.length >= 5) {
        mostrarAviso("Sua equipe já está cheia! (Máx: 5)", "error");
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
            hp: 0,
            equipment: { weapon: null, armor: null, accessory: null },
            learnedSkills: []
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

function checkSynergies() {
    let syns = [];
    let classes = gameState.team.map(h => h.name);
    
    if (classes.includes('Necromante') && classes.includes('Bardo')) {
        syns.push({ id: 'dancaMorte', name: 'Dança da Morte', icon: '💀🎵', desc: 'Dano do Necromante cura 10% da equipe em área.' });
    }
    if (classes.includes('Paladino') && classes.includes('Guerreiro') && classes.includes('Berserker')) {
        syns.push({ id: 'linhaFrente', name: 'Linha de Frente', icon: '🛡️⚔️', desc: 'Equipe toma -30% Dano. Berserker ganha Dano Bônus ao apanhar.' });
    }
    if (classes.includes('Assassino') && classes.includes('Arqueiro')) {
        syns.push({ id: 'sombrasGemeas', name: 'Sombras Gêmeas', icon: '🌑🏹', desc: '+10% Acerto Crítico Global.' });
    }
    if (classes.includes('Mago') && classes.includes('Clérigo')) {
        syns.push({ id: 'menteBrilhante', name: 'Mente Brilhante', icon: '🔮⛪', desc: '+20% Poder Mágico (Base Dmg Mágico x1.2).' });
    }
    return syns;
}

function updateUI() {
    const synContainer = document.getElementById('synergy-container');
    if (synContainer) {
        synContainer.innerHTML = '';
        const activeSyns = checkSynergies();
        activeSyns.forEach(syn => {
            synContainer.innerHTML += `<div style="background:rgba(0,0,0,0.6); border:1px solid #9b59b6; padding:2px 5px; border-radius:4px; font-size:0.8rem; cursor:help;" title="${syn.name}: ${syn.desc}">${syn.icon}</div>`;
        });
    }

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
                <div style="display:flex; justify-content:space-between;">
                    <span class="char-class">STR:${hero.stats.str} AGI:${hero.stats.agi} DEX:${hero.stats.dex} VIT:${hero.stats.vit} INT:${hero.stats.int}</span>
                    <span style="font-size: 0.7rem;">
                        ${hero.equipment && hero.equipment.weapon ? hero.equipment.weapon.icon : ''}
                        ${hero.equipment && hero.equipment.armor ? hero.equipment.armor.icon : ''}
                        ${hero.equipment && hero.equipment.accessory ? hero.equipment.accessory.icon : ''}
                    </span>
                </div>
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
    
    if (gameState.defendingNode) {
        isBoss = true;
        let node = gameState.nodes[gameState.defendingNode];
        if (node.defenses === undefined) node.defenses = 0;
        let diffMultiplier = Math.pow(2, node.defenses);
        actualLevelForEnemy = Math.max(1, gameState.level * diffMultiplier);
        if (bossPanel) bossPanel.style.display = 'none';
    } else if (bossPanel) {
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
    let logDiv = document.getElementById('combat-log');
    if (logDiv) {
        logDiv.innerHTML += isBoss ? `<div style="color:red; font-weight:bold; margin-top:10px;">O terrível ${currentEnemy.name} surgiu!</div>` : `<div style="color:#aaa; font-style:italic; margin-top:10px;">Um ${currentEnemy.name} apareceu!</div>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }
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
                // Passiva Tier 5: Aura do Herói
                if (gameState.skillTree.unlockedNodes.includes(13)) {
                    h.hp = Math.min(getMaxHp(h), h.hp + (getMaxHp(h) * 0.05));
                }
            }
        });
        
        if (vivos === 0) {
            document.getElementById('combat-log').innerText = "Equipe aniquilada... Descansando.";
            gameState.team.forEach(h => h.immortalUsed = false);
            
            if (gameState.defendingNode) {
                gameState.nodes[gameState.defendingNode].owned = false;
                gameState.nodes[gameState.defendingNode].invasion = false;
                mostrarAviso(`Sua equipe falhou em defender ${gameState.nodes[gameState.defendingNode].name} e o nodo foi perdido!`, "error");
                gameState.defendingNode = null;
            }
            
            updateUI();
            return;
        }

        // Tick dos Nodos (Farm Passivo)
        let goldGained = 0;
        for (let key in gameState.nodes) {
            let node = gameState.nodes[key];
            if (node.owned) {
                if (!node.invasion) {
                    goldGained += node.yield;
                    // 1% chance de invasão a cada turno
                    if (Math.random() < 0.01) {
                        node.invasion = true;
                        mostrarAviso(`⚠️ URGENTE: O nodo ${node.name} está sob ataque! Defenda-o no Mapa!`, "error");
                    }
                }
            }
        }
        if (goldGained > 0) {
            gameState.gold += goldGained;
            document.getElementById('team-gold').innerText = gameState.gold;
        }

        // Ataque dos Heróis
        let totalDamage = 0;
        let combatLogHtml = [];
        
        let treeDmgMult = gameState.skillTree.unlockedNodes.includes(1) ? 1.2 : 1.0;
        let treeBossDmgMult = gameState.skillTree.unlockedNodes.includes(4) ? 1.3 : 1.0;
        let treeMobDmgMult = gameState.skillTree.unlockedNodes.includes(6) ? 1.3 : 1.0;
        let treeHealPassMult = gameState.skillTree.unlockedNodes.includes(7) ? 1.5 : 1.0;
        let treeVampirism = gameState.skillTree.unlockedNodes.includes(9) ? 0.1 : 0;
        if (gameState.skillTree.unlockedNodes.includes(14)) treeVampirism += 0.1; // Sede Sangue +10%

        let treeCritMult = gameState.skillTree.unlockedNodes.includes(15) ? 3 : 2; // Exterminador

        let activeSyns = checkSynergies().map(s => s.id);
        if (gameState.berserkerRage === undefined) gameState.berserkerRage = 0;

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
                
                if (activeSyns.includes('sombrasGemeas')) critChance += 0.10;
                if (activeSyns.includes('menteBrilhante') && hero.stats.int > hero.stats.str) baseDmg *= 1.2;
                
                // Bônus de Equipamento
                if (hero.equipment) {
                    if (hero.equipment.weapon && hero.equipment.weapon.stat === 'dmg') baseDmg += hero.equipment.weapon.value;
                    if (hero.equipment.accessory && hero.equipment.accessory.stat === 'dmg') baseDmg += hero.equipment.accessory.value;
                    if (hero.equipment.accessory && hero.equipment.accessory.stat === 'crit') critChance += hero.equipment.accessory.value / 100;
                }
                
                // Mestre de Armas Passiva (Tier 4 Tree)
                if (hero.equipment && hero.equipment.weapon && gameState.skillTree.unlockedNodes.includes(10)) {
                    if (hero.equipment.weapon.stat === 'dmg') baseDmg += hero.equipment.weapon.value * 0.5;
                }

                let isCrit = Math.random() < critChance;
                
                let finalHeroDmg = baseDmg;
                let finalHeroHeal = 0;
                let attackName = "Ataque Básico";
                let usedSkill = null;

                // Evaluate Tactics (Caller System)
                let forcedAction = null;
                
                for (let tactic of gameState.tactics) {
                    let conditionMet = false;
                    
                    if (tactic.condition === 'hp_critical') {
                        conditionMet = gameState.team.some(h => h.hp > 0 && h.hp < getMaxHp(h) * 0.3);
                    } else if (tactic.condition === 'boss_fight') {
                        conditionMet = currentEnemy.isBoss;
                    } else if (tactic.condition === 'enemy_full') {
                        conditionMet = currentEnemy.hp / currentEnemy.maxHp > 0.9;
                    }
                    
                    if (conditionMet) {
                        forcedAction = tactic.action;
                        break; // Stop at first met rule (highest priority)
                    }
                }
                
                // Tenta usar uma skill
                if (hero.gcd === 0 && hero.classData && hero.classData.skills && forcedAction !== 'save_skills') {
                    let availableSkills = hero.classData.skills.filter(s => hero.level >= s.level && hero.learnedSkills.includes(s.id) && (!hero.cds[s.name] || hero.cds[s.name] === 0));
                    
                    if (forcedAction === 'focus_heal') {
                        let healSkills = availableSkills.filter(s => s.type === 'heal');
                        if (healSkills.length > 0) availableSkills = healSkills;
                    } else if (forcedAction === 'focus_dmg') {
                        let dmgSkills = availableSkills.filter(s => s.type === 'dmg');
                        if (dmgSkills.length > 0) availableSkills = dmgSkills;
                    }

                    if (availableSkills.length > 0) {
                        availableSkills.sort((a,b) => b.level - a.level); // Prioriza as de nivel mais alto
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
                        if (hero.equipment && hero.equipment.weapon && hero.equipment.weapon.stat === 'heal') {
                            finalHeroHeal += hero.equipment.weapon.value;
                            if (gameState.skillTree.unlockedNodes.includes(10)) finalHeroHeal += hero.equipment.weapon.value * 0.5;
                        }
                        finalHeroDmg = 0; // Heal não dá dano base (simplificação)
                    }
                    
                    // Arquimago Passiva (Tier 4 Tree) - 20% dobrar efeito da skill
                    if (gameState.skillTree.unlockedNodes.includes(12) && Math.random() < 0.2) {
                        finalHeroDmg *= 2;
                        finalHeroHeal *= 2;
                        attackName += " <span style='color:#9b59b6;'>[Arquimago: x2!]</span>";
                    }
                }
                
                if (isCrit && finalHeroDmg > 0) {
                    finalHeroDmg *= treeCritMult;
                    attackName += " <span style='color:#f1c40f;'>[CRÍTICO]</span>";
                }

                finalHeroDmg *= treeDmgMult;
                if (currentEnemy.isBoss) finalHeroDmg *= treeBossDmgMult;
                else finalHeroDmg *= treeMobDmgMult;
                
                if (hero.name === 'Berserker' && activeSyns.includes('linhaFrente') && finalHeroDmg > 0) {
                    finalHeroDmg += gameState.berserkerRage;
                    if (gameState.berserkerRage > 0) attackName += " <span style='color:#e74c3c;'>[Raiva]</span>";
                    gameState.berserkerRage = 0;
                }

                if (hero.name === 'Necromante' && activeSyns.includes('dancaMorte') && finalHeroDmg > 0) {
                    let dancaHeal = finalHeroDmg * 0.10;
                    gameState.team.forEach(h => {
                        if (h.hp > 0) h.hp = Math.min(getMaxHp(h), h.hp + dancaHeal);
                    });
                    attackName += " <span style='color:#9b59b6;'>[Sinfonia Sombria]</span>";
                }
                
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
        if (combatLogHtml.length > 0) {
            logDiv.innerHTML += combatLogHtml.join('');
        }
        
        // Remove excess logs to prevent infinite DOM growth
        while (logDiv.childElementCount > 30) {
            logDiv.removeChild(logDiv.firstElementChild);
        }
        
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
                
                if (gameState.defendingNode) {
                    gameState.level--; // Defesa de nodo não dá level global
                    let node = gameState.nodes[gameState.defendingNode];
                    node.invasion = false;
                    if (node.defenses === undefined) node.defenses = 0;
                    node.defenses++;
                    
                    mostrarAviso(`Invasão repelida! ${node.name} defesas: ${node.defenses}.`, "success");
                    gameState.defendingNode = null;
                }
            }
            
            // Check level up global
            let levelsGained = 0;
            while (gameState.xp >= gameState.xpMax) {
                gameState.level++;
                levelsGained++;
                gameState.xp -= gameState.xpMax;
                gameState.xpMax = Math.floor(gameState.xpMax * 1.33);
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
                let danoBruto = enemyDmg - def;
                
                if (activeSyns.includes('linhaFrente')) {
                    danoBruto *= 0.70; // 30% redução
                }
                
                let danoFinal = Math.max(1, danoBruto);
                target.hp -= danoFinal;
                
                if (activeSyns.includes('linhaFrente')) {
                    gameState.berserkerRage += danoFinal * 0.50; // Converte dano em raiva
                }
                
                let msg = `${currentEnemy.name} causou ${Math.floor(danoFinal)} a ${target.name}!`;
                
                // Titã Imortal Passiva (Tier 4 Tree)
                if (target.hp <= 0 && gameState.skillTree.unlockedNodes.includes(11) && !target.immortalUsed) {
                    target.hp = 1;
                    target.immortalUsed = true;
                    msg += " <span style='color:#e67e22;'>[Sobreviveu com 1 HP!]</span>";
                }
                
                if (isBossCrit) msg = `<span style="color:#e74c3c; font-weight:bold;">🔥 CRÍTICO DO BOSS!</span> ${msg}`;
                
                document.getElementById('combat-log').innerHTML += `<div style="margin-bottom:2px; color:#e67e22;">${msg}</div>`;
            }
        }
        
        // Verifica Wipe
        let vivosConfirm = 0;
        gameState.team.forEach(h => { if (h.hp > 0) vivosConfirm++; });
        if (vivosConfirm === 0 && currentEnemy.isBoss) {
            gameState.fightingBoss = false;
            gameState.autoBoss = false;
            
            if (gameState.defendingNode) {
                gameState.nodes[gameState.defendingNode].owned = false;
                gameState.nodes[gameState.defendingNode].invasion = false;
                mostrarAviso(`Sua equipe falhou em defender o nodo contra o Boss!`, "error");
                gameState.defendingNode = null;
            }
            
            document.getElementById('combat-log').innerHTML += `<div style="color:red; font-weight:bold; margin-top:5px; text-align:center;">☠️ O Boss aniquilou a equipe...</div>`;
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
    
    // Status Derivados de Combate
    document.getElementById('stat-maxhp').innerText = getMaxHp(hero);
    
    let baseDmg = hero.stats.str * 2 + hero.stats.int * 2;
    let critChance = 0.05 + (hero.stats.dex * 0.02);
    if (hero.equipment) {
        if (hero.equipment.weapon && hero.equipment.weapon.stat === 'dmg') baseDmg += hero.equipment.weapon.value;
        if (hero.equipment.accessory && hero.equipment.accessory.stat === 'dmg') baseDmg += hero.equipment.accessory.value;
        if (hero.equipment.accessory && hero.equipment.accessory.stat === 'crit') critChance += hero.equipment.accessory.value / 100;
        
        if (hero.equipment.weapon && gameState.skillTree.unlockedNodes.includes(10)) {
            if (hero.equipment.weapon.stat === 'dmg') baseDmg += hero.equipment.weapon.value * 0.5;
        }
    }
    document.getElementById('stat-basedmg').innerText = Math.floor(baseDmg);
    document.getElementById('stat-crit').innerText = Math.floor(critChance * 100) + '%';
    
    // Equipamentos
    const eqWeapon = document.getElementById('eq-weapon');
    if (hero.equipment && hero.equipment.weapon) {
        eqWeapon.innerHTML = hero.equipment.weapon.icon;
        eqWeapon.title = `${hero.equipment.weapon.name} (+${hero.equipment.weapon.value} ${hero.equipment.weapon.stat.toUpperCase()})`;
        eqWeapon.style.borderColor = '#f1c40f';
    } else {
        eqWeapon.innerHTML = '🗡️';
        eqWeapon.title = 'Arma Vazia';
        eqWeapon.style.borderColor = '#555';
    }
    
    const eqArmor = document.getElementById('eq-armor');
    if (hero.equipment && hero.equipment.armor) {
        eqArmor.innerHTML = hero.equipment.armor.icon;
        eqArmor.title = `${hero.equipment.armor.name} (+${hero.equipment.armor.value} ${hero.equipment.armor.stat.toUpperCase()})`;
        eqArmor.style.borderColor = '#f1c40f';
    } else {
        eqArmor.innerHTML = '🛡️';
        eqArmor.title = 'Armadura Vazia';
        eqArmor.style.borderColor = '#555';
    }
    
    const eqAcc = document.getElementById('eq-accessory');
    if (hero.equipment && hero.equipment.accessory) {
        eqAcc.innerHTML = hero.equipment.accessory.icon;
        eqAcc.title = `${hero.equipment.accessory.name} (+${hero.equipment.accessory.value} ${hero.equipment.accessory.stat.toUpperCase()})`;
        eqAcc.style.borderColor = '#f1c40f';
    } else {
        eqAcc.innerHTML = '💍';
        eqAcc.title = 'Acessório Vazio';
        eqAcc.style.borderColor = '#555';
    }
    
    let skillsDiv = document.getElementById('modal-char-skills');
    if (skillsDiv) {
        skillsDiv.innerHTML = '';
        if (hero.classData && hero.classData.skills) {
            let levels = [3, 6, 9, 12, 15, 18];
            levels.forEach(lvl => {
                let tierSkills = hero.classData.skills.filter(s => s.level === lvl);
                if (tierSkills.length === 2) {
                    let s1 = tierSkills[0];
                    let s2 = tierSkills[1];
                    let unlocked = hero.level >= lvl;
                    let learned1 = hero.learnedSkills.includes(s1.id);
                    let learned2 = hero.learnedSkills.includes(s2.id);
                    let anyLearned = learned1 || learned2;
                    
                    let canClick = unlocked && !anyLearned;
                    let c1 = learned1 ? 'unlocked' : (canClick ? '' : 'locked');
                    let c2 = learned2 ? 'unlocked' : (canClick ? '' : 'locked');
                    
                    let html1 = `<div class="hero-skill-badge ${c1}" style="${canClick ? 'cursor:pointer; border-color:#f1c40f;' : ''}" ${canClick ? `onclick="escolherSkill('${s1.id}')"` : ''} title="${s1.type}: +${s1.mult}">
                                    <div class="skill-icon">${s1.icon}</div>
                                    <div style="display:flex; flex-direction:column;">
                                        <span style="font-weight:bold;">${s1.name}</span>
                                        <span style="font-size:0.6rem;">Nv. ${lvl}</span>
                                    </div>
                                 </div>`;
                    let html2 = `<div class="hero-skill-badge ${c2}" style="${canClick ? 'cursor:pointer; border-color:#f1c40f;' : ''}" ${canClick ? `onclick="escolherSkill('${s2.id}')"` : ''} title="${s2.type}: +${s2.mult}">
                                    <div class="skill-icon">${s2.icon}</div>
                                    <div style="display:flex; flex-direction:column;">
                                        <span style="font-weight:bold;">${s2.name}</span>
                                        <span style="font-size:0.6rem;">Nv. ${lvl}</span>
                                    </div>
                                 </div>`;
                    skillsDiv.innerHTML += html1 + html2;
                }
            });
        }
    }
    
    document.getElementById('modal-status').style.display = 'flex';
};

window.escolherSkill = function(skillId) {
    if (selectedHeroIndex === null) return;
    const hero = gameState.team[selectedHeroIndex];
    hero.learnedSkills.push(skillId);
    salvarJogo();
    abrirStatus(selectedHeroIndex);
};

window.closeModal = function() {
    document.getElementById('modal-status').style.display = 'none';
};

window.aposentarHeroi = function() {
    if (selectedHeroIndex === null) return;
    const hero = gameState.team[selectedHeroIndex];
    const valorResgate = hero.level * 50;
    
    if (confirm(`Tem certeza que deseja aposentar ${hero.name}? Você receberá ${valorResgate} 💰, mas perderá o herói para sempre.`)) {
        // Desequipa itens
        if (hero.weapon) gameState.inventory.push(hero.weapon);
        if (hero.armor) gameState.inventory.push(hero.armor);
        if (hero.accessory) gameState.inventory.push(hero.accessory);
        
        gameState.gold += valorResgate;
        gameState.team.splice(selectedHeroIndex, 1);
        selectedHeroIndex = null;
        
        salvarJogo();
        updateUI();
        closeModal();
    }
};

window.abrirSkillTree = function() {
    let pts = getAvailableTreePoints();
    document.getElementById('tree-points').innerText = pts;
    for(let i=1; i<=15; i++) {
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
        
        // Tier 4 Requirements
        if (i===10 && !gameState.skillTree.unlockedNodes.includes(1)) isBlocked = true;
        if (i===11 && !gameState.skillTree.unlockedNodes.includes(2)) isBlocked = true;
        if (i===12 && !gameState.skillTree.unlockedNodes.includes(8)) isBlocked = true;

        // Tier 5 Requirements
        if (i===13 && !gameState.skillTree.unlockedNodes.includes(7)) isBlocked = true;
        if (i===14 && !gameState.skillTree.unlockedNodes.includes(9)) isBlocked = true;
        if (i===15 && !gameState.skillTree.unlockedNodes.includes(4)) isBlocked = true;
        
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
    
    // Tier 4 Requirements
    if (id===10 && !gameState.skillTree.unlockedNodes.includes(1)) return;
    if (id===11 && !gameState.skillTree.unlockedNodes.includes(2)) return;
    if (id===12 && !gameState.skillTree.unlockedNodes.includes(8)) return;

    // Tier 5 Requirements
    if (id===13 && !gameState.skillTree.unlockedNodes.includes(7)) return;
    if (id===14 && !gameState.skillTree.unlockedNodes.includes(9)) return;
    if (id===15 && !gameState.skillTree.unlockedNodes.includes(4)) return;
    
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
        mostrarAviso("Sem Pontos de Talento!", "error");
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
        mostrarAviso("Ouro insuficiente para enfrentar o boss!", "error");
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
        mostrarAviso("Palavra incorreta. O progresso NÃO foi apagado.", "error");
        document.getElementById('modal-reset').style.display = 'none';
        document.getElementById('input-reset').value = '';
    }
};

// ================= LOJA E INVENTÁRIO =================
window.abrirLoja = function() {
    document.getElementById('shop-gold').innerText = gameState.gold;
    const list = document.getElementById('shop-list');
    list.innerHTML = '';
    
    SHOP_ITEMS.forEach(item => {
        let currentMult = gameState.shopEconomy[item.type] || 1.0;
        let adjustedPrice = Math.max(1, Math.floor(item.price * currentMult));
        
        let indicator = '';
        if (currentMult > 1.05) indicator = '<span style="color:#e74c3c;" title="Em Alta">📈</span>';
        else if (currentMult < 0.95) indicator = '<span style="color:#2ecc71;" title="Em Baixa">📉</span>';
        else indicator = '<span style="color:#f1c40f;" title="Estável">➖</span>';

        const div = document.createElement('div');
        div.className = 'tavern-item';
        div.onclick = () => comprarItem(item.id);
        div.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <div style="font-size:2rem; background:#333; border:1px solid #b8860b; border-radius:4px; padding:5px;">${item.icon}</div>
                <div>
                    <div class="tavern-item-name">${item.name}</div>
                    <div class="tavern-item-stats">+${item.value} ${item.stat.toUpperCase()}</div>
                </div>
            </div>
            <div style="color:gold; font-size:0.9rem; font-weight:bold;">${adjustedPrice} 💰 ${indicator}</div>
        `;
        list.appendChild(div);
    });
    
    document.getElementById('modal-shop').style.display = 'flex';
};

window.comprarItem = function(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    let currentMult = gameState.shopEconomy[item.type] || 1.0;
    let adjustedPrice = Math.max(1, Math.floor(item.price * currentMult));

    if (gameState.gold >= adjustedPrice) {
        gameState.gold -= adjustedPrice;
        gameState.inventory.push({ ...item, uid: Date.now() + Math.random() });
        
        // Flutuação de Economia: Sobe 10% na categoria comprada, desce 5% nas outras
        gameState.shopEconomy[item.type] = (gameState.shopEconomy[item.type] || 1.0) * 1.10;
        ['weapon', 'armor', 'accessory'].forEach(tipo => {
            if (tipo !== item.type) {
                gameState.shopEconomy[tipo] = Math.max(0.2, (gameState.shopEconomy[tipo] || 1.0) * 0.95);
            }
        });
        
        document.getElementById('shop-gold').innerText = gameState.gold;
        salvarJogo();
        updateUI();
        abrirLoja(); // Atualiza a tela da loja com os novos preços
        mostrarAviso(`Você comprou: ${item.name}! O mercado flutuou.`, "success");
    } else {
        mostrarAviso("Ouro insuficiente!", "error");
    }
};

window.abrirInventario = function() {
    renderInventory();
    document.getElementById('modal-inventory').style.display = 'flex';
};

function renderInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    
    if (gameState.inventory.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#888; padding:20px;">Seu inventário está vazio.</div>';
        return;
    }
    
    gameState.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'tavern-item';
        div.style.cursor = 'default';
        div.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <div style="font-size:1.5rem; background:#333; border:1px solid #7f8c8d; border-radius:4px; padding:2px 5px;">${item.icon}</div>
                <div>
                    <div class="tavern-item-name" style="font-size:0.9rem;">${item.name}</div>
                    <div class="tavern-item-stats" style="color:#2ecc71;">+${item.value} ${item.stat.toUpperCase()}</div>
                </div>
            </div>
            <div style="color:#ccc; font-size:0.7rem; font-style:italic;">Não Equipado</div>
        `;
        list.appendChild(div);
    });
}

let currentEquipSlot = null;

window.abrirSelecaoEquip = function(slot) {
    if (selectedHeroIndex === null) return;
    currentEquipSlot = slot;
    const hero = gameState.team[selectedHeroIndex];
    
    const list = document.getElementById('equip-list');
    list.innerHTML = '';
    
    const availableItems = gameState.inventory.filter(i => i.type === slot);
    
    if (availableItems.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#888; padding:20px;">Nenhum item do tipo disponível.</div>';
    } else {
        availableItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'tavern-item';
            div.onclick = () => equiparItem(item.uid);
            div.innerHTML = `
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="font-size:1.5rem; background:#333; border:1px solid #7f8c8d; border-radius:4px; padding:2px 5px;">${item.icon}</div>
                    <div>
                        <div class="tavern-item-name" style="font-size:0.9rem;">${item.name}</div>
                        <div class="tavern-item-stats" style="color:#2ecc71;">+${item.value} ${item.stat.toUpperCase()}</div>
                    </div>
                </div>
                <button class="btn-success" style="font-size:0.7rem; padding:5px;">Equipar</button>
            `;
            list.appendChild(div);
        });
    }
    
    document.getElementById('modal-equip-select').style.display = 'flex';
};

window.equiparItem = function(uid) {
    if (selectedHeroIndex === null || !currentEquipSlot) return;
    const hero = gameState.team[selectedHeroIndex];
    
    // Desequipa o atual se existir
    desequiparAtual(false);
    
    const itemIndex = gameState.inventory.findIndex(i => i.uid === uid);
    if (itemIndex > -1) {
        const itemToEquip = gameState.inventory.splice(itemIndex, 1)[0];
        hero.equipment[currentEquipSlot] = itemToEquip;
        
        // Recalcula HP caso tenha equipado armadura
        if (currentEquipSlot === 'armor') hero.hp = getMaxHp(hero);
        
        salvarJogo();
        updateUI();
        document.getElementById('modal-equip-select').style.display = 'none';
        abrirStatus(selectedHeroIndex);
    }
};

window.desequiparAtual = function(closeModal = true) {
    if (selectedHeroIndex === null || !currentEquipSlot) return;
    const hero = gameState.team[selectedHeroIndex];
    
    if (hero.equipment[currentEquipSlot]) {
        gameState.inventory.push(hero.equipment[currentEquipSlot]);
        hero.equipment[currentEquipSlot] = null;
        
        // Recalcula HP
        if (currentEquipSlot === 'armor') {
            const max = getMaxHp(hero);
            if (hero.hp > max) hero.hp = max;
        }
        
        salvarJogo();
        updateUI();
        if (closeModal) {
            document.getElementById('modal-equip-select').style.display = 'none';
            abrirStatus(selectedHeroIndex);
        }
    } else if (closeModal) {
        document.getElementById('modal-equip-select').style.display = 'none';
    }
};

carregarJogo();

window.mostrarAviso = function(msg, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `mmo-toast ${tipo}`;
    toast.innerText = msg;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
};

window.toggleLog = function() {
    const log = document.getElementById('combat-log');
    const btn = document.getElementById('btn-toggle-log');
    if (log.style.display === 'none') {
        log.style.display = 'block';
        btn.innerHTML = '👁️ Ocultar Log';
    } else {
        log.style.display = 'none';
        btn.innerHTML = '👁️ Mostrar Log';
    }
};

// ================= TÁTICAS (CALLER) =================
window.abrirTaticas = function() {
    renderTactics();
    document.getElementById('modal-tactics').style.display = 'flex';
};

window.addTactic = function() {
    const condition = document.getElementById('tactic-condition').value;
    const action = document.getElementById('tactic-action').value;
    
    gameState.tactics.push({ id: Date.now(), condition, action });
    salvarJogo();
    renderTactics();
};

window.removeTactic = function(id) {
    gameState.tactics = gameState.tactics.filter(t => t.id !== id);
    salvarJogo();
    renderTactics();
};

function renderTactics() {
    const list = document.getElementById('tactics-list');
    list.innerHTML = '';
    
    const conditionNames = {
        'hp_critical': 'Se HP Aliado < 30%',
        'boss_fight': 'Se Boss Ativo',
        'enemy_full': 'Se Inimigo Full HP'
    };
    const actionNames = {
        'focus_heal': 'Forçar Cura',
        'focus_dmg': 'Forçar Dano',
        'save_skills': 'Poupe Skills'
    };
    
    if (gameState.tactics.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#888; padding:10px;">Nenhuma regra definida. A equipe agirá por instinto.</div>';
    } else {
        gameState.tactics.forEach((t, i) => {
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:8px; border-radius:4px; border-left:3px solid #9b59b6;">
                    <div>
                        <span style="font-weight:bold; color:#f1c40f;">#${i+1}</span>
                        <span style="color:#fff; margin-left:5px;">[${conditionNames[t.condition]}]</span> ➜ <span style="color:#2ecc71;">[${actionNames[t.action]}]</span>
                    </div>
                    <button class="btn-danger" style="padding:2px 8px;" onclick="removeTactic(${t.id})">X</button>
                </div>
            `;
        });
    }
}

// ================= MAPA (NODOS) =================
window.abrirMapa = function() {
    renderNodes();
    document.getElementById('modal-map').style.display = 'flex';
};

window.comprarNodo = function(id) {
    const node = gameState.nodes[id];
    if (gameState.gold >= node.price && !node.owned) {
        gameState.gold -= node.price;
        node.owned = true;
        salvarJogo();
        updateUI();
        renderNodes();
        mostrarAviso(`Você reivindicou ${node.name}! Geração passiva iniciada.`, "success");
    } else {
        mostrarAviso("Ouro insuficiente para conquistar este nodo.", "error");
    }
};

window.defenderNodo = function(id) {
    const node = gameState.nodes[id];
    if (node.invasion) {
        document.getElementById('modal-map').style.display = 'none';
        gameState.defendingNode = id;
        gameState.fightingBoss = true; // Força uma luta de boss
        document.getElementById('boss-panel').style.display = 'none';
        
        if (combatInterval) clearInterval(combatInterval);
        
        salvarJogo();
        gerarInimigo();
        mostrarAviso(`Prepare-se para defender ${node.name} contra o invasor!`, "error");
        
        iniciarCombate();
    }
};

function renderNodes() {
    const list = document.getElementById('nodes-list');
    list.innerHTML = '';
    
    const icones = {
        'mina_ferro': '⛏️',
        'floresta': '🌲',
        'caverna': '🦇'
    };
    
    for (let key in gameState.nodes) {
        const n = gameState.nodes[key];
        const icon = icones[key] || '🗺️';
        
        let acaoHTML = '';
        let statusColor = '#333';
        let borderColor = '#111';
        
        if (n.owned) {
            if (n.invasion) {
                statusColor = 'rgba(231, 76, 60, 0.2)';
                borderColor = '#e74c3c';
                acaoHTML = `<button class="btn-danger" style="font-size:0.8rem; padding:5px; border-radius:3px; box-shadow: 0 0 10px red;" onclick="defenderNodo('${key}')">⚔️ Defender!</button>`;
            } else {
                statusColor = 'rgba(46, 204, 113, 0.1)';
                borderColor = '#2ecc71';
                acaoHTML = `<span style="color:#2ecc71; font-weight:bold; font-size:0.8rem;">✔️ Dominado</span>`;
            }
        } else {
            acaoHTML = `<button class="btn-mmo" style="font-size:0.8rem; padding:5px; border-radius:3px;" onclick="comprarNodo('${key}')">Reivindicar (${n.price}💰)</button>`;
        }
        
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:${statusColor}; padding:10px; border-radius:4px; border:1px solid ${borderColor}; margin-bottom:5px;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <div style="font-size:1.5rem; background:#111; border:1px solid ${borderColor}; border-radius:4px; padding:2px 5px;">${icon}</div>
                    <div>
                        <div style="font-weight:bold; color:#fff; font-size:0.9rem;">${n.name}</div>
                        <div style="color:gold; font-size:0.75rem;">Gera +${n.yield} 💰 / turno</div>
                    </div>
                </div>
                <div>${acaoHTML}</div>
            </div>
        `;
    }
}
