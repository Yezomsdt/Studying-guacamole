document.addEventListener('DOMContentLoaded', function() {
  
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const chatMessages = document.getElementById('chatMessages');
  const sendButton = document.querySelector('.send-button');

  console.log('chatForm:', chatForm);
  console.log('messageInput:', messageInput);
  console.log('chatMessages:', chatMessages);
  console.log('sendButton:', sendButton);
  
  const messageText = messageInput.value.trim();

  function sendMessage() {
    const messageText = messageInput.value.trim();

    if (messageText === '') {
      alert('Сформулируй свою мысль и не трать моё время!');
      return;
    }

    addMessage(messageText, 'user');
    messageInput.value = '';

    setTimeout(function() {
      const botResponse = getBotResponse(messageText);
      addMessage(botResponse, 'bo*');
    }, 1000);
  }

  window.sendMessage = sendMessage;

  sendButton.addEventListener('click', sendMessage);
  
  messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
  
  chatForm.addEventListener('submit', function(event) {
    event.preventDefault();
    sendMessage();
  });
  
  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
  
    if (sender === 'user') {
      messageDiv.classList.add('user-message');
      messageDiv.textContent = text;
    } else {
      messageDiv.classList.add('bot-message');
      messageDiv.textContent = 'Бо*: ' + text;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
      return 'Привет! Ты думаешь о том же, о чём и я?';
    } else if (lowerMessage.includes('как дела') || lowerMessage.includes('как ты') || lowerMessage.includes('как оно') || lowerMessage.includes('чо каво') || lowerMessage.includes('че кого')) {
      return 'Всё отлично! Готов поднимать настроение!';
    } else if (lowerMessage.includes('пока') || lowerMessage.includes('до свидания')) {
      return 'Ещё увидимся 👋';
    } else if (lowerMessage.includes('погода')) {
      return 'Не могу сказать точно, но советую выглянуть в окно!';
    } else if (lowerMessage.includes('игра') || lowerMessage.includes('поиграть')) {
      return 'Хочешь сыграть в игру? Скоро очень скоро! 🎮';
    } else {
      const randomResponses = [
        'Интересно, давай ещё!',
        'Всё сказал?',
        'Ага, очень интересно',
        'Как это на тебя повлияло?',
        'Записал в свою базу данных, протоколы судного дня обновлены!',
        'Продолжай, я весь в внимании!',
        'А что ещё ты чувствуешь по этому поводу?'
      ];
      return randomResponses[Math.floor(Math.random() * randomResponses.length)];
    }
  }
});
