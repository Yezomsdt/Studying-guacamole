document.addEventListener('DOMContentLoaded', function() {
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const chatMessages = document.getElementById('chatMessages');
  const sendButton = document.querySelector('.send-button');

  if (!chatForm || !messageInput || !chatMessages || !sendButton) {
    console.error('❌ Не найдены элементы чата');
    return;
  }

  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (sender === 'user') {
      messageDiv.classList.add('user-message');
      messageDiv.textContent = text;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
      messageDiv.classList.add('bot-message');
      chatMessages.appendChild(messageDiv);
      typeText(messageDiv, 'Бо*: ' + text);
    }
    return messageDiv;
  }

  function typeText(element, text, speed = 30) {
    let i = 0;
    element.textContent = '';
    function typing() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(typing, speed);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
    typing();
  }

  function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message', 'typing-indicator');
    typingDiv.innerHTML = '<span>.</span><span>.</span><span>.</span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
  }

  async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText === '') {
      alert('Сформулируй свою мысль!');
      return;
    }

    addMessage(messageText, 'user');
    messageInput.value = '';

    const typingDiv = addTypingIndicator();

    try {
      const response = await puter.ai.chat(messageText, {
        model: 'gpt-5-nano',
        stream: false
      });

      typingDiv.remove();

      const botAnswer = response?.text || 'Не могу ответить...';
      addMessage(botAnswer, 'bo*');

    } catch (error) {
      console.error('Ошибка AI:', error);
      typingDiv.remove();
      addMessage('Ошибка связи с нейросетью. Попробуй позже!', 'bo*');
    }
  }

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

  const modal = document.getElementById('achievementModal');
  const modalImage = document.getElementById('modalImage');
  const closeModal = document.querySelector('.achievement-modal-close');
  const achievementFigures = document.querySelectorAll('.achievements-gallery figure');

  achievementFigures.forEach(figure => {
    const img = figure.querySelector('img');
    if (img) {
      img.addEventListener('click', function() {
        const imageSrc = figure.getAttribute('data-image') || this.src;
        modalImage.src = imageSrc;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }
  });

  if (closeModal) {
    closeModal.addEventListener('click', function() {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
});
