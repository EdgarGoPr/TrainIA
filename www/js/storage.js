/**
 * Solo Leveling System - Persistent Storage Manager
 * Handles LocalStorage & IndexedDB backup, JSON export/import and migrations.
 */

const STORAGE_KEY = 'SOLO_LEVELING_SYSTEM_DATA_V1';

class SystemStorage {
  constructor() {
    this.key = STORAGE_KEY;
  }

  /**
   * Save complete state to LocalStorage
   */
  save(state) {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(this.key, serialized);
      return true;
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
      return false;
    }
  }

  /**
   * Load state from LocalStorage
   */
  load() {
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
      return null;
    }
  }

  /**
   * Reset all data (Danger zone)
   */
  clear() {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Export database as downloadable JSON file
   */
  exportData(state) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `SOLO_SYSTEM_HUNTER_SAVE_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Import data from JSON string or file
   */
  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.player || typeof parsed.player.level !== 'number') {
        throw new Error("Archivo de guardado del Sistema inválido.");
      }
      this.save(parsed);
      return { success: true, state: parsed };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

window.systemStorage = new SystemStorage();
