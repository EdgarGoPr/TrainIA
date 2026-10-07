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

  // 9. Update App Button Handler
  const updateAppBtn = document.getElementById('update-system-app-btn');
  if (updateAppBtn) {
    updateAppBtn.addEventListener('click', async () => {
      window.systemAudio.playStatusRecovery();
      window.systemUI.showToast('[SISTEMA]: Verificando y sincronizando última versión...', 'normal');

      try {
        // Clear all Service Worker caches to force latest version download
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(k => caches.delete(k)));
        }

        // Update service worker
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update();
          }
        }

        setTimeout(() => {
          window.systemAudio.playLevelUp();
          window.systemUI.showToast('[SISTEMA]: Actualización completada con éxito. Reiniciando HUD...', 'success');
          setTimeout(() => {
            window.location.reload(true);
          }, 800);
        }, 1200);
      } catch (err) {
        console.error('Update error:', err);
        window.location.reload(true);
      }
    });
  }

  // Initial welcome chime
  setTimeout(() => {
    window.systemUI.showToast('[SISTEMA]: Has despertado como Cazador. El Sistema está en línea.', 'normal');
  }, 800);
});
