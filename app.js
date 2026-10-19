// --- ИНИЦИАЛИЗАЦИЯ ТЕМЫ ---
function toggleTheme(checkbox) {
    if (checkbox.checked) {
        document.body.classList.add('light-theme');
        localStorage.setItem('app_theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('app_theme', 'dark');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    const toggle = document.getElementById('theme-toggle');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (toggle) toggle.checked = true;
    } else {
        document.body.classList.remove('light-theme');
        if (toggle) toggle.checked = false;
    }
}

// --- КАСТОМНЫЕ СЕЛЕКТЫ И ЯЗЫКИ ---
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    document.querySelectorAll('.custom-options.open').forEach(el => {
        if (el.id !== id) el.classList.remove('open');
    });
    dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select') && !e.target.closest('.chat-options-menu') && !e.target.closest('.chat-options-btn')) {
        document.querySelectorAll('.custom-options.open').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.chat-options-menu.open').forEach(el => el.classList.remove('open'));
    }
});

function selectLanguage(lang, text) {
    document.getElementById('current-lang-text').innerText = text;
    toggleDropdown('lang-dropdown');
    changeLanguage(lang);
}

function changeLanguage(lang) {
    localStorage.setItem('app_lang', lang);
    const googleSelect = document.querySelector('.goog-te-combo');
    if (googleSelect) {
        googleSelect.value = lang;
        googleSelect.dispatchEvent(new Event('change'));
    }
}

function selectWritingStyle(style, text) {
    document.getElementById('current-style-text').innerText = text;
    toggleDropdown('style-dropdown');
    changeWritingStyle(style);
}

function changeWritingStyle(style) {
    localStorage.setItem('writing_style', style);
    const desc = document.getElementById('style-desc');
    if (style === 'standard') {
        desc.innerText = 'Пример: *Действие* — реплика.';
    } else {
        desc.innerText = 'Пример: *Действие*\n\nИмя (эмоция): "реплика"';
    }
}

function initWritingStyle() {
    const savedStyle = localStorage.getItem('writing_style') || 'standard';
    const text = savedStyle === 'standard' ? 'Стандартный (Книжный)' : 'Кастомный (РП)';
    document.getElementById('current-style-text').innerText = text;
    changeWritingStyle(savedStyle);
}

// --- КАСТОМНЫЕ МОДАЛЬНЫЕ ОКНА ---
let modalCallback = null;
let hideWarningChecked = false;

function showConfirm(title, message, callback) {
    if (localStorage.getItem('hide_edit_warning') === 'true' && title === 'Внимание!') {
        callback(true);
        return;
    }

    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    
    const noShowBtn = document.getElementById('modal-btn-no-show');
    const cancelBtn = document.getElementById('modal-btn-cancel');
    
    hideWarningChecked = false;
    noShowBtn.innerText = 'Больше не показывать';
    noShowBtn.style.color = 'var(--text-muted)';
    
    noShowBtn.onclick = () => {
        hideWarningChecked = !hideWarningChecked;
        noShowBtn.innerText = hideWarningChecked ? '✓ Больше не показывать' : 'Больше не показывать';
        noShowBtn.style.color = hideWarningChecked ? 'var(--text)' : 'var(--text-muted)';
    };

    if (title !== 'Внимание!') {
        noShowBtn.style.display = 'none';
    } else {
        noShowBtn.style.display = 'block';
    }

    cancelBtn.style.display = 'block';
    modalCallback = callback;
    document.getElementById('custom-modal').classList.remove('hidden');
}

function showAlert(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal-btn-no-show').style.display = 'none';
    document.getElementById('modal-btn-cancel').style.display = 'none'; 
    
    modalCallback = null;
    document.getElementById('custom-modal').classList.remove('hidden');
}

function closeModal(result) {
    document.getElementById('custom-modal').classList.add('hidden');
    if (result && hideWarningChecked) {
        localStorage.setItem('hide_edit_warning', 'true');
    }
    if (modalCallback) {
        modalCallback(result);
        modalCallback = null;
    }
}

