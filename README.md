[![GitHub Release][releases-shield]][releases]
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![Community Forum][forum-shield]][forum]

# 🛡️ somfy-alarm-card

Carte personnalisée Home Assistant pour les centrales **Somfy Protexial / Protexiom / Protexial IO**.

Elle affiche en une seule carte l'état de l'alarme, les boutons de contrôle et l'état des capteurs fournis par l'intégration [somfy-protexial](https://github.com/the8tre/somfy-protexial).

![Aperçu thème sombre](doc/images/dark_example.jpg)

---

## ✅ Prérequis

- Home Assistant avec l'intégration [somfy-protexial](https://github.com/the8tre/somfy-protexial) installée et configurée
- Les entités suivantes doivent exister dans HA :

| Entité | Description |
|--------|-------------|
| `alarm_control_panel.alarme` | Centrale d'alarme |
| `binary_sensor.batterie` | État des batteries |
| `binary_sensor.boitier` | État du boîtier |
| `binary_sensor.communication_radio` | Communication Centrale ↔ Capteurs |
| `binary_sensor.communication_gsm` | Communication GSM |

---

## 📥 Installation

### Via HACS (recommandé) 🔄
1. Ajoutez ce dépôt à HACS :
   **Dépôts personnalisés** → **Ajouter un dépôt personnalisé** → `https://github.com/developpeurbox/footao-game-card/`

### Ou manuellement 🛠️

1. Télécharger le fichier `somfy-alarm-card.js`
2. Le copier dans le répertoire `/config/www/` de Home Assistant
3. Dans HA : **Paramètres → Tableaux de bord → Ressources → Ajouter une ressource**
   - URL : `/local/somfy-alarm-card.js`
   - Type : **Module JavaScript**
4. Vider le cache du navigateur ou de l'app Android (**Paramètres → Compagnon → Vider le cache**)

---

## 🎯 Utilisation

Ajouter la carte en YAML dans votre tableau de bord :

```yaml
type: custom:somfy-alarm-card
alarm_entity: alarm_control_panel.alarme
battery_entity: binary_sensor.batterie
boitier_entity: binary_sensor.boitier
radio_entity: binary_sensor.communication_radio
gsm_entity: binary_sensor.communication_gsm
```

Toutes les options correspondent aux noms d'entités par défaut de l'intégration somfy-protexial. Si vos entités ont des noms différents, adaptez les valeurs en conséquence.

---

## ✨ Fonctionnalités

### 🔐 Section Contrôle
- Affiche l'état courant de l'alarme avec couleur dynamique selon l'état
- Indique depuis combien de temps l'alarme est dans cet état (ex. *depuis 1h30*)
- Glow statique sur l'icône quand l'alarme est armée ou déclenchée
- 4 boutons d'action :

| Bouton | Action |
|--------|--------|
| Désarmer | `disarm` |
| Absent | `arm_away` |
| Présent | `arm_home` |
| Nuit | `arm_night` |

### 📡 Section Capteurs
- Affiche les 4 capteurs de statut avec indicateur coloré
- 🟢 **OK** — état nominal
- 🔴 **Valeur KO** — alerte (affichée telle quelle : *Pas de réseau*, *Problème*, *Vérifier la liste des éléments*…)

### 🎨 Thème
- S'adapte automatiquement au thème HA (clair / sombre) via les variables CSS natives de Home Assistant

---

## 🚦 États de l'alarme

| État HA | Libellé affiché | Couleur |
|---------|----------------|---------|
| `disarmed` | Désactivée | Gris |
| `armed_away` | Armée (absent) | Vert |
| `armed_home` | Armée (présent) | Orange |
| `armed_night` | Armée (nuit) | Violet |
| `arming` | Armement… | Orange |
| `pending` | En attente… | Orange |
| `triggered` | DÉCLENCHÉE ! | Rouge |
| `unavailable` | Indisponible | Gris |

---

## 🔗 Intégration associée

Cette carte est conçue pour fonctionner avec :

👉 [the8tre/somfy-protexial](https://github.com/the8tre/somfy-protexial) — Intégration Home Assistant pour centrale SOMFY Protexial / Protexiom / Protexial IO

---

## 📄 Licence

MIT

[releases-shield]: https://img.shields.io/github/v/release/developpeurbox/somfy-protexiom-card?style=for-the-badge
[releases]: https://github.com/developpeurbox/somfy-protexiom-card/releases
[hacs-badge]: https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge
[hacs]: https://github.com/hacs/integration
[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg?style=for-the-badge
[forum]: https://community.home-assistant.io/

[commits]: https://github.com/developpeurbox/somfy-protexiom-card/commits/main
[hacsbadge]: https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge
[exampleimg]: example.png
