/* ========================================================
   Somfy Protexial Card  
   ======================================================== */

const CARD_VERSION = "v0.0.2";

const SENSORS_DEF = [
  { key: "capteur1", defaultEntity: "binary_sensor.somfy_protexial_batterie", defaultLabel: "Affiche Capteur 1", defaultText: "Batterie", type: "binary" },
  { key: "capteur2", defaultEntity: "binary_sensor.somfy_protexial_centrale", defaultLabel: "Affiche Capteur 3", defaultText: "Centrale", type: "binary" },
  { key: "capteur3", defaultEntity: "binary_sensor.somfy_protexial_portes_ou_fenetres", defaultLabel: "Affiche Capteur 8", defaultText: "Portes/Fenêtres", type: "binary" },
  { key: "capteur4", defaultEntity: "binary_sensor.somfy_protexial_mouvement", defaultLabel: "Affiche Capteur 6", defaultText: "Mouvement", type: "binary" },
  { key: "capteur5", defaultEntity: "binary_sensor.somfy_protexial_camera", defaultLabel: "Affiche Capteur 2", defaultText: "Caméra", type: "info" },
  { key: "capteur6", defaultEntity: "binary_sensor.somfy_protexial_comm_centrale_capteurs", defaultLabel: "Affiche Capteur 4", defaultText: "Capteurs", type: "binary" },
  { key: "capteur7", defaultEntity: "binary_sensor.somfy_protexial_communication_gsm", defaultLabel: "Affiche Capteur 5", defaultText: "Gsm", type: "binary" },
  { key: "capteur8", defaultEntity: "sensor.somfy_protexial_operateur_gsm", defaultLabel: "Affiche Capteur 7", defaultText: "Opérateur", type: "info" },
  { key: "capteur9", defaultEntity: "sensor.somfy_protexial_signal_gsm_5", defaultLabel: "Affiche Capteur 9", defaultText: "Signal Gsm", type: "info" },
];

