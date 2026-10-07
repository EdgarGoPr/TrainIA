/**
 * Solo Leveling System - Quests & Dynamic Activities Logic
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

      const deleteBtn = e.target.closest('[data-action="delete-task"]');
      if (deleteBtn) {
        const taskId = deleteBtn.dataset.taskId;
        this.confirmDeleteTask(taskId);
        return;
      }

      const addActivityBtn = e.target.closest('#add-quest-activity-btn') || e.target.closest('#add-settings-activity-btn');
      if (addActivityBtn) {
        this.showAddActivityModal();
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

  confirmDeleteTask(taskId) {
    const task = window.systemState.state.quest.tasks[taskId];
    if (!task) return;

    const confirmation = confirm(`¿Deseas eliminar "${task.name}" de tus objetivos del Sistema?`);
    if (confirmation) {
      window.systemAudio.playClick();
      window.systemState.removeActivity(taskId);
      window.systemUI.showToast(`[SISTEMA]: Actividad "${task.name}" eliminada de los objetivos.`, 'normal');
      this.renderDailyQuest();
      window.systemUI.renderSettingsScreen();
    }
  }

  showAddActivityModal() {
    const modal = document.getElementById('generic-system-modal');
    const titleEl = document.getElementById('generic-modal-title');
    const bodyEl = document.getElementById('generic-modal-body');
    if (!modal || !bodyEl) return;

    window.systemAudio.playClick();
    if (titleEl) titleEl.textContent = '[ REGISTRAR NUEVA ACTIVIDAD EN EL SISTEMA ]';

    bodyEl.innerHTML = `
      <form id="new-activity-form" onsubmit="event.preventDefault(); window.questController.saveNewActivity();" style="display: flex; flex-direction: column; gap: 10px;">
        <div>
          <label style="font-size: 0.8rem; color: var(--text-muted);">Nombre del Ejercicio / Actividad:</label>
          <input type="text" id="act-name-input" required placeholder="ej: Dominadas (Pull-ups), Saltar cuerda, Meditación" style="width: 100%; padding: 8px 10px; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; border-radius: 4px; font-family: var(--font-body); font-size: 0.9rem; margin-top: 4px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 0.8rem; color: var(--text-muted);">Meta Objetivo:</label>
            <input type="number" step="any" id="act-target-input" required value="50" style="width: 100%; padding: 8px 10px; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; border-radius: 4px; font-family: var(--font-mono); font-size: 0.9rem; margin-top: 4px;">
          </div>
          <div>
            <label style="font-size: 0.8rem; color: var(--text-muted);">Unidad:</label>
            <select id="act-unit-select" style="width: 100%; padding: 8px 10px; background: rgba(0,0,0,0.8); border: 1px solid var(--border-cyan); color: #fff; border-radius: 4px; font-family: var(--font-mono); font-size: 0.88rem; margin-top: 4px;">
              <option value="reps">reps (repeticiones)</option>
              <option value="km">km (kilómetros)</option>
              <option value="min">min (minutos)</option>
              <option value="series">series</option>
              <option value="litros">litros</option>
              <option value="páginas">páginas</option>
            </select>
          </div>
        </div>

        <div>
          <label style="font-size: 0.8rem; color: var(--text-muted);">Atributo Vinculado:</label>
          <select id="act-stat-select" style="width: 100%; padding: 8px 10px; background: rgba(0,0,0,0.8); border: 1px solid var(--border-cyan); color: #fff; border-radius: 4px; font-family: var(--font-hud); font-size: 0.85rem; margin-top: 4px;">
            <option value="str">⚔️ FUERZA (STR)</option>
            <option value="agi">⚡ AGILIDAD (AGI)</option>
            <option value="vit">🛡️ VITALIDAD (VIT)</option>
            <option value="int">🧠 INTELIGENCIA / FOCO (INT)</option>
            <option value="per">👁️ PERCEPCIÓN (PER)</option>
          </select>
        </div>

        <button type="submit" class="claim-reward-btn" style="margin-top: 10px; padding: 12px; font-size: 0.9rem;">
          ⚡ INSCRIBIR ACTIVIDAD EN EL SISTEMA
        </button>
      </form>
    `;

    modal.classList.add('active');
  }

  saveNewActivity() {
    const name = document.getElementById('act-name-input')?.value;
    const target = parseFloat(document.getElementById('act-target-input')?.value);
    const unit = document.getElementById('act-unit-select')?.value || 'reps';
    const stat = document.getElementById('act-stat-select')?.value || 'str';

    if (!name || isNaN(target) || target <= 0) return;

    const statLabels = {
      str: 'Fuerza (STR)',
      agi: 'Agilidad (AGI)',
      vit: 'Vitalidad (VIT)',
      int: 'Inteligencia (INT)',
      per: 'Percepción (PER)'
    };

    let incs = [1, 5, 10, 25];
    if (unit === 'km') incs = [0.5, 1.0, 2.5, 5.0];
    if (unit === 'min') incs = [5, 15, 25, 30];

    window.systemState.addNewActivity({
      name: name.trim(),
      target: target,
      unit: unit,
      stat: stat,
      category: statLabels[stat] || 'Entrenamiento',
      incs: incs
    });

    window.systemAudio.playQuestComplete();
    window.systemUI.showToast(`[SISTEMA]: Nueva actividad "${name.trim()}" agregada a la misión.`, 'success');

    const modal = document.getElementById('generic-system-modal');
    if (modal) modal.classList.remove('active');

    this.renderDailyQuest();
    window.systemUI.renderSettingsScreen();
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

    const taskList = Object.values(quest.tasks || {});

    taskList.forEach(t => {
      totalTargetUnits += t.target;
      totalCurrentUnits += Math.min(t.current, t.target);
    });

    const overallPct = taskList.length > 0 ? Math.min(100, Math.round((totalCurrentUnits / (totalTargetUnits || 1)) * 100)) : 0;

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
    if (taskList.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 24px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-cyan);">
          <div style="font-size: 2rem; margin-bottom: 8px;">⚔️</div>
          <div style="font-family: var(--font-hud); color: #fff; margin-bottom: 6px;">Sin actividades registradas</div>
          <p style="font-size: 0.8rem; margin-bottom: 12px;">Agrega nuevos ejercicios y hábitos a tu misión diaria.</p>
          <button id="add-quest-activity-btn" class="modal-btn" style="margin: 0 auto; max-width: 220px;">
            + AGREGAR ACTIVIDAD
          </button>
        </div>
      `;
    } else {
      let html = '';
      taskList.forEach(task => {
        const isDone = task.current >= task.target;
        const pct = Math.min(100, Math.round((task.current / task.target) * 100));
        const incs = task.incs || [1, 5, 10, 25];

        html += `
          <div class="task-card ${isDone ? 'task-complete' : ''}">
            <div class="task-card-header">
              <div class="task-title-group">
                <div class="task-checkbox">${isDone ? '✓' : ''}</div>
                <div>
                  <div class="task-name">${task.name}</div>
                  <span class="task-category-tag">${task.category || 'Entrenamiento'}</span>
                </div>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="direct-input-btn" data-action="edit-task" data-task-id="${task.id}" title="Ingresar valor">
                  ✏️
                </button>
              </div>
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
                ${incs.map(amt => `
                  <button class="quick-inc-btn" data-action="inc-task" data-task-id="${task.id}" data-amount="${amt}">
                    +${amt}
                  </button>
                `).join('')}
                <button class="quick-dec-btn" data-action="dec-task" data-task-id="${task.id}" data-amount="${incs[0]}" title="Restar">
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

      // Add "Nueva Actividad" button at bottom of list
      if (!isCompleted) {
        html += `
          <button id="add-quest-activity-btn" class="modal-btn" style="width: 100%; margin-top: 6px; margin-bottom: 12px; background: rgba(0, 229, 255, 0.08); border: 1px dashed var(--border-cyan); color: var(--color-primary-glow); padding: 12px; font-family: var(--font-hud); font-size: 0.85rem;">
            + AGREGAR NUEVA ACTIVIDAD / OBJETIVO
          </button>
        `;
      }

      container.innerHTML = html;
    }

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

    window.systemAudio.playStatusRecovery();
    window.systemUI.triggerStatusRecoveryEffect();

    if (result.levelUpResult && result.levelUpResult.didLevelUp) {
      setTimeout(() => {
        window.systemAudio.playLevelUp();
        window.systemUI.showLevelUpModal(result.levelUpResult);
      }, 1000);
    } else {
      window.systemAudio.playQuestComplete();
    }

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
