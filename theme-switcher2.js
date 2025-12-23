(function() {
  'use strict';

  if (window.themeSwitcherInitialized) {
    console.warn('⚠️ Переключатель тем уже инициализирован!');
    return;
  }
  
  window.themeSwitcherInitialized = true;
  
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Переключатель тем загружается...');
    
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const body = document.body;

    const availableThemes = ['light', 'dark', 'contrast'];

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

    function loadTheme() {
      let savedTheme = 'light';
      
      if (isLocalStorageSupported) {
        try {
          const stored = localStorage.getItem('siteTheme');
          if (stored && availableThemes.includes(stored)) {
            savedTheme = stored;
          }
        } catch (error) {
          console.error('❌ Ошибка загрузки темы из localStorage:', error);
        }
      }
      
      console.log('📂 Загружена тема:', savedTheme);

      applyTheme(savedTheme);

      themeRadios.forEach(radio => {
        if (radio.value === savedTheme) {
          radio.checked = true;
        }
      });
    }

    function saveTheme(theme) {
      if (!availableThemes.includes(theme)) {
        console.error('❌ Попытка сохранить недопустимую тему:', theme);
        return;
      }
      
      if (isLocalStorageSupported) {
        try {
          localStorage.setItem('siteTheme', theme);
          console.log('💾 Тема сохранена:', theme);
        } catch (error) {
          console.error('❌ Ошибка сохранения темы:', error);
        }
      }
    }

    function applyTheme(theme) {
      body.classList.remove('dark-theme', 'contrast-theme');
  
      if (theme !== 'light') {
        body.classList.add(theme + '-theme');
      }

      updateWidgetBackgrounds(theme);
  
      updateMetaColorScheme(theme);
    }

    function updateWidgetBackgrounds(theme) {
      const themeSwitcher = document.querySelector('.theme-switcher');
      const chatContainer = document.querySelector('.chat-container');
      const chatSection = document.querySelector('.chat-section');
      const rouletteSection = document.querySelector('.roulette-section');
      
      if (theme === 'dark') {
        if (themeSwitcher) themeSwitcher.style.backgroundColor = '#3a2b5b';
        if (chatContainer) chatContainer.style.backgroundColor = '#3a2b5b';
        if (chatSection) chatSection.style.backgroundColor = '#3a2b5b';
        if (rouletteSection) rouletteSection.style.backgroundColor = '#3a2b5b';
      } else if (theme === 'contrast') {
        if (themeSwitcher) themeSwitcher.style.backgroundColor = '#003300';
        if (chatContainer) chatContainer.style.backgroundColor = '#001a00';
        if (chatSection) chatSection.style.backgroundColor = '#001a00';
        if (rouletteSection) rouletteSection.style.backgroundColor = '#001a00';
      } else {
        if (themeSwitcher) themeSwitcher.style.backgroundColor = '';
        if (chatContainer) chatContainer.style.backgroundColor = '';
        if (chatSection) chatSection.style.backgroundColor = '';
        if (rouletteSection) rouletteSection.style.backgroundColor = '';
      }
    }

    
    function changeTheme(theme) {
      if (!availableThemes.includes(theme)) {
        console.error('❌ Попытка установить недопустимую тему:', theme);
        return;
      }
      
      console.log('🔄 Изменение темы на:', theme);
      
      applyTheme(theme);
      saveTheme(theme);

      document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: theme }
      }));
    }

    function updateMetaColorScheme(theme) {
      const colorSchemes = {
        'light': 'light',
        'dark': 'dark',
        'contrast': 'light'
      };
      
      const colorScheme = colorSchemes[theme] || 'light';

      const oldMeta = document.querySelector('meta[name="color-scheme"]');
      if (oldMeta) {
        oldMeta.remove();
      }

      const meta = document.createElement('meta');
      meta.name = 'color-scheme';
      meta.content = colorScheme;
      document.head.appendChild(meta);
    }

    themeRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.checked) {
          changeTheme(this.value);
        }
      });
    });

    loadTheme();

    window.themeSwitcher = {
      getCurrentTheme: function() {
        return availableThemes.find(theme => 
          body.classList.contains(theme + '-theme')
        ) || 'light';
      },
      setTheme: changeTheme,
      getAvailableThemes: function() {
        return [...availableThemes];
      },
      clearSavedTheme: function() {
        if (isLocalStorageSupported) {
          localStorage.removeItem('siteTheme');
          console.log('🗑️ Сохранённая тема удалена');
        }
      }
    };
    
    console.log('✅ Переключатель тем готов! Доступные темы:', availableThemes);
  });
})();
