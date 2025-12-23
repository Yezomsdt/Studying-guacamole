document.addEventListener('DOMContentLoaded', function() {
  const matrixOverlay = document.getElementById('matrixOverlay');
  const isContrastTheme = document.body.classList.contains('contrast-theme');
  
  if (!matrixOverlay || !isContrastTheme) return;

  function createMatrixEffect() {
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = Math.floor(window.innerWidth / fontSize);

    matrixOverlay.innerHTML = '';

    for (let i = 0; i < columns; i++) {
      const column = document.createElement('div');
      column.classList.add('matrix-column');
      column.style.position = 'absolute';
      column.style.left = `${i * fontSize}px`;
      column.style.top = `-100px`;
      column.style.width = `${fontSize}px`;
      column.style.height = `${window.innerHeight}px`;
      column.style.color = '#00ff00';
      column.style.fontSize = `${fontSize}px`;
      column.style.fontFamily = 'monospace';
      column.style.textShadow = '0 0 5px #00ff00';
      column.style.opacity = '0.7';

      const charCount = Math.floor(window.innerHeight / fontSize);
      for (let j = 0; j < charCount; j++) {
        const char = document.createElement('span');
        char.textContent = chars[Math.floor(Math.random() * chars.length)];
        char.style.position = 'absolute';
        char.style.top = `${j * fontSize}px`;
        char.style.opacity = String(Math.random() * 0.5 + 0.3);
        column.appendChild(char);
      }
      
      matrixOverlay.appendChild(column);

      animateColumn(column);
    }
  }
  
  function animateColumn(column) {
    let position = -100;
    const speed = Math.random() * 2 + 1;
    
    function drop() {
      position += speed;
      column.style.top = `${position}px`;

      if (position > window.innerHeight) {
        position = -100;
        column.style.top = `${position}px`;

        const chars = column.querySelectorAll('span');
        chars.forEach(char => {
          char.textContent = chars[Math.floor(Math.random() * chars.length)];
          char.style.opacity = String(Math.random() * 0.5 + 0.3);
        });
      }
      
      requestAnimationFrame(drop);
    }
    
    drop();
  }

  createMatrixEffect();

  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(createMatrixEffect, 250);
  });
});