// --- ОКНО РЕДАКТИРОВАНИЯ / ПРОМОКОДА ---
let currentEditIndex = -1;
let promptCallback = null;

function showPrompt(title, defaultText, callback) {
    document.getElementById('edit-modal-title').innerText = title;
    document.getElementById('edit-modal-input').value = defaultText;
    document.getElementById('edit-modal').classList.remove('hidden');
    promptCallback = callback;
    currentEditIndex = -1;
}

function openEditModal(index, text) {
    currentEditIndex = index;
    document.getElementById('edit-modal-title').innerText = 'Редактировать сообщение';
    document.getElementById('edit-modal-input').value = text;
    document.getElementById('edit-modal').classList.remove('hidden');
    promptCallback = null;
}

function closeEditModal(save) {
    document.getElementById('edit-modal').classList.add('hidden');
    const text = document.getElementById('edit-modal-input').value.trim();
    
    if (save) {
        if (currentEditIndex !== -1 && text !== "") {
            const msg = chatMessagesData[currentEditIndex];
            const newHistory = chatMessagesData.slice(0, currentEditIndex);
            newHistory.push({ text: text, sender: msg.sender });
            chatMessagesData = newHistory;
            allChats[currentChatId].messages = [...chatMessagesData];
            renderChat();
        } else if (promptCallback && text !== "") {
            promptCallback(text);
        }
    }
    currentEditIndex = -1;
    promptCallback = null;
}

// --- ПРОМОКОДЫ ---
function openPromoModal() {
    showPrompt('Ввести промокод', '', (code) => {
        if (code.toUpperCase() === 'ARTIFACT') {
            showAlert('Успех', 'Промокод активирован! Вам начислено 10,000 токенов.');
            // Тут логика начисления
        } else {
            showAlert('Ошибка', 'Неверный или просроченный промокод.');
        }
    });
}

