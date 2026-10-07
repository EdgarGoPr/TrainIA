/**
 * Solo Leveling System - Native Android & PWA Notification Engine
 * Schedules true system notifications on Android (status bar & lock screen) via Capacitor LocalNotifications
 * and Web Push API.
 */

class SystemNotificationManager {
  constructor() {
    this.permissionGranted = false;
    this.checkInterval = null;
    this.localNotificationsPlugin = null;
  }

  async init() {
    this.ensureDefaultSettings();
    this.resolvePlugin();
    await this.setupNotificationChannel();
    this.checkPermissionStatus();
    this.syncNativeScheduledAlarms();
    this.startFallbackScheduleLoop();
    this.attachEventListeners();
  }

  resolvePlugin() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
      this.localNotificationsPlugin = window.Capacitor.Plugins.LocalNotifications;
    }
  }

  ensureDefaultSettings() {
    if (!window.systemState.state.settings.notifications) {
      window.systemState.state.settings.notifications = {
        enabled: true,
        times: ['09:00', '15:00', '21:00'],
        lastTriggeredDateHour: {}
      };
      window.systemState.save();
    }
  }

  async setupNotificationChannel() {
    this.resolvePlugin();
    if (this.localNotificationsPlugin) {
      try {
        await this.localNotificationsPlugin.createChannel({
          id: 'solo_system_channel',
          name: 'Misiones del Sistema',
          description: 'Notificaciones oficiales del Sistema de Solo Leveling',
          importance: 5, // High importance: shows banner and sounds alarm
          visibility: 1, // Visible on lock screen
          vibration: true,
          lights: true,
          lightColor: '#00E5FF'
        });
      } catch (e) {
        console.warn('Channel creation error:', e);
      }
    }
  }

  async checkPermissionStatus() {
    this.resolvePlugin();
    if (this.localNotificationsPlugin) {
      try {
        const status = await this.localNotificationsPlugin.checkPermissions();
        this.permissionGranted = status.display === 'granted';
        return;
      } catch (e) {}
    }

    if ('Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  async requestPermission() {
    this.resolvePlugin();

    // Native Android Permissions
    if (this.localNotificationsPlugin) {
      try {
        const result = await this.localNotificationsPlugin.requestPermissions();
        this.permissionGranted = result.display === 'granted';
        if (this.permissionGranted) {
          window.systemAudio.playNotification();
          await this.syncNativeScheduledAlarms();
          await this.sendInstantSystemNotification(
            '◈ [SISTEMA]: PERMISO CONCEDIDO ◈',
            'Las advertencias de misiones del Sistema aparecerán directamente en la barra de estado de tu celular.'
          );
        }
        return this.permissionGranted;
      } catch (e) {
        console.error('Native permission error:', e);
      }
    }

    // Web Browser fallback
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.permissionGranted = permission === 'granted';
        if (this.permissionGranted) {
          window.systemAudio.playNotification();
          this.sendInstantSystemNotification(
            '◈ [SISTEMA]: PERMISO CONCEDIDO ◈',
            'Las advertencias de misiones del Sistema aparecerán en tu dispositivo.'
          );
        }
        return this.permissionGranted;
      } catch (e) {
        console.error('Web notification permission error:', e);
      }
    }

    return false;
  }

  /**
   * Generates authentic Solo Leveling message with dynamic missing tasks
   */
  generateSoloLevelingPayload() {
    const p = window.systemState.state.player;
    const q = window.systemState.state.quest;

    if (q.status === 'COMPLETED') {
      return {
        title: '◈ [SISTEMA: MISIÓN DIARIA CUMPLIDA] ◈',
        body: `Cazador ${p.name}, has completado todas las tareas del día. Estado recuperado.`
      };
    }

    if (window.systemState.state.penalty?.isActive) {
      return {
        title: '⚠️ [ALERTA CRÍTICA: ZONA DE CASTIGO] ⚠️',
        body: `Cazador ${p.name}, estás en la Zona de Castigo. Sobrevive a la penalización antes de que se agote el tiempo.`
      };
    }

    // Dynamic tasks status breakdown
    const remainingLines = [];
    Object.values(q.tasks).forEach(t => {
      const isDone = t.current >= t.target;
      if (isDone) {
        remainingLines.push(`• ${t.name}: ${t.current}/${t.target} ${t.unit} (✓ HECHO)`);
      } else {
        const rem = (t.target - t.current).toFixed(t.unit === 'km' ? 1 : 0);
        remainingLines.push(`• ${t.name}: ${t.current}/${t.target} ${t.unit} (Faltan ${rem} ${t.unit})`);
      }
    });

    const title = '⚔️ [NOTIFICACIÓN DEL SISTEMA: MISIÓN DIARIA] ⚔️';
    const body = `Cazador ${p.name}, objetivos pendientes antes de medianoche:\n` +
      remainingLines.join('\n') +
      `\n⚠️ Penalización activa a las 23:59:59 si no se completa.`;

    return { title, body };
  }

  /**
   * Send an immediate notification to Android System Drawer / Web Notification
   */
  async sendInstantSystemNotification(customTitle = null, customBody = null) {
    const payload = (customTitle && customBody)
      ? { title: customTitle, body: customBody }
      : this.generateSoloLevelingPayload();

    window.systemAudio.playNotification();

    this.resolvePlugin();

    // 1. Native Android Local Notification (Shows in Android Status Bar / Notification Center)
    if (this.localNotificationsPlugin) {
      try {
        await this.localNotificationsPlugin.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 900000) + 100000,
              title: payload.title,
              body: payload.body,
              schedule: { at: new Date(Date.now() + 200), allowWhileIdle: true },
              channelId: 'solo_system_channel',
              smallIcon: 'ic_launcher'
            }
          ]
        });
      } catch (e) {
        console.warn('LocalNotifications schedule error:', e);
      }
    }

    // 2. Web Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(payload.title, {
              body: payload.body,
              icon: 'icons/icon-192.png',
              badge: 'icons/icon-192.png',
              vibrate: [200, 100, 200, 100, 400],
              tag: 'system-quest-alert',
              renotify: true
            });
          }).catch(() => {
            new Notification(payload.title, { body: payload.body, icon: 'icons/icon-192.png' });
          });
        } else {
          new Notification(payload.title, { body: payload.body, icon: 'icons/icon-192.png' });
        }
      } catch (e) {}
    }

    // 3. In-App HUD Toast
    window.systemUI.showToast(payload.title, 'normal');
  }

  /**
   * Schedules Native Android Alarms for all configured times
   */
  async syncNativeScheduledAlarms() {
    this.resolvePlugin();
    if (!this.localNotificationsPlugin) return;

    const config = window.systemState.state.settings.notifications;
    if (!config) return;

    try {
      // Cancel previous scheduled alarms
      const pending = await this.localNotificationsPlugin.getPending();
      if (pending && pending.notifications.length > 0) {
        await this.localNotificationsPlugin.cancel(pending);
      }

      if (!config.enabled || !config.times || config.times.length === 0) return;

      const payload = this.generateSoloLevelingPayload();
      const notificationsToSchedule = [];

      config.times.forEach((timeStr, index) => {
        const [hour, minute] = timeStr.split(':').map(Number);
        if (isNaN(hour) || isNaN(minute)) return;

        notificationsToSchedule.push({
          id: 2000 + index,
          title: payload.title,
          body: payload.body,
          schedule: {
            on: {
              hour: hour,
              minute: minute
            },
            repeats: true,
            allowWhileIdle: true // Wake device up from sleep / doze mode!
          },
          channelId: 'solo_system_channel',
          smallIcon: 'ic_launcher'
        });
      });

      if (notificationsToSchedule.length > 0) {
        await this.localNotificationsPlugin.schedule({
          notifications: notificationsToSchedule
        });
      }
    } catch (e) {
      console.warn('Error syncing native scheduled alarms:', e);
    }
  }

  startFallbackScheduleLoop() {
    if (this.checkInterval) clearInterval(this.checkInterval);

    this.checkInterval = setInterval(() => {
      this.checkScheduledTimesFallback();
    }, 15000);
  }

  checkScheduledTimesFallback() {
    const config = window.systemState.state.settings.notifications;
    if (!config || !config.enabled || !config.times || config.times.length === 0) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${mins}`;
    const todayDate = window.systemState.getTodayDateString();
    const triggerKey = `${todayDate}_${currentTimeStr}`;

    if (!config.lastTriggeredDateHour) config.lastTriggeredDateHour = {};

    if (config.times.includes(currentTimeStr)) {
      if (!config.lastTriggeredDateHour[triggerKey]) {
        config.lastTriggeredDateHour[triggerKey] = true;
        window.systemState.save();
        this.sendInstantSystemNotification();
      }
    }
  }

  async addScheduledTime(timeStr) {
    if (!timeStr) return;
    const config = window.systemState.state.settings.notifications;
    if (!config.times.includes(timeStr)) {
      config.times.push(timeStr);
      config.times.sort();
      window.systemState.save();
      await this.syncNativeScheduledAlarms();
      this.renderNotificationSettings();
    }
  }

  async removeScheduledTime(timeStr) {
    const config = window.systemState.state.settings.notifications;
    config.times = config.times.filter(t => t !== timeStr);
    window.systemState.save();
    await this.syncNativeScheduledAlarms();
    this.renderNotificationSettings();
  }

  async toggleNotifications(enabled) {
    const config = window.systemState.state.settings.notifications;
    config.enabled = !!enabled;
    window.systemState.save();
    await this.syncNativeScheduledAlarms();
    this.renderNotificationSettings();
  }

  renderNotificationSettings() {
    const container = document.getElementById('notifications-config-container');
    if (!container) return;

    const config = window.systemState.state.settings.notifications || { enabled: true, times: ['09:00', '15:00', '21:00'] };

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <label style="font-family: var(--font-hud); font-size: 0.9rem; color: #fff;">
          Activar Alertas Nativas en Celular:
        </label>
        <input type="checkbox" id="toggle-notif-switch" ${config.enabled ? 'checked' : ''} style="width: 22px; height: 22px; cursor: pointer; accent-color: var(--color-primary);">
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
          Horarios de alerta programados (sonarán en la barra de tu celular):
        </div>
        <div id="notif-times-list" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
          ${config.times.map(t => `
            <div style="background: rgba(0, 229, 255, 0.12); border: 1px solid var(--border-cyan); border-radius: var(--radius-sm); padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 0.9rem;">
              <span>⏰ ${t}</span>
              <button class="icon-btn" style="width: 20px; height: 20px; font-size: 0.65rem; border-color: rgba(255,0,85,0.4); color: var(--penalty-red);" onclick="window.systemNotifications.removeScheduledTime('${t}')" title="Eliminar">✕</button>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="time" id="new-notif-time-input" value="18:00" style="padding: 6px 10px; background: rgba(0,0,0,0.5); border: 1px solid var(--border-cyan); color: #fff; border-radius: 4px; font-family: var(--font-mono); font-size: 0.9rem;">
          <button id="add-notif-time-btn" class="modal-btn" style="padding: 8px 14px; font-size: 0.8rem;">
            + AGREGAR HORARIO
          </button>
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 14px; border-top: 1px solid rgba(0,229,255,0.15); padding-top: 12px;">
        <button id="test-notif-btn" class="modal-btn" style="background: rgba(0, 229, 255, 0.18); border-color: var(--color-primary); color: var(--color-primary-glow);">
          📲 ENVIAR ALERTA A MI CELULAR
        </button>
        <button id="request-notif-perm-btn" class="modal-btn" style="background: rgba(255, 215, 0, 0.15); border-color: var(--color-gold); color: var(--color-gold);">
          🛡️ ACTIVAR PERMISOS ANDROID
        </button>
      </div>
    `;
  }

  attachEventListeners() {
    document.addEventListener('click', async (e) => {
      const addTimeBtn = e.target.closest('#add-notif-time-btn');
      if (addTimeBtn) {
        const input = document.getElementById('new-notif-time-input');
        if (input && input.value) {
          window.systemAudio.playClick();
          await this.addScheduledTime(input.value);
        }
        return;
      }

      const testBtn = e.target.closest('#test-notif-btn');
      if (testBtn) {
        window.systemAudio.playClick();
        await this.sendInstantSystemNotification();
        return;
      }

      const permBtn = e.target.closest('#request-notif-perm-btn');
      if (permBtn) {
        await this.requestPermission();
        return;
      }
    });

    document.addEventListener('change', async (e) => {
      if (e.target && e.target.id === 'toggle-notif-switch') {
        window.systemAudio.playClick();
        await this.toggleNotifications(e.target.checked);
      }
    });
  }
}

window.systemNotifications = new SystemNotificationManager();
