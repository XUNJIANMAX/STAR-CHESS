// ============================================
// 🌐 联机对战：Firebase 实时数据库配置
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDvWUkDVtbXMy2-SCiVWsBvtvu06Q65hZU",
    authDomain: "chess-f771f.firebaseapp.com",
    databaseURL: "https://chess-f771f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chess-f771f",
    storageBucket: "chess-f771f.firebasestorage.app",
    messagingSenderId: "749830614567",
    appId: "1:749830614567:web:bd35ec923769796738a802",
    measurementId: "G-Q1WBQZ63HG"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

var isOnlineMode = false;
var onlineRoomId = null;
var waitingTimer = null;
var lastMsgId = null; // ⭐改为用独一无二的 msgId 来判断，彻底解决本地双重触发问题

// ============================================
// 用户昵称身份管理
// ============================================
var currentUserName = localStorage.getItem('chessUserName') || '星棋手';
document.getElementById('userNameSpan').innerText = currentUserName;

function editUserName() {
    var newName = prompt("请输入你的全新昵称：", currentUserName);
    if (newName !== null) {
        newName = newName.trim();

        // ⭐ 检查彩蛋条件
        var isClown = (newName === "孙哲闻" || newName === "吴艳玉" || newName === "朱佳艺");
        var isMaster = (newName === "李昕燃" || newName.toUpperCase() === "XUN");

        if (isClown) {
            alert("🤡");
            newName = "🤡";
        } else if (isMaster) {
            alert("欢迎回来，主人");
        }

        // 放行中文、字母、数字，以及我们的特殊彩蛋字符🤡
        if (newName === "🤡" || /^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(newName)) {
            currentUserName = newName;
            localStorage.setItem('chessUserName', currentUserName);
            document.getElementById('userNameSpan').innerText = currentUserName;

            // 如果不是彩蛋，正常提示修改成功
            if (!isClown && !isMaster) {
                alert("昵称修改成功！");
            }
        } else {
            alert("⚠️ 格式错误：只能包含汉字、英文字母或数字。");
        }
    }
}

