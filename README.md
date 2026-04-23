# RetroNet Arena (XP x PS2)

Plateforme de jeux multijoueur 1v1 en temps réel avec Socket.io.

## Structure du projet

```text
PS2/
├─ package.json
├─ server.js
├─ README.md
├─ src/
└─ public/
   ├─ index.html
   ├─ css/
   │  └─ style.css
   ├─ js/
   │  └─ main.js
   ├─ assets/
   └─ games/
      ├─ tetris/index.html
      ├─ bomberman/index.html
      ├─ pacman/index.html
      ├─ pinball/index.html
      └─ snake/index.html
```

## Lancer en local

```bash
npm install
npm run dev
```

## Exposer en ligne avec ngrok

1. Démarrer le serveur:

```bash
npm start
```

2. Dans un second terminal:

```bash
ngrok http 3000
```

3. Utiliser l'URL HTTPS fournie par ngrok pour connecter des joueurs distants.

## Événements Socket.io (socle multijoueur)

- `queue:join` : entrée en file pour un jeu.
- `queue:waiting` : en attente d'adversaire.
- `match:found` : création de salle 1v1.
- `game:update` : synchronisation d'état en temps réel.
- `game:event` : évènements gameplay personnalisés.
- `chat:message` : chat en salon.
- `match:ended` : fin anticipée (déconnexion/quitter).
