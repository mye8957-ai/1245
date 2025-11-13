const app = document.getElementById("app");

// ===== 数据层 =====
const DB = {
  users: JSON.parse(localStorage.getItem("users") || "[]"),
  currentUser: JSON.parse(localStorage.getItem("currentUser") || "null"),
  save() { localStorage.setItem("users", JSON.stringify(this.users)); },
  setCurrent(u) { localStorage.setItem("currentUser", JSON.stringify(u)); }
};

function genId() { return Math.floor(100000 + Math.random() * 900000000000).toString().slice(0, 8); }
function getUserByName(n) { return DB.users.find(u => u.username === n); }
function getUserById(i) { return DB.users.find(u => u.id === i); }
function saveUsers() { DB.save(); }

// ===== 登录 =====
function renderLogin() {
  app.innerHTML = `
  <div class="card">
    <h2>登录</h2>
    <input id="loginUser" placeholder="输入用户名">
    <input id="loginPass" type="password" placeholder="输入密码">
    <button id="loginBtn">登录</button>
    <p style="text-align:center;margin-top:10px;">没有账号？ <a id="goReg">注册</a></p>
  </div>`;

  document.getElementById("loginBtn").onclick = () => {
    const name = loginUser.value.trim(), pass = loginPass.value.trim();
    const user = getUserByName(name);
    if (!user || user.password !== pass) return alert("用户名或密码错误");
    DB.currentUser = user; DB.setCurrent(user); renderMain();
  };
  document.getElementById("goReg").onclick = renderRegister;
}

// ===== 注册 =====
function renderRegister() {
  app.innerHTML = `
  <div class="card">
    <h2>注册</h2>
    <input id="regUser" placeholder="用户名（6~12位字母数字）">
    <input id="regPass" type="password" placeholder="密码（8~16位字母数字）">
    <input id="regPass2" type="password" placeholder="确认密码">
    <input type="file" id="regAvatar">
    <button id="regBtn">注册</button>
    <p style="text-align:center;margin-top:10px;">已有账号？ <a id="goLogin">登录</a></p>
  </div>`;
  document.getElementById("goLogin").onclick = renderLogin;

  document.getElementById("regBtn").onclick = async () => {
    const name = regUser.value.trim(), pass = regPass.value.trim(), pass2 = regPass2.value.trim();
    if (!/^[a-zA-Z0-9]{6,12}$/.test(name)) return alert("用户名不符合要求");
    if (!/^[a-zA-Z0-9]{8,16}$/.test(pass)) return alert("密码不符合要求");
    if (pass !== pass2) return alert("两次密码不一致");
    if (getUserByName(name)) return alert("该用户名已被注册");

    let avatar = "";
    if (regAvatar.files[0]) avatar = await fileToBase64(regAvatar.files[0]);
    const id = genId();
    const user = { id, username: name, password: pass, avatar, nickname: "", friends: [], requests: [], messages: {} };
    DB.users.push(user); saveUsers();
    DB.currentUser = user; DB.setCurrent(user); renderNickname();
  };
}

// ===== 起名 =====
function renderNickname() {
  app.innerHTML = `
  <div class="card">
    <h2>起个名字</h2>
    <input id="nickInput" placeholder="1~6位任意文字">
    <button id="nickBtn">确定</button>
  </div>`;
  document.getElementById("nickBtn").onclick = () => {
    const nick = nickInput.value.trim();
    if (nick.length < 1 || nick.length > 6) return alert("昵称长度不符");
    DB.currentUser.nickname = nick; saveUsers(); DB.setCurrent(DB.currentUser);
    renderMain();
  };
}

// ===== 主界面 =====
function renderMain() {
  const user = DB.currentUser;
  app.innerHTML = `
  <div class="chat-container">
    <div class="sidebar">
      <div style="text-align:center;">
        <img id="myAvatar" src="${user.avatar || 'https://via.placeholder.com/80'}" width="80" style="border-radius:50%;cursor:pointer">
        <p>${user.nickname || user.username}</p>
      </div>
      <input id="searchBox" placeholder="搜索编号">
      <button id="searchBtn">搜索</button>
      <div id="friendList"></div>
    </div>
    <div class="chat-main" id="chatMain">
      <div style="text-align:right;padding:10px;">
        <button id="searchFriends">好友申请</button>
      </div>
      <div class="message-box" id="messages"></div>
      <div class="message-input">
        <input id="msgInput" placeholder="输入消息...">
        <input type="file" id="imgInput" accept="image/*" style="display:none">
        <button id="imgBtn">🖼️</button>
        <button id="voiceBtn">🎤</button>
        <button id="sendBtn">发送</button>
      </div>
    </div>
  </div>`;

  document.getElementById("myAvatar").onclick = () => {
    navigator.clipboard.writeText(user.id);
    alert("编号已复制：" + user.id);
  };
  renderFriendList();

  document.getElementById("searchBtn").onclick = () => {
    const val = document.getElementById("searchBox").value.trim();
    const target = getUserById(val);
    if (!target) return alert("未找到用户");
    if (target.id === user.id) return alert("不能加自己");
    renderAddFriend(target);
  };
  document.getElementById("searchFriends").onclick = renderRequests;
  document.getElementById("sendBtn").onclick = sendMessage;
  document.getElementById("imgBtn").onclick = () => imgInput.click();
  document.getElementById("imgInput").onchange = sendImage;
  document.getElementById("voiceBtn").onclick = toggleRecording;
}