// ============================================
// 开发者信息页逻辑
// ============================================
function openDeveloperMenu() {
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('developerScreen').style.display = 'flex';
}
function closeDeveloperMenu() {
    document.getElementById('developerScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'flex';
}

// ============================================
// AI 对话设置与存储
// ============================================
var aiChatStyle = localStorage.getItem('duoChessChatStyle') || 'normal';

function updateChatSettingsUI() {
    var btnNormal = document.getElementById('btn-chat-normal');
    var btnRealtime = document.getElementById('btn-chat-realtime');
    var apiSettings = document.getElementById('realtimeApiSettings');

    if (aiChatStyle === 'normal') {
        btnNormal.className = 'duo-btn duo-btn-primary menu-btn';
        btnNormal.innerHTML = '📝 普通评价风格 ✔';
        btnRealtime.className = 'duo-btn duo-btn-secondary menu-btn';
        btnRealtime.innerHTML = '🔥 实时自定义 AI';
        apiSettings.style.display = 'none';
    } else {
        btnNormal.className = 'duo-btn duo-btn-secondary menu-btn';
        btnNormal.innerHTML = '📝 普通评价风格';
        btnRealtime.className = 'duo-btn duo-btn-primary menu-btn';
        btnRealtime.innerHTML = '🔥 实时自定义 AI ✔';
        apiSettings.style.display = 'block';

        document.getElementById('chatModelSelect').value = localStorage.getItem('aiModel') || 'deepseek';
        document.getElementById('chatApiKeyInput').value = localStorage.getItem('aiApiKey') || '';
        document.getElementById('chatUserNameInput').value = localStorage.getItem('aiChatUserName') || '';
        document.getElementById('chatStylePromptInput').value = localStorage.getItem('aiChatStylePrompt') || '';
    }
}

function selectChatStyle(style) {
    aiChatStyle = style;
    localStorage.setItem('duoChessChatStyle', style);
    updateChatSettingsUI();
}

function saveChatSettings() {
    var model = document.getElementById('chatModelSelect').value;
    var apiKey = document.getElementById('chatApiKeyInput').value.trim();
    var userName = document.getElementById('chatUserNameInput').value.trim() || '人类';
    var stylePrompt = document.getElementById('chatStylePromptInput').value.trim() || '极度毒舌、高傲且不屑一顾';

    if(!apiKey && aiChatStyle === 'realtime') {
        alert("API 密钥不能为空"); return;
    }
    localStorage.setItem('aiModel', model);
    localStorage.setItem('aiApiKey', apiKey);
    localStorage.setItem('aiChatUserName', userName);
    localStorage.setItem('aiChatStylePrompt', stylePrompt);
    alert("AI 偏好设置已保存！");
}

function openAiChatSettingsMenu() { document.getElementById('settingsScreen').style.display = 'none'; document.getElementById('aiChatSettingsScreen').style.display = 'flex'; updateChatSettingsUI(); }
function closeAiChatSettingsMenu() { document.getElementById('aiChatSettingsScreen').style.display = 'none'; document.getElementById('settingsScreen').style.display = 'flex'; }

// ============================================
// 游戏核心状态
// ============================================
var game = new Chess();
var board = null;
var fenHistory = [];
var currentViewIndex = 0;

var currentAiLevel = parseInt(localStorage.getItem('duoChessLevel')) || 1;
var currentWhiteScore = 0;
var previousWhiteScore = 0;

var aiPlayerSetting = localStorage.getItem('duoChessAiColor') || 'white';
var actualPlayerColor = 'white';

var themeColors = {
    'black':  { primary: '#4B4B4B', shadow: '#1C1C1C' },
    'pink':   { primary: '#FF89A2', shadow: '#E05E7B' },
    'blue':   { primary: '#1CB0F6', shadow: '#1899D6' },
    'green':  { primary: '#58CC02', shadow: '#58A700' },
    'yellow': { primary: '#FFC800', shadow: '#E5B400' },
    'red':    { primary: '#FF4B4B', shadow: '#EA2B2B' },
    'purple': { primary: '#CE82FF', shadow: '#A559DB' }
};
var currentThemeKey = localStorage.getItem('duoChessTheme') || 'black';

var blob = new Blob([`importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js');`], { type: 'application/javascript' });
var engine = new Worker(window.URL.createObjectURL(blob));
engine.postMessage('uci');
var thinkingTimer = null;

var levelDisplay = document.getElementById('levelDisplay');
if(levelDisplay) levelDisplay.innerText = "🤖 Lv. " + currentAiLevel;

window.onload = function() {
    var urlParams = new URLSearchParams(window.location.search);
    var room = urlParams.get('room');
    if (room) { joinOnlineRoom(room); }

    // 监听屏幕大小变化，自动重绘棋盘防错乱
    window.addEventListener('resize', function() {
        if (board) board.resize();
    });
};

// ============================================
// 联机对战逻辑
// ============================================
function createOnlineRoom() {
    onlineRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    var hostColor = Math.random() < 0.5 ? 'white' : 'black';
    actualPlayerColor = hostColor;
    localStorage.setItem('lastGameColor', actualPlayerColor);

    db.ref('rooms/' + onlineRoomId).set({
        status: 'waiting', hostColor: hostColor, fen: game.fen(),
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('waitingScreen').style.display = 'flex';
    document.getElementById('waitingPlayerName').innerText = "当前棋手：" + currentUserName;

    var shareUrl = window.location.origin + window.location.pathname + '?room=' + onlineRoomId;
    document.getElementById('inviteLink').innerText = shareUrl;

    var timeLeft = 300;
    document.getElementById('waitingTime').innerText = "05:00";
    waitingTimer = setInterval(function() {
        timeLeft--;
        if (timeLeft <= 0) { cancelOnlineRoom(); alert("等待超时，房间已关闭。"); }
        else {
            var m = Math.floor(timeLeft / 60); var s = timeLeft % 60;
            document.getElementById('waitingTime').innerText = "0" + m + ":" + (s < 10 ? "0" + s : s);
        }
    }, 1000);

    db.ref('rooms/' + onlineRoomId).on('value', function(snapshot) {
        var data = snapshot.val();
        if (data && data.status === 'playing' && document.getElementById('waitingScreen').style.display === 'flex') {
            clearInterval(waitingTimer); enterOnlineGameScreen();
        }
    });
}

function cancelOnlineRoom() {
    if (waitingTimer) clearInterval(waitingTimer);
    if (onlineRoomId) db.ref('rooms/' + onlineRoomId).remove();
    document.getElementById('waitingScreen').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'flex';
    window.history.replaceState({}, document.title, window.location.pathname);
}

function copyInviteLink() {
    var link = document.getElementById('inviteLink').innerText;
    navigator.clipboard.writeText(link).then(function() { alert("已复制到剪贴板，快发给好友吧！"); });
}

function joinOnlineRoom(roomId) {
    db.ref('rooms/' + roomId).once('value').then(function(snapshot) {
        var data = snapshot.val();
        if (!data || data.status !== 'waiting') {
            alert("房间不存在或对局已开始！");
            window.history.replaceState({}, document.title, window.location.pathname); return;
        }

        onlineRoomId = roomId;
        actualPlayerColor = data.hostColor === 'white' ? 'black' : 'white';
        localStorage.setItem('lastGameColor', actualPlayerColor);

        db.ref('rooms/' + onlineRoomId).update({ status: 'playing' });
        document.getElementById('homeScreen').style.display = 'none';
        enterOnlineGameScreen();
        listenToOnlineMoves();
    });
}

function enterOnlineGameScreen() {
    isOnlineMode = true;
    engine.postMessage('stop');
    game.reset(); fenHistory = [game.fen()]; currentWhiteScore = 0; previousWhiteScore = 0; lastMsgId = null;

    document.getElementById('waitingScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('aiChatSettingsScreen').style.display = 'none';
    document.getElementById('developerScreen').style.display = 'none';

    document.getElementById('gameBottomBar').style.display = 'none';
    document.getElementById('selfChatBox').style.display = 'block';
    document.getElementById('selfChatBox').innerText = '💬 点击发言...';

    document.getElementById('duoMessage').innerHTML = '';

    document.getElementById('gameScreen').style.display = 'flex';
    document.getElementById('aiAskBtn').style.display = 'none';
    document.getElementById('levelDisplay').innerText = "🌐 联机对战";

    var startMsg = actualPlayerColor === 'white' ? "联机成功！你执白棋，请先走。" : "联机成功！你执黑棋，等待对方落子。";
    setAnimatedMessage(`<span style="color:#8E8E93; font-size:13px;">[系统] ${startMsg}</span>`);

    setTimeout(function() {
        document.getElementById('myBoard').innerHTML = '';
        board = Chessboard('myBoard', Object.assign({}, config, { orientation: actualPlayerColor }));
        board.position(game.fen()); setTimeout(updateKingShiver, 50);
        updateNavButtons(); updateMaterialScore();
        listenToOnlineMoves();
        listenToOnlineChat();
    }, 50);
    window.history.replaceState({}, document.title, window.location.pathname);
}

function listenToOnlineMoves() {
    db.ref('rooms/' + onlineRoomId).on('value', function(snapshot) {
        var data = snapshot.val();
        if (data && data.fen && data.fen !== game.fen()) {
            game.load(data.fen); board.position(game.fen());
            setTimeout(updateKingShiver, 50);

            fenHistory.push(game.fen()); currentViewIndex = fenHistory.length - 1;
            saveReplayData(); updateNavButtons(); updateMaterialScore();

            if (game.game_over()) updateOnlineStatus();
        }
    });
}

function openOnlineChatMenu() { document.getElementById('onlineChatMenuModal').style.display = 'flex'; }
function closeOnlineChatMenu() { document.getElementById('onlineChatMenuModal').style.display = 'none'; }

function sendOnlineChat(msg) {
    if(!msg) return;

    // ⭐ 发送时生成唯一ID，完全解决本地 Timestamp 引发的重复渲染问题
    var msgId = Math.random().toString(36).substring(2, 10);

    db.ref('rooms/' + onlineRoomId + '/chat').set({
        msgId: msgId,
        sender: actualPlayerColor,
        senderName: currentUserName,
        text: msg,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    closeOnlineChatMenu();
    document.getElementById('customOnlineChatInput').value = '';
}

function sendCustomOnlineChat() {
    var val = document.getElementById('customOnlineChatInput').value.trim();
    if(val) sendOnlineChat(val);
}

function listenToOnlineChat() {
    db.ref('rooms/' + onlineRoomId + '/chat').off('value');
    db.ref('rooms/' + onlineRoomId + '/chat').on('value', function(snapshot) {
        var data = snapshot.val();

        // ⭐ 通过对比唯一 msgId 而非时间戳，避免重复
        if (data && data.text && data.msgId !== lastMsgId) {
            lastMsgId = data.msgId;
            var isSelf = data.sender === actualPlayerColor;
            var msgColor = isSelf ? '#1CB0F6' : '#FF89A2'; // 自己发言为蓝色，对手为粉色

            var msgHtml = `<span style="color:${msgColor};"><b>${data.senderName}：</b></span>${data.text}`;
            setAnimatedMessage(msgHtml);
        }
    });
}

function updateOnlineStatus() {
    var msg = "";
    if (game.in_checkmate()) {
        var isPlayerWin = (game.turn() === 'b' && actualPlayerColor === 'white') || (game.turn() === 'w' && actualPlayerColor === 'black');
        msg = isPlayerWin ? `<span style="color:#58CC02; font-weight:800;">【系统】你赢了！漂亮地将死了对手。</span>` : `<span style="color:#FF4B4B; font-weight:800;">【系统】你输了，被将死了。</span>`;
    } else if (game.in_draw()) {
        msg = `<span style="color:#8E8E93; font-weight:800;">【系统】和棋！双方势均力敌。</span>`;
    }
    if (msg) setAnimatedMessage(msg);
}

// ============================================
// 棋局常规交互
// ============================================
function removeHighlights() { $('#myBoard .square-55d63').removeClass('highlight-dot highlight-capture'); }
function updateKingShiver() {
    $('#myBoard .square-55d63').removeClass('shaking-square');
    if (game.in_check()) {
        var turn = game.turn(); var boardData = game.board(); var kingSquare = '';
        var files = ['a','b','c','d','e','f','g','h'];
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
                if (boardData[r][c] && boardData[r][c].type === 'k' && boardData[r][c].color === turn) { kingSquare = files[c] + (8 - r); break; }
            }
        }
        if (kingSquare) $('#myBoard .square-' + kingSquare).addClass('shaking-square');
    }
}

function setAnimatedMessage(html) {
    var duoMsgElem = document.getElementById('duoMessage');
    if (isOnlineMode) {
        var msgDiv = document.createElement('div');
        msgDiv.className = 'msg-fade-in';
        msgDiv.style.marginBottom = '6px';
        msgDiv.innerHTML = html;
        duoMsgElem.appendChild(msgDiv);
        duoMsgElem.scrollTop = duoMsgElem.scrollHeight;
    } else {
        duoMsgElem.innerHTML = `<div class="msg-fade-in">${html}</div>`;
    }
}

function applyTheme() {
    var t = themeColors[currentThemeKey];
    document.documentElement.style.setProperty('--theme-primary', t.primary);
    document.documentElement.style.setProperty('--theme-shadow', t.shadow);
    document.documentElement.style.setProperty('--theme-board-dark', t.primary);
    updateAiSettingsUI();
}
applyTheme();

function saveReplayData() { if (fenHistory.length > 1) localStorage.setItem('chessReplayData', JSON.stringify(fenHistory)); }

var savedReplay = localStorage.getItem('chessReplayData');
var reviewBtn = document.getElementById('reviewBtn');
if (savedReplay && JSON.parse(savedReplay).length > 1 && reviewBtn) reviewBtn.classList.remove('btn-disabled');

function openSettings() { document.getElementById('homeScreen').style.display = 'none'; document.getElementById('settingsScreen').style.display = 'flex'; }
function closeSettings() { document.getElementById('settingsScreen').style.display = 'none'; document.getElementById('homeScreen').style.display = 'flex'; }
function openThemeMenu() { document.getElementById('settingsScreen').style.display = 'none'; document.getElementById('themeScreen').style.display = 'flex'; }
function closeThemeMenu() { document.getElementById('themeScreen').style.display = 'none'; document.getElementById('settingsScreen').style.display = 'flex'; }
function openAiSettingsMenu() { document.getElementById('settingsScreen').style.display = 'none'; document.getElementById('aiSettingsScreen').style.display = 'flex'; updateAiSettingsUI(); }
function closeAiSettingsMenu() { document.getElementById('aiSettingsScreen').style.display = 'none'; document.getElementById('settingsScreen').style.display = 'flex'; }
function selectTheme(themeKey) { currentThemeKey = themeKey; localStorage.setItem('duoChessTheme', themeKey); applyTheme(); closeThemeMenu(); }
function selectAiColor(color) { aiPlayerSetting = color; localStorage.setItem('duoChessAiColor', color); updateAiSettingsUI(); setTimeout(closeAiSettingsMenu, 200); }

function updateAiSettingsUI() {
    var btns = ['white', 'black', 'random']; var labels = { 'white': '⚪ 执白棋', 'black': '⚫ 执黑棋', 'random': '🎲 随机分配' };
    btns.forEach(function(b) {
        var btnElem = document.getElementById('btn-ai-' + b);
        if (!btnElem) return;
        if (b === aiPlayerSetting) { btnElem.className = 'duo-btn duo-btn-primary menu-btn'; btnElem.innerHTML = labels[b] + ' ✔'; }
        else { btnElem.className = 'duo-btn duo-btn-secondary menu-btn'; btnElem.innerHTML = labels[b]; }
    });
}

function startAIGame(isRestart = false) {
    isOnlineMode = false;
    engine.postMessage('stop'); if (thinkingTimer) clearTimeout(thinkingTimer);
    if (isRestart) { game.reset(); fenHistory = []; previousWhiteScore = 0; currentWhiteScore = 0; }

    actualPlayerColor = aiPlayerSetting === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : aiPlayerSetting;
    localStorage.setItem('lastGameColor', actualPlayerColor);

    document.getElementById('gameBottomBar').style.display = 'flex';
    document.getElementById('selfChatBox').style.display = 'none';

    var undoBtn = document.getElementById('undoBtn');
    if(undoBtn) { undoBtn.classList.remove('btn-disabled'); undoBtn.onclick = undoMove; }

    setAnimatedMessage(actualPlayerColor === 'white' ? "准备好学习将杀了？你执白棋，先走！" : "你执黑棋，我先走！请稍等...");

    document.getElementById('aiAskBtn').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('themeScreen').style.display = 'none';
    document.getElementById('aiSettingsScreen').style.display = 'none';
    document.getElementById('aiChatSettingsScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    document.getElementById('levelDisplay').innerText = "🤖 Lv. " + currentAiLevel;

    setTimeout(function() {
        document.getElementById('myBoard').innerHTML = '';
        board = Chessboard('myBoard', Object.assign({}, config, { orientation: actualPlayerColor }));
        board.position(game.fen()); setTimeout(updateKingShiver, 50);

        if (fenHistory.length === 0) {
            fenHistory.push(game.fen()); updateNavButtons(); updateMaterialScore();
            if (actualPlayerColor === 'black' && game.turn() === 'w') window.setTimeout(getAIMove, 400);
        }
    }, 50);
}

function reviewLastGame() {
    var saved = localStorage.getItem('chessReplayData'); if (!saved) return;
    var historyData = JSON.parse(saved); if (historyData.length <= 1) return;

    engine.postMessage('stop'); if (thinkingTimer) clearTimeout(thinkingTimer);

    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';

    document.getElementById('gameBottomBar').style.display = 'none';
    document.getElementById('selfChatBox').style.display = 'none';
    document.getElementById('aiAskBtn').style.display = 'block';

    setAnimatedMessage("这是你上一局的复盘记录，点击下方按钮回顾对局。");
    document.getElementById('levelDisplay').innerText = "🔄 复盘模式";
    document.getElementById('scoreDisplay').innerText = "👀 回放";

    fenHistory = historyData; currentViewIndex = 0;

    setTimeout(function() {
        document.getElementById('myBoard').innerHTML = '';
        board = Chessboard('myBoard', { draggable: false, position: fenHistory[0], pieceTheme: generateDuolingoPiece, orientation: localStorage.getItem('lastGameColor') || 'white' });
        setTimeout(updateKingShiver, 50); updateNavButtons();
    }, 50);
}

function updateMaterialScore() {
    var pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
    var score = 0; var boardState = game.board();
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var square = boardState[i][j];
            if (square) { var val = pieceValues[square.type]; if (square.color === 'w') score += val; else score -= val; }
        }
    }
    if (actualPlayerColor === 'black') score = -score;

    var scoreDisplay = document.getElementById('scoreDisplay');
    var oldScoreText = scoreDisplay.innerText; var newScoreText = "";

    if (score > 0) { newScoreText = "⚔️ +" + score; scoreDisplay.style.color = "#58CC02"; scoreDisplay.style.backgroundColor = "#E6FFD5"; }
    else if (score < 0) { newScoreText = "⚔️ " + score; scoreDisplay.style.color = "#FF4B4B"; scoreDisplay.style.backgroundColor = "#FFEBEE"; }
    else { newScoreText = "⚔️ 0"; scoreDisplay.style.color = "#8E8E93"; scoreDisplay.style.backgroundColor = "#F2F2F7"; }

    if(oldScoreText !== newScoreText && oldScoreText !== "") {
        scoreDisplay.classList.add("score-pop"); setTimeout(function() { scoreDisplay.classList.remove("score-pop"); }, 300);
    }
    scoreDisplay.innerText = newScoreText;
}

engine.onmessage = function(event) {
    if(isOnlineMode) return;

    var line = event.data;
    if (line.indexOf('info depth') > -1) {
        if (line.indexOf('score cp') > -1) {
            var match = line.match(/score cp (-?\d+)/);
            if (match) currentWhiteScore = -parseInt(match[1]);
        } else if (line.indexOf('score mate') > -1) {
            var matchMate = line.match(/score mate (-?\d+)/);
            if (matchMate) currentWhiteScore = parseInt(matchMate[1]) > 0 ? -10000 : 10000;
        }
    }
    if (line && line.indexOf('bestmove') > -1) {
        var match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
        if (match) {
            if (thinkingTimer) clearTimeout(thinkingTimer);
            var moveResult = game.move({ from: match[1], to: match[2], promotion: match[3] ? match[3] : 'q' });
            if (moveResult) {
                board.position(game.fen()); setTimeout(updateKingShiver, 50);
                fenHistory.push(game.fen()); currentViewIndex = fenHistory.length - 1;
                saveReplayData(); updateNavButtons(); updateMaterialScore(); updateStatus();
                previousWhiteScore = currentWhiteScore;
            }
        }
    }
};

function getAIMove() {
    if (game.game_over() || isOnlineMode) return;
    thinkingTimer = setTimeout(function() { setAnimatedMessage("正在推演局面... (当前Lv." + currentAiLevel + ")"); }, 300);

    var skillLevel = Math.max(0, currentAiLevel - 1);
    engine.postMessage('setoption name Skill Level value ' + skillLevel);
    engine.postMessage('position fen ' + game.fen());

    if (currentAiLevel <= 2) {
        var moves = game.moves({ verbose: true });
        var randomChance = currentAiLevel === 1 ? 0.7 : 0.4;
        if (Math.random() < randomChance && moves.length > 0) {
            var rMove = moves[Math.floor(Math.random() * moves.length)];
            var uciMove = rMove.from + rMove.to + (rMove.promotion ? rMove.promotion : '');
            engine.postMessage('go depth 1 searchmoves ' + uciMove); return;
        }
        engine.postMessage('go depth 1 nodes 10');
    } else if (currentAiLevel === 3) {
        engine.postMessage('go depth 1 movetime 50');
    } else {
        var depth = Math.max(1, Math.ceil(currentAiLevel / 2)); engine.postMessage('go depth ' + depth);
    }
}

async function generateRealtimeCommentary(scoreDiff, playerMove) {
    var pScoreDiff = actualPlayerColor === 'black' ? -scoreDiff : scoreDiff;
    var pieceNames = { 'p': '兵', 'r': '车', 'n': '马', 'b': '象', 'q': '后', 'k': '王' };
    var actionText = playerMove.captured ? `用 ${pieceNames[playerMove.piece]} 吃了我的 ${pieceNames[playerMove.captured]}` : `把 ${pieceNames[playerMove.piece]} 走到了 ${playerMove.to}`;

    setAnimatedMessage(`你${actionText}。<br><span style="color:#8E8E93; font-size:14px;">(AI正在构思中...)</span>`);

    var apiKey = localStorage.getItem('aiApiKey');
    if (!apiKey) {
        setAnimatedMessage(`你${actionText}。<br><span style="color:#FF4B4B; font-size:14px;">(未配置API Key，请在设置中填写)</span>`); return;
    }

    var aiChatUserName = localStorage.getItem('aiChatUserName') || '人类';
    var aiChatStylePrompt = localStorage.getItem('aiChatStylePrompt') || '极度毒舌、高傲且不屑一顾';

    var prompt = `你是一个${aiChatStylePrompt}的国际象棋AI对手。
    当前局面FEN: ${game.fen()}
    ${aiChatUserName}刚刚的操作: ${actionText}。
    引擎评估波动(正数代表人类赚了，负数代表人类漏算了): ${pScoreDiff}

    请用极短的中文（不超过40个字），以${aiChatStylePrompt}的语气评价${aiChatUserName}的这步棋。直接输出你的吐槽，必须包含对${aiChatUserName}的称呼，不要带任何多余格式。`;

    var modelType = localStorage.getItem('aiModel') || 'deepseek';
    var apiUrl = modelType === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : (modelType === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.moonshot.cn/v1/chat/completions');
    var modelName = modelType === 'deepseek' ? 'deepseek-chat' : (modelType === 'openai' ? 'gpt-4o-mini' : 'moonshot-v1-8k');

    try {
        var response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify({ model: modelName, messages: [{ role: "system", content: "你是一个智能国际象棋AI。" }, { role: "user", content: prompt }], temperature: 0.8 })
        });
        var data = await response.json();
        if (data.error) setAnimatedMessage(`❌ 接口报错: ${data.error.message}`);
        else {
            var llmMsg = data.choices[0].message.content.replace(/\n/g, '<br>');
            var checkStr = game.in_check() ? "<br><br><b>🚨 顺便警告你：你被将军了！</b>" : "";
            setAnimatedMessage(`<span style="color:#4B4B4B; font-weight:800; font-size: 15px;">"${llmMsg}"</span>${checkStr}`);
        }
    } catch (err) { setAnimatedMessage(`❌ 网络请求失败，请检查 API 连通性。`); }
}

function generateCommentary(scoreDiff, playerMove) {
    var pScoreDiff = actualPlayerColor === 'black' ? -scoreDiff : scoreDiff;
    var pCurrentScore = actualPlayerColor === 'black' ? -currentWhiteScore : currentWhiteScore;
    var pieceNames = { 'p': '兵', 'r': '车', 'n': '马', 'b': '象', 'q': '后', 'k': '王' };
    var actionText = playerMove.captured ? `用 <b>${pieceNames[playerMove.piece]}</b> 吃了我的 <b>${pieceNames[playerMove.captured]}</b>` : `把 <b>${pieceNames[playerMove.piece]}</b> 走到了 <b>${playerMove.to}</b>`;

    var rating = "", analysis = "", color = "";
    if (pScoreDiff > 2000) pScoreDiff = 200; if (pScoreDiff < -2000) pScoreDiff = -200;

    if (pScoreDiff >= 150) { rating = "【绝妙好棋】"; analysis = "这一步非常犀利，你成功扩大了优势！"; color = "#58CC02"; }
    else if (pScoreDiff >= 60) { rating = "【一步好棋】"; analysis = "漂亮的走法，步步为营。"; color = "#58CC02"; }
    else if (pScoreDiff > -80 && pScoreDiff < 60) {
        rating = "【中规中矩】"; color = "#8E8E93";
        if (pCurrentScore > 150) analysis = "稳扎稳打，你现在牢牢掌控着局面。";
        else if (pCurrentScore < -150) analysis = "防守得很谨慎，但局面对你依旧艰难。";
        else analysis = "平稳的过渡，局势依然胶着。";
    }
    else if (pScoreDiff <= -80 && pScoreDiff > -250) { rating = "【稍显草率】"; analysis = "这步棋给了我可乘之机，稍微有些危险。"; color = "#FF9600"; }
    else { rating = "【严重失误】"; analysis = "哎呀！这步棋漏算了，局面一下子陷入了被动。"; color = "#FF4B4B"; }

    return `你${actionText}。<br><span style="color:${color}; font-weight:800; font-size: 18px;">${rating}</span> <br><span style="font-size: 15px;">${analysis}</span>`;
}

function updateStatus() {
    var levelDispElem = document.getElementById('levelDisplay');
    var msg = "";
    if (game.in_checkmate()) {
        var isPlayerWin = (game.turn() === 'b' && actualPlayerColor === 'white') || (game.turn() === 'w' && actualPlayerColor === 'black');
        if (isPlayerWin) {
            currentAiLevel = Math.min(currentAiLevel + 1, 20); localStorage.setItem('duoChessLevel', currentAiLevel);
            msg = `<span style="color:#58CC02; font-weight:800;">【你赢了】</span><br>你的算力超出了我的预估。下局我升至 Lv.${currentAiLevel}`; levelDispElem.innerText = "🤖 Lv. " + currentAiLevel;
        } else {
            currentAiLevel = Math.max(currentAiLevel - 1, 1); localStorage.setItem('duoChessLevel', currentAiLevel);
            msg = `<span style="color:#FF4B4B; font-weight:800;">【将死】</span><br>防线漏洞百出。下局我降至 Lv.${currentAiLevel} 陪你练。`; levelDispElem.innerText = "🤖 Lv. " + currentAiLevel;
        }
        setAnimatedMessage(msg);
    } else if (game.in_draw()) {
        setAnimatedMessage("和棋。由于场上子力不足或逼和，这次算我们平手。");
    } else {
        var history = game.history({ verbose: true });
        var playerMove = history[history.length - 2];
        if (playerMove) {
            if (aiChatStyle === 'realtime' && !isOnlineMode) generateRealtimeCommentary(currentWhiteScore - previousWhiteScore, playerMove);
            else {
                msg = generateCommentary(currentWhiteScore - previousWhiteScore, playerMove);
                if (game.in_check()) msg += "<br><br><b>🚨 警告：你被将军了！</b>";
                setAnimatedMessage(msg);
            }
        } else setAnimatedMessage(`你执${actualPlayerColor === 'white' ? '白' : '黑'}，开始你的布局吧。`);
    }
}

// ============================================
// 🌟 纯点击悬浮走棋逻辑 (禁用拖拽)
// ============================================
var clickSelectedSquare = null;

function clearClickSelection() {
    clickSelectedSquare = null;
    $('.square-55d63').removeClass('selected-square');
    removeHighlights();
}

$(document).on('click', '.square-55d63', function() {
    if (game.game_over()) return;
    if (isOnlineMode && actualPlayerColor !== (game.turn() === 'w' ? 'white' : 'black')) return;
    if (!isOnlineMode) {
        if (actualPlayerColor === 'white' && game.turn() !== 'w') return;
        if (actualPlayerColor === 'black' && game.turn() !== 'b') return;
    }
    if (currentViewIndex !== fenHistory.length - 1) return;

    var square = $(this).attr('data-square');
    var piece = game.get(square);
    var isOwnPiece = piece && ((piece.color === 'w' && actualPlayerColor === 'white') || (piece.color === 'b' && actualPlayerColor === 'black'));

    if (clickSelectedSquare === square) { clearClickSelection(); return; }

    if (clickSelectedSquare) {
        var moves = game.moves({ square: clickSelectedSquare, verbose: true });
        var move = moves.find(m => m.to === square);

        if (move) {
            var m = game.move({ from: clickSelectedSquare, to: square, promotion: 'q' });
            if (m) {
                clearClickSelection(); fenHistory.push(game.fen()); currentViewIndex = fenHistory.length - 1;
                board.position(game.fen()); setTimeout(updateKingShiver, 50); saveReplayData(); updateNavButtons(); updateMaterialScore();

                if (game.game_over()) {
                    if (isOnlineMode) updateOnlineStatus(); else updateStatus();
                } else {
                    if (isOnlineMode) { db.ref('rooms/' + onlineRoomId).update({ fen: game.fen() }); }
                    else { window.setTimeout(getAIMove, 250); }
                }
                return;
            }
        }
        if (isOwnPiece) { selectSquareForClick(square); } else { clearClickSelection(); }
    } else {
        if (isOwnPiece) selectSquareForClick(square);
    }
});

function selectSquareForClick(square) {
    clearClickSelection();
    var moves = game.moves({ square: square, verbose: true });
    if (moves.length === 0) return;

    clickSelectedSquare = square;
    $('#myBoard .square-' + square).addClass('selected-square');

    for (var i = 0; i < moves.length; i++) {
        var isCapture = moves[i].flags.indexOf('c') !== -1 || moves[i].flags.indexOf('e') !== -1;
        if (isCapture) $('#myBoard .square-' + moves[i].to).addClass('highlight-capture');
        else $('#myBoard .square-' + moves[i].to).addClass('highlight-dot');
    }
}

function viewPrevious() { if (currentViewIndex > 0) { currentViewIndex--; board.position(fenHistory[currentViewIndex]); setTimeout(updateKingShiver, 50); updateNavButtons(); } }
function viewNext() { if (currentViewIndex < fenHistory.length - 1) { currentViewIndex++; board.position(fenHistory[currentViewIndex]); setTimeout(updateKingShiver, 50); updateNavButtons(); } }
function updateNavButtons() {
    var btnPrev = document.getElementById('btnPrev'); var btnNext = document.getElementById('btnNext');
    if (currentViewIndex === 0) btnPrev.classList.add('btn-disabled'); else btnPrev.classList.remove('btn-disabled');
    if (currentViewIndex === fenHistory.length - 1) btnNext.classList.add('btn-disabled'); else btnNext.classList.remove('btn-disabled');
}

function undoMove() {
    if (isOnlineMode) return;
    var minLen = actualPlayerColor === 'white' ? 1 : 2;
    if (fenHistory.length <= minLen) { setAnimatedMessage("已经在开局了，无法悔棋。"); return; }

    clearClickSelection();
    engine.postMessage('stop'); if (thinkingTimer) clearTimeout(thinkingTimer);
    var playerTurnChar = actualPlayerColor === 'white' ? 'w' : 'b';

    game.undo(); fenHistory.pop();
    if (game.turn() !== playerTurnChar && fenHistory.length > minLen) { game.undo(); fenHistory.pop(); }

    currentViewIndex = fenHistory.length - 1; board.position(game.fen()); setTimeout(updateKingShiver, 50);
    saveReplayData(); setAnimatedMessage("怎么，刚才那步走后悔了？重新来过吧。");
    previousWhiteScore = 0; currentWhiteScore = 0;
    updateMaterialScore(); updateNavButtons();
}

function generateDuolingoPiece(piece) {
    var isWhite = piece.charAt(0) === 'w'; var type = piece.charAt(1);
    var fill = isWhite ? '#FFFFFF' : '#4B4B4B';
    var pieceShadow = isWhite ? '#9FA6B2' : '#1C1C1C';
    var stroke = isWhite ? '#9FA6B2' : '#1C1C1C';
    var inner = isWhite ? '#9FA6B2' : '#FFFFFF';
    var sw = 6;
    var base = `<rect x="25" y="78" width="50" height="12" rx="6" fill="${pieceShadow}" /><rect x="25" y="73" width="50" height="12" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    if (type === 'P') paths = base + `<path d="M 38 73 C 38 55 45 45 50 45 C 55 45 62 55 62 73 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><circle cx="50" cy="30" r="15" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    else if (type === 'R') paths = base + `<rect x="35" y="45" width="30" height="28" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M 30 45 L 30 25 L 38 25 L 38 33 L 46 33 L 46 25 L 54 25 L 54 33 L 62 33 L 62 25 L 70 25 L 70 45 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    else if (type === 'N') paths = base + `<path d="M 65 73 L 60 35 L 65 20 L 55 25 C 45 20 30 25 25 40 L 25 50 L 35 45 C 45 45 45 55 35 73 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><circle cx="45" cy="32" r="3.5" fill="${inner}"/>`;
    else if (type === 'B') paths = base + `<path d="M 40 73 L 60 73 L 55 45 C 65 45 65 20 50 16 C 35 20 35 45 45 45 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><line x1="45" y1="28" x2="55" y2="38" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="14" r="5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    else if (type === 'Q') paths = base + `<path d="M 30 73 L 70 73 L 80 35 L 65 45 L 50 20 L 35 45 L 20 35 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><circle cx="20" cy="35" r="5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><circle cx="50" cy="20" r="5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><circle cx="80" cy="35" r="5" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    else if (type === 'K') paths = base + `<path d="M 30 73 L 70 73 L 65 45 C 65 30 35 30 35 45 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/><line x1="50" y1="10" x2="50" y2="28" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/><line x1="40" y1="18" x2="60" y2="18" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
    var svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${paths}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
}

// 🌟 彻底禁用拖拽，仅保留棋盘渲染配置
var config = { draggable: false, position: 'start', pieceTheme: generateDuolingoPiece };

// ============================================
// 复盘大模型聊天逻辑
// ============================================
function openAiChat() {
    document.getElementById('aiChatModal').style.display = 'flex';
    document.getElementById('aiModelSelect').value = localStorage.getItem('aiModel') || 'deepseek';
    document.getElementById('aiApiKeyInput').value = localStorage.getItem('aiApiKey') || '';
    if (!localStorage.getItem('aiApiKey')) document.getElementById('aiSettingsPanel').style.display = 'block';
}
function closeAiChat() { document.getElementById('aiChatModal').style.display = 'none'; }
function toggleAiSettings() { var panel = document.getElementById('aiSettingsPanel'); panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; }
function saveAiSettings() {
    var model = document.getElementById('aiModelSelect').value; var apiKey = document.getElementById('aiApiKeyInput').value.trim();
    if(!apiKey) { alert("API 密钥不能为空"); return; }
    localStorage.setItem('aiModel', model); localStorage.setItem('aiApiKey', apiKey);
    toggleAiSettings(); addAiMessage("✅ 设置已保存！现在可以直接问我问题了。", 'system');
}
function addAiMessage(text, type) {
    var chatHistory = document.getElementById('aiChatHistory'); var msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg ai-' + type; msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    chatHistory.appendChild(msgDiv); chatHistory.scrollTop = chatHistory.scrollHeight; return msgDiv;
}
async function sendAiMessage() {
    var inputElem = document.getElementById('aiChatInput'); var userText = inputElem.value.trim(); if (!userText) return;
    var apiKey = localStorage.getItem('aiApiKey');
    if (!apiKey) { alert('请先在设置中填写并保存您的 API Key！'); document.getElementById('aiSettingsPanel').style.display = 'block'; return; }

    addAiMessage(userText, 'user'); inputElem.value = '';
    var loadingMsg = addAiMessage("教练正在推演棋盘局势，请稍等...", 'bot');

    var fullHistory = game.history({ verbose: true });
    var lastMove = currentViewIndex > 0 ? fullHistory[currentViewIndex - 1] : null;
    var moveText = lastMove ? `${lastMove.color === 'w' ? '白方' : '黑方'} 将 ${lastMove.piece.toUpperCase()} 移动到了 ${lastMove.to}` : '当前是开局初始状态';

    var prompt = `你是一位顶级的国际象棋大师兼人类教练。当前局面FEN: ${fenHistory[currentViewIndex]} \n导致该局面的最后一步: ${moveText} \n玩家提问: ${userText} \n请直接、简明扼要地用中文回答玩家，语气像个朋友，给出明确战术指导。`;

    var modelType = localStorage.getItem('aiModel');
    var apiUrl = modelType === 'deepseek' ? 'https://api.deepseek.com/chat/completions' : (modelType === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.moonshot.cn/v1/chat/completions');
    var modelName = modelType === 'deepseek' ? 'deepseek-chat' : (modelType === 'openai' ? 'gpt-4o-mini' : 'moonshot-v1-8k');

    try {
        var response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }, body: JSON.stringify({ model: modelName, messages: [{ role: "system", content: "你是一个专业的辅助教练。" }, { role: "user", content: prompt }], temperature: 0.6 }) });
        var data = await response.json();
        if (data.error) loadingMsg.innerHTML = "❌ 接口报错: " + data.error.message;
        else loadingMsg.innerHTML = data.choices[0].message.content.replace(/\n/g, '<br>');
    } catch (err) { loadingMsg.innerHTML = "❌ 请求失败。请检查您的网络连接或 API 密钥是否有效。"; }
}