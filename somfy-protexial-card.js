/* ========================================================
   Somfy Protexial Card  
   ======================================================== */
console.log("VERSION LOCAL TEST");

const CARD_VERSION = "v0.0.2";

const SENSORS_DEF = [
  { key: "capteur1", defaultEntity: "binary_sensor.somfy_protexial_batterie",               defaultLabel: "Affiche Capteur 1", defaultText: "Batterie",        type: "binary" },
  { key: "capteur2", defaultEntity: "binary_sensor.somfy_protexial_centrale",               defaultLabel: "Affiche Capteur 3", defaultText: "Centrale",        type: "binary" },
  { key: "capteur3", defaultEntity: "binary_sensor.somfy_protexial_portes_ou_fenetres",     defaultLabel: "Affiche Capteur 8", defaultText: "Portes/Fenêtres", type: "binary" },
  { key: "capteur4", defaultEntity: "binary_sensor.somfy_protexial_mouvement",              defaultLabel: "Affiche Capteur 6", defaultText: "Mouvement",       type: "binary" },
  { key: "capteur5", defaultEntity: "binary_sensor.somfy_protexial_camera",                 defaultLabel: "Affiche Capteur 2", defaultText: "Caméra",          type: "info"   },
  { key: "capteur6", defaultEntity: "binary_sensor.somfy_protexial_comm_centrale_capteurs", defaultLabel: "Affiche Capteur 4", defaultText: "Capteurs",        type: "binary" },
  { key: "capteur7", defaultEntity: "binary_sensor.somfy_protexial_communication_gsm",      defaultLabel: "Affiche Capteur 5", defaultText: "Gsm",             type: "binary" },
  { key: "capteur8", defaultEntity: "sensor.somfy_protexial_operateur_gsm",                 defaultLabel: "Affiche Capteur 7", defaultText: "Opérateur",       type: "info"   },
  { key: "capteur9", defaultEntity: "sensor.somfy_protexial_signal_gsm_5",                  defaultLabel: "Affiche Capteur 9", defaultText: "Signal Gsm",      type: "info"   },
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
      const formAlarm = this.shadowRoot.getElementById("form_alarm");
      formAlarm.hass   = this._hass;
      formAlarm.schema = this._alarmSchema;
      formAlarm.data   = { alarm_entity: cfg.alarm_entity || "alarm_control_panel.alarme" };

      formAlarm.addEventListener("value-changed", e => {
        e.stopPropagation();
        this._fireConfig({ ...this._config, alarm_entity: e.detail.value.alarm_entity });
      });

      const formTitle = this.shadowRoot.getElementById("form_title");
      formTitle.hass   = this._hass;
      formTitle.schema = this._titleSchema;
      formTitle.data   = { title: cfg.title || "Somfy Protexial — Contrôle" };

      formTitle.addEventListener("value-changed", e => {
        e.stopPropagation();
        this._fireConfig({ ...this._config, title: e.detail.value.title });
      });

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
          shown.length = 0;
          shown.push(...newShown);
          this._fireConfig(this._config);
        });

        const form = block.querySelector(`#form_${s.key}`);
        form.hass   = this._hass;
        form.schema = this._sensorSchema(s);
        form.data   = {
          [`entity_${s.key}`]: entities[s.key] || s.defaultEntity,
          [`label_${s.key}`]:  labels[s.key]   || s.defaultText,
        };
      });
    });
  }
}

// ── Card ────────────────────────────────────────────────
class SomfyProtexialCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
  }

  _getState(entityId) { return this._hass?.states[entityId]; }

  _sensorValues(sensor) {
    const entityId  = this.config.entities[sensor.key] || sensor.defaultEntity;
    const ent       = this._getState(entityId);
    const state     = ent?.state ?? "unavailable";
    const isUnavail = state === "unavailable";

    let statusLabel, statusColor, dotColor;

    if (sensor.type === "binary") {
      const okStates = ["ok", "non détecté", "fermées"];
      const isOk = okStates.includes(String(state).toLowerCase());

      statusLabel = isUnavail ? "Indisponible" : state;
      statusColor = isUnavail
        ? "var(--disabled-color)"
        : isOk
          ? "#4ade80"
          : "#ef4444";

      dotColor = statusColor;
    } else {
      statusLabel = isUnavail ? "Indisponible" : state;
      statusColor = isUnavail ? "var(--disabled-color)" : "var(--primary-text-color)";
      dotColor    = isUnavail ? "var(--disabled-color)" : "var(--primary-color)";
    }

    return { statusLabel, statusColor, dotColor };
  }

  _render() {
    if (!this._hass) return;

    const activeSensors = SENSORS_DEF.filter(s => this.config.sensors.includes(s.key));

    const iconLock = `<svg class="ei" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`;

    this.shadowRoot.innerHTML = `
      <div class="alarm-actions">
        <button class="btn btn-disarm" data-action="disarm">${iconLock} Désarmer</button>
        <button class="btn btn-arm-home" data-action="arm_home">${iconLock} Présent</button>
        <button class="btn btn-arm-away" data-action="arm_away">${iconLock} Absent</button>
      </div>

      <div class="sensors-section">
        ${activeSensors.map(s => {
          const label = this.config.labels[s.key] || s.defaultText;
          const { statusLabel, statusColor, dotColor } = this._sensorValues(s);

          return `
            <div class="sensor-row">
              <span>${label}</span>
              <span style="color:${statusColor}">
                <span class="dot" style="background:${dotColor}"></span>
                ${statusLabel}
              </span>
            </div>`;
        }).join("")}
      </div>
    `;
  }

  _update() {}
}

customElements.define("somfy-protexial-card", SomfyProtexialCard);
