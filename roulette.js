document.addEventListener('DOMContentLoaded', function() {

  const resetStatsButton = document.getElementById('resetStatsButton');
  const rouletteWheel = document.getElementById('rouletteWheel');
  const rouletteBall = document.getElementById('rouletteBall');
  const spinButton = document.getElementById('spinButton');
  const resultDisplay = document.querySelector('.result-value');
  const attemptsCount = document.getElementById('attemptsCount');
  const winsCount = document.getElementById('winsCount');
  const luckPercentage = document.getElementById('luckPercentage');

  const sectors = [
    { text: '💰', color: '#2ecc71', bonus: 3, isWin: true },
    { text: '🍀', color: '#f1c40f', bonus: 2, isWin: true },
    { text: '💀', color: '#3498db', bonus: 0, isWin: false },
    { text: '😐', color: '#e74c3c', bonus: -1, isWin: false },
    { text: '🎁', color: '#9b59b6', bonus: 2, isWin: true },
    { text: '☀️', color: '#e67e22', bonus: 1, isWin: true },
    { text: '🌙', color: '#34495e', bonus: 0, isWin: false },
    { text: '⚡', color: '#e74c3c', bonus: 1, isWin: false }
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
    resetStatsButton.addEventListener('click', resetStats);
    
  }

  function createSectors() {
    const sectorAngle = 360 / sectors.length;

    rouletteWheel.innerHTML = '';
    
    sectors.forEach((sector, index) => {
      const sectorEl = document.createElement('div');
      sectorEl.className = 'wheel-sector';
      const rotateAngle = index * sectorAngle;
      sectorEl.style.transform = `rotate(${rotateAngle}deg)`;
      const textSpan = document.createElement('span');
      textSpan.textContent = sector.text;
      textSpan.style.color = sector.color;
      textSpan.style.transform = `rotate(${sectorAngle/2 - 90}deg)`;
      sectorEl.appendChild(textSpan);
      rouletteWheel.appendChild(sectorEl);
    });
  }

  function spinRoulette() {
    if (spinButton.disabled) return;
    spinButton.disabled = true;
    spinButton.textContent = '🎰 Роллим...';
    rouletteWheel.classList.add('spinning');
    rouletteBall.classList.add('spinning');
    document.querySelector('.pointer').classList.add('spinning');
    const randomSector = Math.floor(Math.random() * sectors.length);
    const sectorAngle = 360 / sectors.length;
    const spinDegrees = 3600 + (randomSector * sectorAngle) + Math.random() * sectorAngle * 0.5;
    rouletteWheel.style.transform = `rotate(${spinDegrees}deg)`;
    rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.21, 0.99)';

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

    resultDisplay.innerHTML = `${sector.text} <span class="result-description">${getResultDescription(sector.text)}</span>`;
  resultDisplay.style.color = sector.color;

  resultDisplay.style.transform = 'scale(1.3)';
  resultDisplay.style.transition = 'transform 0.3s';
  setTimeout(() => {
    resultDisplay.style.transform = 'scale(1)';
  }, 300);

    updateStatsDisplay();

    setTimeout(() => {
      spinButton.disabled = false;
      spinButton.textContent = '🎰 ЗАРОЛЛИТЬ!';
      rouletteWheel.classList.remove('spinning');
      rouletteBall.classList.remove('spinning');
      document.querySelector('.pointer').classList.remove('spinning');
      rouletteBall.style.animation = 'none';
    setTimeout(() => {
      rouletteBall.style.animation = '';
    }, 10);
    
    rouletteWheel.style.transform = 'rotate(0deg)';
    rouletteWheel.style.transition = 'none';
    setTimeout(() => {
      rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.21, 0.99)';
    }, 50);
  }, 2000);
}

  function showResultMessage(sector) {
    const messages = {
      win: [
        "🎉 Повезло, сегодня живёшь!",
        "🔥 На лаки",
        "🌟 Ты рождён под счастливой звездой!",
        "🚀 Невероятно! Удача на твоей стороне!"
      ],
      lose: [
        "💪 22 отжимания вне очереди!",
        "🔄 Не грусти, со следующего депа точно отыграешься!",
        "🎯 Не повезло, сегодня умрёшь!",
        "📈 Я бы на твоём месте тильтанул"
      ],
      neutral: [
        "Это так, для интриги, крути ещё!",
        "Крути ещё и узнаешь",
        "Не завелось с первого раза",
        "Ни нашим ни вашим"
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
  
    const messageDisplay = document.createElement('div');
    messageDisplay.className = 'result-message';
    messageDisplay.textContent = message;
    messageDisplay.style.color = sector.color;
    messageDisplay.style.marginTop = '10px';
    messageDisplay.style.fontSize = '14px';
    messageDisplay.style.opacity = '0.8';
  
    const controls = document.querySelector('.roulette-controls');
    controls.appendChild(messageDisplay);
  
    setTimeout(() => {
      if (messageDisplay.parentNode) {
        messageDisplay.parentNode.removeChild(messageDisplay);
      }
    }, 3000);
  }

function getResultDescription(emoji) {
  const descriptions = {
    '💰': ' - Кэшбэк 100%!',
    '🍀': ' - Удача на твоей стороне!',
    '💀': ' - Поражение... но в следующий раз повезёт!',
    '😐': ' - Ничего особенного',
    '🎁': ' - Призовой выигрыш!',
    '☀️': ' - Солнечный день!',
    '🌙': ' - Ночная смена',
    '⚡': ' - Энергия!'
  };
  return descriptions[emoji] || '';
}
  
  function updateStatsDisplay() {
    attemptsCount.textContent = stats.attempts;
    winsCount.textContent = stats.wins;
    
    const percentage = stats.attempts > 0 
      ? Math.round((stats.wins / stats.attempts) * 100)
      : 0;
    
    luckPercentage.textContent = `${percentage}%`;
    if (percentage >= 70) {
      luckPercentage.style.color = '#2ecc71';
    } else if (percentage >= 50) {
      luckPercentage.style.color = '#f1c40f';
    } else if (percentage >= 30) {
      luckPercentage.style.color = '#e67e22';
    } else {
      luckPercentage.style.color = '#e74c3c';
    }
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
  if (confirm('Точно? Сделанного не вернёшь')) {
    stats = { attempts: 0, wins: 0, totalBonus: 0 };
    saveStats();
    updateStatsDisplay();

    resultDisplay.textContent = 'Статистика сброшена!';
    resultDisplay.style.color = '#2ecc71';
    
    setTimeout(() => {
      resultDisplay.textContent = '-';
      resultDisplay.style.color = 'gold';
    }, 2000);
  }
}

  window.resetRouletteStats = resetStats;
  
  console.log('🚀 Рулетка готова к использованию!');
});
