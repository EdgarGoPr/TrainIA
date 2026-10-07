/**
 * Solo Leveling System - Tactical Rest Timer & Series Recovery Engine
 */

class SystemRestTimer {
  constructor() {
    this.totalSeconds = 60;
    this.remainingSeconds = 60;
    this.timerInterval = null;
    this.isRunning = false;
    this.isPaused = false;
    this.currentLabel = 'Recuperación de Serie';
    this.domPill = null;
    this.domModal = null;
  }

  init() {
    this.createFloatingPill();
  }

  createFloatingPill() {
    // Remove existing pill if any
    const existing = document.getElementById('system-rest-timer-pill');
    if (existing) existing.remove();

    const pill = document.createElement('div');
    pill.id = 'system-rest-timer-pill';
    pill.className = 'rest-timer-floating-pill';
    pill.style.display = 'none';
    pill.innerHTML = `
      <div class="pill-inner" onclick="window.systemTimer.openModal()">
        <span class="pill-icon">⏱️</span>
        <div class="pill-text-group">
          <span class="pill-label">RECUPERACIÓN</span>
          <span class="pill-time" id="pill-countdown-display">01:00</span>
        </div>
        <button class="pill-action-btn" onclick="event.stopPropagation(); window.systemTimer.togglePlayPause();" id="pill-play-pause-btn" title="Pausar / Reanudar">
          ⏸️
        </button>
        <button class="pill-close-btn" onclick="event.stopPropagation(); window.systemTimer.stop();" title="Cerrar temporizador">
          ✕
        </button>
      </div>
    `;
    document.body.appendChild(pill);
    this.domPill = pill;
  }

