document.addEventListener('DOMContentLoaded', function() {
  
  const themeRadios = document.querySelectorAll('input[name="theme"]');

  const savedTheme = localStorage.getItem('siteTheme') || 'light';
  document.body.className = savedTheme + '-theme';

  themeRadios.forEach(radio => {
    if (radio.value === savedTheme) {
      radio.checked = true;
    }

    radio.addEventListener('change', function() {
      const selectedTheme = this.value;
      document.body.className = selectedTheme + '-theme';
      localStorage.setItem('siteTheme', selectedTheme);
    });
  });
  
});
