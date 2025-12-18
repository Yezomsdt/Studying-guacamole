document.addEventListener('DOMContentLoaded', function() {
  console.log('🌳 Дерево настроения загружается...');

  const moodTree = document.getElementById('moodTree');
  const growBtn = document.getElementById('growTree');
  const resetBtn = document.getElementById('resetTree');
  const leafCount = document.getElementById('leafCount');
  const moodScore = document.getElementById('moodScore');
  const messagePopup = document.getElementById('messagePopup');
  const popupMessageText = document.getElementById('popupMessageText');
  const popupMood = document.getElementById('popupMood');
  const popupTime = document.getElementById('popupTime');
  const closePopup = document.querySelector('.close-popup');

  let messages = [];
  let leafCounter = 0;

  drawTree();

  function analyzeMood(text) {
    const lowerText = text.toLowerCase();
    let score = 0;

    const positiveWords = ['хорошо', 'отлично', 'рад', 'счастье', 'люблю', 'прекрасно', 'супер', 'круто', 'ура', 'успех'];
    const negativeWords = ['плохо', 'грустно', 'печаль', 'злой', 'ненавижу', 'ужасно', 'проблема', 'беда', 'слезы', 'больно'];

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 2;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 2;
    });

    if (score >= 3) return { type: 'positive', score: score, emoji: '😊', color: '#4CAF50' };
    if (score >= 1) return { type: 'good', score: score, emoji: '🙂', color: '#8BC34A' };
    if (score >= -1) return { type: 'neutral', score: score, emoji: '😐', color: '#FFC107' };
    if (score >= -3) return { type: 'sad', score: score, emoji: '😢', color: '#FF9800' };
    return { type: 'negative', score: score, emoji: '😠', color: '#F44336' };
  }

  function drawTree() {
    const svgNS = "http://www.w3.org/2000/svg";

    moodTree.innerHTML = '';

    const trunk = document.createElementNS(svgNS, 'path');
    trunk.setAttribute('d', 'M400,450 L400,300 Q400,280 420,260 Q440,240 430,220 Q420,200 400,180');
    trunk.setAttribute('class', 'tree-branch');
    trunk.setAttribute('stroke', '#8B4513');
    trunk.setAttribute('stroke-width', '20');
    trunk.setAttribute('fill', 'none');
    moodTree.appendChild(trunk);

    const branches = [
      { path: 'M400,350 Q380,330 360,310', width: 10 },
      { path: 'M400,320 Q420,300 440,290', width: 8 },
      { path: 'M400,280 Q370,260 350,250', width: 7 },
      { path: 'M400,250 Q430,230 450,220', width: 6 }
    ];
    
    branches.forEach(branch => {
      const branchElem = document.createElementNS(svgNS, 'path');
      branchElem.setAttribute('d', branch.path);
      branchElem.setAttribute('class', 'tree-branch');
      branchElem.setAttribute('stroke', '#A0522D');
      branchElem.setAttribute('stroke-width', branch.width.toString());
      branchElem.setAttribute('fill', 'none');
      moodTree.appendChild(branchElem);
    });

    messages.forEach((msg, index) => {
      addLeafToTree(msg.text, msg.mood, index);
    });
  }

  function addLeafToTree(text, mood, id) {
    const svgNS = "http://www.w3.org/2000/svg";

    const x = 350 + Math.random() * 100;
    const y = 180 + Math.random() * 200;

    const leafGroup = document.createElementNS(svgNS, 'g');
    leafGroup.setAttribute('class', 'tree-leaf');
    leafGroup.setAttribute('data-id', id);

    const leaf = document.createElementNS(svgNS, 'ellipse');
    leaf.setAttribute('cx', x);
    leaf.setAttribute('cy', y);
    leaf.setAttribute('rx', '15');
    leaf.setAttribute('ry', '8');
    leaf.setAttribute('fill', mood.color);
    leaf.setAttribute('stroke', mood.color);
    leaf.setAttribute('stroke-width', '1');

    const stem = document.createElementNS(svgNS, 'line');
    stem.setAttribute('x1', x);
    stem.setAttribute('y1', y - 8);
    stem.setAttribute('x2', x);
    stem.setAttribute('y2', y - 15);
    stem.setAttribute('stroke', '#556B2F');
    stem.setAttribute('stroke-width', '2');
    
    leafGroup.appendChild(leaf);
    leafGroup.appendChild(stem);
    moodTree.appendChild(leafGroup);

    leafGroup.addEventListener('click', function() {
      showMessagePopup(id);
    });

    leafGroup.style.opacity = '0';
    leafGroup.style.transform = `translate(0, -20px)`;
    
    setTimeout(() => {
      leafGroup.style.transition = 'all 0.8s ease';
      leafGroup.style.opacity = '1';
      leafGroup.style.transform = `translate(0, 0)`;
    }, 50);
  }

  function showMessagePopup(id) {
    const message = messages[id];
    
    if (!message) return;
    
    popupMessageText.textContent = message.text;
    popupMood.textContent = `Настроение: ${message.mood.type} ${message.mood.emoji}`;
    popupTime.textContent = `Время: ${message.time}`;
    
    messagePopup.classList.add('active');
  }

  function addMessageToTree(text) {
    const mood = analyzeMood(text);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const message = {
      text: text,
      mood: mood,
      time: time,
      id: messages.length
    };
    
    messages.push(message);
    addLeafToTree(text, mood, message.id);

    updateStats();

    saveMessagesToStorage();
  }

  function updateStats() {
    leafCount.textContent = messages.length;
    
    if (messages.length > 0) {
      const avgScore = messages.reduce((sum, msg) => sum + msg.mood.score, 0) / messages.length;
      
      let emoji = '😐';
      if (avgScore >= 1.5) emoji = '😊';
      else if (avgScore >= 0.5) emoji = '🙂';
      else if (avgScore <= -1.5) emoji = '😠';
      else if (avgScore <= -0.5) emoji = '😢';
      
      moodScore.textContent = emoji;
    }
  }

  function saveMessagesToStorage() {
    try {
      localStorage.setItem('moodTreeMessages', JSON.stringify(messages));
    } catch (e) {
      console.log('Не удалось сохранить сообщения:', e);
    }
  }

  function loadMessagesFromStorage() {
    try {
      const saved = localStorage.getItem('moodTreeMessages');
      if (saved) {
        messages = JSON.parse(saved);
        updateStats();
      }
    } catch (e) {
      console.log('Не удалось загрузить сообщения:', e);
    }
  }

  growBtn.addEventListener('click', function() {
    drawTree();
  });

  resetBtn.addEventListener('click', function() {
    if (confirm('Удалить все сообщения и сбросить дерево?')) {
      messages = [];
      localStorage.removeItem('moodTreeMessages');
      drawTree();
      updateStats();
    }
  });

  closePopup.addEventListener('click', function() {
    messagePopup.classList.remove('active');
  });

  messagePopup.addEventListener('click', function(e) {
    if (e.target === messagePopup) {
      messagePopup.classList.remove('active');
    }
  });

  const originalSendMessage = window.sendMessage;
  
  if (typeof originalSendMessage === 'function') {
    window.sendMessage = function() {
      const messageInput = document.getElementById('messageInput');
      const text = messageInput.value.trim();
      
      if (text) {
        addMessageToTree(text);
        
        return originalSendMessage();
      }
    };
  } else {
    document.addEventListener('messageSent', function(e) {
      if (e.detail && e.detail.text) {
        addMessageToTree(e.detail.text);
      }
    });
  }
  
  loadMessagesFromStorage();
  
  if (messages.length === 0) {
    const demoMessages = [
      "Привет! Какой прекрасный день!",
      "Сегодня немного грустно...",
      "Жду выходных с нетерпением!",
      "Устал от работы, нужен отдых",
      "Получил хорошие новости!"
    ];
    
    demoMessages.forEach(msg => {
      addMessageToTree(msg);
    });
  }
  
  console.log('✅ Дерево настроения готово!');
});
