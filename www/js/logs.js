/**
 * Solo Leveling System - Dungeon Logs, History & Backup Manager
 */

class DungeonLogsController {
  constructor() {}

  init() {
    this.renderLogs();
    this.attachEventListeners();
  }

  attachEventListeners() {
    document.addEventListener('click', (e) => {
      const exportBtn = e.target.closest('#export-backup-btn');
      if (exportBtn) {
        window.systemAudio.playClick();
        window.systemStorage.exportData(window.systemState.state);
        window.systemUI.showToast('[SISTEMA]: Datos de Cazador exportados correctamente.', 'info');
        return;
      }

      const importBtn = e.target.closest('#import-backup-btn');
      if (importBtn) {
        const fileInput = document.getElementById('backup-file-input');
        if (fileInput) fileInput.click();
        return;
      }

      const resetBtn = e.target.closest('#reset-system-btn');
      if (resetBtn) {
        this.confirmReset();
        return;
      }
    });

    const fileInput = document.getElementById('backup-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = window.systemStorage.importData(event.target.result);
          if (result.success) {
            window.systemAudio.playLevelUp();
            window.systemState.init();
            window.systemUI.refreshAll();
            window.systemUI.showToast('[SISTEMA]: Estado restaurado con éxito.', 'success');
          } else {
            alert('Error al importar el archivo: ' + result.error);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  renderLogs() {
    const metricsGrid = document.getElementById('logs-metrics-grid');
    const timelineList = document.getElementById('logs-timeline-list');
    if (!metricsGrid || !timelineList) return;

    const summary = window.systemState.state.statsSummary;
    const p = window.systemState.state.player;
    const history = window.systemState.state.history || {};

    // Render Metrics
    metricsGrid.innerHTML = `
      <div class="metric-box">
        <div class="metric-num">${summary.completedDays || 0}</div>
        <div class="metric-lbl">Misiones Éxito</div>
      </div>
      <div class="metric-box">
        <div class="metric-num">${summary.currentStreak || 0} 🔥</div>
        <div class="metric-lbl">Racha Actual</div>
      </div>
      <div class="metric-box">
        <div class="metric-num">${summary.maxStreak || 0} ⭐</div>
        <div class="metric-lbl">Racha Máxima</div>
      </div>
      <div class="metric-box">
        <div class="metric-num">${summary.totalPushups || 0}</div>
        <div class="metric-lbl">Total Flexiones</div>
      </div>
      <div class="metric-box">
        <div class="metric-num">${summary.totalSquats || 0}</div>
        <div class="metric-lbl">Total Sentadillas</div>
      </div>
      <div class="metric-box">
        <div class="metric-num">${summary.totalSitups || 0}</div>
        <div class="metric-lbl">Total Abdominales</div>
      </div>
      <div class="metric-box">
        <div class="metric-num">${(summary.totalKm || 0).toFixed(1)} km</div>
        <div class="metric-lbl">Distancia Carrera</div>
      </div>
      <div class="metric-box">
        <div class="metric-num">${summary.totalDeepworkMin || 0} m</div>
        <div class="metric-lbl">Tiempo Foco INT</div>
      </div>
      <div class="metric-box">
        <div class="metric-num">${summary.penaltiesCleared || 0} 💀</div>
        <div class="metric-lbl">Castigos Superados</div>
      </div>
    `;

    // Render Timeline entries (sorted descending by date)
    const dateKeys = Object.keys(history).sort().reverse();
    if (dateKeys.length === 0) {
      timelineList.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">
          No hay registros de mazmorras pasadas. ¡Tu leyenda comienza hoy!
        </div>
      `;
      return;
    }

    let html = '';
    dateKeys.forEach(dateStr => {
      const entry = history[dateStr];
      const isOk = entry.status === 'COMPLETED';
      html += `
        <div class="log-entry-row ${isOk ? 'completed' : 'failed'}">
          <div>
            <div style="font-family: var(--font-hud); font-weight:700; color:#fff;">
              ${dateStr} ${isOk ? '⚔️ VICTORIA' : '💀 FALLIDO'}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">
              Flexiones: ${entry.pushups || 0} | Sentadillas: ${entry.squats || 0} | Abs: ${entry.situps || 0} | ${entry.running || 0} km
            </div>
          </div>
          <div style="text-align: right; font-family: var(--font-mono); font-size: 0.75rem;">
            <span style="color: ${isOk ? 'var(--hp-color)' : 'var(--penalty-red)'}">
              ${isOk ? '+EXP CLAIMED' : 'ZONA CASTIGO'}
            </span>
          </div>
        </div>
      `;
    });

    timelineList.innerHTML = html;
  }

  confirmReset() {
    const confirmation = confirm('⚠️ ADVERTENCIA CRÍTICA DEL SISTEMA ⚠️\n\n¿Estás seguro de que deseas reiniciar todo el progreso del Cazador? Esta acción no se puede deshacer.');
    if (confirmation) {
      window.systemStorage.clear();
      window.location.reload();
    }
  }
}

window.logsController = new DungeonLogsController();
