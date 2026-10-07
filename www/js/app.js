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

  // 9. Enhanced System Update Handler (GitHub Remote & PWA Cache Sychronizer)
  const CURRENT_VERSION = '1.0.0';
  const updateAppBtn = document.getElementById('update-system-app-btn');
  if (updateAppBtn) {
    updateAppBtn.addEventListener('click', async () => {
      window.systemAudio.playStatusRecovery();
      window.systemUI.showToast('[SISTEMA]: Conectando con los servidores del Sistema (GitHub)...', 'normal');

      try {
        // Clear caches
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(k => caches.delete(k)));
        }

        // Try fetching remote version.json from GitHub
        const remoteUrl = `https://raw.githubusercontent.com/EdgarGoPr/TrainIA/main/version.json?t=${Date.now()}`;
        const res = await fetch(remoteUrl, { cache: 'no-store' });

        if (res.ok) {
          const remoteData = await res.json();
          const remoteVer = remoteData.version || CURRENT_VERSION;

          if (remoteVer !== CURRENT_VERSION) {
            window.systemAudio.playLevelUp();
            const modal = document.getElementById('generic-system-modal');
            const titleEl = document.getElementById('generic-modal-title');
            const bodyEl = document.getElementById('generic-modal-body');

            if (modal && bodyEl) {
              if (titleEl) titleEl.textContent = `[ ACTUALIZACIÓN DEL SISTEMA DISPONIBLE: v${remoteVer} ]`;
              bodyEl.innerHTML = `
                <div style="padding: 6px 0;">
                  <div style="font-size: 2rem; text-align: center; margin-bottom: 8px;">⚡</div>
                  <h4 style="font-family: var(--font-hud); color: var(--color-primary-glow); margin-bottom: 8px; text-align: center;">
                    NUEVA VERSIÓN DETECTADA (v${remoteVer})
                  </h4>
                  <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
                    Se han publicado nuevas funciones y mejoras para el Sistema de entrenamiento:
                  </p>
                  <div style="background: rgba(0, 229, 255, 0.08); border: 1px solid var(--border-cyan); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 14px; font-size: 0.8rem;">
                    <strong style="color: #fff;">Novedades del Parche:</strong>
                    <ul style="margin-top: 6px; padding-left: 18px; color: var(--text-muted);">
                      ${(remoteData.changelog || ['Mejoras de rendimiento']).map(c => `<li>${c}</li>`).join('')}
                    </ul>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <a href="${remoteData.downloadUrl || 'https://github.com/EdgarGoPr/TrainIA/raw/main/TrainIA.apk'}" download="TrainIA.apk" class="claim-reward-btn" style="text-decoration: none; text-align: center; font-size: 0.88rem; padding: 12px;">
                      📥 DESCARGAR NUEVO APK (v${remoteVer})
                    </a>
                    <button class="modal-btn" onclick="window.location.reload(true);" style="padding: 10px; font-size: 0.8rem;">
                      🔄 REINICIAR Y APLICAR EN PWA
                    </button>
                  </div>
                </div>
              `;
              modal.classList.add('active');
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Remote version check failed:', e);
      }

      // If already on latest version
      window.systemAudio.playQuestComplete();
      window.systemUI.showToast(`[SISTEMA]: Tu versión (v${CURRENT_VERSION}) ya es la más reciente. HUD sincronizado.`, 'success');
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
    });
  }

  // Initial welcome chime
  setTimeout(() => {
    window.systemUI.showToast('[SISTEMA]: Has despertado como Cazador. El Sistema está en línea.', 'normal');
  }, 800);
});