  start(seconds = 60, label = 'Recuperación de Serie') {
    this.stop();
    this.totalSeconds = Math.max(5, seconds);
    this.remainingSeconds = this.totalSeconds;
    this.currentLabel = label;
    this.isRunning = true;
    this.isPaused = false;

    if (this.domPill) {
      this.domPill.style.display = 'block';
      this.domPill.classList.add('active');
    }

    window.systemAudio.playClick();
    window.systemUI.showToast(`[SISTEMA]: Temporizador de descanso iniciado (${this.formatTime(this.remainingSeconds)}).`, 'normal');

    this.updateDisplays();

    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.remainingSeconds--;
        this.updateDisplays();

        if (this.remainingSeconds <= 0) {
          this.complete();
        }
      }
    }, 1000);
  }

  togglePlayPause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    window.systemAudio.playClick();
    const btn = document.getElementById('pill-play-pause-btn');
    if (btn) btn.textContent = this.isPaused ? '▶️' : '⏸️';

    const modalBtn = document.getElementById('modal-timer-play-pause-btn');
    if (modalBtn) modalBtn.textContent = this.isPaused ? '▶️ REANUDAR' : '⏸️ PAUSAR';
  }

  addTime(seconds = 15) {
    if (!this.isRunning) return;
    this.remainingSeconds += seconds;
    this.totalSeconds += seconds;
    window.systemAudio.playClick();
    this.updateDisplays();
  }

  subtractTime(seconds = 15) {
    if (!this.isRunning) return;
    this.remainingSeconds = Math.max(5, this.remainingSeconds - seconds);
    window.systemAudio.playClick();
    this.updateDisplays();
  }

  stop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
    this.isPaused = false;

    if (this.domPill) {
      this.domPill.style.display = 'none';
      this.domPill.classList.remove('active');
    }

    const modal = document.getElementById('generic-system-modal');
    if (modal && modal.dataset.activeType === 'rest-timer') {
      modal.classList.remove('active');
    }
  }

  complete() {
    this.stop();
    window.systemAudio.playStatusRecovery();

    // Haptic vibration
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch (e) {}
    }

    window.systemUI.showToast('[SISTEMA]: ⚡ ¡Tiempo de recuperación completado! Comienza la siguiente serie.', 'quest');

    // Visual chime modal alert
    const modal = document.getElementById('generic-system-modal');
    const titleEl = document.getElementById('generic-modal-title');
    const bodyEl = document.getElementById('generic-modal-body');
    if (modal && bodyEl) {
      modal.dataset.activeType = 'rest-timer-done';
      if (titleEl) titleEl.textContent = '[ DESCANSO FINALIZADO ]';
      bodyEl.innerHTML = `
        <div style="text-align: center; padding: 12px 0;">
          <div style="font-size: 3rem; margin-bottom: 8px; animation: pulse 1s infinite;">⚡</div>
          <h3 style="font-family: var(--font-hud); color: var(--color-primary-glow); margin-bottom: 6px; font-size: 1.1rem;">
            ¡RECUPERACIÓN COMPLETA!
          </h3>
          <p style="font-size: 0.85rem; color: #fff; margin-bottom: 16px;">
            El tiempo de descanso ha concluido. El Sistema exige máxima intensidad en tu siguiente serie.
          </p>
          <button class="claim-reward-btn" onclick="document.getElementById('generic-system-modal').classList.remove('active');" style="padding: 12px; font-size: 0.9rem;">
            ⚔️ CONTINUAR ENTRENAMIENTO
          </button>
        </div>
      `;
      modal.classList.add('active');
    }
  }

  updateDisplays() {
    const formatted = this.formatTime(this.remainingSeconds);
    const pillText = document.getElementById('pill-countdown-display');
    if (pillText) pillText.textContent = formatted;

    const modalText = document.getElementById('modal-timer-countdown');
    if (modalText) modalText.textContent = formatted;

    const pct = Math.max(0, Math.min(100, Math.round((this.remainingSeconds / (this.totalSeconds || 1)) * 100)));
    const modalBar = document.getElementById('modal-timer-progress-bar');
    if (modalBar) modalBar.style.width = `${pct}%`;
  }

  formatTime(totalSec) {
    const s = Math.max(0, totalSec);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  openModal() {
    window.systemAudio.playClick();
    const modal = document.getElementById('generic-system-modal');
    const titleEl = document.getElementById('generic-modal-title');
    const bodyEl = document.getElementById('generic-modal-body');
    if (!modal || !bodyEl) return;

    modal.dataset.activeType = 'rest-timer';
    if (titleEl) titleEl.textContent = '[ CRONÓMETRO DE DESCANSO TÁCTICO ]';

    const formatted = this.formatTime(this.remainingSeconds);
    const pct = Math.max(0, Math.min(100, Math.round((this.remainingSeconds / (this.totalSeconds || 1)) * 100)));

    bodyEl.innerHTML = `
      <div style="text-align: center; padding: 6px 0;">
        <div style="font-family: var(--font-hud); font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
          ${this.currentLabel}
        </div>

        <div id="modal-timer-countdown" style="font-family: var(--font-mono); font-size: 3.2rem; font-weight: 900; color: var(--color-primary-glow); text-shadow: var(--glow-cyan); margin-bottom: 10px;">
          ${formatted}
        </div>

        <div class="bar-track" style="height: 10px; margin-bottom: 16px; border-radius: 5px; background: rgba(0,0,0,0.6);">
          <div id="modal-timer-progress-bar" class="bar-fill hp-fill" style="width: ${pct}%; transition: width 0.3s ease;"></div>
        </div>

        <!-- Adjustment Controls -->
        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 14px;">
          <button class="modal-btn" onclick="window.systemTimer.subtractTime(15)" style="padding: 6px 12px; font-size: 0.8rem;">-15s</button>
          <button id="modal-timer-play-pause-btn" class="modal-btn" onclick="window.systemTimer.togglePlayPause()" style="padding: 6px 16px; font-size: 0.85rem; border-color: var(--color-primary); color: #fff;">
            ${this.isPaused ? '▶️ REANUDAR' : '⏸️ PAUSAR'}
          </button>
          <button class="modal-btn" onclick="window.systemTimer.addTime(15)" style="padding: 6px 12px; font-size: 0.8rem;">+15s</button>
        </div>

        <!-- Presets -->
        <div style="background: rgba(0, 229, 255, 0.06); border: 1px solid var(--border-cyan); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 12px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px; font-family: var(--font-hud);">
            ◈ PRESETS DE RECUPERACIÓN RÁPIDA:
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
            <button class="quick-inc-btn" onclick="window.systemTimer.start(30)" style="font-size: 0.82rem; padding: 8px;">30s</button>
            <button class="quick-inc-btn" onclick="window.systemTimer.start(60)" style="font-size: 0.82rem; padding: 8px;">60s</button>
            <button class="quick-inc-btn" onclick="window.systemTimer.start(90)" style="font-size: 0.82rem; padding: 8px;">90s</button>
            <button class="quick-inc-btn" onclick="window.systemTimer.start(120)" style="font-size: 0.82rem; padding: 8px;">120s</button>
          </div>
        </div>

        <button class="modal-btn" onclick="window.systemTimer.stop(); document.getElementById('generic-system-modal').classList.remove('active');" style="width: 100%; padding: 10px; font-size: 0.82rem; background: rgba(255, 0, 85, 0.15); border-color: rgba(255, 0, 85, 0.4); color: #ff0055;">
          🛑 DETENER TEMPORIZADOR
        </button>
      </div>
    `;

    modal.classList.add('active');
  }
}

window.systemTimer = new SystemRestTimer();