function renderFriendList() {
  const list = document.getElementById("friendList");
  const u = DB.currentUser; list.innerHTML = "";
  for (const fid of u.friends) {
    const friend = getUserById(fid);
    if (friend) {
      const div = document.createElement("div");
      div.className = "friend-item";
      div.innerHTML = `<img src="${friend.avatar || 'https://via.placeholder.com/40'}" width="30" style="border-radius:50%;vertical-align:middle;margin-right:5px;">${friend.nickname || friend.username}`;
      div.onclick = () => openChat(friend.id);
      list.appendChild(div);
    }
  }
}

// ===== 好友申请 =====
function renderAddFriend(target) {
  app.innerHTML = `
  <div class="card">
    <h2>添加好友</h2>
    <img src="${target.avatar || 'https://via.placeholder.com/80'}" width="80" style="border-radius:50%">
    <p>${target.nickname || target.username}</p>
    <textarea id="addMsg" style="width:100%;height:80px;background:#2a2a2a;color:#fff;border:none;border-radius:8px;padding:5px;">你好，我是${DB.currentUser.nickname}</textarea>
    <button id="sendAdd">发送好友申请</button>
    <button id="back">返回</button>
  </div>`;
  document.getElementById("back").onclick = renderMain;
  document.getElementById("sendAdd").onclick = () => {
    target.requests.push({ from: DB.currentUser.id, msg: addMsg.value });
    saveUsers(); alert("申请已发送"); renderMain();
  };
}

// ===== 申请列表 =====
function renderRequests() {
  const user = DB.currentUser;
  app.innerHTML = `<div class="card"><h2>好友申请</h2><div id="reqList"></div><button id="back">返回</button></div>`;
  const list = document.getElementById("reqList");
  if (user.requests.length === 0) list.innerHTML = "<p>暂无好友申请</p>";
  for (const r of user.requests) {
    const from = getUserById(r.from);
    const div = document.createElement("div");
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <img src="${from.avatar || 'https://via.placeholder.com/40'}" width="40" style="border-radius:50%;vertical-align:middle;margin-right:5px;">
      <b>${from.nickname || from.username}</b><br>
      <i>${r.msg}</i><br>
      <button class="accept">通过</button>
      <button class="deny">拒绝</button>`;
    div.querySelector(".accept").onclick = () => {
      user.friends.push(from.id);
      from.friends.push(user.id);
      user.requests = user.requests.filter(x => x !== r);
      saveUsers(); alert("已通过"); renderRequests();
    };
    div.querySelector(".deny").onclick = () => {
      user.requests = user.requests.filter(x => x !== r);
      saveUsers(); renderRequests();
    };
    list.appendChild(div);
  }
  document.getElementById("back").onclick = renderMain;
}

// ===== 聊天逻辑 =====
let chattingId = null;
function openChat(fid) { chattingId = fid; renderChat(fid); }

function renderChat(fid) {
  renderMain();
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = renderMessages(fid);
  scrollBottom();
}

function renderMessages(fid) {
  const me = DB.currentUser;
  const msgs = me.messages[fid] || [];
  return msgs.map(m => {
    const time = new Date(m.time).toLocaleTimeString();
    if (m.type === "text") return `<div class="message ${m.from===me.id?'me':''}"><div>${m.text}</div><small style="opacity:0.6;">${time}</small></div>`;
    if (m.type === "image") return `<div class="message ${m.from===me.id?'me':''}"><img src="${m.text}" style="max-width:200px;border-radius:8px;"><br><small style="opacity:0.6;">${time}</small></div>`;
    if (m.type === "audio") return `<div class="message ${m.from===me.id?'me':''}"><audio controls src="${m.text}"></audio><br><small style="opacity:0.6;">${time}</small></div>`;
  }).join('');
}

function sendMessage() {
  if (!chattingId) return alert("请选择好友聊天");
  const text = msgInput.value.trim(); if (!text) return;
  pushMessage(chattingId, "text", text); msgInput.value = "";
  renderChat(chattingId);
}

async function sendImage(e) {
  const file = e.target.files[0]; if (!file) return;
  const base64 = await fileToBase64(file);
  pushMessage(chattingId, "image", base64);
  renderChat(chattingId);
}

function pushMessage(fid, type, text) {
  const me = DB.currentUser, target = getUserById(fid);
  if (!me.messages[fid]) me.messages[fid] = [];
  if (!target.messages[me.id]) target.messages[me.id] = [];
  const msg = { from: me.id, type, text, time: Date.now() };
  me.messages[fid].push(msg); target.messages[me.id].push(msg);
  saveUsers();
}

function scrollBottom() {
  const msgBox = document.getElementById("messages");
  msgBox.scrollTop = msgBox.scrollHeight;
}

// ===== 语音录制 =====
let mediaRecorder, audioChunks = [], recording = false;
async function toggleRecording() {
  if (recording) {
    mediaRecorder.stop();
    recording = false;
    voiceBtn.textContent = "🎤";
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        pushMessage(chattingId, "audio", reader.result);
        renderChat(chattingId);
      };
      reader.readAsDataURL(blob);
    };
    mediaRecorder.start();
    recording = true;
    voiceBtn.textContent = "⏹️";
  } catch {
    alert("无法访问麦克风");
  }
}

// ===== 工具 =====
function fileToBase64(file) {
  return new Promise(res => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.readAsDataURL(file);
  });
}

// ===== 启动 =====
if (!DB.currentUser) renderLogin(); else renderMain();
