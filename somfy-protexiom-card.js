/* ========================================================
   Somfy Protexial Card
   ======================================================== */

console.log("VERSION LOCAL TEST");

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

// ─────────────────────────────────────────────
// Editor
// ─────────────────────────────────────────────

class SomfyProtexialCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = {};
    this._built = false;
  }

  set hass(hass) {
    this._hass = hass;
    this.shadowRoot?.querySelectorAll("ha-form, ha-entity-picker")
      .forEach(el => el.hass = hass);
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._built) {
      this._built = true;
      this._render();
    }
  }

  _fireConfig(cfg) {
    this._config = cfg;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: cfg },
      bubbles: true,
      composed: true,
    }));
  }

  get _alarmSchema() {
    return [{ name: "alarm_entity", selector: { entity: { domain: "alarm_control_panel" } } }];
  }

  get _titleSchema() {
    return [{ name: "title", selector: { text: {} } }];
  }

  _render() {
    const cfg = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; font-family: sans-serif; }
        ha-form { margin-bottom: 8px; display:block; }
      </style>

      <ha-form id="form_alarm"></ha-form>
      <ha-form id="form_title"></ha-form>
      <div id="sensors"></div>
    `;

    requestAnimationFrame(() => {
      const formAlarm = this.shadowRoot.getElementById("form_alarm");
      formAlarm.hass = this._hass;
      formAlarm.schema = this._alarmSchema;
      formAlarm.data = { alarm_entity: cfg.alarm_entity || "alarm_control_panel.alarme" };

      formAlarm.addEventListener("value-changed", e => {
        this._fireConfig({
          ...this._config,
          alarm_entity: e.detail.value.alarm_entity
        });
      });

      const formTitle = this.shadowRoot.getElementById("form_title");
      formTitle.hass = this._hass;
      formTitle.schema = this._titleSchema;
      formTitle.data = { title: cfg.title || "Somfy Protexial" };

      formTitle.addEventListener("value-changed", e => {
        this._fireConfig({
          ...this._config,
          title: e.detail.value.title
        });
      });
    });
  }
}

// ─────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────

class SomfyProtexialCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
  }

  setConfig(config) {
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _getState(entityId) {
    return this._hass?.states?.[entityId];
  }

  _sensorValues(sensor) {
    const entityId = this.config.entities?.[sensor.key] || sensor.defaultEntity;
    const ent = this._getState(entityId);
    const state = ent?.state ?? "unavailable";

    const okStates = ["on", "open", "open", "detected", "non détecté", "fermées"];
    const isOk = okStates.includes(String(state).toLowerCase());

    const isUnavail = state === "unavailable";

    return {
      statusLabel: state,
      statusColor: isUnavail ? "var(--disabled-color)" : (isOk ? "#4ade80" : "#ef4444"),
      dotColor: isUnavail ? "gray" : (isOk ? "#4ade80" : "#ef4444")
    };
  }

  _render() {
    if (!this._hass) return;

    const activeSensors = SENSORS_DEF.filter(s =>
      (this.config.sensors || []).includes(s.key)
    );

    this.shadowRoot.innerHTML = `
      <style>
        .sensor-row { display:flex; justify-content:space-between; padding:6px 0; }
        .dot { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:6px; }
      </style>

      <div>
        <button class="btn" data-action="disarm">Désarmer</button>
        <button class="btn" data-action="arm_home">Présent</button>
        <button class="btn" data-action="arm_away">Absent</button>
      </div>

      <div>
        ${activeSensors.map(s => {
          const label = this.config.labels?.[s.key] || s.defaultText;
          const v = this._sensorValues(s);

          return `
            <div class="sensor-row">
              <span>${label}</span>
              <span>
                <span class="dot" style="background:${v.dotColor}"></span>
                ${v.statusLabel}
              </span>
            </div>
          `;
        }).join("")}
      </div>
    `;

    this.shadowRoot.querySelectorAll(".btn").forEach(btn => {
      btn.addEventListener("click", () => {
        let service = "alarm_arm_away";

        if (btn.dataset.action === "disarm") service = "alarm_disarm";
        if (btn.dataset.action === "arm_home") service = "alarm_arm_home";

        this._hass.callService(
          "alarm_control_panel",
          service,
          {},
          { entity_id: this.config.alarm_entity }
        );
      });
    });
  }
}

// ─────────────────────────────────────────────
// REQUIRED: Home Assistant registration
// ─────────────────────────────────────────────

customElements.define("somfy-protexial-card", SomfyProtexialCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "somfy-protexial-card",
  name: "Somfy Protexial Card",
  description: "Carte personnalisée Somfy Protexial",
  configurable: true,
});
