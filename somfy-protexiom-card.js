/* ========================================================
   Somfy Protexiom Card  — v0.0.1
   ======================================================== */

const CARD_VERSION = "v0.0.15";

class SomfyAlarmCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    console.info(`%c SOMFY-PROTEXIOM-CARD %c ${CARD_VERSION} `, "color:#c8a96e;background:#1e1e2e;font-weight:700;padding:2px 4px;border-radius:4px 0 0 4px", "color:#1e1e2e;background:#c8a96e;font-weight:700;padding:2px 4px;border-radius:0 4px 4px 0");

    this.config = {
      alarm_entity: config.alarm_entity || "alarm_control_panel.alarme",
      battery_entity: config.battery_entity || "binary_sensor.batterie",
      boitier_entity: config.boitier_entity || "binary_sensor.boitier",
      radio_entity: config.radio_entity || "binary_sensor.communication_radio",
      gsm_entity: config.gsm_entity || "binary_sensor.communication_gsm",
    };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _getState(entityId) {
    return this._hass?.states[entityId];
  }

  _alarmLabel(state) {
    const map = {
      disarmed:    { label: "Désactivée",      color: "var(--secondary-text-color)" },
      armed_away:  { label: "Armée (absent)",  color: "#206633" },
      armed_home:  { label: "Armée (présent)", color: "#f59e0b" },
      armed_night: { label: "Armée (nuit)",    color: "#8b5cf6" },
      pending:     { label: "En attente…",     color: "#f59e0b" },
      triggered:   { label: "DÉCLENCHÉE !",    color: "#ef4444" },
      arming:      { label: "Armement…",       color: "#f59e0b" },
      unavailable: { label: "Indisponible",    color: "var(--disabled-color)" },
    };
    return map[state] || { label: state, color: "var(--secondary-text-color)" };
  }

  _sinceLabel(entityId) {
    const ent = this._getState(entityId);
    if (!ent || !ent.last_changed) return "";
    const diffMin = Math.floor((new Date() - new Date(ent.last_changed)) / 60000);
    if (diffMin < 1) return "depuis moins d'une minute";
    if (diffMin < 60) return `depuis ${diffMin} min`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m === 0 ? `depuis ${h}h` : `depuis ${h}h${String(m).padStart(2, "0")}`;
  }

  _sensorRow(label, entityId, iconSvg) {
    const ent = this._getState(entityId);
    const state = ent?.state ?? "unavailable";
    const isOk = state === "OK";
    const isUnavail = state === "unavailable";
    const statusLabel = isUnavail ? "Indisponible" : state;
    const statusColor = isUnavail ? "var(--disabled-color)" : isOk ? "#4ade80" : "#ef4444";
    const dotColor = statusColor;

    return `
      <div class="sensor-row">
        <div class="sensor-icon">${iconSvg}</div>
        <span class="sensor-label">${label}</span>
        <span class="sensor-status" style="color:${statusColor}">
          <span class="dot" style="background:${dotColor}"></span>
          ${statusLabel}
        </span>
      </div>`;
  }

  _render() {
    if (!this._hass) return;

    const alarmEnt = this._getState(this.config.alarm_entity);
    const alarmState = alarmEnt?.state ?? "unavailable";
    const { label: alarmLabel, color: alarmColor } = this._alarmLabel(alarmState);
    const isArmed = !["disarmed", "unavailable"].includes(alarmState);
    const isTriggered = alarmState === "triggered";
    const sinceLabel = this._sinceLabel(this.config.alarm_entity);

    const iconBattery = `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>`;
    const iconBoitier = `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    const iconRadio = `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 3C7.46 3 3.34 4.78.29 7.67L2 9.38C4.62 6.86 8.13 5.27 12 5.27s7.38 1.59 10 4.11l1.71-1.71C20.66 4.78 16.54 3 12 3zm0 4.55c-3.3 0-6.27 1.34-8.43 3.5l1.71 1.71C6.86 11.18 9.29 10.09 12 10.09s5.14 1.09 6.72 2.67l1.71-1.71C18.27 8.89 15.3 7.55 12 7.55zm0 4.54c-1.93 0-3.68.78-4.95 2.05L8.76 15.85C9.66 14.95 10.77 14.36 12 14.36s2.34.59 3.24 1.49l1.71-1.71C15.68 12.87 13.93 12.09 12 12.09zM12 17a2 2 0 100 4 2 2 0 000-4z"/></svg>`;
    const iconGsm = `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>`;
    const iconAlarm = `<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`;



    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: var(--primary-font-family, sans-serif); }

        .card {
          background: var(--ha-card-background, var(--card-background-color));
          border-radius: var(--ha-card-border-radius, 12px);
          overflow: hidden;
          border: 1px solid var(--divider-color);
          box-shadow: var(--ha-card-box-shadow, none);
        }

        .alarm-section {
          padding: 16px;
          background: var(--secondary-background-color);
          border-bottom: 1px solid var(--divider-color);
        }

        .section-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--secondary-text-color);
          margin-bottom: 14px;
        }

        .alarm-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .alarm-icon-wrap {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--primary-background-color);
          color: ${alarmColor};
          flex-shrink: 0;
          ${isArmed || isTriggered ? `box-shadow: 0 0 14px ${alarmColor}88;` : ""}
        }

        .alarm-info {
          flex: 1;
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .alarm-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--primary-text-color);
        }

        .alarm-state {
          font-size: 13px;
          color: ${alarmColor};
        }

        .alarm-since {
          margin-left: auto;
          font-size: 11px;
          color: var(--secondary-text-color);
          font-style: italic;
          white-space: nowrap;
        }

        .alarm-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 14px;
        }

        .btn {
          height: 36px;
          min-height: 36px;
          max-height: 36px;
          padding: 0 4px;
          margin: 0;
          border-radius: 8px;
          border: none;
          box-sizing: border-box;
          font-family: var(--primary-font-family, sans-serif);
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: opacity 0.2s, transform 0.1s;
          white-space: nowrap;
          -webkit-appearance: none;
          appearance: none;
          overflow: hidden;
        }
        .btn:hover  { opacity: 0.85; transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }

        .ei {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .btn-disarm    { background: #4b5563; color: #fff; border: none; }
        .btn-arm-away  { background: #206633; color: #fff; }
        .btn-arm-home  { background: #f59e0b; color: #111; }
        .btn-arm-night { background: #8b5cf6; color: #fff; }

        .sensors-section {
          padding: 16px;
          background: var(--ha-card-background, var(--card-background-color));
        }

        .sensor-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--divider-color);
        }
        .sensor-row:last-child { border-bottom: none; }

        .sensor-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: var(--secondary-background-color);
          color: var(--primary-color);
          flex-shrink: 0;
        }

        .sensor-label {
          flex: 1;
          font-size: 14px;
          color: var(--primary-text-color);
        }

        .sensor-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      </style>

      <div class="card">
        <div class="alarm-section">
          <div class="section-title">Somfy Protexiom — Contrôle</div>
          <div class="alarm-row">
            <div class="alarm-icon-wrap">${iconAlarm}</div>
            <div class="alarm-info">
              <span class="alarm-name">Alarme</span>
              <span class="alarm-state">${alarmLabel}</span>
              ${sinceLabel ? `<span class="alarm-since">${sinceLabel}</span>` : ""}
            </div>
          </div>
          <div class="alarm-actions">
            <button class="btn btn-disarm"    data-action="disarm"><svg class="ei" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>Désarmer</button>
            <button class="btn btn-arm-away"  data-action="arm_away"><svg class="ei" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>Absent</button>
            <button class="btn btn-arm-home"  data-action="arm_home"><svg class="ei" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Présent</button>
            <button class="btn btn-arm-night" data-action="arm_night"><svg class="ei" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>Nuit</button>
          </div>
        </div>

        <div class="sensors-section">
          <div class="section-title">Capteurs</div>
          ${this._sensorRow("Batterie", this.config.battery_entity, iconBattery)}
          ${this._sensorRow("Centrale", this.config.boitier_entity, iconBoitier)}
          ${this._sensorRow("Comm. Centrale ↔ Capteurs", this.config.radio_entity, iconRadio)}
          ${this._sensorRow("Communication GSM", this.config.gsm_entity, iconGsm)}
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll(".btn[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._hass.callService("alarm_control_panel", btn.dataset.action, {
          entity_id: this.config.alarm_entity,
        });
      });
    });
  }

  getCardSize() { return 5; }
}

customElements.define("somfy-alarm-card", SomfyAlarmCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "somfy-protexiom-card.js",
  name: "Somfy Protexiom Card",
  description: "Carte personnalisée pour alarme Somfy Protexiom",
});