// ── Editor ──────────────────────────────────────────────
class SomfyProtexialCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass   = null;
    this._config = {};
    this._built  = false;
  }

  set hass(hass) {
    this._hass = hass;
    this.shadowRoot.querySelectorAll("ha-entity-picker, ha-form")
      .forEach(el => { el.hass = hass; });
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._built) { this._built = true; this._render(); }
  }

  _fireConfig(cfg) {
    this._config = cfg;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: cfg }, bubbles: true, composed: true,
    }));
  }

  get _alarmSchema() {
    return [{ name: "alarm_entity", selector: { entity: { domain: "alarm_control_panel" } } }];
  }

  get _titleSchema() {
    return [{ name: "title", selector: { text: {} } }];
  }

  _sensorSchema(s) {
    return [
      { name: `entity_${s.key}`, selector: { entity: {} } },
      { name: `label_${s.key}`,  selector: { text: {} } },
    ];
  }

  _render() {
    const cfg      = this._config || {};
    const shown    = cfg.sensors  || SENSORS_DEF.map(s => s.key);
    const labels   = cfg.labels   || {};
    const entities = cfg.entities || {};

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: var(--primary-font-family, sans-serif); }
        ha-form { display: block; margin-bottom: 8px; }
        ha-expansion-panel {
          display: block; margin-bottom: 8px;
          --expansion-panel-content-padding: 12px;
          border-radius: 6px; --ha-card-border-radius: 6px;
        }
        ha-expansion-panel h3 { margin: 0; font-size: inherit; font-weight: 600; }
        .sensor-block { border-top: 1px solid var(--divider-color); padding: 12px 0 4px; }
        .sensor-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .sensor-name { font-size: 13px; font-weight: 600; color: var(--primary-text-color); flex: 1; }
        input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--primary-color); cursor: pointer; flex-shrink: 0; }
      </style>

      <ha-form id="form_alarm"></ha-form>

      <ha-expansion-panel outlined>
        <ha-icon slot="leading-icon" icon="mdi:cog"></ha-icon>
        <h3 slot="header">Card settings</h3>
        <div>
          <ha-form id="form_title"></ha-form>
          <div id="sensors_container"></div>
        </div>
      </ha-expansion-panel>
    `;

    requestAnimationFrame(() => {
      // ── Alarme ──
      const formAlarm = this.shadowRoot.getElementById("form_alarm");
      formAlarm.hass   = this._hass;
      formAlarm.schema = this._alarmSchema;
      formAlarm.data   = { alarm_entity: cfg.alarm_entity || "alarm_control_panel.alarme" };
      formAlarm.computeLabel = s => ({ alarm_entity: "Entité alarme" }[s.name] || s.name);
      formAlarm.addEventListener("value-changed", e => {
        e.stopPropagation();
        this._fireConfig({ ...this._config, alarm_entity: e.detail.value.alarm_entity });
      });

      // ── Titre ──
      const formTitle = this.shadowRoot.getElementById("form_title");
      formTitle.hass   = this._hass;
      formTitle.schema = this._titleSchema;
      formTitle.data   = { title: cfg.title || "Somfy Protexial — Contrôle" };
      formTitle.computeLabel = s => ({ title: "Titre de la carte" }[s.name] || s.name);
      formTitle.addEventListener("value-changed", e => {
        e.stopPropagation();
        this._fireConfig({ ...this._config, title: e.detail.value.title });
      });

      // ── Capteurs ──
      const container = this.shadowRoot.getElementById("sensors_container");
      SENSORS_DEF.forEach(s => {
        const block = document.createElement("div");
        block.className = "sensor-block";
        block.innerHTML = `
          <div class="sensor-header">
            <input type="checkbox" id="chk_${s.key}" ${shown.includes(s.key) ? "checked" : ""}>
            <div class="sensor-name">${s.defaultLabel}</div>
          </div>
          <ha-form id="form_${s.key}"></ha-form>
        `;
        container.appendChild(block);

        block.querySelector(`#chk_${s.key}`).addEventListener("change", () => {
          const newShown = shown.includes(s.key)
            ? shown.filter(k => k !== s.key)
            : [...shown, s.key];
          this._config = { ...this._config, sensors: newShown };
          shown.length = 0; shown.push(...newShown);
          this._fireConfig(this._config);
        });

        const form = block.querySelector(`#form_${s.key}`);
        form.hass   = this._hass;
        form.schema = this._sensorSchema(s);
        form.data   = {
          [`entity_${s.key}`]: entities[s.key] || s.defaultEntity,
          [`label_${s.key}`]:  labels[s.key]   || s.defaultText,
        };
        form.computeLabel = f => ({
          [`entity_${s.key}`]: "Entité",
          [`label_${s.key}`]:  "Nom affiché",
        }[f.name] || f.name);
        form.addEventListener("value-changed", e => {
          e.stopPropagation();
          const val = e.detail.value;
          const newEntities = { ...(this._config.entities || {}) };
          const newLabels   = { ...(this._config.labels   || {}) };
          const entVal = val[`entity_${s.key}`];
          const lblVal = val[`label_${s.key}`];
          if (entVal && entVal !== s.defaultEntity) newEntities[s.key] = entVal;
          else delete newEntities[s.key];
          if (lblVal && lblVal !== s.defaultText) newLabels[s.key] = lblVal;
          else delete newLabels[s.key];
          this._fireConfig({ ...this._config, entities: newEntities, labels: newLabels });
        });
      });
    });
  }
}

if (!customElements.get("somfy-protexial-card-editor"))
  customElements.define("somfy-protexial-card-editor", SomfyProtexialCardEditor);

