/**
 * Solo Leveling System - Quests & Penalty Zone Logic
 */

class QuestController {
  constructor() {
    this.penaltyInterval = null;
  }

  init() {
    this.renderDailyQuest();
    this.renderPenaltyZone();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Quick increment buttons on daily quest
    document.addEventListener('click', (e) => {
      const incBtn = e.target.closest('[data-action="inc-task"]');
      if (incBtn) {
        const taskId = incBtn.dataset.taskId;
        const amount = parseFloat(incBtn.dataset.amount);
        this.incrementTask(taskId, amount);
        return;
      }

      const decBtn = e.target.closest('[data-action="dec-task"]');
      if (decBtn) {
        const taskId = decBtn.dataset.taskId;
        const amount = parseFloat(decBtn.dataset.amount);
        this.incrementTask(taskId, -amount);
        return;
      }

      const editBtn = e.target.closest('[data-action="edit-task"]');
      if (editBtn) {
        const taskId = editBtn.dataset.taskId;
        this.promptDirectInput(taskId);
        return;
      }

      const claimBtn = e.target.closest('#claim-quest-btn');
      if (claimBtn) {
        this.claimReward();
        return;
      }

      const startPenaltyBtn = e.target.closest('#start-penalty-timer-btn');
      if (startPenaltyBtn) {
        this.togglePenaltyTimer();
        return;
      }

      const clearPenaltyBtn = e.target.closest('#clear-penalty-btn');
      if (clearPenaltyBtn) {
        this.completePenaltyQuest();
        return;
      }
    });
  }

  incrementTask(taskId, amount) {
    window.systemAudio.playClick();
    window.systemState.updateTaskProgress(taskId, amount);
    this.renderDailyQuest();
    window.systemUI.updateHeader();
    window.systemUI.updateStatusScreen();

    // Check if that just made the quest ready
    if (window.systemState.isDailyQuestReadyToClaim()) {
      window.systemAudio.playNotification();
      window.systemUI.showToast('[NOTIFICACIÓN] ¡Todos los objetivos completados! Recompensa disponible.', 'success');
    }
  }

