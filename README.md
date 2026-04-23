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
      ├─ _shared/
      │  ├─ game-shell.css
      │  └─ game-shell.js
      ├─ tetris/
      │  ├─ index.html
      │  └─ game.js
      ├─ bomberman/
      │  ├─ index.html
      │  └─ game.js
      ├─ pacman/
      │  ├─ index.html
      │  └─ game.js
      ├─ pinball/
      │  ├─ index.html
      │  └─ game.js
      └─ snake/
         ├─ index.html
         └─ game.js
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

## Gameplay implémenté

- **Tetris** : chute de pièces, rotation, suppression de lignes, score race 1v1.
- **Bomberman** : déplacement sur grille, pose de bombes, explosions en croix, duel de score.
- **Pac-Man** : collecte de pellets dans un labyrinthe, course au score.
- **Pinball** : style arcade (paddle + balle + briques), course au score.
- **Snake** : serpent, nourriture, croissance, duel de score en temps réel.

## Événements Socket.io

- `queue:join` : entrée en file pour un jeu.
- `queue:waiting` : en attente d'adversaire.
- `match:found` : création de salle 1v1.
- `game:update` : synchronisation d'état en temps réel.
- `game:event` : évènements gameplay personnalisés.
- `chat:message` : chat en salon.
- `match:ended` : fin anticipée (déconnexion/quitter).