// ── Card ────────────────────────────────────────────────
class SomfyProtexialCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
  }

  static getConfigElement() { return document.createElement("somfy-protexial-card-editor"); }

  static getStubConfig() {
    return {
      alarm_entity: "alarm_control_panel.alarme",
      sensors:      SENSORS_DEF.map(s => s.key),
      labels:       {},
      entities:     {},
      title:        "Somfy Protexial — Contrôle",
    };
  }

  setConfig(config) {
    console.info(
      `%c SOMFY-PROTEXIAL-CARD %c ${CARD_VERSION} `,
      "color:#c8a96e;background:#1e1e2e;font-weight:700;padding:2px 4px;border-radius:4px 0 0 4px",
      "color:#1e1e2e;background:#c8a96e;font-weight:700;padding:2px 4px;border-radius:0 4px 4px 0"
    );
    this.config = {
      alarm_entity: config.alarm_entity || "alarm_control_panel.alarme",
      sensors:      config.sensors      || SENSORS_DEF.map(s => s.key),
      labels:       config.labels       || {},
      entities:     config.entities     || {},
      title:        config.title        || "Somfy Protexial — Contrôle",
    };
    // Si config change (ex: éditeur), forcer un re-render complet
    this._rendered = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._rendered = true;
      this._render();
    } else {
      this._update();
    }
  }

  _getState(entityId) { return this._hass?.states[entityId]; }

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
    if (!ent?.last_changed) return "";
    const diffMin = Math.floor((new Date() - new Date(ent.last_changed)) / 60000);
    if (diffMin < 1) return "depuis moins d'une minute";
    if (diffMin < 60) return `depuis ${diffMin} min`;
    const h = Math.floor(diffMin / 60), m = diffMin % 60;
    return m === 0 ? `depuis ${h}h` : `depuis ${h}h${String(m).padStart(2, "0")}`;
  }

  _sensorValues(sensor) {
    const entityId  = this.config.entities[sensor.key] || sensor.defaultEntity;
    const ent       = this._getState(entityId);
    const state     = ent?.state ?? "unavailable";
    const isUnavail = state === "unavailable";
    let statusLabel, statusColor, dotColor;
    if (sensor.type === "binary") {
      const okStates = ["on", "open", "open", "detected", "non détecté", "fermées"];
      const isOk = okStates.includes(String(state));
      statusLabel = isUnavail ? "Indisponible" : state;
      statusColor = isUnavail ? "var(--disabled-color)" : isOk ? "#4ade80" : "#ef4444";
      dotColor    = statusColor;
    } else {
      statusLabel = isUnavail ? "Indisponible" : state;
      statusColor = isUnavail ? "var(--disabled-color)" : "var(--primary-text-color)";
      dotColor    = isUnavail ? "var(--disabled-color)" : "var(--primary-color)";
    }
    return { statusLabel, statusColor, dotColor };
  }

  // ── Premier rendu complet ────────────────────────────
  _render() {
    if (!this._hass) return;

    const alarmEnt    = this._getState(this.config.alarm_entity);
    const alarmState  = alarmEnt?.state ?? "unavailable";
    const { label: alarmLabel, color: alarmColor } = this._alarmLabel(alarmState);
    const isArmed     = !["disarmed", "unavailable"].includes(alarmState);
    const isTriggered = alarmState === "triggered";
    const sinceLabel  = this._sinceLabel(this.config.alarm_entity);
    const activeSensors = SENSORS_DEF.filter(s => this.config.sensors.includes(s.key));

    const iconAlarm = `<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`;
    const iconLock  = `<svg class="ei" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: var(--primary-font-family, sans-serif); }
        .card {
          background: var(--ha-card-background, var(--card-background-color));
          border-radius: var(--ha-card-border-radius, 12px); overflow: hidden;
          border: 1px solid var(--divider-color); box-shadow: var(--ha-card-box-shadow, none);
        }
        .alarm-section { padding: 16px; background: var(--secondary-background-color); border-bottom: 1px solid var(--divider-color); }
        .section-title { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--secondary-text-color); margin-bottom: 14px; }
        .alarm-row { display: flex; align-items: center; gap: 14px; }
        .alarm-icon-wrap {
          width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
          border-radius: 12px; background: var(--primary-background-color); flex-shrink: 0;
        }
        .alarm-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .alarm-name { font-size: 15px; font-weight: 600; color: var(--primary-text-color); }
        .alarm-state-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .alarm-state { font-size: 13px; }
        .alarm-since { font-size: 11px; color: var(--secondary-text-color); font-style: italic; }
        .alarm-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
        .btn {
          height: 36px; width: 110px; padding: 0 10px; margin: 0;
          border-radius: 8px; border: none; box-sizing: border-box;
          font-family: var(--primary-font-family, sans-serif); font-size: 12px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: 6px; transition: opacity 0.2s, transform 0.1s; white-space: nowrap;
          -webkit-appearance: none; appearance: none;
        }
        .btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .ei { width: 16px; height: 16px; flex-shrink: 0; }
        .btn-disarm   { background: #4b5563; color: #fff; }
        .btn-arm-away { background: #206633; color: #fff; }
        .sensors-section { padding: 16px; background: var(--ha-card-background, var(--card-background-color)); }
        .sensor-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--divider-color); }
        .sensor-row:last-child { border-bottom: none; }
        .sensor-label { flex: 1; font-size: 14px; color: var(--primary-text-color); }
        .sensor-status { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
        .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .no-sensors { font-size: 13px; color: var(--secondary-text-color); padding: 8px 0; text-align: center; }
        .card-version { font-size: 10px; color: var(--disabled-color); text-align: right; padding: 6px 16px 8px; border-top: 1px solid var(--divider-color); letter-spacing: 0.5px; }
      </style>

      <div class="card">
        <div class="alarm-section">
          <div class="section-title">${this.config.title}</div>
          <div class="alarm-row">
            <div class="alarm-icon-wrap" style="color:${alarmColor};${isArmed || isTriggered ? `box-shadow:0 0 14px ${alarmColor}88;` : ""}">
              ${iconAlarm}
            </div>
            <div class="alarm-info">
              <span class="alarm-name">Alarme</span>
              <div class="alarm-state-row">
                <span class="alarm-state" style="color:${alarmColor}">${alarmLabel}</span>
                <span class="alarm-since">${sinceLabel}</span>
              </div>
            </div>
            <div class="alarm-actions">
              <button class="btn btn-disarm" data-action="disarm">
                ${iconLock} Désarmer
              </button>
              <button class="btn btn-arm-away" data-action="arm_away">
                ${iconLock} Absent
              </button>
              <button class="btn btn-arm-home" data-action="arm_home">
               ${iconLock} Présent
              </button>
            </div>
          </div>
        </div>

        <div class="sensors-section">
          <div class="section-title">Capteurs</div>
          ${activeSensors.length
            ? activeSensors.map(s => {
                const label = this.config.labels[s.key] || s.defaultText;
                const { statusLabel, statusColor, dotColor } = this._sensorValues(s);
                return `
                  <div class="sensor-row" data-key="${s.key}">
                    <span class="sensor-label">${label}</span>
                    <span class="sensor-status" style="color:${statusColor}">
                      <span class="dot" style="background:${dotColor}"></span>
                      <span class="sensor-val">${statusLabel}</span>
                    </span>
                  </div>`;
              }).join("")
            : `<div class="no-sensors">Aucun capteur sélectionné</div>`}
        </div>

        <div class="card-version">Somfy Protexial Card ${CARD_VERSION}</div>
      </div>
    `;

    // Boutons
    this.shadowRoot.querySelectorAll(".btn[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        
      this._hass.callService(
      "alarm_control_panel",
        action === "disarm" ? "alarm_disarm" :
        action === "arm_home" ? "alarm_arm_home" : "alarm_arm_away",
        {},
        { entity_id: this.config.alarm_entity }
      );
         
      });
    });
  }

  // ── Mise à jour légère (sans reconstruire le DOM) ────
  _update() {
    if (!this._hass) return;

    const alarmEnt   = this._getState(this.config.alarm_entity);
    const alarmState = alarmEnt?.state ?? "unavailable";
    const { label: alarmLabel, color: alarmColor } = this._alarmLabel(alarmState);
    const isArmed     = !["disarmed", "unavailable"].includes(alarmState);
    const isTriggered = alarmState === "triggered";
    const sinceLabel  = this._sinceLabel(this.config.alarm_entity);
    const sr = this.shadowRoot;

    // Icône alarme
    const iconWrap = sr.querySelector(".alarm-icon-wrap");
    if (iconWrap) {
      iconWrap.style.color = alarmColor;
      iconWrap.style.boxShadow = (isArmed || isTriggered) ? `0 0 14px ${alarmColor}88` : "";
    }

    // État + depuis
    const stateEl = sr.querySelector(".alarm-state");
    if (stateEl) { stateEl.textContent = alarmLabel; stateEl.style.color = alarmColor; }
    const sinceEl = sr.querySelector(".alarm-since");
    if (sinceEl) sinceEl.textContent = sinceLabel;

    // Capteurs
    SENSORS_DEF.filter(s => this.config.sensors.includes(s.key)).forEach(s => {
      const row = sr.querySelector(`.sensor-row[data-key="${s.key}"]`);
      if (!row) return;
      const { statusLabel, statusColor, dotColor } = this._sensorValues(s);
      const statusEl = row.querySelector(".sensor-status");
      const dotEl    = row.querySelector(".dot");
      const valEl    = row.querySelector(".sensor-val");
      if (statusEl) statusEl.style.color = statusColor;
      if (dotEl)    dotEl.style.background = dotColor;
      if (valEl)    valEl.textContent = statusLabel;
    });
  }

  getCardSize() { return 5; }
}

if (!customElements.get("somfy-protexial-card"))
  customElements.define("somfy-protexial-card", SomfyProtexialCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "somfy-protexial-card",
  name: "Somfy Protexial Card",
  description: "Carte personnalisée pour alarme Somfy Protexial",
  configurable: true,
});
