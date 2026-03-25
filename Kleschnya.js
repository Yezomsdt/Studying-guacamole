(function() {
  'use strict';

  if (window.battleGameInitialized) {
    console.warn('⚠️ Клешня уже инициализирована!');
    return;
  }
  window.battleGameInitialized = true;

  document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Загрузка КЛЕШНИ...');

    const openBtn = document.getElementById('openGameBtn');
    const gameSection = document.getElementById('gameSection');
    const newGameBtn = document.getElementById('newGameBtn');
    const endTurnBtn = document.getElementById('endTurnBtn');
    const undoBtn = document.getElementById('undoBtn');
    const canvas = document.getElementById('gameCanvas');
    const widthInput = document.getElementById('gameWidth');
    const heightInput = document.getElementById('gameHeight');
    const currentPlayerSpan = document.getElementById('currentPlayerDisplay');
    const actionsLeftSpan = document.getElementById('actionsLeftDisplay');
    const playerColorSample = document.getElementById('playerColorSample');
    const player1ColorInput = document.getElementById('player1Color');
    const player2ColorInput = document.getElementById('player2Color');

    if (!openBtn || !gameSection || !canvas) {
      console.error('❌ Не найдены необходимые элементы клешни');
      return;
    }
    
    class BattleGame {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 30;
        this.height = 30;
        this.cellSize = 20;
        this.offsetX = 0;
        this.offsetY = 0;
        this.grid = [];
        this.currentPlayer = 1;
        this.actionsLeft = 10;
        this.gameOver = false;
        this.winner = null;

        this.firstMoveP1 = true;
        this.firstMoveP2 = true;

        this.startZoneP1 = null;
        this.startZoneP2 = null;

        this.history = [];

        this.player1Color = '#ff4444';
        this.player2Color = '#4444ff';

        this.clawComponents = { 1: [], 2: [] };

        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.canvas.addEventListener('click', this.handleCanvasClick);
      }

      updateColors() {
        if (player1ColorInput) this.player1Color = player1ColorInput.value;
        if (player2ColorInput) this.player2Color = player2ColorInput.value;
        this.draw();
        this.updateUI();
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
        this.history = [];

        this.generateStartZones();
        this.updateClawComponents();
        this.updateColors();
        this.draw();
        this.updateUI();
      }

      generateStartZones() {
        const zoneSize = 5;
        const margin = 2;
        let x1 = margin;
        let y1 = margin;
        let x2 = this.width - zoneSize - margin;
        let y2 = this.height - zoneSize - margin;

        if (x1 + zoneSize > x2 || y1 + zoneSize > y2) {
          const centerX = Math.floor(this.width / 2);
          const centerY = Math.floor(this.height / 2);
          x1 = Math.max(0, centerX - zoneSize - 2);
          y1 = Math.max(0, centerY - zoneSize - 2);
          x2 = Math.min(this.width - zoneSize, centerX + 2);
          y2 = Math.min(this.height - zoneSize, centerY + 2);
        }

        this.startZoneP1 = {
          x1: x1,
          y1: y1,
          x2: x1 + zoneSize - 1,
          y2: y1 + zoneSize - 1
        };
        this.startZoneP2 = {
          x1: x2,
          y1: y2,
          x2: x2 + zoneSize - 1,
          y2: y2 + zoneSize - 1
        };
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

      updateClawComponents() {
        this.clawComponents = { 1: [], 2: [] };
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));

        for (let player of [1, 2]) {
          const clawType = player === 1 ? 'C1' : 'C2';
          for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
              if (this.grid[i][j] === clawType && !visited[i][j]) {
                const component = [];
                const queue = [[i, j]];
                visited[i][j] = true;
                while (queue.length) {
                  const [r, c] = queue.shift();
                  component.push([r, c]);
                  for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                      if (dr === 0 && dc === 0) continue;
                      const nr = r + dr;
                      const nc = c + dc;
                      if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width &&
                          this.grid[nr][nc] === clawType && !visited[nr][nc]) {
                        visited[nr][nc] = true;
                        queue.push([nr, nc]);
                      }
                    }
                  }
                }
                this.clawComponents[player].push(component);
              }
            }
          }
        }

        for (let player of [1, 2]) {
          const playerUnit = player === 1 ? 'P1' : 'P2';
          const playerQueen = player === 1 ? 'P1Q' : 'P2Q';
          for (let comp of this.clawComponents[player]) {
            let active = false;
            for (let [r, c] of comp) {
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  if (dr === 0 && dc === 0) continue;
                  const nr = r + dr;
                  const nc = c + dc;
                  if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width) {
                    const cell = this.grid[nr][nc];
                    if (cell === playerUnit || cell === playerQueen) {
                      active = true;
                      break;
                    }
                  }
                }
                if (active) break;
              }
              if (active) break;
            }
            comp.active = active;
          }
        }
      }

      isAdjacentToActiveClaw(row, col, player) {
        if (!this.clawComponents[player]) return false;
        for (let comp of this.clawComponents[player]) {
          if (!comp.active) continue;
          for (let [cr, cc] of comp) {
            if (Math.abs(cr - row) <= 1 && Math.abs(cc - col) <= 1) {
              return true;
            }
          }
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

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) continue;
            const cell = this.grid[nr][nc];
            if (cell === playerUnit || cell === playerQueen) return true;
          }
        }

        if (this.isAdjacentToActiveClaw(row, col, this.currentPlayer)) return true;

        return false;
      }

      canAttack(row, col) {
        const cell = this.grid[row][col];
        if (!cell) return false;

        const enemyUnits = this.currentPlayer === 1 ? ['P2', 'P2Q'] : ['P1', 'P1Q'];
        if (!enemyUnits.includes(cell)) return false;

        const playerUnit = this.currentPlayer === 1 ? 'P1' : 'P2';
        const playerQueen = this.currentPlayer === 1 ? 'P1Q' : 'P2Q';

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr < 0 || nr >= this.height || nc < 0 || nc >= this.width) continue;
            const neighbor = this.grid[nr][nc];
            if (neighbor === playerUnit || neighbor === playerQueen) return true;
          }
        }

        if (this.isAdjacentToActiveClaw(row, col, this.currentPlayer)) return true;

        return false;
      }

      handleCanvasClick(e) {
        if (this.gameOver) {
          alert(`Игра окончена! Победил ${this.winner}`);
          return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const col = Math.floor((mouseX - this.offsetX) / this.cellSize);
        const row = Math.floor((mouseY - this.offsetY) / this.cellSize);

        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return;

        if (this.actionsLeft <= 0) {
          alert('Закончились ОД, заверши ход.');
          return;
        }

        this.processAction(row, col);
      }

      processAction(row, col) {
        const cell = this.grid[row][col];
        const playerUnit = this.currentPlayer === 1 ? 'P1' : 'P2';
        const playerQueen = this.currentPlayer === 1 ? 'P1Q' : 'P2Q';
        const playerClaw = this.currentPlayer === 1 ? 'C1' : 'C2';

        if ((this.currentPlayer === 1 && this.firstMoveP1) ||
            (this.currentPlayer === 2 && this.firstMoveP2)) {
          if (this.isInStartZone(row, col) && cell === null) {
            this.history.push({
              row, col,
              previousState: null,
              wasQueen: true
            });
            this.grid[row][col] = playerQueen;
            if (this.currentPlayer === 1) this.firstMoveP1 = false;
            else this.firstMoveP2 = false;
            this.actionsLeft--;
            this.updateClawComponents();
            this.draw();
            this.updateUI();
            return;
          } else {
            alert('Сначала поставь матку в своей стартовой зоне!');
            return;
          }
        }

        if (cell === null && this.canPlaceUnit(row, col)) {
          this.history.push({
            row, col,
            previousState: null,
            wasQueen: false
          });
          this.grid[row][col] = playerUnit;
          this.actionsLeft--;
          this.updateClawComponents();
          this.draw();
          this.updateUI();
          return;
        }

        if (cell !== null && this.canAttack(row, col)) {
          const isQueen = (cell === 'P1Q' || cell === 'P2Q');
          this.history.push({
            row, col,
            previousState: cell,
            wasQueen: false
          });
          this.grid[row][col] = playerClaw;
          this.actionsLeft--;

          if (isQueen) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            alert(`🎉 Игрок ${this.currentPlayer} победил, съев вражескую матку!`);
            this.updateClawComponents();
            this.draw();
            this.updateUI();
            return;
          }

          this.updateClawComponents();
          this.draw();
          this.updateUI();
          return;
        }

        console.log('Невозможно: cell=', cell, 'canPlaceUnit=', this.canPlaceUnit(row,col), 'canAttack=', this.canAttack(row,col));
        alert('Так ходить нельзя');
      }

      undoLastAction() {
        if (this.history.length === 0) {
          alert('Нет действий для отмены');
          return;
        }
        const last = this.history.pop();
        const row = last.row;
        const col = last.col;
        const previousCell = last.previousState;
        const wasQueen = last.wasQueen;

        this.grid[row][col] = previousCell;
        this.actionsLeft++;

        if (wasQueen && previousCell === null) {
          if (this.currentPlayer === 1) {
            this.firstMoveP1 = true;
          } else {
            this.firstMoveP2 = true;
          }
        }

        this.updateClawComponents();
        this.draw();
        this.updateUI();
      }

      endTurn() {
        if (this.gameOver) return;

        if (this.actionsLeft > 0) {
          alert('Сначала потрать все ОД!');
          return;
        }

        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.actionsLeft = 10;
        this.history = [];

        this.updateUI();
        this.draw();
      }

      updateUI() {
        if (currentPlayerSpan) currentPlayerSpan.textContent = this.currentPlayer;
        if (actionsLeftSpan) actionsLeftSpan.textContent = this.actionsLeft;
        if (playerColorSample) {
          playerColorSample.style.backgroundColor = this.currentPlayer === 1 ? this.player1Color : this.player2Color;
        }

        if (endTurnBtn) {
          endTurnBtn.disabled = (this.actionsLeft > 0);
        }
        if (undoBtn) {
          undoBtn.disabled = (this.history.length === 0 || this.gameOver);
        }
      }

      draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        this.cellSize = Math.floor(Math.min(
          canvas.width / this.width,
          canvas.height / this.height
        ));

        this.offsetX = (canvas.width - this.width * this.cellSize) / 2;
        this.offsetY = (canvas.height - this.height * this.cellSize) / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.width; i++) {
          const x = this.offsetX + i * this.cellSize;
          ctx.beginPath();
          ctx.moveTo(x, this.offsetY);
          ctx.lineTo(x, this.offsetY + this.height * this.cellSize);
          ctx.stroke();
        }
        for (let i = 0; i <= this.height; i++) {
          const y = this.offsetY + i * this.cellSize;
          ctx.beginPath();
          ctx.moveTo(this.offsetX, y);
          ctx.lineTo(this.offsetX + this.width * this.cellSize, y);
          ctx.stroke();
        }

        for (let row = 0; row < this.height; row++) {
          for (let col = 0; col < this.width; col++) {
            const cell = this.grid[row][col];
            if (!cell) continue;

            const x = this.offsetX + col * this.cellSize;
            const y = this.offsetY + row * this.cellSize;

            let fillColor;
            if (cell === 'P1' || cell === 'P1Q') fillColor = this.player1Color;
            else if (cell === 'P2' || cell === 'P2Q') fillColor = this.player2Color;
            else if (cell === 'C1') fillColor = this.darkenColor(this.player1Color, 0.7);
            else if (cell === 'C2') fillColor = this.darkenColor(this.player2Color, 0.7);

            ctx.fillStyle = fillColor;
            ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

            ctx.font = `bold ${Math.floor(this.cellSize * 0.6)}px monospace`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let symbol = '';
            if (cell === 'P1' || cell === 'P2') symbol = '✖';
            else if (cell === 'P1Q' || cell === 'P2Q') symbol = '♕';
            else if (cell === 'C1' || cell === 'C2') symbol = '◆';

            ctx.fillText(symbol, x + this.cellSize / 2, y + this.cellSize / 2);

            if (cell === 'P1Q' || cell === 'P2Q') {
              ctx.strokeStyle = '#ffd700';
              ctx.lineWidth = 3;
              ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
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
            ctx.strokeRect(
              this.offsetX + zone.x1 * this.cellSize,
              this.offsetY + zone.y1 * this.cellSize,
              (zone.x2 - zone.x1 + 1) * this.cellSize,
              (zone.y2 - zone.y1 + 1) * this.cellSize
            );
            ctx.setLineDash([]);
          }
        }
      }

      darkenColor(hex, factor) {
        let r = parseInt(hex.substring(1,3), 16);
        let g = parseInt(hex.substring(3,5), 16);
        let b = parseInt(hex.substring(5,7), 16);
        r = Math.floor(r * factor);
        g = Math.floor(g * factor);
        b = Math.floor(b * factor);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
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

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        game.undoLastAction();
      });
    }

    if (player1ColorInput) {
      player1ColorInput.addEventListener('input', () => {
        game.updateColors();
      });
    }
    if (player2ColorInput) {
      player2ColorInput.addEventListener('input', () => {
        game.updateColors();
      });
    }

    window.battleGame = game;
    console.log('✅ КЛЕШНЯ готова');
  });
})();
