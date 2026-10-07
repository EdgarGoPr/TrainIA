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
    await this.checkPermissionStatus();
    await this.syncNativeScheduledAlarms();
    this.startFallbackScheduleLoop();
    this.attachEventListeners();
  }

  resolvePlugin() {
    if (this.localNotificationsPlugin) return this.localNotificationsPlugin;

    if (window.Capacitor) {
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        this.localNotificationsPlugin = window.Capacitor.Plugins.LocalNotifications;
      } else if (typeof window.Capacitor.registerPlugin === 'function') {
        try {
          this.localNotificationsPlugin = window.Capacitor.registerPlugin('LocalNotifications');
        } catch (e) {
          console.warn('registerPlugin notice:', e);
        }
      }
    }
    return this.localNotificationsPlugin;
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
    const plugin = this.resolvePlugin();
    if (plugin && typeof plugin.createChannel === 'function') {
      try {
        await plugin.createChannel({
          id: 'solo_system_channel',
          name: 'Misiones del Sistema',
          description: 'Notificaciones oficiales del Sistema de Solo Leveling',
          importance: 5, // High / Max priority: heads-up banner, sound, vibration
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
    const plugin = this.resolvePlugin();
    if (plugin && typeof plugin.checkPermissions === 'function') {
      try {
        const status = await plugin.checkPermissions();
        this.permissionGranted = (status.display === 'granted');
        return this.permissionGranted;
      } catch (e) {
        console.warn('Check native permission error:', e);
      }
    }

    if ('Notification' in window) {
      this.permissionGranted = (Notification.permission === 'granted');
      return this.permissionGranted;
    }

    return false;
  }

  async requestPermission() {
    const plugin = this.resolvePlugin();

    // 1. Native Android Permissions
    if (plugin && typeof plugin.requestPermissions === 'function') {
      try {
        const result = await plugin.requestPermissions();
        this.permissionGranted = (result.display === 'granted');
        if (this.permissionGranted) {
          window.systemAudio.playNotification();
          await this.setupNotificationChannel();
          await this.syncNativeScheduledAlarms();
          await this.sendInstantSystemNotification(
            '◈ [SISTEMA: PERMISOS ACTIVADOS] ◈',
            'Las alertas de la Misión Diaria ahora aparecerán directamente en la barra de estado de tu celular.'
          );
        }
        this.renderNotificationSettings();
        return this.permissionGranted;
      } catch (e) {
        console.error('Native permission request error:', e);
      }
    }

    // 2. Web Browser fallback
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.permissionGranted = (permission === 'granted');
        if (this.permissionGranted) {
          window.systemAudio.playNotification();
          this.sendInstantSystemNotification(
            '◈ [SISTEMA: PERMISOS ACTIVADOS] ◈',
            'Las alertas del Sistema aparecerán en tu dispositivo.'
          );
        }
        this.renderNotificationSettings();
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
        body: `Cazador ${p.name}, has completado todas las tareas del día. Estado corporal y recompensas disponibles.`
      };
    }

    if (window.systemState.state.penalty?.isActive) {
      return {
        title: '⚠️ [ALERTA CRÍTICA: ZONA DE CASTIGO] ⚠️',
        body: `Cazador ${p.name}, estás en la Zona de Castigo. Sobrevive a la penalización antes de que expire el tiempo.`
      };
    }

    // Dynamic tasks status breakdown (only active tasks)
    const remainingLines = [];
    const taskList = Object.values(q.tasks || {}).filter(t => t.active !== false);

    taskList.forEach(t => {
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
      (remainingLines.length > 0 ? remainingLines.join('\n') : '• Sin tareas pendientes') +
      `\n⚠️ Penalización a las 23:59:59 si no se completa.`;

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

    const plugin = this.resolvePlugin();

    // 1. Native Android Local Notification (Shows in Android Status Bar & Notification Center)
    if (plugin && typeof plugin.schedule === 'function') {
      try {
        await this.setupNotificationChannel();
        await plugin.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 800000) + 100000,
              title: payload.title,
              body: payload.body,
              schedule: { at: new Date(Date.now() + 200), allowWhileIdle: true },
              channelId: 'solo_system_channel',
              smallIcon: 'ic_launcher',
              largeIcon: 'ic_launcher'
            }
          ]
        });
      } catch (e) {
        console.warn('Native LocalNotifications schedule error:', e);
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
    const plugin = this.resolvePlugin();
    if (!plugin || typeof plugin.schedule !== 'function') return;

    const config = window.systemState.state.settings.notifications;
    if (!config) return;

    try {
      // Cancel previous scheduled alarms
      if (typeof plugin.getPending === 'function' && typeof plugin.cancel === 'function') {
        const pending = await plugin.getPending();
        if (pending && pending.notifications && pending.notifications.length > 0) {
          await plugin.cancel(pending);
        }
      }

      if (!config.enabled || !config.times || config.times.length === 0) return;

      await this.setupNotificationChannel();
      const payload = this.generateSoloLevelingPayload();
      const notificationsToSchedule = [];

      config.times.forEach((timeStr, index) => {
        const [hour, minute] = timeStr.split(':').map(Number);
        if (isNaN(hour) || isNaN(minute)) return;

        const now = new Date();
        const schedTime = new Date();
        schedTime.setHours(hour, minute, 0, 0);
        if (schedTime.getTime() <= now.getTime()) {
          schedTime.setDate(schedTime.getDate() + 1);
        }

        notificationsToSchedule.push({
          id: 2000 + index,
          title: payload.title,
          body: payload.body,
          schedule: {
            at: schedTime,
            repeats: true,
            every: 'day',
            allowWhileIdle: true // Wake device up from sleep / doze mode!
          },
          channelId: 'solo_system_channel',
          smallIcon: 'ic_launcher'
        });
      });

      if (notificationsToSchedule.length > 0) {
        await plugin.schedule({
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
    const isGranted = this.permissionGranted;

    container.innerHTML = `
      <!-- Notification Permission Status Badge -->
      <div style="background: ${isGranted ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 170, 0, 0.12)'}; border: 1px solid ${isGranted ? '#00ff88' : '#ffaa00'}; border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-family: var(--font-hud); font-size: 0.82rem; color: #fff;">
            PERMISO DEL SISTEMA OPERATIVO:
          </div>
          <div style="font-size: 0.72rem; color: ${isGranted ? '#00ff88' : '#ffaa00'}; margin-top: 2px;">
            ${isGranted ? '● PERMISO CONCEDIDO (Alertas en barra de estado activas)' : '⚠️ PERMISO PENDIENTE (Toca el botón dorado para activar)'}
          </div>
        </div>
        ${!isGranted ? `
          <button id="request-notif-perm-btn" class="modal-btn" style="padding: 6px 12px; font-size: 0.75rem; background: rgba(255, 215, 0, 0.2); border-color: var(--color-gold); color: var(--color-gold); white-space: nowrap;">
            🛡️ ACTIVAR
          </button>
        ` : ''}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <label style="font-family: var(--font-hud); font-size: 0.88rem; color: #fff; cursor: pointer;">
          Activar Alertas Nativas en Celular:
        </label>
        <input type="checkbox" id="toggle-notif-switch" ${config.enabled ? 'checked' : ''} style="width: 22px; height: 22px; cursor: pointer; accent-color: var(--color-primary);">
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
          Horarios de alerta programados (sonarán en la barra superior de tu teléfono):
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

      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px; border-top: 1px solid rgba(0,229,255,0.15); padding-top: 12px;">
        <button id="test-notif-btn" class="modal-btn" style="background: rgba(0, 229, 255, 0.2); border-color: var(--color-primary); color: var(--color-primary-glow); padding: 12px; font-size: 0.88rem;">
          📲 PROBAR ALERTA EN MI CELULAR AHORA
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
        if (!this.permissionGranted) {
          await this.requestPermission();
        }
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
