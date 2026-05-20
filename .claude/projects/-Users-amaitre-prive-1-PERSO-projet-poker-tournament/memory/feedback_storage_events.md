---
name: storage events need separate windows
description: localStorage storage events only fire between separate browser windows (not tabs) in Opera — TV display must open as popup window
type: feedback
---

L'événement `storage` de localStorage ne se déclenche pas entre onglets dans Opera, uniquement entre fenêtres séparées. Le bouton TV doit utiliser `window.open()` avec `popup=true` pour forcer l'ouverture en nouvelle fenêtre.

**Why:** L'utilisateur a passé du temps à debugger un timer TV qui ne se mettait pas à jour. La cause était qu'il ouvrait `/?display` dans un nouvel onglet au lieu d'une nouvelle fenêtre.

**How to apply:** Toujours utiliser `popup=true` dans `window.open()` pour la fenêtre display/TV. Si un mécanisme de sync cross-window est nécessaire, vérifier que les fenêtres sont bien séparées.