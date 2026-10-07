/**
 * Solo Leveling System - Main Application Orchestrator
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State & Storage
  window.systemState.init();

  // 2. Initialize Controllers
  window.questController.init();
  window.lootController.init();
  window.logsController.init();
  window.systemUI.init();
  if (window.systemNotifications) {
    window.systemNotifications.init();
  }

  // 3. User Audio Unlock on First Tap/Click
  const unlockAudio = () => {
    window.systemAudio.ensureContext();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });

  // 4. Real-time 1-Second Ticker (Countdown & Midnight Transition Check)
  setInterval(() => {
    window.systemUI.updateCountdown();
    window.systemState.checkDateTransition();
  }, 1000);

  // 5. Setup Level Up Close Button
  const closeLevelUpBtn = document.getElementById('close-level-up-btn');
  if (closeLevelUpBtn) {
    closeLevelUpBtn.addEventListener('click', () => {
      window.systemAudio.playClick();
      window.systemUI.hideLevelUpModal();
    });
  }

  // 6. Setup Settings Save Button
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      window.systemUI.saveSettings();
    });
  }

  // 7. Setup Test Penalty Button (Useful for instant testing of penalty mode!)
  const testPenaltyBtn = document.getElementById('test-penalty-btn');
  if (testPenaltyBtn) {
    testPenaltyBtn.addEventListener('click', () => {
      const today = window.systemState.getTodayDateString();
      window.systemState.triggerPenaltyZone(today);
      window.systemAudio.playPenaltyAlarm();
      window.questController.renderPenaltyZone();
      window.systemUI.showToast('[ALERTA]: Zona de Castigo activada manualmente para pruebas.', 'warning');
      window.systemUI.switchTab('tab-daily-quest');
    });
  }

  // 8. PWA Install Prompt Capture
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBanner = document.getElementById('pwa-install-banner');
    if (installBanner) installBanner.style.display = 'block';
  });

  const installAppBtn = document.getElementById('install-pwa-btn');
  if (installAppBtn) {
    installAppBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          window.systemUI.showToast('[SISTEMA]: Aplicación instalada en el dispositivo.', 'success');
        }
        deferredPrompt = null;
        const installBanner = document.getElementById('pwa-install-banner');
        if (installBanner) installBanner.style.display = 'none';
      }
    });
  }

  // 9. Enhanced System Update Handler (GitHub Remote & PWA Cache Synchronizer)
  const CURRENT_VERSION = '1.1.2';
  const updateAppBtn = document.getElementById('update-system-app-btn');
  if (updateAppBtn) {
    updateAppBtn.addEventListener('click', async () => {
      window.systemAudio.playStatusRecovery();
      window.systemUI.showToast('[SISTEMA]: Conectando con los servidores del Sistema (GitHub)...', 'normal');

      let remoteData = null;
      let remoteVer = CURRENT_VERSION;

      try {
        // Clear caches and refresh service worker
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(k => caches.delete(k)));
        }

        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (let reg of regs) {
            await reg.update();
          }
        }

        // Fetch remote version.json from GitHub
        const remoteUrl = `https://raw.githubusercontent.com/EdgarGoPr/TrainIA/main/version.json?t=${Date.now()}`;
        const res = await fetch(remoteUrl, { cache: 'no-store' });

        if (res.ok) {
          remoteData = await res.json();
          remoteVer = remoteData.version || CURRENT_VERSION;
        }
      } catch (e) {
        console.warn('Remote version check notice:', e);
      }

      window.systemAudio.playLevelUp();
      const modal = document.getElementById('generic-system-modal');
      const titleEl = document.getElementById('generic-modal-title');
      const bodyEl = document.getElementById('generic-modal-body');

      if (modal && bodyEl) {
        const isUpToDate = remoteVer === CURRENT_VERSION;
        if (titleEl) titleEl.textContent = `[ ESTADO DE ACTUALIZACIÓN DEL SISTEMA ]`;

        const changelogList = remoteData?.changelog || [
          'Versión oficial v1.1.2 de TrainIA',
          'Gestión de actividades en lote en Ajustes (Activar, Desactivar o Borrar)',
          'Misión Diaria protegida contra borrado accidental de ejercicios',
          'Sincronización forzada y descarga directa de APK v1.1.2'
        ];

        bodyEl.innerHTML = `
          <div style="padding: 6px 0;">
            <div style="font-size: 2.5rem; text-align: center; margin-bottom: 8px;">⚡</div>
            <h3 style="font-family: var(--font-hud); color: var(--color-primary-glow); margin-bottom: 6px; text-align: center; font-size: 1.05rem;">
              ${isUpToDate ? `SISTEMA SINCRONIZADO (v${CURRENT_VERSION})` : `¡NUEVA VERSIÓN DETECTADA! (v${remoteVer})`}
            </h3>
            <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 12px; font-family: var(--font-mono); font-size: 0.75rem;">
              <span style="background: rgba(0,229,255,0.1); border: 1px solid var(--border-cyan); padding: 2px 8px; border-radius: 4px; color: #fff;">
                Local: v${CURRENT_VERSION}
              </span>
              <span style="background: rgba(0,255,136,0.1); border: 1px solid #00ff88; padding: 2px 8px; border-radius: 4px; color: #00ff88;">
                GitHub: v${remoteVer}
              </span>
            </div>

            <div style="background: rgba(0, 229, 255, 0.08); border: 1px solid var(--border-cyan); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 14px; font-size: 0.8rem;">
              <strong style="color: #fff; font-family: var(--font-hud);">◈ Novedades y Mejoras del Sistema:</strong>
              <ul style="margin-top: 6px; padding-left: 18px; color: var(--text-muted); line-height: 1.4;">
                ${changelogList.map(c => `<li>${c}</li>`).join('')}
              </ul>
            </div>

            <p style="font-size: 0.78rem; color: #fff; margin-bottom: 12px; text-align: center;">
              ¿Cómo deseas aplicar la actualización en tu dispositivo?
            </p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <a href="https://github.com/EdgarGoPr/TrainIA/raw/main/TrainIA.apk?v=1.1.2" download="TrainIA.apk" class="claim-reward-btn" style="text-decoration: none; text-align: center; font-size: 0.88rem; padding: 12px; background: linear-gradient(135deg, #00e5ff, #00b4d8); color: #05070d; box-shadow: var(--glow-cyan);">
                📥 DESCARGAR / INSTALAR APK v${remoteVer} (ANDROID)
              </a>
              <button class="modal-btn" onclick="if('caches' in window){caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>{window.location.reload(true);})}else{window.location.reload(true);}" style="padding: 10px; font-size: 0.8rem; background: rgba(0, 229, 255, 0.15); border-color: var(--border-cyan); color: #fff;">
                🔄 LIMPIAR CACHÉ Y RECARGAR PWA
              </button>
            </div>
          </div>
        `;
        modal.classList.add('active');
      }
    });
  }

  // Initial welcome chime
  setTimeout(() => {
    window.systemUI.showToast('[SISTEMA]: Has despertado como Cazador. El Sistema está en línea.', 'normal');
  }, 800);
});
