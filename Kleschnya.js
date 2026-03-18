(function() {
  'use strict';

  if (window.battleGameInitialized) {
    console.warn('⚠️ Игра уже инициализирована!');
    return;
  }
  window.battleGameInitialized = true;

  document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Загрузка КЛЕШНИ...');

    const openBtn = document.getElementById('openGameBtn');
    const gameSection = document.getElementById('gameSection');
    const newGameBtn = document.getElementById('newGameBtn');
    const endTurnBtn = document.getElementById('endTurnBtn');
    const canvas = document.getElementById('gameCanvas');
    const widthInput = document.getElementById('gameWidth');
    const heightInput = document.getElementById('gameHeight');
    const currentPlayerSpan = document.getElementById('currentPlayerDisplay');
    const actionsLeftSpan = document.getElementById('actionsLeftDisplay');
    const playerColorSample = document.getElementById('playerColorSample');

    if (!openBtn || !gameSection || !canvas) {
      console.error('❌ Не найдены необходимые элементы игры');
      return;
    }

    class BattleGame {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 30;
        this.height = 30;
        this.cellSize = 20;
        this.grid = []; // 2D массив: null - пусто, 'P1','P2' - крестики, 'P1Q','P2Q' - матки, 'C1','C2' - клешни
        this.currentPlayer = 1;
        this.actionsLeft = 10;
        this.gameOver = false;
        this.winner = null;

        this.firstMoveP1 = true;
        this.firstMoveP2 = true;

        this.startZoneP1 = null;
        this.startZoneP2 = null;

        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.canvas.addEventListener('click', this.handleCanvasClick);
      }

      initGame(width, height) {
        console.log(`🔄 Новая игра: ${width}x${height}`);
        this.width = Math.min(200, Math.max(10, width));
        this.height = Math.min(200, Math.max(10, height));
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.currentPlayer = 1;
        this.actionsLeft = 10;
        this.gameOver = false;
        this.winner = null;
        this.firstMoveP1 = true;
        this.firstMoveP2 = true;

        this.generateStartZones();
        this.draw();

        this.updateUI();
      }

      generateStartZones() {
        const zoneSize = 5;
        const margin = 2;
        const availableW = this.width - 2 * zoneSize - 2 * margin;
        const availableH = this.height - 2 * zoneSize - 2 * margin;

        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);

        let x1 = margin;
        let y1 = margin;
        let x2 = this.width - zoneSize - margin;
        let y2 = this.height - zoneSize - margin;

        if (x1 + zoneSize > x2 || y1 + zoneSize > y2) {
          const halfZone = Math.floor(zoneSize / 2);
          x1 = Math.max(0, centerX - zoneSize - 2);
          y1 = Math.max(0, centerY - zoneSize - 2);
          x2 = Math.min(this.width - zoneSize, centerX + 2);
          y2 = Math.min(this.height - zoneSize, centerY + 2);
        }

        this.startZoneP1 = { x1, y1, x2: x1 + zoneSize - 1, y2: y1 + zoneSize - 1 };
        this.startZoneP2 = { x2, y2, x2: x2 + zoneSize - 1, y2: y2 + zoneSize - 1 };

        console.log('Зона P1:', this.startZoneP1);
        console.log('Зона P2:', this.startZoneP2);
      }

      isInStartZone(row, col) {
        if (this.currentPlayer === 1 && this.firstMoveP1) {
          return (row >= this.startZoneP1.y1 && row <= this.startZoneP1.y2 &&
                  col >= this.startZoneP1.x1 && col <= this.startZoneP1.x2);
        }
        if (this.currentPlayer === 2 && this.firstMoveP2) {
          return (row >= this.startZoneP2.y1 && row <= this.startZoneP2.y2 &&
                  col >= this.startZoneP2.x1 && col <= this.startZoneP2.x2);
        }
        return false;
      }

      canPlaceUnit(row, col) {
        if (this.grid[row][col] !== null) return false;

        if ((this.currentPlayer === 1 && this.firstMoveP1) ||
            (this.currentPlayer === 2 && this.firstMoveP2)) {
          return this.isInStartZone(row, col);
        }

        const playerUnit = this.currentPlayer === 1 ? 'P1' : 'P2';
        const playerQueen = this.currentPlayer === 1 ? 'P1Q' : 'P2Q';
        const playerClaw = this.currentPlayer === 1 ? 'C1' : 'C2';

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) continue;

            const cell = this.grid[nr][nc];
            if (cell === playerUnit || cell === playerQueen) {
              return true;
            }
            if (cell === playerClaw) {
              if (this.isClawActive(nr, nc, this.currentPlayer)) {
                return true;
              }
            }
          }
        }
        return false;
      }

      isClawActive(row, col, player) {
        const playerUnit = player === 1 ? 'P1' : 'P2';
        const playerQueen = player === 1 ? 'P1Q' : 'P2Q';
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) continue;
            const cell = this.grid[nr][nc];
            if (cell === playerUnit || cell === playerQueen) {
              return true;
            }
          }
        }
        return false;
      }

      canAttack(row, col) {
        const cell = this.grid[row][col];
        if (!cell) return false;

        const enemyUnits = this.currentPlayer === 1 ? ['P2', 'P2Q'] : ['P1', 'P1Q'];
        if (!enemyUnits.includes(cell)) return false;

        const playerUnit = this.currentPlayer === 1 ? 'P1' : 'P2';
        const playerQueen = this.currentPlayer === 1 ? 'P1Q' : 'P2Q';
        const playerClaw = this.currentPlayer === 1 ? 'C1' : 'C2';

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) continue;

            const neighbor = this.grid[nr][nc];
            if (neighbor === playerUnit || neighbor === playerQueen) {
              return true;
            }
            if (neighbor === playerClaw && this.isClawActive(nr, nc, this.currentPlayer)) {
              return true;
            }
          }
        }
        return false;
      }

      handleCanvasClick(e) {
        if (this.gameOver) {
          alert(`Игра окончена! Победил игрок ${this.winner}`);
          return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const col = Math.floor(mouseX / this.cellSize);
        const row = Math.floor(mouseY / this.cellSize);

        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return;

        if (this.actionsLeft <= 0) {
          alert('У вас больше нет действий в этом ходу. Завершите ход.');
          return;
        }

        this.processAction(row, col);
      }

      processAction(row, col) {
        const cell = this.grid[row][col];
        const playerUnit = this.currentPlayer === 1 ? 'P1' : 'P2';
        const playerQueen = this.currentPlayer === 1 ? 'P1Q' : 'P2Q';
        const playerClaw = this.currentPlayer === 1 ? 'C1' : 'C2';
        const enemyQueen = this.currentPlayer === 1 ? 'P2Q' : 'P1Q';

        if ((this.currentPlayer === 1 && this.firstMoveP1) ||
            (this.currentPlayer === 2 && this.firstMoveP2)) {
          if (this.isInStartZone(row, col) && cell === null) {
            this.grid[row][col] = playerQueen;
            if (this.currentPlayer === 1) this.firstMoveP1 = false;
            else this.firstMoveP2 = false;
            this.actionsLeft--;
            this.draw();
            this.updateUI();
            return;
          } else {
            alert('Сначала поставьте матку в своей стартовой зоне!');
            return;
          }
        }

        if (cell === null && this.canPlaceUnit(row, col)) {
          this.grid[row][col] = playerUnit;
          this.actionsLeft--;
          this.draw();
          this.updateUI();
          return;
        }

        if (cell !== null && this.canAttack(row, col)) {
          const isQueen = (cell === 'P1Q' || cell === 'P2Q');
          this.grid[row][col] = playerClaw;
          this.actionsLeft--;

          if (isQueen) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            alert(`🎉 Игрок ${this.currentPlayer} победил, съев вражескую матку!`);
            this.draw();
            this.updateUI();
            return;
          }

          this.draw();
          this.updateUI();
          return;
        }

        alert('Невозможное действие');
      }

      endTurn() {
        if (this.gameOver) return;

        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.actionsLeft = 10;

        this.updateUI();
        this.draw();
      }

      updateUI() {
        if (currentPlayerSpan) currentPlayerSpan.textContent = this.currentPlayer;
        if (actionsLeftSpan) actionsLeftSpan.textContent = this.actionsLeft;
        if (playerColorSample) {
          playerColorSample.style.backgroundColor = this.currentPlayer === 1 ? '#ff4444' : '#4444ff';
          playerColorSample.style.borderColor = this.currentPlayer === 1 ? '#cc0000' : '#0000cc';
        }

        if ((this.currentPlayer === 1 && this.firstMoveP1) ||
            (this.currentPlayer === 2 && this.firstMoveP2)) {
        }
      }

      draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cellW = Math.floor(w / this.width);
        const cellH = Math.floor(h / this.height);
        this.cellSize = Math.min(cellW, cellH);

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.width; i++) {
          ctx.beginPath();
          ctx.moveTo(i * cellW, 0);
          ctx.lineTo(i * cellW, h);
          ctx.stroke();
        }
        for (let i = 0; i <= this.height; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * cellH);
          ctx.lineTo(w, i * cellH);
          ctx.stroke();
        }

        for (let row = 0; row < this.height; row++) {
          for (let col = 0; col < this.width; col++) {
            const cell = this.grid[row][col];
            if (!cell) continue;

            const x = col * cellW;
            const y = row * cellH;

            let fillColor, textColor = '#fff';
            if (cell === 'P1' || cell === 'P1Q') {
              fillColor = '#ff4444';
            } else if (cell === 'P2' || cell === 'P2Q') {
              fillColor = '#4444ff';
            } else if (cell === 'C1') {
              fillColor = '#880000';
            } else if (cell === 'C2') {
              fillColor = '#000088';
            }

            ctx.fillStyle = fillColor;
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

            ctx.font = `bold ${Math.min(cellW, cellH) * 0.6}px monospace`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let symbol = '';
            if (cell === 'P1' || cell === 'P2') symbol = '✖';
            else if (cell === 'P1Q' || cell === 'P2Q') symbol = '♕';
            else if (cell === 'C1' || cell === 'C2') symbol = '◆';

            ctx.fillText(symbol, x + cellW / 2, y + cellH / 2);

            if (cell === 'P1Q' || cell === 'P2Q') {
              ctx.strokeStyle = '#ffd700';
              ctx.lineWidth = 3;
              ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
            }
          }
        }

        if ((this.currentPlayer === 1 && this.firstMoveP1) ||
            (this.currentPlayer === 2 && this.firstMoveP2)) {
          const zone = this.currentPlayer === 1 ? this.startZoneP1 : this.startZoneP2;
          if (zone) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            ctx.strokeRect(zone.x1 * cellW, zone.y1 * cellH,
                          (zone.x2 - zone.x1 + 1) * cellW,
                          (zone.y2 - zone.y1 + 1) * cellH);
            ctx.setLineDash([]);
          }
        }
      }
    }

    const game = new BattleGame(canvas);

    openBtn.addEventListener('click', () => {
      gameSection.classList.toggle('hidden');
      if (!gameSection.classList.contains('hidden')) {
        const w = parseInt(widthInput.value) || 30;
        const h = parseInt(heightInput.value) || 30;
        game.initGame(w, h);
      }
    });

    newGameBtn.addEventListener('click', () => {
      const w = parseInt(widthInput.value);
      const h = parseInt(heightInput.value);
      if (isNaN(w) || w < 10 || w > 200 || isNaN(h) || h < 10 || h > 200) {
        alert('Размеры поля должны быть от 10 до 200');
        return;
      }
      game.initGame(w, h);
    });

    endTurnBtn.addEventListener('click', () => {
      game.endTurn();
    });

    window.battleGame = game;

    console.log('✅ Иницализация игры завершена');
  });
})();
