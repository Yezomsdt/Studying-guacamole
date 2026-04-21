(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'neuralCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    let width, height;
    let nodes = [];
    const nodeCount = 80;
    const connectionDistance = 150;

    const pastelColors = [
      'rgba(255, 183, 197, ', // пастельный розовый
      'rgba(183, 221, 255, ', // пастельный голубой
      'rgba(255, 223, 186, ', // пастельный оранжевый
      'rgba(230, 230, 250, ', // пастельный лавандовый
      'rgba(186, 255, 201, ', // пастельный мятный
      'rgba(255, 255, 186, ', // пастельный жёлтый
      'rgba(221, 183, 255, '  // пастельный фиолетовый
    ];

    let isVisible = false;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    class Node {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 3 + 2;
        this.color = pastelColors[Math.floor(Math.random() * pastelColors.length)];
        this.opacity = Math.random() * 0.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.x = Math.max(0, Math.min(width, this.x));
        this.y = Math.max(0, Math.min(height, this.y));
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.fill();
      }
    }

    function init() {
      resize();
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node());
      }
    }

    function drawConnections() {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.4;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = 'rgba(168, 208, 255, ' + opacity + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      if (!isVisible) {
        requestAnimationFrame(animate);
        return;
      }

      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, 0, width, height);

      drawConnections();

      nodes.forEach(node => {
        node.update();
        node.draw();
      });

      requestAnimationFrame(animate);
    }

    function show() {
      isVisible = true;
      canvas.style.display = 'block';
    }

    function hide() {
      isVisible = false;
      canvas.style.display = 'none';
    }

    window.addEventListener('resize', resize);
    init();
    animate();

    document.addEventListener('themeChanged', function(e) {
      if (e.detail.theme === 'dark') {
        show();
      } else {
        hide();
      }
    });

    if (document.body.classList.contains('dark-theme')) {
      show();
    } else {
      hide();
    }

    console.log('✅ Анимация нейронной сети готова!');
  });
})();
