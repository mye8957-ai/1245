const app = document.getElementById("app");
const DATA_URL = "https://raw.githubusercontent.com/mye8957-ai/1245/main/data.json";

let DB = { users: [], currentUser: null };

// ===== 工具函数 =====
function fileToBase64(file) {
  return new Promise(res => {
    const reader = new FileReader();
    reader.onload = e => res(e.target.result);
    reader.readAsDataURL(file);
  });
}

async function loadData() {
  const resp = await fetch(DATA_URL);
  DB = await resp.json();
}

// ===== 登录界面 =====
function renderLogin() {
  app.innerHTML = `
  <div class="card">
    <h2>登录</h2>
    <input id="loginUser" placeholder="用户名">
    <input id="loginPass" type="password" placeholder="密码">
    <button id="loginBtn">登录</button>
    <p>没有账号？ <a id="goReg">注册</a></p>
  </div>`;
  document.getElementById("loginBtn").onclick = () => {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value.trim();
    const user = DB.users.find(x => x.username===u && x.password===p);
    if(!user) return alert("用户名或密码错误");
    DB.currentUser = user;
    renderMain();
  };
  document.getElementById("goReg").onclick = renderRegister;
}

// ===== 注册界面 =====
function renderRegister() {
  app.innerHTML = `
  <div class="card">
    <h2>注册</h2>
    <input id="regUser" placeholder="用户名 6~12 位">
    <input id="regPass" type="password" placeholder="密码 8~16 位">
    <input id="regPass2" type="password" placeholder="确认密码">
    <input type="file" id="regAvatar">
    <button id="regBtn">注册</button>
    <p>已有账号？ <a id="goLogin">登录</a></p>
  </div>`;
  document.getElementById("goLogin").onclick = renderLogin;
  document.getElementById("regBtn").onclick = async () => {
    const u = regUser.value.trim(), p=regPass.value.trim(), p2=regPass2.value.trim();
    if(!/^[a-zA-Z0-9]{6,12}$/.test(u)) return alert("用户名不符合要求");
    if(!/^[a-zA-Z0-9]{8,16}$/.test(p)) return alert("密码不符合要求");
    if(p!==p2) return alert("两次密码不一致");
    if(DB.users.find(x=>x.username===u)) return alert("用户名已存在");
    let avatar="";
    if(regAvatar.files[0]) avatar=await fileToBase64(regAvatar.files[0]);
    const newUser={id:Date.now().toString().slice(-8),username:u,password:p,nickname:"",avatar,friends:[],requests:[],messages:{}};
    DB.users.push(newUser);
    DB.currentUser=newUser;
    renderNickname();
  };
}

// ===== 起昵称 =====
function renderNickname() {
  app.innerHTML=`
  <div class="card">
    <h2>起个名字</h2>
    <input id="nickInput" placeholder="1~6位昵称">
    <button id="nickBtn">确定</button>
  </div>`;
  document.getElementById("nickBtn").onclick=()=>{
    const n=nickInput.value.trim();
    if(n.length<1||n.length>6) return alert("昵称长度不符");
    DB.currentUser.nickname=n;
    renderMain();
  };
}

// ===== 主界面（简化版） =====
function renderMain() {
  app.innerHTML=`<div class="card"><h2>欢迎, ${DB.currentUser.nickname||DB.currentUser.username}</h2>
  <p>这里可以实现搜索、好友、聊天逻辑</p></div>`;
}

// ===== 启动 =====
loadData().then(()=>{
  if(DB.currentUser) renderMain();
  else renderLogin();
});
