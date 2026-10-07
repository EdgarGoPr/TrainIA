/**
 * Solo Leveling System - Core Game State & Math Progression
 */

const SYSTEM_TITLES = [
  { id: 'rank_e', name: 'Rango E: El Más Débil', description: 'Cazador novato que apenas despierta.', minLevel: 1, unlocked: true },
  { id: 'wolf_slayer', name: 'Lobo Solitario', description: 'Completa una racha de 7 días consecutivos de entrenamiento.', minStreak: 7, unlocked: false },
  { id: 'adversity_survivor', name: 'El que superó la adversidad', description: 'Sobrevive y completa con éxito una Zona de Castigo.', penaltyCleared: true, unlocked: false },
  { id: 'iron_will', name: 'Voluntad Inquebrantable', description: 'Completa 30 Misiones Diarias en total.', minQuests: 30, unlocked: false },
  { id: 'titan_force', name: 'Fuerza Descomunal', description: 'Alcanza 50 puntos en el atributo STR (Fuerza).', minStr: 50, unlocked: false },
  { id: 'death_sprinter', name: 'Velocista Letal', description: 'Acumula más de 100 km recorridos en carrera.', minKm: 100, unlocked: false },
  { id: 'master_mind', name: 'Mente Trascendental', description: 'Alcanza 50 puntos en el atributo INT (Foco).', minInt: 50, unlocked: false },
  { id: 'shadow_monarch', name: 'Monarca de las Sombras', description: 'Alcanza el Nivel 50 y trasciende los límites humanos.', minLevel: 50, unlocked: false },
  { id: 'national_hunter', name: 'Cazador de Rango Nacional', description: 'Alcanza el Nivel 100 y conviértete en una fuerza insuperable.', minLevel: 100, unlocked: false }
];

const DEFAULT_ACTIVITIES = [
  { id: 'pushups', name: 'Flexiones de brazos', sub: 'Push-ups', target: 100, unit: 'reps', stat: 'str', category: 'Fuerza (STR)', incs: [1, 5, 10, 25], active: true },
  { id: 'squats', name: 'Sentadillas', sub: 'Squats', target: 100, unit: 'reps', stat: 'str', category: 'Piernas (STR)', incs: [1, 5, 10, 25], active: true },
  { id: 'situps', name: 'Abdominales', sub: 'Sit-ups', target: 100, unit: 'reps', stat: 'vit', category: 'Core (VIT)', incs: [1, 5, 10, 25], active: true },
  { id: 'running', name: 'Carrera o Caminata activa', sub: 'Cardio', target: 10.0, unit: 'km', stat: 'agi', category: 'Agilidad (AGI)', incs: [0.5, 1.0, 2.5, 5.0], active: true },
  { id: 'deepwork', name: 'Bloque de Foco / Estudio', sub: 'Mente', target: 60, unit: 'min', stat: 'int', category: 'Inteligencia (INT)', incs: [5, 15, 25, 30], active: true }
];

const DEFAULT_LOOT_TABLE = [
  { id: 'rest_buff', name: 'Poción de Recuperación Completa', rarity: 'rare', icon: '🧪', desc: 'Permite un descanso extra o restaurar HP/MP al 100% al instante.' },
  { id: 'stat_pill', name: 'Elixir de Poder (+3 Puntos de Estadística)', rarity: 'epic', icon: '💎', desc: 'Otorga inmediatamente +3 Puntos Libres de Estadística.', pointsBonus: 3 },
  { id: 'cheat_meal', name: 'Comida de Banquete (Cheat Meal)', rarity: 'common', icon: '🍖', desc: 'Permiso del Sistema para disfrutar de tu comida o postre favorito sin culpa.' },
  { id: 'gaming_time', name: 'Tiempo de Mazmorra (2h de Ocio / Videojuegos)', rarity: 'common', icon: '🎮', desc: '2 horas libres de ocio sin remordimientos.' },
  { id: 'shadow_key', name: 'Llave de Mazmorra Oculta (Recompensa Especial)', rarity: 'legendary', icon: '🗝️', desc: 'Un capricho o premio personal de alto valor que tú elijas.' }
];

class SystemStateManager {
  constructor() {
    this.state = this.getInitialState();
  }

  getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getInitialState() {
    const today = this.getTodayDateString();
    const tasksMap = {};
    DEFAULT_ACTIVITIES.forEach(a => {
      if (a.active !== false) {
        tasksMap[a.id] = { ...a, current: 0, active: true };
      }
    });

    return {
      player: {
        name: 'Sung Jin-woo',
        title: 'Rango E: El Más Débil',
        level: 1,
        currentExp: 0,
        statPoints: 5,
        stats: {
          str: 10,
          agi: 10,
          vit: 10,
          int: 10,
          per: 10
        },
        hp: 200,
        maxHp: 200,
        mp: 150,
        maxMp: 150,
        fatigue: 0,
        unlockedTitles: ['rank_e']
      },
      quest: {
        date: today,
        status: 'IN_PROGRESS', // IN_PROGRESS | COMPLETED | FAILED
        completedAt: null,
        tasks: tasksMap
      },
      penalty: {
        isActive: false,
        triggeredDate: null,
        penaltyType: 'SURVIVAL_TIME',
        targetSeconds: 1800,
        elapsedSeconds: 0,
        isRunning: false,
        reason: 'Has fallado la misión diaria antes de medianoche.'
      },
      inventory: {
        lootBoxes: 1,
        items: [],
        customRewards: [...DEFAULT_LOOT_TABLE]
      },
      history: {},
      statsSummary: {
        totalDays: 0,
        completedDays: 0,
        failedDays: 0,
        penaltiesCleared: 0,
        totalPushups: 0,
        totalSquats: 0,
        totalSitups: 0,
        totalKm: 0,
        totalDeepworkMin: 0,
        currentStreak: 0,
        maxStreak: 0
      },
      settings: {
        soundEnabled: true,
        hapticEnabled: true,
        customActivities: JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES)),
        penaltyMinutes: 30,
        theme: 'system-cyan',
        notifications: {
          enabled: true,
          times: ['09:00', '15:00', '21:00'],
          lastTriggeredDateHour: {}
        }
      },
      meta: {
        createdDate: today,
        lastActiveDate: today,
        version: '1.1.4'
      }
    };
  }

  init() {
    const saved = window.systemStorage.load();
    if (saved) {
      this.state = this.mergeWithDefaults(saved);
    } else {
      this.state = this.getInitialState();
      this.save();
    }

    this.recalculateMaxVitals();
    this.checkDateTransition();
    this.checkTitleUnlocks();
    this.save();
    return this.state;
  }

  mergeWithDefaults(saved) {
    const base = this.getInitialState();
    const merged = {
      ...base,
      ...saved,
      player: {
        ...base.player,
        ...(saved.player || {}),
        stats: { ...base.player.stats, ...(saved.player?.stats || {}) }
      },
      quest: {
        ...base.quest,
        ...(saved.quest || {}),
        tasks: {
          ...(saved.quest?.tasks || base.quest.tasks)
        }
      },
      penalty: { ...base.penalty, ...(saved.penalty || {}) },
      inventory: { ...base.inventory, ...(saved.inventory || {}) },
      history: { ...(saved.history || {}) },
      statsSummary: { ...base.statsSummary, ...(saved.statsSummary || {}) },
      settings: {
        ...base.settings,
        ...(saved.settings || {}),
        customActivities: (saved.settings?.customActivities || base.settings.customActivities).map(a => ({
          ...a,
          active: a.active !== false
        })),
        notifications: {
          ...base.settings.notifications,
          ...(saved.settings?.notifications || {})
        }
      },
      meta: { ...base.meta, ...(saved.meta || {}), version: '1.1.4' }
    };
    return merged;
  }

  save() {
    window.systemStorage.save(this.state);
  }

  getRequiredExpForLevel(lvl = this.state.player.level) {
    return Math.max(100, Math.floor(100 * Math.pow(lvl, 1.5)));
  }

  getQuestExpReward(lvl = this.state.player.level) {
    return Math.floor(75 * Math.pow(lvl, 1.45));
  }

  getHunterRank(lvl = this.state.player.level) {
    if (lvl >= 100) return { rank: 'NACIONAL', label: 'Cazador de Rango Nacional', color: '#FFD700', glow: 'gold' };
    if (lvl >= 90) return { rank: 'S', label: 'Cazador Rango S', color: '#B026FF', glow: 'purple' };
    if (lvl >= 70) return { rank: 'A', label: 'Cazador Rango A', color: '#FF0055', glow: 'red' };
    if (lvl >= 45) return { rank: 'B', label: 'Cazador Rango B', color: '#00E5FF', glow: 'cyan' };
    if (lvl >= 25) return { rank: 'C', label: 'Cazador Rango C', color: '#00FF88', glow: 'green' };
    if (lvl >= 10) return { rank: 'D', label: 'Cazador Rango D', color: '#00B4D8', glow: 'blue' };
    return { rank: 'E', label: 'Cazador Rango E', color: '#A0AEC0', glow: 'gray' };
  }

  recalculateMaxVitals() {
    const { vit, int } = this.state.player.stats;
    this.state.player.maxHp = 100 + vit * 10;
    this.state.player.maxMp = 50 + int * 10;

    if (this.state.player.hp > this.state.player.maxHp) this.state.player.hp = this.state.player.maxHp;
    if (this.state.player.mp > this.state.player.maxMp) this.state.player.mp = this.state.player.maxMp;
  }

  checkDateTransition() {
    const today = this.getTodayDateString();
    const lastDate = this.state.quest.date;

    if (lastDate !== today) {
      const yesterdayWasCompleted = this.state.quest.status === 'COMPLETED';

      if (!this.state.history[lastDate]) {
        this.recordHistoryEntry(lastDate, this.state.quest.status);
      }

      if (!yesterdayWasCompleted && !this.state.penalty.isActive) {
        this.triggerPenaltyZone(lastDate);
      } else if (yesterdayWasCompleted && !this.state.penalty.isActive) {
        this.resetDailyQuest(today);
      } else if (this.state.penalty.isActive) {
        this.state.quest.date = today;
      }
      this.state.meta.lastActiveDate = today;
    }
  }

  recordHistoryEntry(dateStr, status) {
    const q = this.state.quest;
    this.state.history[dateStr] = {
      date: dateStr,
      status: status,
      level: this.state.player.level,
      tasks: { ...q.tasks },
      pushups: q.tasks.pushups?.current || 0,
      squats: q.tasks.squats?.current || 0,
      situps: q.tasks.situps?.current || 0,
      running: q.tasks.running?.current || 0,
      deepwork: q.tasks.deepwork?.current || 0,
      completedAt: q.completedAt
    };

    if (status === 'COMPLETED') {
      this.state.statsSummary.completedDays++;
      this.state.statsSummary.currentStreak++;
      if (this.state.statsSummary.currentStreak > this.state.statsSummary.maxStreak) {
        this.state.statsSummary.maxStreak = this.state.statsSummary.currentStreak;
      }
    } else {
      this.state.statsSummary.failedDays++;
      this.state.statsSummary.currentStreak = 0;
    }
    this.state.statsSummary.totalDays++;
    this.state.statsSummary.totalPushups += (q.tasks.pushups?.current || 0);
    this.state.statsSummary.totalSquats += (q.tasks.squats?.current || 0);
    this.state.statsSummary.totalSitups += (q.tasks.situps?.current || 0);
    this.state.statsSummary.totalKm += (q.tasks.running?.current || 0);
    this.state.statsSummary.totalDeepworkMin += (q.tasks.deepwork?.current || 0);
  }

  triggerPenaltyZone(dateStr) {
    this.state.penalty.isActive = true;
    this.state.penalty.triggeredDate = dateStr;
    this.state.penalty.elapsedSeconds = 0;
    this.state.penalty.isRunning = false;
    this.state.penalty.targetSeconds = (this.state.settings.penaltyMinutes || 30) * 60;
    this.state.quest.status = 'FAILED';
  }

  resetDailyQuest(today = this.getTodayDateString()) {
    const activities = this.state.settings.customActivities || DEFAULT_ACTIVITIES;
    const tasksMap = {};
    activities.forEach(a => {
      if (a.active !== false) {
        tasksMap[a.id] = { ...a, current: 0, active: true };
      }
    });

    this.state.quest = {
      date: today,
      status: 'IN_PROGRESS',
      completedAt: null,
      tasks: tasksMap
    };
  }

  /**
   * Add a new custom objective activity to the daily quest
   */
  addNewActivity({ name, target, unit, category, stat, incs }) {
    const id = 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newAct = {
      id,
      name: name.trim(),
      sub: category || 'General',
      target: parseFloat(target) || 10,
      unit: unit || 'reps',
      stat: stat || 'str',
      category: category || 'Entrenamiento',
      incs: incs || [1, 5, 10, 25],
      active: true
    };

    if (!this.state.settings.customActivities) {
      this.state.settings.customActivities = JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));
    }

    this.state.settings.customActivities.push(newAct);

    // Also add to active quest if in progress
    if (this.state.quest.status === 'IN_PROGRESS') {
      this.state.quest.tasks[id] = { ...newAct, current: 0, active: true };
    }

    this.save();
    return newAct;
  }

  /**
   * Remove a single activity from daily quest
   */
  removeActivity(activityId) {
    this.removeActivities([activityId]);
  }

  /**
   * Bulk remove activities
   */
  removeActivities(activityIds) {
    if (!this.state.settings.customActivities || !Array.isArray(activityIds)) return;
    const idSet = new Set(activityIds);

    this.state.settings.customActivities = this.state.settings.customActivities.filter(a => !idSet.has(a.id));
    activityIds.forEach(id => {
      if (this.state.quest.tasks[id]) {
        delete this.state.quest.tasks[id];
      }
    });

    this.save();
  }

  /**
   * Bulk deactivate activities (pauses them from daily quest without deleting)
   */
  deactivateActivities(activityIds) {
    if (!this.state.settings.customActivities || !Array.isArray(activityIds)) return;
    const idSet = new Set(activityIds);

    this.state.settings.customActivities.forEach(a => {
      if (idSet.has(a.id)) {
        a.active = false;
      }
    });

    activityIds.forEach(id => {
      if (this.state.quest.tasks[id]) {
        delete this.state.quest.tasks[id];
      }
    });

    this.save();
  }

  /**
   * Bulk activate activities (re-enables them in daily quest)
   */
  activateActivities(activityIds) {
    if (!this.state.settings.customActivities || !Array.isArray(activityIds)) return;
    const idSet = new Set(activityIds);

    this.state.settings.customActivities.forEach(a => {
      if (idSet.has(a.id)) {
        a.active = true;
        if (this.state.quest.status === 'IN_PROGRESS' && !this.state.quest.tasks[a.id]) {
          this.state.quest.tasks[a.id] = { ...a, current: 0, active: true };
        }
      }
    });

    this.save();
  }

  /**
   * Toggle activity active/inactive status
   */
  toggleActivityStatus(activityId) {
    const act = this.state.settings.customActivities?.find(a => a.id === activityId);
    if (!act) return;
    if (act.active === false) {
      this.activateActivities([activityId]);
    } else {
      this.deactivateActivities([activityId]);
    }
  }

  updateActivityTarget(activityId, newTarget) {
    const parsed = parseFloat(newTarget);
    if (isNaN(parsed) || parsed <= 0) return;

    const act = this.state.settings.customActivities?.find(a => a.id === activityId);
    if (act) act.target = parsed;

    if (this.state.quest.tasks[activityId]) {
      this.state.quest.tasks[activityId].target = parsed;
    }

    this.save();
  }

  updateTaskProgress(taskId, delta, isAbsolute = false) {
    const task = this.state.quest.tasks[taskId];
    if (!task) return;

    if (isAbsolute) {
      task.current = Math.max(0, Math.min(task.target * 3, delta));
    } else {
      task.current = Math.max(0, parseFloat((task.current + delta).toFixed(1)));
    }

    this.save();
  }

  isDailyQuestReadyToClaim() {
    const tasks = Object.values(this.state.quest.tasks);
    if (tasks.length === 0) return false;
    if (this.state.quest.status === 'COMPLETED') return false;
    return tasks.every(t => t.current >= t.target);
  }

  claimDailyQuestReward() {
    if (!this.isDailyQuestReadyToClaim()) return null;

    const today = this.getTodayDateString();
    this.state.quest.status = 'COMPLETED';
    this.state.quest.completedAt = new Date().toISOString();

    const expGained = this.getQuestExpReward();
    const levelUpResult = this.addExp(expGained);

    this.state.player.statPoints += 3;

    this.recalculateMaxVitals();
    this.state.player.hp = this.state.player.maxHp;
    this.state.player.mp = this.state.player.maxMp;
    this.state.player.fatigue = 0;

    this.state.inventory.lootBoxes = (this.state.inventory.lootBoxes || 0) + 1;

    this.recordHistoryEntry(today, 'COMPLETED');
    this.checkTitleUnlocks();
    this.save();

    return {
      expGained,
      levelUpResult,
      statPointsGained: 3,
      lootBoxesGained: 1
    };
  }

  addExp(amount) {
    let currentExp = this.state.player.currentExp + amount;
    let oldLevel = this.state.player.level;
    let newLevel = oldLevel;
    let totalStatPointsAwarded = 0;

    let reqExp = this.getRequiredExpForLevel(newLevel);
    while (currentExp >= reqExp) {
      currentExp -= reqExp;
      newLevel++;
      const points = newLevel % 5 === 0 ? 5 : 3;
      this.state.player.statPoints += points;
      totalStatPointsAwarded += points;
      reqExp = this.getRequiredExpForLevel(newLevel);
    }

    this.state.player.level = newLevel;
    this.state.player.currentExp = currentExp;
    this.recalculateMaxVitals();

    const didLevelUp = newLevel > oldLevel;
    if (didLevelUp) {
      this.checkTitleUnlocks();
    }

    return {
      didLevelUp,
      oldLevel,
      newLevel,
      statPointsAwarded: totalStatPointsAwarded
    };
  }

  allocateStat(statKey, amount = 1) {
    if (this.state.player.statPoints < amount) return false;
    if (!this.state.player.stats[statKey] && this.state.player.stats[statKey] !== 0) return false;

    this.state.player.stats[statKey] += amount;
    this.state.player.statPoints -= amount;

    this.recalculateMaxVitals();
    this.checkTitleUnlocks();
    this.save();
    return true;
  }

  checkTitleUnlocks() {
    const p = this.state.player;
    const summary = this.state.statsSummary;
    const unlockedIds = new Set(p.unlockedTitles || []);
    const newlyUnlocked = [];

    SYSTEM_TITLES.forEach(title => {
      if (unlockedIds.has(title.id)) return;

      let canUnlock = false;
      if (title.minLevel && p.level >= title.minLevel) canUnlock = true;
      if (title.minStreak && summary.currentStreak >= title.minStreak) canUnlock = true;
      if (title.minQuests && summary.completedDays >= title.minQuests) canUnlock = true;
      if (title.minStr && p.stats.str >= title.minStr) canUnlock = true;
      if (title.minInt && p.stats.int >= title.minInt) canUnlock = true;
      if (title.minKm && summary.totalKm >= title.minKm) canUnlock = true;
      if (title.penaltyCleared && summary.penaltiesCleared >= 1) canUnlock = true;

      if (canUnlock) {
        unlockedIds.add(title.id);
        newlyUnlocked.push(title);
      }
    });

    this.state.player.unlockedTitles = Array.from(unlockedIds);
    return newlyUnlocked;
  }

  equipTitle(titleName) {
    this.state.player.title = titleName;
    this.save();
  }

  clearPenalty() {
    this.state.penalty.isActive = false;
    this.state.penalty.isRunning = false;
    this.state.penalty.elapsedSeconds = 0;
    this.state.statsSummary.penaltiesCleared = (this.state.statsSummary.penaltiesCleared || 0) + 1;

    this.resetDailyQuest(this.getTodayDateString());
    this.checkTitleUnlocks();
    this.save();
  }

  openLootBox() {
    if ((this.state.inventory.lootBoxes || 0) <= 0) return null;

    this.state.inventory.lootBoxes--;
    const pool = this.state.inventory.customRewards?.length > 0
      ? this.state.inventory.customRewards
      : DEFAULT_LOOT_TABLE;

    const rand = Math.random();
    let selected;

    if (rand < 0.05) {
      selected = pool.find(i => i.rarity === 'legendary') || pool[0];
    } else if (rand < 0.25) {
      selected = pool.find(i => i.rarity === 'epic') || pool[0];
    } else if (rand < 0.60) {
      selected = pool.find(i => i.rarity === 'rare') || pool[0];
    } else {
      selected = pool[Math.floor(Math.random() * pool.length)];
    }

    const itemInstance = {
      ...selected,
      instanceId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      obtainedAt: new Date().toISOString(),
      used: false
    };

    if (itemInstance.pointsBonus) {
      this.state.player.statPoints += itemInstance.pointsBonus;
    }

    this.state.inventory.items.unshift(itemInstance);
    this.save();

    return itemInstance;
  }

  useItem(instanceId) {
    const item = this.state.inventory.items.find(i => i.instanceId === instanceId);
    if (!item || item.used) return false;

    item.used = true;
    item.usedAt = new Date().toISOString();

    if (item.id === 'rest_buff') {
      this.recalculateMaxVitals();
      this.state.player.hp = this.state.player.maxHp;
      this.state.player.mp = this.state.player.maxMp;
      this.state.player.fatigue = 0;
    }

    this.save();
    return true;
  }
}

window.systemState = new SystemStateManager();
window.SYSTEM_TITLES = SYSTEM_TITLES;
window.DEFAULT_ACTIVITIES = DEFAULT_ACTIVITIES;
