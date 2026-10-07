/**
 * Solo Leveling System - UI Controller, HUD Renderers & Canvas Visual FX
 */

class SystemUIController {
  constructor() {
    this.currentTab = 'tab-daily-quest'; // Default to Daily Quest for fast action!
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationFrameId = null;
  }

  init() {
    this.setupCanvas();
    this.setupTabNavigation();
    this.setupModalsAndEvents();
    this.refreshAll();
  }

  refreshAll() {
    this.updateHeader();
    this.updateStatusScreen();
    window.questController.renderDailyQuest();
    window.questController.renderPenaltyZone();
    window.lootController.renderInventory();
    window.logsController.renderLogs();
    this.renderSettingsScreen();
  }

  /* ==========================================================================
     CANVAS PARTICLE FX (MANA & DIGITAL EMBERS)
     ========================================================================== */
  setupCanvas() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create initial particle pool
    this.particles = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.6 - 0.2,
        opacity: Math.random() * 0.7 + 0.2
      });
    }

    this.animateCanvas();
  }

  animateCanvas() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const isPenalty = window.systemState?.state?.penalty?.isActive;
    const pColor = isPenalty ? 'rgba(255, 0, 85, ' : 'rgba(0, 229, 255, ';

    this.particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y < 0) {
        p.y = this.canvas.height + 10;
        p.x = Math.random() * this.canvas.width;
      }
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = pColor + p.opacity + ')';
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = isPenalty ? '#ff0055' : '#00e5ff';
      this.ctx.fill();
    });

    this.animationFrameId = requestAnimationFrame(() => this.animateCanvas());
  }

  /* ==========================================================================
     TAB ROUTING
     ========================================================================== */
  setupTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-item-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.targetTab;
        if (!targetTab) return;
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    window.systemAudio.playClick();
    this.currentTab = tabId;

    // Update bottom nav active state
    document.querySelectorAll('.nav-item-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.targetTab === tabId);
    });

    // Update pane visibility
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });

    // Refresh targeted tab view
    if (tabId === 'tab-status') this.updateStatusScreen();
    if (tabId === 'tab-daily-quest') window.questController.renderDailyQuest();
    if (tabId === 'tab-inventory') window.lootController.renderInventory();
    if (tabId === 'tab-history') window.logsController.renderLogs();
    if (tabId === 'tab-settings') this.renderSettingsScreen();
  }

  /* ==========================================================================
     HEADER HUD UPDATES & COUNTDOWN
     ========================================================================== */
  updateHeader() {
    const p = window.systemState.state.player;
    const rankInfo = window.systemState.getHunterRank(p.level);

    // Update Rank Badge
    const headerRankBadge = document.getElementById('header-hunter-rank');
    if (headerRankBadge) {
      headerRankBadge.textContent = rankInfo.rank;
      headerRankBadge.style.color = rankInfo.color;
      headerRankBadge.style.borderColor = rankInfo.color;
    }

    // Update Sound Button State
    const soundBtn = document.getElementById('toggle-sound-btn');
    if (soundBtn) {
      const isMuted = window.systemAudio.muted;
      soundBtn.classList.toggle('muted', isMuted);
      soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
    }

    // Update Inventory Nav Badge
    const invCount = window.systemState.state.inventory?.lootBoxes || 0;
    const invBadge = document.getElementById('nav-inv-badge');
    if (invBadge) {
      invBadge.style.display = invCount > 0 ? 'flex' : 'none';
      invBadge.textContent = invCount;
    }
  }

  updateCountdown() {
    const timeEl = document.getElementById('quest-countdown-time');
    const barEl = document.getElementById('quest-countdown-hud');
    if (!timeEl) return;

    const now = new Date();
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);

    const diff = Math.max(0, midnight.getTime() - now.getTime());
    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

    timeEl.textContent = `${hours}:${mins}:${secs}`;

    // Color code based on remaining hours
    if (barEl) {
      const totalHours = diff / (1000 * 60 * 60);
      barEl.classList.toggle('warning', totalHours < 4 && totalHours >= 1);
      barEl.classList.toggle('critical', totalHours < 1);
    }
  }

  /* ==========================================================================
     PLAYER STATUS SCREEN
     ========================================================================== */
  updateStatusScreen() {
    const p = window.systemState.state.player;
    const reqExp = window.systemState.getRequiredExpForLevel(p.level);
    const expPct = Math.min(100, Math.round((p.currentExp / reqExp) * 100));
    const rankInfo = window.systemState.getHunterRank(p.level);

    // Profile Info
    const nameEl = document.getElementById('player-name-display');
    const titleEl = document.getElementById('player-title-display');
    const levelEl = document.getElementById('player-level-display');
    const rankBadgeEl = document.getElementById('player-rank-badge-box');

    if (nameEl) nameEl.textContent = p.name;
    if (titleEl) titleEl.textContent = `[ ${p.title} ] ▾`;
    if (levelEl) levelEl.textContent = `NIVEL ${p.level}`;
    if (rankBadgeEl) {
      rankBadgeEl.textContent = `RANGO ${rankInfo.rank}`;
      rankBadgeEl.style.background = rankInfo.color;
    }

    // Vitals
    const hpValEl = document.getElementById('hp-val-text');
    const hpFillEl = document.getElementById('hp-bar-fill');
    const mpValEl = document.getElementById('mp-val-text');
    const mpFillEl = document.getElementById('mp-bar-fill');
    const expValEl = document.getElementById('exp-val-text');
    const expFillEl = document.getElementById('exp-bar-fill');

    if (hpValEl) hpValEl.textContent = `${p.hp} / ${p.maxHp}`;
    if (hpFillEl) hpFillEl.style.width = `${Math.min(100, (p.hp / p.maxHp) * 100)}%`;

    if (mpValEl) mpValEl.textContent = `${p.mp} / ${p.maxMp}`;
    if (mpFillEl) mpFillEl.style.width = `${Math.min(100, (p.mp / p.maxMp) * 100)}%`;

    if (expValEl) expValEl.textContent = `${p.currentExp} / ${reqExp} (${expPct}%)`;
    if (expFillEl) expFillEl.style.width = `${expPct}%`;

    // Available Stat Points
    const statPtsEl = document.getElementById('available-stat-points');
    if (statPtsEl) statPtsEl.textContent = p.statPoints;

    // Stat Values & Buttons
    const statKeys = ['str', 'agi', 'vit', 'int', 'per'];
    statKeys.forEach(k => {
      const valEl = document.getElementById(`stat-val-${k}`);
      const btnEl = document.getElementById(`stat-btn-${k}`);
      if (valEl) valEl.textContent = p.stats[k];
      if (btnEl) btnEl.disabled = p.statPoints <= 0;
    });

    // Derived Combat Stats
    const pAtkEl = document.getElementById('combat-patk-val');
    const pSpdEl = document.getElementById('combat-spd-val');
    const pRecEl = document.getElementById('combat-rec-val');
    const pFocEl = document.getElementById('combat-foc-val');

    if (pAtkEl) pAtkEl.textContent = Math.floor(p.stats.str * 2.5 + p.stats.agi * 1.5);
    if (pSpdEl) pSpdEl.textContent = Math.floor(p.stats.agi * 2.2);
    if (pRecEl) pRecEl.textContent = `${Math.floor(p.stats.vit * 1.8)} HP/d`;
    if (pFocEl) pFocEl.textContent = Math.floor(p.stats.int * 2.5);
  }

  /* ==========================================================================
     MODALS & POPUPS
     ========================================================================== */
  setupModalsAndEvents() {
    // Stat increment buttons
    const statKeys = ['str', 'agi', 'vit', 'int', 'per'];
    statKeys.forEach(k => {
      const btn = document.getElementById(`stat-btn-${k}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (window.systemState.allocateStat(k, 1)) {
            window.systemAudio.playStatUp();
            this.updateStatusScreen();
            this.updateHeader();
          }
        });
      }
    });

    // Sound toggle
    const soundBtn = document.getElementById('toggle-sound-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        window.systemAudio.ensureContext();
        window.systemAudio.setMuted(!window.systemAudio.muted);
        this.updateHeader();
      });
    }

    // Edit Name
    const editNameBtn = document.getElementById('edit-hunter-name-btn');
    if (editNameBtn) {
      editNameBtn.addEventListener('click', () => {
        const newName = prompt('Ingresa el nuevo nombre del Cazador:', window.systemState.state.player.name);
        if (newName && newName.trim()) {
          window.systemState.state.player.name = newName.trim();
          window.systemState.save();
          this.updateStatusScreen();
        }
      });
    }

    // Title selector click
    const titleBtn = document.getElementById('player-title-display');
    if (titleBtn) {
      titleBtn.addEventListener('click', () => {
        this.showTitlesModal();
      });
    }

    // Close generic modal handlers
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-action="close-modal"]');
      if (closeBtn) {
        const modal = closeBtn.closest('.system-modal-overlay');
        if (modal) modal.classList.remove('active');
        return;
      }
    });
  }

  showTitlesModal() {
    const modal = document.getElementById('generic-system-modal');
    const titleEl = document.getElementById('generic-modal-title');
    const bodyEl = document.getElementById('generic-modal-body');
    if (!modal || !bodyEl) return;

    window.systemAudio.playClick();
    if (titleEl) titleEl.textContent = '[ REGISTRO DE TÍTULOS DEL SISTEMA ]';

    const p = window.systemState.state.player;
    const unlocked = new Set(p.unlockedTitles || []);

    let html = `
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
        Selecciona un título desbloqueado para equipar en tu credencial de Cazador:
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px;">
    `;

    window.SYSTEM_TITLES.forEach(t => {
      const isUnlocked = unlocked.has(t.id);
      const isEquipped = p.title === t.name;

      html += `
        <div style="
          background: ${isEquipped ? 'rgba(0, 229, 255, 0.15)' : 'rgba(10, 16, 28, 0.7)'};
          border: 1px solid ${isEquipped ? 'var(--color-primary)' : isUnlocked ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: ${isUnlocked ? '1' : '0.5'};
        ">
          <div>
            <div style="font-family: var(--font-hud); font-size: 0.85rem; font-weight:700; color: ${isUnlocked ? 'var(--color-gold)' : 'var(--text-muted)'};">
              ${t.name} ${isEquipped ? '⭐' : ''}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">
              ${t.description}
            </div>
          </div>
          <div>
            ${isUnlocked && !isEquipped ? `
              <button class="modal-btn" style="padding: 4px 10px; font-size: 0.72rem;" onclick="window.systemState.equipTitle('${t.name}'); window.systemUI.updateStatusScreen(); document.getElementById('generic-system-modal').classList.remove('active');">
                EQUIPAR
              </button>
            ` : isEquipped ? `
              <span style="font-size: 0.72rem; color: var(--color-primary); font-family: var(--font-mono);">EQUIPADO</span>
            ` : `
              <span style="font-size: 0.72rem; color: var(--text-dim); font-family: var(--font-mono);">BLOQUEADO</span>
            `}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    bodyEl.innerHTML = html;
    modal.classList.add('active');
  }

  showLevelUpModal(levelUpResult) {
    const overlay = document.getElementById('level-up-overlay');
    const numEl = document.getElementById('level-up-num-text');
    const ptsEl = document.getElementById('level-up-pts-text');
    if (!overlay) return;

    if (numEl) numEl.textContent = `LVL ${levelUpResult.newLevel}`;
    if (ptsEl) ptsEl.textContent = `+${levelUpResult.statPointsAwarded} PUNTOS DE ESTADÍSTICA DISPONIBLES`;

    overlay.classList.add('active');
  }

  hideLevelUpModal() {
    const overlay = document.getElementById('level-up-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  triggerStatusRecoveryEffect() {
    const overlay = document.getElementById('recovery-wave-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    void overlay.offsetWidth; // Trigger reflow
    overlay.classList.add('active');
  }

  showRewardModal({ expGained, statPoints, lootBoxes }) {
    const modal = document.getElementById('generic-system-modal');
    const titleEl = document.getElementById('generic-modal-title');
    const bodyEl = document.getElementById('generic-modal-body');
    if (!modal || !bodyEl) return;

    if (titleEl) titleEl.textContent = '[ RECOMPENSA DE MISIÓN DIARIA RECLAMADA ]';

    bodyEl.innerHTML = `
      <div style="text-align: center; padding: 10px 0;">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">⚡</div>
        <h3 style="font-family: var(--font-hud); color: var(--color-primary-glow); margin-bottom: 12px;">
          RECUPERACIÓN DE ESTADO COMPLETA
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          Tus puntos de HP y MP han sido restaurados al 100%. La fatiga corporal ha sido erradicada por el Sistema.
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
          <div style="background: rgba(176, 38, 255, 0.15); border: 1px solid var(--color-purple); padding: 8px 12px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.85rem; color: #fff;">
            🔮 <strong>+${expGained} Puntos de Experiencia (EXP)</strong>
          </div>
          <div style="background: rgba(0, 229, 255, 0.15); border: 1px solid var(--color-primary); padding: 8px 12px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.85rem; color: #fff;">
            ⭐ <strong>+${statPoints} Puntos de Estadística Libres</strong>
          </div>
          <div style="background: rgba(255, 215, 0, 0.15); border: 1px solid var(--color-gold); padding: 8px 12px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.85rem; color: #fff;">
            🎁 <strong>+${lootBoxes} Caja Misteriosa Bendita (Inventario)</strong>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  showLootRevealModal(item) {
    const modal = document.getElementById('generic-system-modal');
    const titleEl = document.getElementById('generic-modal-title');
    const bodyEl = document.getElementById('generic-modal-body');
    if (!modal || !bodyEl) return;

    if (titleEl) titleEl.textContent = '[ APERTURA DE CAJA MISTERIOSA ]';

    bodyEl.innerHTML = `
      <div style="text-align: center; padding: 14px 0;">
        <div style="font-size: 3.5rem; margin-bottom: 10px; filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));">
          ${item.icon || '🎁'}
        </div>
        <div style="font-family: var(--font-hud); font-size: 0.72rem; color: var(--color-gold); letter-spacing: 2px; text-transform: uppercase;">
          [ RANGO: ${item.rarity.toUpperCase()} ]
        </div>
        <h3 style="font-family: var(--font-hud); color: #fff; font-size: 1.15rem; margin: 6px 0 10px;">
          ${item.name}
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          ${item.desc}
        </p>
        <div style="font-size: 0.75rem; color: var(--color-primary-glow); font-family: var(--font-mono);">
          El objeto ha sido depositado en tu Inventario.
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  showToast(message, type = 'normal') {
    const container = document.getElementById('system-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `sys-toast ${type === 'warning' ? 'warning' : ''}`;
    toast.innerHTML = `
      <div style="color: ${type === 'warning' ? 'var(--penalty-red)' : 'var(--color-primary)'}; font-size:1rem;">◈</div>
      <div style="flex:1;">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* ==========================================================================
     SETTINGS SCREEN
     ========================================================================== */
  renderSettingsScreen() {
    const container = document.getElementById('activities-config-container');
    const activities = window.systemState.state.settings.customActivities || window.DEFAULT_ACTIVITIES;

    if (container) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${activities.map(act => `
            <div style="background: rgba(14, 21, 37, 0.6); border: 1px solid var(--border-cyan); border-radius: var(--radius-sm); padding: 8px 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-family: var(--font-hud); font-size: 0.85rem; font-weight:700; color:#fff;">
                  ${act.name}
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">
                  ${act.category || 'Entrenamiento'} | Unidad: ${act.unit}
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <input type="number" step="any" value="${act.target}" onchange="window.systemState.updateActivityTarget('${act.id}', this.value); window.questController.renderDailyQuest();" style="width: 70px; padding: 4px 6px; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; border-radius: 4px; text-align: right; font-family: var(--font-mono); font-size: 0.85rem;">
                <button class="icon-btn" style="width: 26px; height: 26px; font-size: 0.75rem; border-color: rgba(255,0,85,0.4); color: var(--penalty-red);" onclick="window.questController.confirmDeleteTask('${act.id}');" title="Eliminar actividad">🗑️</button>
              </div>
            </div>
          `).join('')}

          <button id="add-settings-activity-btn" class="modal-btn" style="margin-top: 6px; background: rgba(0, 229, 255, 0.15); border-color: var(--color-primary); color: var(--color-primary-glow);">
            + AGREGAR NUEVA ACTIVIDAD
          </button>
        </div>
      `;
    }

    if (window.systemNotifications) {
      window.systemNotifications.renderNotificationSettings();
    }
  }

  saveSettings() {
    window.systemState.save();
    window.systemAudio.playClick();
    this.showToast('[SISTEMA]: Parámetros del Sistema actualizados.', 'success');
    window.questController.renderDailyQuest();
  }
}

window.systemUI = new SystemUIController();
