(function() {
  'use strict';

  if (window.rouletteInitialized) {
    console.warn('⚠️ Рулетка уже инициализирована!');
    return;
  }
  
  window.rouletteInitialized = true;
  
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 Рулетка загружается...');

    const elements = {
      resetStatsButton: document.getElementById('resetStatsButton'),
      rouletteWheel: document.getElementById('rouletteWheel'),
      rouletteBall: document.getElementById('rouletteBall'),
      spinButton: document.getElementById('spinButton'),
      resultDisplay: document.querySelector('.result-value'),
      attemptsCount: document.getElementById('attemptsCount'),
      winsCount: document.getElementById('winsCount'),
      luckPercentage: document.getElementById('luckPercentage'),
      openRouletteBtn: document.getElementById('openRouletteBtn'),
      rouletteSection: document.getElementById('rouletteSection'),
      pointer: document.querySelector('.pointer')
    };

    const criticalElements = ['rouletteWheel', 'spinButton', 'rouletteSection', 'openRouletteBtn'];
    const missingElements = criticalElements.filter(key => !elements[key]);
    
    if (missingElements.length > 0) {
      console.error('❌ Не найдены элементы:', missingElements);
      return;
    }

    const sectors = [
      { text: '💰', color: '#e74c3c', bonus: 3, isWin: true },
      { text: '🍀', color: '#2ecc71', bonus: 2, isWin: true },
      { text: '💀', color: '#34495e', bonus: -2, isWin: false },
      { text: '😐', color: '#3498db', bonus: 0, isWin: false },
      { text: '🎁', color: '#9b59b6', bonus: 2, isWin: true },
      { text: '☀️', color: '#f1c40f', bonus: 1, isWin: true },
      { text: '🌙', color: '#e67e22', bonus: 0, isWin: false },
      { text: '⚡', color: '#1abc9c', bonus: 1, isWin: true }
    ];
    
    const sectorAngle = 360 / sectors.length;
    const descriptions = {
      '💰': ' - Ты пидор!',
      '🍀': ' - Первый на кого ты посмотришь пидор!',
      '💀': ' - Сегодня умрёшь!',
      '😐': ' - Ничего особенного, крути ещё раз',
      '🎁': ' - Тебе сюрприз, чекай штаны!',
      '☀️': ' - Смотри под ноги',
      '🌙': ' - Ночная смена',
      '⚡': ' - Десять отжиманий вне очереди!!'
    };

    let state = {
      stats: { attempts: 0, wins: 0, totalBonus: 0 },
      isSpinning: false,
      isRouletteVisible: false,
      currentTimeout: null
    };

    const isLocalStorageSupported = (function() {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        console.warn('⚠️ LocalStorage не поддерживается:', e.message);
        return false;
      }
    })();

    function initRoulette() {
      console.log('🌀 Инициализация рулетки...');
      
      createSectors();
      loadStats();
      updateStatsDisplay();

      elements.spinButton.addEventListener('click', spinRoulette);
      
      if (elements.resetStatsButton) {
        elements.resetStatsButton.addEventListener('click', resetStats);
      }
      
      elements.openRouletteBtn.addEventListener('click', toggleRouletteVisibility);

      elements.rouletteSection.classList.add('hidden');
      elements.openRouletteBtn.innerHTML = '🎪 Открыть рулетку судьбы';
      
      console.log('✅ Рулетка инициализирована');
    }
    
    function createSectors() {
      elements.rouletteWheel.innerHTML = '';
      
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
        elements.rouletteWheel.appendChild(sectorEl);
      });
      
      console.log(`✅ Создано ${sectors.length} секторов`);
    }
    
    function toggleRouletteVisibility() {
      state.isRouletteVisible = !state.isRouletteVisible;
      
      if (state.isRouletteVisible) {
        elements.rouletteSection.classList.remove('hidden');
        elements.openRouletteBtn.innerHTML = '🎪 Скрыть рулетку судьбы';
        elements.openRouletteBtn.classList.add('active');
      } else {
        elements.rouletteSection.classList.add('hidden');
        elements.openRouletteBtn.innerHTML = '🎪 Открыть рулетку судьбы';
        elements.openRouletteBtn.classList.remove('active');
      }
      
      console.log(`👁️ Рулетка ${state.isRouletteVisible ? 'показана' : 'скрыта'}`);
    }
    
    function spinRoulette() {
      if (state.isSpinning) {
        console.log('⚠️ Рулетка уже вращается!');
        return;
      }
      
      console.log('🎡 Начинаем вращение...');
      
      state.isSpinning = true;
      elements.spinButton.disabled = true;
      elements.spinButton.textContent = '🎰 Вращается...';

      elements.rouletteWheel.classList.add('spinning');
      elements.rouletteBall.classList.add('spinning');
      if (elements.pointer) {
        elements.pointer.classList.add('spinning');
      }

      const randomSector = Math.floor(Math.random() * sectors.length);
      const spinDegrees = 3600 + (randomSector * sectorAngle) + (Math.random() * sectorAngle * 0.5);

      elements.rouletteWheel.style.transform = `rotate(${spinDegrees}deg)`;
      elements.rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.21, 0.99)';

      state.currentTimeout = setTimeout(() => {
        showResult(randomSector);
      }, 4000);
    }
    
    function showResult(sectorIndex) {
      const sector = sectors[sectorIndex];
      console.log(`🎯 Выпал сектор: ${sector.text}`);

      state.stats.attempts++;
      if (sector.isWin) state.stats.wins++;
      state.stats.totalBonus += sector.bonus;

      saveStats();

      displayResult(sector);

      updateStatsDisplay();

      setTimeout(resetRouletteState, 2000);
    }
    
    function displayResult(sector) {
      const description = descriptions[sector.text] || '';
      elements.resultDisplay.innerHTML = `${sector.text} <span class="result-description">${description}</span>`;
      elements.resultDisplay.style.color = sector.color;

      elements.resultDisplay.style.transform = 'scale(1.3)';
      elements.resultDisplay.style.transition = 'transform 0.3s';
      
      setTimeout(() => {
        elements.resultDisplay.style.transform = 'scale(1)';
      }, 300);
    }
    
    function resetRouletteState() {
      state.isSpinning = false;

      elements.spinButton.disabled = false;
      elements.spinButton.textContent = '🎰 ЗАРОЛЛИТЬ!';

      elements.rouletteWheel.classList.remove('spinning');
      elements.rouletteBall.classList.remove('spinning');
      if (elements.pointer) {
        elements.pointer.classList.remove('spinning');
      }

      elements.rouletteWheel.style.transform = 'rotate(0deg)';
      elements.rouletteWheel.style.transition = 'none';

      setTimeout(() => {
        elements.rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.21, 0.99)';
      }, 50);
      
      console.log('🔄 Состояние рулетки сброшено');
    }
    
    function updateStatsDisplay() {
      if (elements.attemptsCount) {
        elements.attemptsCount.textContent = state.stats.attempts;
      }
      
      if (elements.winsCount) {
        elements.winsCount.textContent = state.stats.wins;
      }
      
      if (elements.luckPercentage) {
        const percentage = state.stats.attempts > 0 
          ? Math.round((state.stats.wins / state.stats.attempts) * 100)
          : 0;
        
        elements.luckPercentage.textContent = `${percentage}%`;

        if (percentage >= 70) {
          elements.luckPercentage.style.color = '#2ecc71';
        } else if (percentage >= 50) {
          elements.luckPercentage.style.color = '#f1c40f';
        } else if (percentage >= 30) {
          elements.luckPercentage.style.color = '#e67e22';
        } else {
          elements.luckPercentage.style.color = '#e74c3c';
        }
      }
    }
    
    function saveStats() {
      if (!isLocalStorageSupported) return;
      
      try {
        localStorage.setItem('rouletteStats', JSON.stringify(state.stats));
        console.log('💾 Статистика сохранена:', state.stats);
      } catch (error) {
        console.error('❌ Ошибка сохранения статистики:', error);
      }
    }
    
    function loadStats() {
      if (!isLocalStorageSupported) return;
      
      try {
        const saved = localStorage.getItem('rouletteStats');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.attempts !== undefined && parsed.wins !== undefined) {
            state.stats = parsed;
            console.log('📂 Статистика загружена:', state.stats);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки статистики:', error);
      }
    }
    
    function resetStats() {
      if (!confirm('Точно? Сделанного не вернёшь')) {
        return;
      }

      state.stats = { attempts: 0, wins: 0, totalBonus: 0 };

      saveStats();

      updateStatsDisplay();

      if (elements.resultDisplay) {
        elements.resultDisplay.textContent = 'Статистика сброшена!';
        elements.resultDisplay.style.color = '#2ecc71';
        
        setTimeout(() => {
          elements.resultDisplay.textContent = '-';
          elements.resultDisplay.style.color = 'gold';
        }, 2000);
      }
      
      console.log('🗑️ Статистика сброшена');
    }

    initRoulette();

    window.roulette = {
      getStats: () => ({ ...state.stats }),
      getState: () => ({ 
        isSpinning: state.isSpinning,
        isVisible: state.isRouletteVisible 
      }),
      spin: spinRoulette,
      resetStats: resetStats,
      show: () => {
        state.isRouletteVisible = true;
        elements.rouletteSection.classList.remove('hidden');
        elements.openRouletteBtn.innerHTML = '🎪 Скрыть рулетку судьбы';
      },
      hide: () => {
        state.isRouletteVisible = false;
        elements.rouletteSection.classList.add('hidden');
        elements.openRouletteBtn.innerHTML = '🎪 Открыть рулетку судьбы';
      }
    };
    
    console.log('🚀 Рулетка готова к использованию!');

    window.addEventListener('beforeunload', function() {
      if (state.currentTimeout) {
        clearTimeout(state.currentTimeout);
      }
    });
  });
})();