  promptDirectInput(taskId) {
    const task = window.systemState.state.quest.tasks[taskId];
    if (!task) return;

    const val = prompt(`Ingresa el progreso actual para ${task.name} (${task.unit}):`, task.current);
    if (val !== null) {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0) {
        window.systemAudio.playClick();
        window.systemState.updateTaskProgress(taskId, parsed, true);
        this.renderDailyQuest();
        window.systemUI.updateHeader();
        window.systemUI.updateStatusScreen();
      }
    }
  }

  renderDailyQuest() {
    const container = document.getElementById('daily-quest-tasks-container');
    const bannerContainer = document.getElementById('daily-quest-banner-container');
    const claimContainer = document.getElementById('claim-quest-container');
    if (!container) return;

    const quest = window.systemState.state.quest;
    const isCompleted = quest.status === 'COMPLETED';
    const isReady = window.systemState.isDailyQuestReadyToClaim();

    // Render Banner
    let totalTargetUnits = 0;
    let totalCurrentUnits = 0;

    Object.values(quest.tasks).forEach(t => {
      totalTargetUnits += t.target;
      totalCurrentUnits += Math.min(t.current, t.target);
    });

    const overallPct = Math.min(100, Math.round((totalCurrentUnits / (totalTargetUnits || 1)) * 100));

    if (bannerContainer) {
      bannerContainer.innerHTML = `
        <div class="quest-banner-hero">
          <span class="quest-status-tag ${isCompleted ? 'completed' : 'in-progress'}">
            ${isCompleted ? 'MISIÓN COMPLETADA' : 'MISIÓN EN CURSO'}
          </span>
          <h2 class="quest-main-title">Misión Diaria: Preparación para ser fuerte</h2>
          <p class="quest-subtext">El Sistema exige templanza y disciplina física constante para superar los límites.</p>
          <div class="quest-overall-progress">
            <div class="quest-progress-header">
              <span>Progreso Total del Día</span>
              <span><strong>${overallPct}%</strong></span>
            </div>
            <div class="bar-track">
              <div class="bar-fill hp-fill" style="width: ${overallPct}%;"></div>
            </div>
          </div>
        </div>
      `;
    }

    // Render Tasks Cards
    let html = '';
    const taskList = [
      { id: 'pushups', name: '100 Flexiones de brazos', sub: 'Push-ups', category: 'Fuerza (STR)', incs: [1, 5, 10, 25] },
      { id: 'squats', name: '100 Sentadillas', sub: 'Squats', category: 'Piernas (STR/AGI)', incs: [1, 5, 10, 25] },
      { id: 'situps', name: '100 Abdominales', sub: 'Sit-ups / Core', category: 'Vitalidad (VIT)', incs: [1, 5, 10, 25] },
      { id: 'running', name: '10.0 km Carrera o Caminata activa', sub: 'Cardio', category: 'Agilidad (AGI)', incs: [0.5, 1.0, 2.5, 5.0] },
      { id: 'deepwork', name: '60 min Trabajo Profundo / Lectura', sub: 'Mente', category: 'Inteligencia (INT)', incs: [5, 15, 25, 30] }
    ];

    taskList.forEach(meta => {
      const task = quest.tasks[meta.id];
      if (!task) return;

      const isDone = task.current >= task.target;
      const pct = Math.min(100, Math.round((task.current / task.target) * 100));

      html += `
        <div class="task-card ${isDone ? 'task-complete' : ''}">
          <div class="task-card-header">
            <div class="task-title-group">
              <div class="task-checkbox">${isDone ? '✓' : ''}</div>
              <div>
                <div class="task-name">${task.name}</div>
                <span class="task-category-tag">${meta.category}</span>
              </div>
            </div>
            <button class="direct-input-btn" data-action="edit-task" data-task-id="${meta.id}" title="Ingresar valor">
              ✏️ Editar
            </button>
          </div>

          <div class="task-progress-nums">
            <span>Progreso: <span class="task-current-val">${task.current}</span> <small>${task.unit}</small></span>
            <span class="task-target-val">Objetivo: ${task.target} ${task.unit} (${pct}%)</span>
          </div>

          <div class="bar-track" style="margin-bottom: 8px;">
            <div class="bar-fill ${isDone ? 'hp-fill' : 'mp-fill'}" style="width: ${pct}%;"></div>
          </div>

          ${!isCompleted ? `
            <div class="task-btn-grid">
              ${meta.incs.map(amt => `
                <button class="quick-inc-btn" data-action="inc-task" data-task-id="${meta.id}" data-amount="${amt}">
                  +${amt}
                </button>
              `).join('')}
              <button class="quick-dec-btn" data-action="dec-task" data-task-id="${meta.id}" data-amount="${meta.incs[0]}" title="Restar">
                -
              </button>
            </div>
          ` : `
            <div style="font-size:0.75rem; color: var(--hp-color); font-family: var(--font-mono); margin-top:6px;">
              [OBJETIVO SELLADO POR EL SISTEMA]
            </div>
          `}
        </div>
      `;
    });

    container.innerHTML = html;

    // Render Claim Button
    if (claimContainer) {
      if (isCompleted) {
        claimContainer.innerHTML = `
          <button class="claim-reward-btn" disabled style="background: rgba(0, 255, 136, 0.15); border-color: var(--hp-color); color: var(--hp-color); box-shadow:none;">
            ✓ RECOMPENSA RECLAMADA HOY
          </button>
        `;
      } else {
        claimContainer.innerHTML = `
          <button id="claim-quest-btn" class="claim-reward-btn" ${!isReady ? 'disabled' : ''}>
            ${isReady ? '⚡ RECLAMAR RECOMPENSA DEL SISTEMA ⚡' : `🔒 OBJETIVOS PENDIENTES (${overallPct}%)`}
          </button>
        `;
      }
    }
  }

  claimReward() {
    const result = window.systemState.claimDailyQuestReward();
    if (!result) return;

    // Trigger full recovery wash effect
    window.systemAudio.playStatusRecovery();
    window.systemUI.triggerStatusRecoveryEffect();

    // If level up occurred
    if (result.levelUpResult && result.levelUpResult.didLevelUp) {
      setTimeout(() => {
        window.systemAudio.playLevelUp();
        window.systemUI.showLevelUpModal(result.levelUpResult);
      }, 1000);
    } else {
      window.systemAudio.playQuestComplete();
    }

    // Show Reward Popup
    window.systemUI.showRewardModal({
      expGained: result.expGained,
      statPoints: result.statPointsGained,
      lootBoxes: result.lootBoxesGained
    });

    this.renderDailyQuest();
    window.systemUI.updateHeader();
    window.systemUI.updateStatusScreen();
    window.systemUI.updateInventoryScreen();
    window.systemUI.updateLogsScreen();
  }

  /* ==========================================================================
     PENALTY ZONE LOGIC
     ========================================================================== */
  renderPenaltyZone() {
    const penaltyCard = document.getElementById('penalty-zone-banner');
    if (!penaltyCard) return;

    const penalty = window.systemState.state.penalty;
    if (!penalty.isActive) {
      penaltyCard.style.display = 'none';
      document.body.classList.remove('theme-penalty');
      return;
    }

    // Activate crimson penalty theme
    penaltyCard.style.display = 'block';
    document.body.classList.add('theme-penalty');

    const totalSecs = penalty.targetSeconds;
    const remSecs = Math.max(0, totalSecs - penalty.elapsedSeconds);
    const mins = String(Math.floor(remSecs / 60)).padStart(2, '0');
    const secs = String(remSecs % 60).padStart(2, '0');

    penaltyCard.innerHTML = `
      <div class="penalty-zone-card">
        <h3 class="penalty-header-title">⚠️ ZONA DE CASTIGO ACTIVADA ⚠️</h3>
        <div class="penalty-desc-box">
          <strong>[ADVERTENCIA DEL SISTEMA]:</strong> No completaste la Misión Diaria anterior a tiempo. Has sido transportado a la Zona de Castigo. La Misión Diaria normal está bloqueada hasta que sobrevivas a la penalización.
        </div>
        <div class="penalty-timer-display">
          <div class="penalty-digits">${mins}:${secs}</div>
          <div class="penalty-timer-label">TIEMPO DE SUPERVIVENCIA RESTANTE</div>
        </div>
        <div class="penalty-actions-grid">
          <button id="start-penalty-timer-btn" class="penalty-btn penalty-btn-primary">
            ${penalty.isRunning ? '⏸️ PAUSAR TIMER' : '▶️ INICIAR SUPERVIVENCIA'}
          </button>
          <button id="clear-penalty-btn" class="penalty-btn penalty-btn-secondary">
            ⚡ PURIFICAR CASTIGO
          </button>
        </div>
      </div>
    `;
  }

  togglePenaltyTimer() {
    const penalty = window.systemState.state.penalty;
    window.systemAudio.playClick();

    if (penalty.isRunning) {
      penalty.isRunning = false;
      if (this.penaltyInterval) clearInterval(this.penaltyInterval);
    } else {
      penalty.isRunning = true;
      window.systemAudio.playPenaltyAlarm();
      this.penaltyInterval = setInterval(() => {
        penalty.elapsedSeconds++;
        if (penalty.elapsedSeconds >= penalty.targetSeconds) {
          clearInterval(this.penaltyInterval);
          this.completePenaltyQuest();
        } else {
          this.renderPenaltyZone();
        }
      }, 1000);
    }
    window.systemState.save();
    this.renderPenaltyZone();
  }

  completePenaltyQuest() {
    if (this.penaltyInterval) clearInterval(this.penaltyInterval);
    window.systemAudio.playStatusRecovery();
    window.systemState.clearPenalty();
    window.systemUI.showToast('[SISTEMA]: Has sobrevivido a la Zona de Castigo. Misión diaria restablecida.', 'success');
    this.renderPenaltyZone();
    this.renderDailyQuest();
    window.systemUI.updateHeader();
    window.systemUI.updateStatusScreen();
    window.systemUI.updateLogsScreen();
  }
}

window.questController = new QuestController();
