document.addEventListener('DOMContentLoaded', function() {
  
  const rouletteWheel = document.getElementById('rouletteWheel');
  const rouletteBall = document.getElementById('rouletteBall');
  const spinButton = document.getElementById('spinButton');
  const resultDisplay = document.querySelector('.result-value');
  const attemptsCount = document.getElementById('attemptsCount');
  const winsCount = document.getElementById('winsCount');
  const luckPercentage = document.getElementById('luckPercentage');

  const sectors = [
    { text: '🍀 Удача!', color: '#2ecc71', bonus: 3, isWin: true },
    { text: '💰 Выигрыш!', color: '#f1c40f', bonus: 2, isWin: true },
    { text: '😐 Нейтрально', color: '#3498db', bonus: 0, isWin: false },
    { text: '💀 Поражение', color: '#e74c3c', bonus: -1, isWin: false },
    { text: '🎁 Приз!', color: '#9b59b6', bonus: 2, isWin: true },
    { text: '⚡ Шанс!', color: '#e67e22', bonus: 1, isWin: true },
    { text: '🌙 Ночь', color: '#34495e', bonus: 0, isWin: false },
    { text: '☀️ Утро', color: '#e74c3c', bonus: 1, isWin: true }
  ];

  let stats = {
    attempts: 0,
    wins: 0,
    totalBonus: 0
  };

  loadStats();

  initRoulette();

  function initRoulette() {
    createSectors();

    updateStatsDisplay();

    spinButton.addEventListener('click', spinRoulette);
    
    console.log('✅ Рулетка инициализирована!');
  }

  function createSectors() {
    const sectorAngle = 360 / sectors.length;
    
    sectors.forEach((sector, index) => {
      const sectorEl = document.createElement('div');
      sectorEl.className = 'wheel-sector';
      sectorEl.style.transform = `rotate(${index * sectorAngle}deg)`;
      sectorEl.style.color = sector.color;
      sectorEl.innerHTML = `<span style="transform: rotate(${sectorAngle/2}deg)">${sector.text}</span>`;
      rouletteWheel.appendChild(sectorEl);
    });
  }

  function spinRoulette() {
    if (spinButton.disabled) return;

    spinButton.disabled = true;
    spinButton.textContent = '🎰 Вращается...';

    rouletteWheel.classList.add('spinning');
    rouletteBall.classList.add('spinning');

    const randomSector = Math.floor(Math.random() * sectors.length);
    const sectorAngle = 360 / sectors.length;

    const spinDegrees = 3600 + (randomSector * sectorAngle) + Math.random() * sectorAngle;

    rouletteWheel.style.transform = `rotate(${spinDegrees}deg)`;

    const ballDegrees = -spinDegrees + Math.random() * 180;
    rouletteBall.style.transform = `rotate(${ballDegrees}deg)`;

    setTimeout(() => {
      showResult(randomSector);
    }, 4000);
  }

  function showResult(sectorIndex) {
    const sector = sectors[sectorIndex];

    stats.attempts++;
    if (sector.isWin) stats.wins++;
    stats.totalBonus += sector.bonus;
    
    saveStats();

    resultDisplay.textContent = sector.text;
    resultDisplay.style.color = sector.color;

    resultDisplay.style.transform = 'scale(1.3)';
    setTimeout(() => {
      resultDisplay.style.transform = 'scale(1)';
    }, 300);

    updateStatsDisplay();

    showResultMessage(sector);

    setTimeout(() => {
      spinButton.disabled = false;
      spinButton.textContent = '🎰 Крутить рулетку!';
      rouletteWheel.classList.remove('spinning');
      rouletteBall.classList.remove('spinning');
    }, 2000);
  }

  function showResultMessage(sector) {
    const messages = {
      win: [
        "🎉 Поздравляем! Тебе сегодня везёт!",
        "🔥 Отличный результат! Продолжай в том же духе!",
        "🌟 Ты рождён под счастливой звездой!"
      ],
      lose: [
        "💪 Не расстраивайся! В следующий раз повезёт!",
        "🔄 Удача переменчива, попробуй ещё раз!",
        "🎯 Практика ведёт к совершенству!"
      ],
      neutral: [
        "🤔 Интересно... что будет в следующий раз?",
        "🌀 Судьба пока не определилась",
        "📊 Статистика нейтральна сегодня"
      ]
    };
    
    let message;
    if (sector.bonus > 0) {
      message = messages.win[Math.floor(Math.random() * messages.win.length)];
    } else if (sector.bonus < 0) {
      message = messages.lose[Math.floor(Math.random() * messages.lose.length)];
    } else {
      message = messages.neutral[Math.floor(Math.random() * messages.neutral.length)];
    }

    setTimeout(() => {
      alert(message);
    }, 500);
  }

  function updateStatsDisplay() {
    attemptsCount.textContent = stats.attempts;
    winsCount.textContent = stats.wins;
    
    const percentage = stats.attempts > 0 
      ? Math.round((stats.wins / stats.attempts) * 100)
      : 0;
    
    luckPercentage.textContent = `${percentage}%`;
    luckPercentage.style.color = percentage > 50 ? '#2ecc71' : 
                                 percentage > 30 ? '#f1c40f' : '#e74c3c';
  }

  function saveStats() {
    try {
      localStorage.setItem('rouletteStats', JSON.stringify(stats));
    } catch (e) {
      console.log('Не удалось сохранить статистику:', e);
    }
  }

  function loadStats() {
    try {
      const saved = localStorage.getItem('rouletteStats');
      if (saved) {
        stats = JSON.parse(saved);
      }
    } catch (e) {
      console.log('Не удалось загрузить статистику:', e);
    }
  }

  function resetStats() {
    if (confirm('Сбросить всю статистику рулетки?')) {
      stats = { attempts: 0, wins: 0, totalBonus: 0 };
      saveStats();
      updateStatsDisplay();
    }
  }

  window.resetRouletteStats = resetStats;
  
  console.log('🚀 Рулетка готова к использованию!');
});
