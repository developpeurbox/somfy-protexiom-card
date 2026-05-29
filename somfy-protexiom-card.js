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
      { name: `label_${s.key}`, selector: { text: {} } },
    ];
  }

  _render() {
    const cfg = this._config || {};
    const shown = cfg.sensors || SENSORS_DEF.map(s => s.key);
    const labels = cfg.labels || {};
    const entities = cfg.entities || {};

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: var(--primary-font-family, sans-serif); }
        ha-form { display: block; margin-bottom: 8px; }
        ha-expansion-panel {
          display: block; margin-bottom: 8px;
          --expansion-panel-content-padding: 12px;
          border-radius: 6px;
        }
        .sensor-block { border-top: 1px solid var(--divider-color); padding: 12px 0 4px; }
        .sensor-header { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
        .sensor-name { font-size: 13px; font-weight: 600; }
      </style>

      <ha-form id="form_alarm"></ha-form>
      <ha-form id="form_title"></ha-form>
      <div id="sensors_container"></div>
    `;

    requestAnimationFrame(() => {
      const formAlarm = this.shadowRoot.getElementById("form_alarm");
      formAlarm.hass = this._hass;
      formAlarm.schema = this._alarmSchema;
      formAlarm.data = { alarm_entity: cfg.alarm_entity };

      formAlarm.addEventListener("value-changed", e => {
        this._fireConfig({ ...this._config, alarm_entity: e.detail.value.alarm_entity });
      });

      const formTitle = this.shadowRoot.getElementById("form_title");
      formTitle.hass = this._hass;
      formTitle.schema = this._titleSchema;
      formTitle.data = { title: cfg.title };

      formTitle.addEventListener("value-changed", e => {
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
      });
    });
  }
}

customElements.define("somfy-protexial-card-editor", SomfyProtexialCardEditor);

// ── Card ────────────────────────────────────────────────
class SomfyProtexialCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
  }

  setConfig(config) {
    this.config = {
      alarm_entity: config.alarm_entity,
      sensors: config.sensors || SENSORS_DEF.map(s => s.key),
      labels: config.labels || {},
      entities: config.entities || {},
      title: config.title
    };
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

  _getState(entityId) {
    return this._hass?.states[entityId];
  }

  _sensorValues(sensor) {
    const entityId = this.config.entities?.[sensor.key] || sensor.defaultEntity;
    const ent = this._getState(entityId);
    const state = ent?.state ?? "unavailable";
    const isUnavail = state === "unavailable";

    const okStates = ["on", "open", "open", "detected", "non détecté", "fermées"];
    const isOk = okStates.includes(String(state).toLowerCase());

    let statusLabel, statusColor, dotColor;

    if (sensor.type === "binary") {
      statusLabel = isUnavail ? "Indisponible" : state;
      statusColor = isUnavail ? "var(--disabled-color)" : (isOk ? "#4ade80" : "#ef4444");
      dotColor = statusColor;
    } else {
      statusLabel = isUnavail ? "Indisponible" : state;
      statusColor = "var(--primary-text-color)";
      dotColor = "var(--primary-color)";
    }

    return { statusLabel, statusColor, dotColor };
  }

  _render() {
    if (!this._hass) return;

    const activeSensors = SENSORS_DEF.filter(s => this.config.sensors.includes(s.key));

    this.shadowRoot.innerHTML = `
      <div class="alarm-actions">
        <button class="btn" data-action="disarm">Désarmer</button>
        <button class="btn" data-action="arm_home">Présent</button>
        <button class="btn" data-action="arm_away">Absent</button>
      </div>

      <div class="sensors-section">
        ${activeSensors.map(s => {
          const { statusLabel, statusColor, dotColor } = this._sensorValues(s);
          const label = this.config.labels?.[s.key] || s.defaultText;

          return `
            <div class="sensor-row">
              <span>${label}</span>
              <span style="color:${statusColor}">
                <span style="background:${dotColor}" class="dot"></span>
                ${statusLabel}
              </span>
            </div>
          `;
        }).join("")}
      </div>
    `;

    this.shadowRoot.querySelectorAll(".btn[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        let service;

        switch (btn.dataset.action) {
          case "disarm":
            service = "alarm_disarm";
            break;
          case "arm_home":
            service = "alarm_arm_home";
            break;
          case "arm_away":
          default:
            service = "alarm_arm_away";
            break;
        }

        this._hass.callService(
          "alarm_control_panel",
          service,
          {},
          { entity_id: this.config.alarm_entity }
        );
      });
    });
  }

  _update() {}
}

customElements.define("somfy-protexial-card", SomfyProtexialCard);
