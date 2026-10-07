/**
 * Solo Leveling System - Loot Box & Inventory Controller
 */

class LootController {
  constructor() {
    this.isUnboxing = false;
  }

  init() {
    this.renderInventory();
    this.attachEventListeners();
  }

  attachEventListeners() {
    document.addEventListener('click', (e) => {
      const openBoxBtn = e.target.closest('#open-lootbox-btn') || e.target.closest('#lootbox-chest');
      if (openBoxBtn) {
        this.openLootBox();
        return;
      }

      const useItemBtn = e.target.closest('[data-action="use-item"]');
      if (useItemBtn) {
        const instanceId = useItemBtn.dataset.instanceId;
        this.useItem(instanceId);
        return;
      }

      const addCustomRewardBtn = e.target.closest('#add-custom-reward-btn');
      if (addCustomRewardBtn) {
        this.promptAddCustomReward();
        return;
      }
    });
  }

  renderInventory() {
    const heroBox = document.getElementById('lootbox-hero-box');
    const itemsList = document.getElementById('inventory-items-list');
    if (!heroBox || !itemsList) return;

    const inv = window.systemState.state.inventory;
    const boxCount = inv.lootBoxes || 0;

    heroBox.innerHTML = `
      <div id="lootbox-chest" class="lootbox-chest-icon" title="Toca para abrir">
        ${boxCount > 0 ? '🎁' : '📦'}
      </div>
      <div class="lootbox-count-badge">
        ${boxCount > 0 ? `Tienes ${boxCount} Caja(s) Misteriosa(s)` : 'Sin Cajas Misteriosas Disponibles'}
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
        Completa tu Misión Diaria para obtener Cajas Benditas con recompensas del Sistema.
      </p>
      <button id="open-lootbox-btn" class="open-box-btn" ${boxCount <= 0 ? 'disabled' : ''}>
        ✨ ABRIR CAJA MISTERIOSA ✨
      </button>
    `;

    // Render Items
    if (!inv.items || inv.items.length === 0) {
      itemsList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.85rem;">
          No tienes objetos ni recompensas almacenadas en el Inventario.
        </div>
      `;
      return;
    }

    let html = '';
    inv.items.forEach(item => {
      html += `
        <div class="inv-item-card ${item.rarity} ${item.used ? 'used' : ''}">
          <div class="inv-item-icon">${item.icon || '🎁'}</div>
          <div class="inv-item-details">
            <div class="inv-item-name">${item.name}</div>
            <div class="inv-item-desc">${item.desc}</div>
            <div style="font-size: 0.68rem; color: var(--text-dim); margin-top: 2px;">
              Obtenido: ${new Date(item.obtainedAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            ${!item.used ? `
              <button class="use-item-btn" data-action="use-item" data-instance-id="${item.instanceId}">
                USAR
              </button>
            ` : `
              <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
                USADO
              </span>
            `}
          </div>
        </div>
      `;
    });

    itemsList.innerHTML = html;
  }

  openLootBox() {
    if (this.isUnboxing) return;
    if ((window.systemState.state.inventory.lootBoxes || 0) <= 0) return;

    this.isUnboxing = true;
    window.systemAudio.playLootBox();

    // Trigger visual opening effect
    const chest = document.getElementById('lootbox-chest');
    if (chest) {
      chest.style.transform = 'scale(1.3) rotate(15deg)';
      chest.style.transition = 'transform 0.4s ease';
    }

    setTimeout(() => {
      const item = window.systemState.openLootBox();
      this.isUnboxing = false;
      this.renderInventory();
      window.systemUI.updateHeader();
      window.systemUI.updateStatusScreen();

      // Show unboxing reveal modal
      window.systemUI.showLootRevealModal(item);
    }, 600);
  }

  useItem(instanceId) {
    const success = window.systemState.useItem(instanceId);
    if (success) {
      window.systemAudio.playStatusRecovery();
      window.systemUI.showToast('[SISTEMA]: Recompensa utilizada con éxito.', 'success');
      this.renderInventory();
      window.systemUI.updateHeader();
      window.systemUI.updateStatusScreen();
    }
  }

  promptAddCustomReward() {
    const name = prompt('Nombre de tu Recompensa Personalizada (ej: 1h de Netflix, Comida Trampa, Salida con amigos):');
    if (!name) return;

    const desc = prompt('Descripción o regla de la recompensa:', 'Permiso del sistema para disfrutar de un descanso merecido.');
    
    const newReward = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      rarity: 'rare',
      icon: '✨',
      desc: desc ? desc.trim() : 'Recompensa configurada por el Cazador.'
    };

    window.systemState.state.inventory.customRewards.push(newReward);
    window.systemState.save();
    window.systemAudio.playClick();
    window.systemUI.showToast('[SISTEMA]: Nueva recompensa agregada al registro de botín.', 'success');
  }
}

window.lootController = new LootController();
