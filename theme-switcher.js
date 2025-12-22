document.addEventListener('DOMContentLoaded', function() {
  
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const body = document.body;

  function loadTheme() {
    const savedTheme = localStorage.getItem('siteTheme') || 'light';

    body.className = savedTheme + '-theme';

    themeRadios.forEach(radio => {
      radio.checked = (radio.value === savedTheme);
    });
  }

  function saveTheme(theme) {
    localStorage.setItem('siteTheme', theme);
  }

  function changeTheme(theme) {
    body.classList.remove('light-theme', 'dark-theme', 'contrast-theme');

    body.classList.add(theme + '-theme');

    saveTheme(theme);

    updateCSSVariables(theme);
  }

  function updateCSSVariables(theme) {
  }

  themeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        changeTheme(this.value);
      }
    });
  });
  
  loadTheme();
  
});
