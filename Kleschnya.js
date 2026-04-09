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
    const undoBtn = document.getElementById('undoBtn');
    const canvas = document.getElementById('gameCanvas');
    const widthInput = document.getElementById('gameWidth');
    const heightInput = document.getElementById('gameHeight');
    const currentPlayerSpan = document.getElementById('currentPlayerDisplay');
    const actionsLeftSpan = document.getElementById('actionsLeftDisplay');
    const playerColorSample = document.getElementById('playerColorSample');
    const colorPickersContainer = document.getElementById('colorPickersContainer');
    const playerCountRadios = document.querySelectorAll('input[name="playerCount"]');

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
        this.baseCellSize = 20;
        this.cellSize = 20;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1.0;
        this.grid = [];
        this.terrainGrid = [];
        this.numPlayers = 2;
        this.currentPlayer = 1;
        this.actionsLeft = 10;
        this.gameOver = false;
        this.winner = null;
        this.playersAlive = [];
        this.firstMove = [];
        this.startZones = [];
        this.history = [];
        this.playerColors = ['', '#ff4444', '#4444ff', '#44ff44', '#ffaa44'];

        this.clawComponents = {};

        this.mapTemplates = {
          'empty': {
            name: 'Пустошь',
            generate: (w, h) => {
              const terrain = Array(h).fill().map(() => Array(w).fill('land'));
              return terrain;
            }
          },
          'islands': {
            name: 'Острова',
            generate: (w, h) => {
              const terrain = Array(h).fill().map(() => Array(w).fill('water'));
              const zoneSize = Math.max(5, Math.floor(Math.min(w, h) / 8));
              const margin = 2;
              for (let r = margin; r < margin + zoneSize + 4; r++) {
                for (let c = margin; c < margin + zoneSize + 4; c++) {
                  if (r < h && c < w) terrain[r][c] = 'land';
                }
              }
              for (let r = h - zoneSize - margin - 4; r < h - margin; r++) {
                for (let c = w - zoneSize - margin - 4; c < w - margin; c++) {
                  if (r >= 0 && c >= 0) terrain[r][c] = 'land';
                }
              }
              for (let r = margin; r < margin + zoneSize + 4; r++) {
                for (let c = w - zoneSize - margin - 4; c < w - margin; c++) {
                  if (r < h && c >= 0) terrain[r][c] = 'land';
                }
              }
              for (let r = h - zoneSize - margin - 4; r < h - margin; r++) {
                for (let c = margin; c < margin + zoneSize + 4; c++) {
                  if (r >= 0 && c < w) terrain[r][c] = 'land';
                }
              }
              const numIslands = Math.floor(Math.min(w, h) / 3);
              for (let i = 0; i < numIslands; i++) {
                const cx = Math.floor(Math.random() * w);
                const cy = Math.floor(Math.random() * h);
                const radius = Math.floor(Math.random() * 4) + 3;
                for (let r = cy - radius; r <= cy + radius; r++) {
                  for (let c = cx - radius; c <= cx + radius; c++) {
                    if (r >= 0 && r < h && c >= 0 && c < w) {
                      const dist = Math.sqrt((r - cy) ** 2 + (c - cx) ** 2);
                      if (dist <= radius && Math.random() > 0.25) terrain[r][c] = 'land';
                    }
                  }
                }
              }
              return terrain;
            }
          },
          'river': {
            name: 'Река',
            generate: (w, h) => {
              const terrain = Array(h).fill().map(() => Array(w).fill('land'));
              const riverWidth = Math.max(3, Math.floor(w / 12));
              const centerStart = Math.floor(w * (0.3 + Math.random() * 0.4));
              let riverX = centerStart;
              for (let r = 0; r < h; r++) {
                if (r > 5 && r < h - 5) {
                  riverX += Math.floor(Math.sin(r / 5) * 4) + Math.floor((Math.random() - 0.5) * 3);
                  riverX = Math.max(riverWidth + 2, Math.min(w - riverWidth - 2, riverX));
                }
                for (let c = riverX - riverWidth; c <= riverX + riverWidth; c++) {
                  if (c >= 0 && c < w) terrain[r][c] = 'water';
                }
              }
              return terrain;
            }
          },
          'checkerboard': {
            name: 'Шахматка',
            generate: (w, h) => {
              const terrain = Array(h).fill().map(() => Array(w).fill('land'));
              const blockSize = Math.max(3, Math.floor(Math.min(w, h) / 8));
              for (let r = 0; r < h; r++) {
                for (let c = 0; c < w; c++) {
                  const blockRow = Math.floor(r / blockSize);
                  const blockCol = Math.floor(c / blockSize);
                  if ((blockRow + blockCol) % 2 === 1) {
                    terrain[r][c] = 'water';
                  }
                }
              }
              const margin = 2;
              const zoneSize = Math.max(5, Math.floor(Math.min(w, h) / 8));
              for (let r = margin; r < margin + zoneSize + 4; r++) {
                for (let c = margin; c < margin + zoneSize + 4; c++) {
                  if (r < h && c < w) terrain[r][c] = 'land';
                }
              }
              for (let r = h - zoneSize - margin - 4; r < h - margin; r++) {
                for (let c = w - zoneSize - margin - 4; c < w - margin; c++) {
                  if (r >= 0 && c >= 0) terrain[r][c] = 'land';
                }
              }
              for (let r = margin; r < margin + zoneSize + 4; r++) {
                for (let c = w - zoneSize - margin - 4; c < w - margin; c++) {
                  if (r < h && c >= 0) terrain[r][c] = 'land';
                }
              }
              for (let r = h - zoneSize - margin - 4; r < h - margin; r++) {
                for (let c = margin; c < margin + zoneSize + 4; c++) {
                  if (r >= 0 && c < w) terrain[r][c] = 'land';
                }
              }
              return terrain;
            }
          },
          'moat': {
            name: 'Ров',
            generate: (w, h) => {
              const terrain = Array(h).fill().map(() => Array(w).fill('land'));
              const minDimension = Math.min(w, h);
              const moatWidth = minDimension > 100 ? 6 : (minDimension > 50 ? 4 : 2);
              const numMoats = minDimension > 150 ? 3 : (minDimension > 80 ? 2 : 1);

              for (let r = 0; r < h; r++) {
                for (let c = 0; c < w; c++) {
                  for (let m = 0; m < numMoats; m++) {
                    const moatPosH = Math.floor((h / (numMoats + 1)) * (m + 1));
                    const moatPosV = Math.floor((w / (numMoats + 1)) * (m + 1));
                    if (Math.abs(r - moatPosH) <= moatWidth || Math.abs(c - moatPosV) <= moatWidth) {
                      terrain[r][c] = 'water';
                      break;
                    }
                  }
                }
              }
              return terrain;
            }
          }
        };
        this.currentMapTemplate = 'empty';

        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartOffsetX = 0;
        this.dragStartOffsetY = 0;
        this.dragDistance = 0;
        this.dragThreshold = 5;

        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
      }

      updateColorPickersUI() {
        if (!colorPickersContainer) return;
        colorPickersContainer.innerHTML = '';
        for (let i = 1; i <= this.numPlayers; i++) {
          const div = document.createElement('div');
          div.className = 'color-picker-item';
          div.innerHTML = `
            <label>Игрок ${i}:</label>
            <input type="color" class="player-color-input" data-player="${i}" value="${this.playerColors[i]}">
          `;
          colorPickersContainer.appendChild(div);
        }
        document.querySelectorAll('.player-color-input').forEach(input => {
          input.addEventListener('input', (e) => {
            const player = parseInt(e.target.dataset.player);
            this.playerColors[player] = e.target.value;
            this.draw();
            this.updateUI();
          });
        });
      }

      resizeCanvasToFit() {
        const maxWidth = 800;
        const maxHeight = 600;

        const cellByWidth = maxWidth / this.width;
        const cellByHeight = maxHeight / this.height;
        this.baseCellSize = Math.floor(Math.min(cellByWidth, cellByHeight));
        this.baseCellSize = Math.max(8, this.baseCellSize);

        this.canvas.width = this.width * this.baseCellSize;
        this.canvas.height = this.height * this.baseCellSize;
        this.zoom = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.cellSize = this.baseCellSize;
      }

      initGame(width, height, numPlayers = 2, mapTemplate = null) {
        console.log(`🔄 Новая игра: ${width}x${height}, игроков: ${numPlayers}`);
        this.width = Math.min(200, Math.max(10, width));
        this.height = Math.min(200, Math.max(10, height));
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        if (mapTemplate && this.mapTemplates[mapTemplate]) {
          this.currentMapTemplate = mapTemplate;
        }
        const template = this.mapTemplates[this.currentMapTemplate];
        this.terrainGrid = template.generate(this.width, this.height);
        this.numPlayers = Math.min(4, Math.max(2, numPlayers));
        this.currentPlayer = 1;
        this.actionsLeft = 10;
        this.gameOver = false;
        this.winner = null;
        this.playersAlive = Array(this.numPlayers + 1).fill(true);
        this.firstMove = Array(this.numPlayers + 1).fill(true);
        this.history = [];

        const defaultColors = ['', '#ff4444', '#4444ff', '#44ff44', '#ffaa44'];
        for (let i = 1; i <= this.numPlayers; i++) {
          if (!this.playerColors[i]) this.playerColors[i] = defaultColors[i];
        }
        this.updateColorPickersUI();

        this.generateStartZones();
        this.resizeCanvasToFit();
        this.updateClawComponents();
        this.draw();
        this.updateUI();
        this.renderMapPreviews();
      }

      generateStartZones() {
        const zoneSize = 5;
        const margin = 2;
        const zones = {};
        if (this.numPlayers === 2) {
          zones[1] = { x1: margin, y1: margin, x2: margin+zoneSize-1, y2: margin+zoneSize-1 };
          zones[2] = { x1: this.width-zoneSize-margin, y1: this.height-zoneSize-margin, x2: this.width-margin-1, y2: this.height-margin-1 };
        } else if (this.numPlayers === 3) {
          zones[1] = { x1: margin, y1: margin, x2: margin+zoneSize-1, y2: margin+zoneSize-1 };
          zones[2] = { x1: this.width-zoneSize-margin, y1: this.height-zoneSize-margin, x2: this.width-margin-1, y2: this.height-margin-1 };
          zones[3] = { x1: this.width-zoneSize-margin, y1: margin, x2: this.width-margin-1, y2: margin+zoneSize-1 };
        } else {
          zones[1] = { x1: margin, y1: margin, x2: margin+zoneSize-1, y2: margin+zoneSize-1 };
          zones[2] = { x1: this.width-zoneSize-margin, y1: this.height-zoneSize-margin, x2: this.width-margin-1, y2: this.height-margin-1 };
          zones[3] = { x1: this.width-zoneSize-margin, y1: margin, x2: this.width-margin-1, y2: margin+zoneSize-1 };
          zones[4] = { x1: margin, y1: this.height-zoneSize-margin, x2: margin+zoneSize-1, y2: this.height-margin-1 };
        }
        for (let i = 1; i <= this.numPlayers; i++) this.startZones[i] = zones[i];
      }

      isInStartZone(row, col) {
        if (!this.firstMove[this.currentPlayer]) return false;
        const zone = this.startZones[this.currentPlayer];
        return (row >= zone.y1 && row <= zone.y2 && col >= zone.x1 && col <= zone.x2);
      }

      updateClawComponents() {
        this.clawComponents = {};
        for (let p = 1; p <= this.numPlayers; p++) this.clawComponents[p] = [];
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        for (let player = 1; player <= this.numPlayers; player++) {
          const clawType = `C${player}`;
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
                      const nr = r + dr, nc = c + dc;
                      if (nr >=0 && nr < this.height && nc >=0 && nc < this.width &&
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

        for (let player = 1; player <= this.numPlayers; player++) {
          const playerUnit = `P${player}`, playerQueen = `P${player}Q`;
          for (let comp of this.clawComponents[player]) {
            let active = false;
            for (let [r, c] of comp) {
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  if (dr === 0 && dc === 0) continue;
                  const nr = r + dr, nc = c + dc;
                  if (nr >=0 && nr < this.height && nc >=0 && nc < this.width) {
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
            if (Math.abs(cr - row) <= 1 && Math.abs(cc - col) <= 1) return true;
          }
        }
        return false;
      }

      canPlaceUnit(row, col) {
        if (this.grid[row][col] !== null) return false;
        if (this.firstMove[this.currentPlayer]) return this.isInStartZone(row, col);

        const playerUnit = `P${this.currentPlayer}`, playerQueen = `P${this.currentPlayer}Q`;

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr, nc = col + dc;
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
        if (!cell.startsWith('P')) return false;
        const enemyPlayer = parseInt(cell[1]);
        if (enemyPlayer === this.currentPlayer) return false;

        const playerUnit = `P${this.currentPlayer}`, playerQueen = `P${this.currentPlayer}Q`;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr, nc = col + dc;
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
          alert(`Игра окончена! Победил игрок ${this.winner}`);
          return;
        }
        if (this.dragDistance > this.dragThreshold) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const col = Math.floor((mouseX - this.offsetX) / this.cellSize);
        const row = Math.floor((mouseY - this.offsetY) / this.cellSize);
        if (row < 0 || row >= this.height || col < 0 || col >= this.width) return;
        const actionCost = this.getActionCost(row, col);
        if (this.actionsLeft < actionCost) {
          const terrain = this.terrainGrid[row][col];
          alert(`Недостаточно ОД для действия на ${terrain === 'water' ? 'воде' : 'суше'}! Нужно ${actionCost} ОД, а у вас ${this.actionsLeft}.`);
          return;
        }
        this.processAction(row, col);
      }

      getActionCost(row, col) {
        // Returns 2 for water terrain, 1 for land
        if (this.terrainGrid && this.terrainGrid[row] && this.terrainGrid[row][col] === 'water') {
          return 2;
        }
        return 1;
      }

      processAction(row, col) {
        const cell = this.grid[row][col];
        const playerUnit = `P${this.currentPlayer}`;
        const playerQueen = `P${this.currentPlayer}Q`;
        const playerClaw = `C${this.currentPlayer}`;
        const actionCost = this.getActionCost(row, col);

        if (this.firstMove[this.currentPlayer]) {
          if (this.isInStartZone(row, col) && cell === null) {
            this.history.push({ row, col, previousState: null, wasQueen: true, player: this.currentPlayer });
            this.grid[row][col] = playerQueen;
            this.firstMove[this.currentPlayer] = false;
            this.actionsLeft -= actionCost;
            this.updateClawComponents();
            this.draw();
            this.updateUI();
            return;
          } else {
            alert('Сначала поставь матку в своей стартовой зоне!');
            return;
          }
        }

        // Постановка крестика
        if (cell === null && this.canPlaceUnit(row, col)) {
          this.history.push({ row, col, previousState: null, wasQueen: false, player: this.currentPlayer });
          this.grid[row][col] = playerUnit;
          this.actionsLeft -= actionCost;
          this.updateClawComponents();
          this.draw();
          this.updateUI();
          return;
        }

        // Атака
        if (cell !== null && this.canAttack(row, col)) {
          const isQueen = cell.endsWith('Q');
          const enemyPlayer = parseInt(cell[1]);
          this.history.push({ row, col, previousState: cell, wasQueen: false, player: this.currentPlayer });
          this.grid[row][col] = playerClaw;
          this.actionsLeft -= actionCost;

          if (isQueen) {
            this.playersAlive[enemyPlayer] = false;
            const alive = [];
            for (let i = 1; i <= this.numPlayers; i++) if (this.playersAlive[i]) alive.push(i);
            if (alive.length === 1) {
              this.gameOver = true;
              this.winner = alive[0];
              alert(`🎉 Игрок ${this.winner} победил!`);
            } else {
              alert(`Игрок ${enemyPlayer} выбыл!`);
            }
          }

          this.updateClawComponents();
          this.draw();
          this.updateUI();
          return;
        }

        console.log('Невозможное действие');
      }

      undoLastAction() {
        if (this.history.length === 0) {
          alert('Нет действий для отмены');
          return;
        }
        const last = this.history.pop();
        this.grid[last.row][last.col] = last.previousState;
        const actionCost = this.getActionCost(last.row, last.col);
        this.actionsLeft += actionCost;
        if (last.wasQueen && last.previousState === null) 
        this.firstMove[last.player] = true;
        this.updateClawComponents();
        this.draw();
        this.updateUI();
      }

      endTurn() {
        if (this.gameOver) return;
        if (this.actionsLeft > 0) {
          alert('Сначала потрать ОД!');
          return;
        }
        let next = this.currentPlayer;
        do {
          next = next % this.numPlayers + 1;
        } while (!this.playersAlive[next]);
        this.currentPlayer = next;
        this.actionsLeft = 10;
        this.history = [];
        this.updateUI();
        this.draw();
      }

      updateUI() {
        if (currentPlayerSpan) currentPlayerSpan.textContent = this.currentPlayer;
        if (actionsLeftSpan) actionsLeftSpan.textContent = this.actionsLeft;
        if (playerColorSample) playerColorSample.style.backgroundColor = this.playerColors[this.currentPlayer];

        if (endTurnBtn) endTurnBtn.disabled = (this.actionsLeft > 0);
        if (undoBtn) undoBtn.disabled = (this.history.length === 0 || this.gameOver);
      }

      handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        let newZoom = this.zoom * delta;
        const maxZoom = (this.width >= 150 || this.height >= 150) ? 8 : 5;
        newZoom = Math.min(maxZoom, Math.max(1.0, newZoom));
        if (newZoom === this.zoom) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const oldWorldX = (mouseX - this.offsetX) / this.cellSize;
        const oldWorldY = (mouseY - this.offsetY) / this.cellSize;

        this.zoom = newZoom;
        this.cellSize = this.baseCellSize * this.zoom;

        const newWorldX = (mouseX - this.offsetX) / this.cellSize;
        const newWorldY = (mouseY - this.offsetY) / this.cellSize;

        this.offsetX += (newWorldX - oldWorldX) * this.cellSize;
        this.offsetY += (newWorldY - oldWorldY) * this.cellSize;
        this.limitOffsets();
        this.draw();
      }

      handleMouseDown(e) {
        if (e.button !== 0) return;
        this.isDragging = true;
        this.dragDistance = 0;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragStartOffsetX = this.offsetX;
        this.dragStartOffsetY = this.offsetY;
        this.canvas.style.cursor = 'grabbing';
      }

      handleMouseMove(e) {
        if (!this.isDragging) return;
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        this.dragDistance = Math.hypot(dx, dy);
        this.offsetX = this.dragStartOffsetX + dx;
        this.offsetY = this.dragStartOffsetY + dy;
        this.limitOffsets();
        this.draw();
      }

      handleMouseUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
      }

      updateCellSizeAndOffsets() {
        this.cellSize = this.baseCellSize * this.zoom;
      }

      limitOffsets() {
        const fullWidth = this.width * this.cellSize;
        const fullHeight = this.height * this.cellSize;
        const minX = this.canvas.width - fullWidth;
        const maxX = 0;
        const minY = this.canvas.height - fullHeight;
        const maxY = 0;
        this.offsetX = Math.min(maxX, Math.max(minX, this.offsetX));
        this.offsetY = Math.min(maxY, Math.max(minY, this.offsetY));
      }

      draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        for (let row = 0; row < this.height; row++) {
          for (let col = 0; col < this.width; col++) {
            const terrain = this.terrainGrid[row][col];
            const x = this.offsetX + col * this.cellSize;
            const y = this.offsetY + row * this.cellSize;

            if (terrain === 'water') {
              ctx.fillStyle = '#4da6ff';
              ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

              ctx.font = `${Math.floor(this.cellSize * 0.5)}px monospace`;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('~', x + this.cellSize / 2, y + this.cellSize / 2);
            }
          }
        }

        ctx.save();
        ctx.translate(0.5, 0.5);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;

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
        ctx.restore();

        for (let row = 0; row < this.height; row++) {
          for (let col = 0; col < this.width; col++) {
            const cell = this.grid[row][col];
            if (!cell) continue;

            const x = this.offsetX + col * this.cellSize;
            const y = this.offsetY + row * this.cellSize;
            let symbolColor;
            if (cell.startsWith('P')) {
              const player = parseInt(cell[1]);
              symbolColor = this.playerColors[player];
            } else if (cell.startsWith('C')) {
              const player = parseInt(cell[1]);
              symbolColor = this.darkenColor(this.playerColors[player], 0.7);
            }

            ctx.font = `bold ${Math.floor(this.cellSize * 0.7)}px monospace`;
            ctx.fillStyle = symbolColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let symbol = '';
            if (cell.startsWith('P') && !cell.endsWith('Q')) symbol = '✖';
            else if (cell.endsWith('Q')) symbol = '♕';
            else if (cell.startsWith('C')) symbol = '◆';
            ctx.fillText(symbol, x + this.cellSize / 2, y + this.cellSize / 2);

            if (cell.endsWith('Q')) {
              ctx.strokeStyle = '#ffd700';
              ctx.lineWidth = 3;
              ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
            }
          }
        }

        if (this.firstMove[this.currentPlayer] && this.startZones[this.currentPlayer]) {
          const zone = this.startZones[this.currentPlayer];
          ctx.save();
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = '#0f0';
          ctx.lineWidth = 4;
          ctx.strokeRect(
            this.offsetX + zone.x1 * this.cellSize,
            this.offsetY + zone.y1 * this.cellSize,
            (zone.x2 - zone.x1 + 1) * this.cellSize,
            (zone.y2 - zone.y1 + 1) * this.cellSize
          );
          ctx.restore();
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

    function getSelectedPlayers() {
      for (let r of playerCountRadios) if (r.checked) return parseInt(r.value);
      return 2;
    }

    openBtn.addEventListener('click', () => {
      gameSection.classList.toggle('hidden');
      if (!gameSection.classList.contains('hidden')) {
        const w = parseInt(widthInput.value) || 30;
        const h = parseInt(heightInput.value) || 30;
        game.initGame(w, h, getSelectedPlayers());
      }
    });

    newGameBtn.addEventListener('click', () => {
      const w = parseInt(widthInput.value);
      const h = parseInt(heightInput.value);
      if (isNaN(w) || w < 10 || w > 200 || isNaN(h) || h < 10 || h > 200) {
        alert('Размеры поля должны быть от 10 до 200');
        return;
      }
      game.initGame(w, h, getSelectedPlayers());
    });

    endTurnBtn.addEventListener('click', () => {
      game.endTurn();
    });

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        game.undoLastAction();
      });
    }

    playerCountRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (!gameSection.classList.contains('hidden')) {
          const w = parseInt(widthInput.value) || 30;
          const h = parseInt(heightInput.value) || 30;
          game.initGame(w, h, getSelectedPlayers());
        }
      });
    });

    game.renderMapPreviews = function() {
      const container = document.getElementById('mapPreviewsContainer');
      if (!container) return;

      container.innerHTML = '';

      for (const [key, template] of Object.entries(this.mapTemplates)) {
        const div = document.createElement('div');
        div.className = 'map-preview-item' + (key === this.currentMapTemplate ? ' active' : '');
        div.dataset.mapKey = key;

        const canvas = document.createElement('canvas');
        canvas.className = 'map-preview-canvas';
        canvas.width = 80;
        canvas.height = 60;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 80, 60);

        // Generate terrain preview for THIS specific map type
        const previewTerrain = template.generate(40, 30);

        // Draw mini terrain preview
        const cellW = 80 / 40;
        const cellH = 60 / 30;
        for (let r = 0; r < 30; r++) {
          for (let c = 0; c < 40; c++) {
            if (previewTerrain[r][c] === 'water') {
              ctx.fillStyle = '#4da6ff';
              ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
            }
          }
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'map-preview-name';
        nameSpan.textContent = template.name;

        div.appendChild(canvas);
        div.appendChild(nameSpan);

        div.addEventListener('click', () => {
          this.currentMapTemplate = key;
          const w = parseInt(widthInput.value) || 30;
          const h = parseInt(heightInput.value) || 30;
          this.initGame(w, h, getSelectedPlayers(), key);
        });

        container.appendChild(div);
      }
    };

    window.battleGame = game;
    console.log('✅ КЛЕШНЯ готова');
  });
})();