// --- АВАТАРКА ---
function setupProfileAvatar() {
    const container = document.getElementById('profile-avatar-container');
    if (!container) return;

    let avatarInput = document.getElementById('profile-avatar-input');
    if (!avatarInput) {
        avatarInput = document.createElement('input');
        avatarInput.type = 'file';
        avatarInput.id = 'profile-avatar-input';
        avatarInput.accept = 'image/*';
        avatarInput.style.display = 'none';
        document.body.appendChild(avatarInput);
    }

    if (!document.getElementById('change-avatar-btn')) {
        const btn = document.createElement('button');
        btn.id = 'change-avatar-btn';
        btn.className = 'btn secondary';
        btn.style.cssText = 'width: auto; padding: 6px 12px; font-size: 12px; margin-top: 5px; margin-bottom: 10px;';
        btn.innerHTML = 'Сменить аватар';
        container.parentNode.insertBefore(btn, container.nextSibling);
        btn.onclick = () => avatarInput.click();
    }

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                container.innerHTML = `<img src="${ev.target.result}" alt="Avatar">`;
                localStorage.setItem('profile_avatar', ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    const savedAvatar = localStorage.getItem('profile_avatar');
    if (savedAvatar) {
        container.innerHTML = `<img src="${savedAvatar}" alt="Avatar">`;
    }
}

// --- УПРАВЛЕНИЕ ПЕРСОНАЖАМИ (ДЛЯ СЮЖЕТА) ---
let allCharacters = JSON.parse(localStorage.getItem('all_characters')) || {};

function saveCharacter() {
    const nameInput = document.getElementById('char-name-input').value.trim();
    const plotInput = document.getElementById('char-plot-input').value.trim();
    
    if (!nameInput || !plotInput) {
        showAlert('Ошибка', 'Пожалуйста, заполните Имя и Сюжет.');
        return;
    }

    allCharacters[nameInput] = {
        plot: plotInput
    };
    localStorage.setItem('all_characters', JSON.stringify(allCharacters));
    
    showAlert('Успех', 'Персонаж и его сюжет успешно созданы!');
    setTimeout(() => history.back(), 1500);
}

// --- УПРАВЛЕНИЕ ИСТОРИЕЙ ЧАТОВ ---
let allChats = {}; 
let currentChatId = null;
let currentCharacterName = null; 
let chatMessagesData = []; 

function generateId() {
    return 'chat_' + Date.now();
}

function getCurrentCharacterChats() {
    const filtered = {};
    for (const [id, chat] of Object.entries(allChats)) {
        if (chat.character === currentCharacterName) {
            filtered[id] = chat;
        }
    }
    return filtered;
}

function getSortedChats() {
    const charChats = getCurrentCharacterChats();
    return Object.entries(charChats).sort((a, b) => {
        const aPinned = a[1].pinned ? 1 : 0;
        const bPinned = b[1].pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return b[0].localeCompare(a[0]);
    });
}

function updateHistoryOverlay() {
    const historyList = document.getElementById('history-list-full');
    const counterSpan = document.getElementById('chat-count');
    
    if (!historyList) return;
    historyList.innerHTML = '';
    
    const sortedChats = getSortedChats();
    
    sortedChats.forEach(([id, chat]) => {
        const item = document.createElement('div');
        item.className = `history-item ${id === currentChatId ? 'active' : ''}`;
        item.onclick = (e) => {
            if (e.target.closest('.chat-options-btn') || e.target.closest('.chat-options-menu')) return;
            loadHistoryChat(id);
        };
        
        let pinIcon = chat.pinned ? `<span class="pinned-icon"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg></span>` : '';
        
        item.innerHTML = `
            <span>${pinIcon}${chat.character} (${chat.messages.length} сообщ.)</span>
            <button class="chat-options-btn" onclick="toggleChatOptions(event, '${id}')">
                <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
            </button>
            <div class="chat-options-menu" id="options-${id}">
                <button onclick="renameChat('${id}')">Изменить название</button>
                <button onclick="pinChat('${id}')">${chat.pinned ? 'Открепить' : 'Закрепить'}</button>
                <button onclick="deleteChat('${id}')" style="color: #ff4444;">Удалить чат</button>
            </div>
        `;
        historyList.appendChild(item);
    });

    if (counterSpan) {
        counterSpan.innerText = `(${sortedChats.length})`;
    }
}

function toggleChatOptions(e, id) {
    e.stopPropagation();
    document.querySelectorAll('.chat-options-menu.open').forEach(el => {
        if (el.id !== `options-${id}`) el.classList.remove('open');
    });
    const menu = document.getElementById(`options-${id}`);
    if(menu) menu.classList.toggle('open');
}

function renameChat(id) {
    showPrompt('Новое название', allChats[id].character, (newName) => {
        allChats[id].character = newName;
        if (id === currentChatId) {
            currentCharacterName = newName;
            document.getElementById('chat-title-text').innerText = newName;
        }
        updateHistoryOverlay();
    });
}

function pinChat(id) {
    allChats[id].pinned = !allChats[id].pinned;
    updateHistoryOverlay();
}

function deleteChat(id) {
    showConfirm('Удалить чат?', 'Это действие нельзя отменить.', (result) => {
        if (!result) return;
        
        delete allChats[id];
        if (id === currentChatId) {
            const remaining = getSortedChats();
            if (remaining.length > 0) {
                loadHistoryChat(remaining[0][0]);
            } else {
                closeHistoryOverlay();
                startNewChat(); 
            }
        }
        updateHistoryOverlay();
    });
}

function openHistoryOverlay() {
    updateHistoryOverlay();
    const menu = document.getElementById('chat-side-menu');
    menu.classList.remove('open');
    menu.style.display = 'none'; 
    document.getElementById('history-overlay').classList.add('open');
}

function closeHistoryOverlay() {
    document.getElementById('history-overlay').classList.remove('open');
    const menu = document.getElementById('chat-side-menu');
    menu.style.display = 'flex';
    setTimeout(() => menu.classList.add('open'), 50);
}

function loadHistoryChat(chatId) {
    if (!allChats[chatId]) return;
    
    if (currentChatId && allChats[currentChatId]) {
        allChats[currentChatId].messages = chatMessagesData;
    }

    currentChatId = chatId;
    currentCharacterName = allChats[chatId].character;
    chatMessagesData = [...allChats[chatId].messages];
    document.getElementById('chat-title-text').innerText = currentCharacterName;
    
    renderChat();
    document.getElementById('history-overlay').classList.remove('open');
    document.getElementById('chat-side-menu').classList.remove('open');
}

// --- НАВИГАЦИЯ ---
function navigateTo(screenId, chatName = null, chatId = null, push = true) {
    const chatMenu = document.getElementById('chat-side-menu');
    if(chatMenu) chatMenu.classList.remove('open');
    const historyOverlay = document.getElementById('history-overlay');
    if(historyOverlay) historyOverlay.classList.remove('open');

    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    const bottomNav = document.getElementById('bottom-nav');
    if (screenId === 'screen-chat' || screenId === 'screen-create' || screenId === 'screen-create-os') {
        bottomNav.style.display = 'none';
    } else {
        bottomNav.style.display = 'flex';
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if (screenId === 'screen-chars') document.querySelectorAll('.nav-item')[0].classList.add('active');
        if (screenId === 'screen-chats') document.querySelectorAll('.nav-item')[1].classList.add('active');
        if (screenId === 'screen-profile') document.querySelectorAll('.nav-item')[2].classList.add('active');
    }

    const chatScreen = document.getElementById('screen-chat');
    if (screenId === 'screen-chat') {
        chatScreen.classList.remove('hidden');
        
        if (chatName && !chatId) {
            currentCharacterName = chatName;
            document.getElementById('chat-title-text').innerText = chatName;

            // СТАВИМ АВАТАРКУ В ШАПКУ
            const avatarDiv = document.getElementById('chat-char-avatar');
            if (chatName === 'Кай') {
                avatarDiv.style.backgroundImage = "url('https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=100&auto=format&fit=crop')";
            } else {
                avatarDiv.style.backgroundImage = "none"; // Или дефолтная
            }

            const existingChats = getCurrentCharacterChats();
            const existingIds = Object.keys(existingChats);

            if (existingIds.length > 0) {
                currentChatId = existingIds[existingIds.length - 1];
                chatMessagesData = [...allChats[currentChatId].messages];
            } else {
                currentChatId = generateId();
                let startingText = allCharacters[chatName]?.plot || `*${chatName} смотрит на тебя*\n\n— Привет. Давай начнем нашу историю.`;
                chatMessagesData = [{ text: startingText, sender: 'ai' }];
                allChats[currentChatId] = { character: chatName, messages: [...chatMessagesData], pinned: false };
            }
            renderChat();
        } 
        else if (chatId && allChats[chatId]) {
            currentChatId = chatId;
            currentCharacterName = allChats[chatId].character;
            chatMessagesData = [...allChats[chatId].messages];
            document.getElementById('chat-title-text').innerText = currentCharacterName;
            
            const avatarDiv = document.getElementById('chat-char-avatar');
            if (currentCharacterName === 'Кай') {
                avatarDiv.style.backgroundImage = "url('https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=100&auto=format&fit=crop')";
            }

            renderChat();
        }
    } else {
        chatScreen.classList.add('hidden');
    }

    if (push) {
        history.pushState({ screen: screenId, chatName: currentCharacterName, chatId: currentChatId }, '');
    }
}

window.addEventListener('popstate', (e) => {
    if (e.state && e.state.screen) {
        navigateTo(e.state.screen, e.state.chatName, e.state.chatId, false);
    } else {
        navigateTo('screen-chars', null, null, false);
    }
});

function toggleChatMenu() {
    const menu = document.getElementById('chat-side-menu');
    const history = document.getElementById('history-overlay');
    
    if (menu.classList.contains('open')) {
        menu.classList.remove('open');
    } else {
        menu.style.display = 'flex';
        history.classList.remove('open');
        updateHistoryOverlay(); 
        setTimeout(() => menu.classList.add('open'), 50);
    }
}

function startNewChat() {
    if (!currentCharacterName) return;
    allChats[currentChatId].messages = [...chatMessagesData];
    
    currentChatId = generateId();
    let startingText = allCharacters[currentCharacterName]?.plot || `*${currentCharacterName} смотрит на тебя*\n\n— Привет. Давай начнем нашу историю.`;
    
    chatMessagesData = [{ text: startingText, sender: 'ai' }];
    allChats[currentChatId] = { character: currentCharacterName, messages: [...chatMessagesData], pinned: false };
    
    renderChat();
    toggleChatMenu();
}

function formatMessageText(text) {
    let safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    safeText = safeText.replace(/\*(.*?)\*/g, "<em>$1</em>");
    return safeText;
}

function renderChat() {
    const container = document.getElementById('chat-messages');
    if(!container) return;
    container.innerHTML = '';
    
    chatMessagesData.forEach((msg, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${msg.sender}`;
        
        const bubble = document.createElement('div');
        bubble.className = `msg ${msg.sender}`;
        bubble.innerHTML = formatMessageText(msg.text);
        
        const actions = document.createElement('div');
        actions.className = 'msg-actions';
        
        let actionsHtml = `
            <button onclick="editMessage(${index})" title="Редактировать">
                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>`;
            
        if (msg.sender === 'ai') {
            actionsHtml += `
            <button onclick="regenerateMessage(${index})" title="Перегенерировать">
                <svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
            </button>`;
        }
        
        actions.innerHTML = actionsHtml;
        wrapper.appendChild(bubble);
        wrapper.appendChild(actions);
        container.appendChild(wrapper);
    });
    
    container.scrollTop = container.scrollHeight;
}

function addMessage(text, sender) {
    chatMessagesData.push({ text, sender });
    if (allChats[currentChatId]) {
        allChats[currentChatId].messages = [...chatMessagesData];
    }
    renderChat();
}

function editMessage(index) {
    showConfirm('Внимание!', 'Вся история чата после этого сообщения будет удалена. Продолжить?', (result) => {
        if (!result) return;
        const msg = chatMessagesData[index];
        openEditModal(index, msg.text);
    });
}

function regenerateMessage(index) {
    showConfirm('Внимание!', 'Вся история чата после этого сообщения будет удалена. Продолжить?', (result) => {
        if (!result) return;
        chatMessagesData = chatMessagesData.slice(0, index);
        allChats[currentChatId].messages = [...chatMessagesData];
        renderChat();
        simulateAIResponse();
    });
}

function toggleCustomLore(checkbox) {
    const warningBox = document.getElementById('lore-warning');
    if (checkbox.checked) warningBox.classList.add('active');
    else warningBox.classList.remove('active');
    localStorage.setItem('custom_lore', checkbox.checked);
}

function initCustomLore() {
    const saved = localStorage.getItem('custom_lore') === 'true';
    const toggle = document.getElementById('custom-lore-toggle');
    if (toggle) {
        toggle.checked = saved;
        if (saved) document.getElementById('lore-warning').classList.add('active');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupProfileAvatar();
    initWritingStyle();
    initCustomLore();

    const savedLang = localStorage.getItem('app_lang') || 'ru';
    const langText = savedLang === 'ru' ? 'RU' : savedLang === 'uk' ? 'UA' : 'EN';
    document.getElementById('current-lang-text').innerText = langText;
    setTimeout(() => changeLanguage(savedLang), 1000);

    history.replaceState({ screen: 'screen-chars' }, '');
});

function switchTab(screenId, navElement) { navigateTo(screenId); }
function openChat(name) { navigateTo('screen-chat', name); }
function resumeChat(name) { openChat(name); }
function startCreate() { navigateTo('screen-create'); }
function startCreateOS() { navigateTo('screen-create-os'); }
function saveOS() { showAlert('Успех', 'ОС сохранена!'); setTimeout(() => history.back(), 1500); }

let isUniverseMode = false;
let isAnimating = false;
let isOsFileMode = false;

function switchMainTab(tab, el) {
    document.querySelectorAll('.mtab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

function switchProfileTab(tabId, el) {
    document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.ptab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`ptab-${tabId}`).classList.add('active');
}

function switchMode(toUniverse) {
    if (isUniverseMode === toUniverse || isAnimating) return;
    isAnimating = true;
    isUniverseMode = toUniverse;
    const bg = document.getElementById('toggle-bg');
    const formChar = document.getElementById('form-char');
    const formUniverse = document.getElementById('form-universe');
    
    if (toUniverse) {
        bg.classList.add('universe'); 
        document.getElementById('btn-mode-char').classList.remove('active'); 
        document.getElementById('btn-mode-universe').classList.add('active');
    } else {
        bg.classList.remove('universe'); 
        document.getElementById('btn-mode-universe').classList.remove('active'); 
        document.getElementById('btn-mode-char').classList.add('active');
    }
    
    const currentForm = toUniverse ? formChar : formUniverse;
    const nextForm = toUniverse ? formUniverse : formChar;
    
    currentForm.classList.add('anim-explode-out');
    setTimeout(() => {
        currentForm.classList.remove('active', 'anim-explode-out');
        nextForm.classList.add('active', 'anim-suck-in');
        setTimeout(() => { nextForm.classList.remove('anim-suck-in'); isAnimating = false; }, 400);
    }, 400);
}

function switchOsMode(toFile) {
    isOsFileMode = toFile;
    const bg = document.getElementById('os-toggle-bg');
    const form = document.getElementById('os-form-wrapper');
    const file = document.getElementById('os-file-wrapper');
    const btnForm = document.getElementById('btn-os-form');
    const btnFile = document.getElementById('btn-os-file');
    
    if (toFile) {
        bg.classList.add('active'); btnForm.classList.remove('active'); btnFile.classList.add('active');
        form.style.display = 'none'; file.style.display = 'block';
    } else {
        bg.classList.remove('active'); btnFile.classList.remove('active'); btnForm.classList.add('active');
        file.style.display = 'none'; form.style.display = 'block';
    }
}

function handleKeyPress(e) { if (e.key === 'Enter') sendMessage(); }

function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user'); 
    input.value = '';
    simulateAIResponse();
}

function simulateAIResponse() {
    const container = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'msg ai typing'; 
    typingDiv.innerText = '...'; 
    typingDiv.id = 'typing-indicator';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper ai';
    wrapper.appendChild(typingDiv);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
        document.getElementById('typing-indicator')?.parentElement.remove();
        const style = localStorage.getItem('writing_style') || 'standard';
        let aiReply = "";

        if (style === 'standard') {
            aiReply = "*Кай усмехается и делает глоток виски* — Интересный подход. Но мне нравится ход твоих мыслей. Продолжай.";
        } else {
            aiReply = "*Кай усмехается, отставляя стакан в сторону, и смотрит прямо на тебя*\n\nКай (с иронией): \"Интересный подход. Но мне нравится ход твоих мыслей. Продолжай.\"";
        }
        addMessage(aiReply, 'ai');
    }, 1500);
}

function editNickname() {
    const currentNick = document.getElementById('user-nick').innerText;
    showPrompt('Новый ник (до 50 символов)', currentNick, (newNick) => {
        if (newNick.length <= 50) {
            document.getElementById('user-nick').innerText = newNick;
        } else {
            showAlert('Ошибка', 'Слишком длинный ник! Максимум 50 символов.');
        }
    });
}

function setupAvatarUpload(zoneId, inputId, previewId, textId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const text = document.getElementById(textId);
    if(!zone) return;
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                preview.src = ev.target.result;
                preview.style.display = 'block';
                text.style.display = 'none';
                zone.querySelector('svg').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
}
setupAvatarUpload('drop-zone-char', 'input-char', 'preview-char', 'text-char');
setupAvatarUpload('drop-zone-universe', 'input-universe', 'preview-universe', 'text-universe');