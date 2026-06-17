const loginSection = document.getElementById('login-section');
const leaveSection = document.getElementById('leave-section');
const chatSection = document.getElementById('chat-section');
const phoneInput = document.getElementById('phone-number');
const emailInput = document.getElementById('email-id');
const userNameInput = document.getElementById('user-name');
const userColorInput = document.getElementById('user-color');
const loginBtn = document.getElementById('login-btn');
const leaveBtn = document.getElementById('leave-btn');
const loginTypeRadios = document.querySelectorAll('input[name="login-type"]');

const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesBox = document.getElementById('messages');

const voiceBtn = document.getElementById('voice-btn');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const timeDisplay = document.getElementById('time-display');
const chatTitle = document.getElementById('chat-title');
const userListBottom = document.getElementById('user-list-bottom');
const groupBtn = document.getElementById('group-btn');

const OWNER_PHONE = '9999999999';
const OWNER_EMAIL = 'owner@example.com';

let myPhoneNumber = null;
let myEmail = null;
let myUserName = null;
let myColor = '#0aa8b7';
let isOwner = false;
let loginType = 'phone';

let users = [];
let chatMode = 'group';
let privateChatWithUser = null;

let groupMessages = [];
let privateMessages = {};

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let audioStream = null;

function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  timeDisplay.textContent = `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
}
setInterval(updateTime, 1000);
updateTime();

function getPrivateChatKey(user1, user2) {
  return [user1, user2].sort().join('|');
}

function updateChatTitle() {
  if (chatMode === 'group') {
    chatTitle.textContent = 'Group Chat';
    groupBtn.classList.add('active');
  } else {
    chatTitle.textContent = 'Private Chat with ' + privateChatWithUser.userName;
    groupBtn.classList.remove('active');
  }
}

function updateUserListBottom() {
  userListBottom.innerHTML = '';

  const groupSpan = document.createElement('span');
  groupSpan.textContent = 'Group';
  if (chatMode === 'group') groupSpan.classList.add('active');
  groupSpan.addEventListener('click', () => {
    chatMode = 'group';
    privateChatWithUser = null;
    updateChatTitle();
    updateUserListBottom();
    renderMessages();
  });
  userListBottom.appendChild(groupSpan);

  users.forEach(user => {
    const span = document.createElement('span');
    span.textContent = user.userName;
    span.style.backgroundColor = user.color;
    if (chatMode === 'private' && privateChatWithUser && user.userName === privateChatWithUser.userName) {
      span.classList.add('active');
    }
    span.addEventListener('click', () => {
      chatMode = 'private';
      privateChatWithUser = user;
      updateChatTitle();
      updateUserListBottom();
      renderMessages();
    });
    userListBottom.appendChild(span);
  });
}

function addMessageToStore(msg) {
  if (chatMode === 'group') {
    groupMessages.push(msg);
  } else {
    const key = getPrivateChatKey(myUserName, privateChatWithUser.userName);
    if (!privateMessages[key]) privateMessages[key] = [];
    privateMessages[key].push(msg);
  }
}

function renderMessages() {
  messagesBox.innerHTML = '';
  let messagesToShow = chatMode === 'group'
    ? groupMessages
    : (privateMessages[getPrivateChatKey(myUserName, privateChatWithUser.userName)] || []);

  messagesToShow.forEach((msg, index) => {
    const msgEl = document.createElement('div');
    msgEl.classList.add(msg.isMine ? 'message-mine' : 'message-other');
    if (msg.isMine) {
      msgEl.style.background = msg.color || '#0aa8b7';
      msgEl.style.color = 'white';
    }

    if (!msg.isMine || isOwner) {
      const authorSpan = document.createElement('span');
      authorSpan.classList.add('message-author');
      authorSpan.textContent = msg.author;
      msgEl.appendChild(authorSpan);
    }

    if (msg.type === 'text') {
      const textSpan = document.createElement('span');
      textSpan.textContent = msg.text;
      msgEl.appendChild(textSpan);
    } else if (msg.type === 'voice') {
      const voiceText = document.createElement('span');
      voiceText.textContent = '[voice message] ';
      msgEl.appendChild(voiceText);

      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = msg.text;
      msgEl.appendChild(audio);
    } else if (msg.type === 'file') {
      const fileText = document.createElement('span');
      fileText.textContent = '[file]';
      msgEl.appendChild(fileText);
    }

    if (msg.isMine || isOwner) {
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.marginLeft = '8px';
      deleteBtn.style.padding = '4px 8px';
      deleteBtn.style.background = '#d32f2f';
      deleteBtn.style.color = 'white';
      deleteBtn.style.border = 'none';
      deleteBtn.style.borderRadius = '6px';
      deleteBtn.style.fontSize = '12px';
      deleteBtn.style.cursor = 'pointer';

      deleteBtn.addEventListener('click', () => {
        if (chatMode === 'group') {
          groupMessages.splice(index, 1);
        } else {
          const key = getPrivateChatKey(myUserName, privateChatWithUser.userName);
          privateMessages[key].splice(index, 1);
        }
        renderMessages();
      });

      msgEl.appendChild(deleteBtn);
    }

    messagesBox.appendChild(msgEl);
  });

  messagesBox.scrollTop = messagesBox.scrollHeight;
}

loginTypeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    loginType = radio.value;
    if (loginType === 'phone') {
      phoneInput.style.display = 'block';
      emailInput.style.display = 'none';
    } else {
      phoneInput.style.display = 'none';
      emailInput.style.display = 'block';
    }
  });
});

loginBtn.addEventListener('click', () => {
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const name = userNameInput.value.trim();

  if (!name) {
    alert('Please enter your username');
    return;
  }

  if (loginType === 'phone') {
    if (!phone) {
      alert('Please enter your phone number');
      return;
    }
    myPhoneNumber = phone;
    myEmail = null;
  } else {
    if (!email) {
      alert('Please enter your email ID');
      return;
    }
    myPhoneNumber = null;
    myEmail = email;
  }

  myUserName = name;
  myColor = userColorInput.value;
  isOwner = (myPhoneNumber === OWNER_PHONE || myEmail === OWNER_EMAIL);

  localStorage.setItem('chatUser', JSON.stringify({
    phoneNumber: myPhoneNumber,
    email: myEmail,
    userName: myUserName,
    color: myColor
  }));

  if (!users.some(u => u.userName === myUserName)) {
    users.push({
      phoneNumber: myPhoneNumber,
      email: myEmail,
      userName: myUserName,
      color: myColor
    });
  }

  loginSection.style.display = 'none';
  leaveSection.style.display = 'block';
  chatSection.style.display = 'block';

  chatMode = 'group';
  privateChatWithUser = null;
  updateChatTitle();
  updateUserListBottom();
  renderMessages();
});

leaveBtn.addEventListener('click', () => {
  localStorage.removeItem('chatUser');
  myPhoneNumber = null;
  myEmail = null;
  myUserName = null;
  myColor = '#0aa8b7';
  isOwner = false;
  users = [];
  chatMode = 'group';
  privateChatWithUser = null;

  loginSection.style.display = 'block';
  leaveSection.style.display = 'none';
  chatSection.style.display = 'none';
});

sendBtn.addEventListener('click', () => {
  const text = messageInput.value.trim();
  if (!text) return;

  addMessageToStore({
    author: myUserName,
    text,
    type: 'text',
    isMine: true,
    color: myColor
  });

  messageInput.value = '';
  renderMessages();
});

voiceBtn.addEventListener('click', async () => {
  if (!isRecording) {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(audioStream);
      audioChunks = [];
      isRecording = true;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        addMessageToStore({
          author: myUserName,
          text: audioUrl,
          type: 'voice',
          isMine: true,
          color: myColor
        });

        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
        isRecording = false;
        mediaRecorder = null;
        audioChunks = [];
        renderMessages();
      };

      voiceBtn.textContent = 'Recording... Stop';
      voiceBtn.style.background = '#d32f2f';
      mediaRecorder.start();
    } catch (err) {
      alert('Cannot access microphone: ' + err.message);
    }
  } else {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    voiceBtn.textContent = 'Voice';
    voiceBtn.style.background = '';
  }
});

uploadBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) {
    alert('Please choose a file first');
    return;
  }

  addMessageToStore({
    author: myUserName,
    text: '',
    type: 'file',
    isMine: true,
    color: myColor
  });

  renderMessages();
});

const savedUser = JSON.parse(localStorage.getItem('chatUser') || 'null');
if (savedUser) {
  myPhoneNumber = savedUser.phoneNumber || null;
  myEmail = savedUser.email || null;
  myUserName = savedUser.userName;
  myColor = savedUser.color || '#0aa8b7';
  isOwner = (myPhoneNumber === OWNER_PHONE || myEmail === OWNER_EMAIL);

  if (!users.some(u => u.userName === myUserName)) {
    users.push({
      phoneNumber: myPhoneNumber,
      email: myEmail,
      userName: myUserName,
      color: myColor
    });
  }

  loginSection.style.display = 'none';
  leaveSection.style.display = 'block';
  chatSection.style.display = 'block';
  updateChatTitle();
  updateUserListBottom();
  renderMessages();
}