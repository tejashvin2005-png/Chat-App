document.addEventListener("DOMContentLoaded", () => {

const socket = io();
let username = "";
let profilePics = {};
// PROFILE PREVIEW
window.previewPic = function () {
  const file = document.getElementById("profilePic").files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const img = document.getElementById("preview");
    img.src = reader.result;
    img.style.display = "block";
  };

  reader.readAsDataURL(file);
};
// ================= JOIN =================
window.joinChat = function () {
  const user = document.getElementById("username").value.trim();
  const file = document.getElementById("profilePic").files[0];

  if (!user) return alert("Enter username");

  username = user;
  socket.emit("join", username);

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("profilePic", {
        user: username,
        image: reader.result
      });
    };
    reader.readAsDataURL(file);
  }
};

// ================= CHAT HISTORY =================
socket.on("chatHistory", (history) => {
  document.getElementById("messages").innerHTML = "";
  history.forEach(displayMessage);
});

// ================= PROFILE =================
socket.on("allProfilePics", (pics) => profilePics = pics);
socket.on("profilePic", (data) => profilePics[data.user] = data.image);

// ================= DISPLAY MESSAGE =================
function displayMessage(msg) {
  const div = document.createElement("div");

  if (msg.user === "System") {
    div.className = "system";
    div.innerHTML = `<span>${msg.text}</span><small>${msg.time}</small>`;
  }
  else if (msg.user === username) {
    div.className = "me";
    div.innerHTML = `${msg.text}<small>${msg.time} ✔✔</small>`;
  }
  else {
    div.className = "other";
    div.innerHTML = `
      <div class="msg-header">
        <img src="${profilePics[msg.user] || ''}">
        <b>${msg.user}</b>
      </div>
      ${msg.text}
      <small>${msg.time}</small>
    `;
  }

  const messages = document.getElementById("messages");
  messages.appendChild(div);

  // 🔊 SOUND ONLY FOR OTHERS
  if (msg.user !== username && msg.user !== "System") {
    document.getElementById("msgSound").play();
  }

  div.scrollIntoView({ behavior: "smooth" });
}

// ================= RECEIVE =================
socket.on("message", displayMessage);

// ================= USERS =================
socket.on("onlineUsers", (users) => {
  document.getElementById("users").innerText =
    "Online: " + users.join(", ");

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
});

// ================= SEND MESSAGE =================
window.sendMessage = function () {
  const input = document.getElementById("messageInput");

  if (!input.value.trim()) return;

  socket.emit("publicMessage", { text: input.value });
  socket.emit("stopTyping");

  input.value = "";
};

// ================= IMAGE =================
window.sendImage = function () {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    socket.emit("image", { image: reader.result });
  };
  reader.readAsDataURL(file);
};

socket.on("image", (data) => {
  const div = document.createElement("div");
  div.className = data.user === username ? "me" : "other";

  div.innerHTML = `
    <b>${data.user}</b><br>
    <img src="${data.image}" width="150" style="border-radius:10px;">
  `;

  document.getElementById("messages").appendChild(div);
});

// ================= EMOJI =================
window.toggleEmoji = function () {
  const box = document.getElementById("emojiBox");

  box.style.display = box.style.display === "block" ? "none" : "block";
  box.innerHTML = "";

  const emojis = ["😀","😂","😍","🔥","❤️"];

  emojis.forEach(e => {
    const btn = document.createElement("button");
    btn.textContent = e;
    btn.onclick = () => {
      document.getElementById("messageInput").value += e;
    };
    box.appendChild(btn);
  });
};

// ================= TYPING =================
const inputBox = document.getElementById("messageInput");

inputBox.addEventListener("input", () => {
  socket.emit(inputBox.value ? "typing" : "stopTyping", username);
});

socket.on("typing", (user) => {
  if (user !== username) {
    document.getElementById("typing").innerText = user + " is typing...";
  }
});

socket.on("stopTyping", () => {
  document.getElementById("typing").innerText = "";
});

// ================= THEME =================
window.toggleDark = function () {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
};

// ================= BACKGROUND =================
window.changeBg = function(bg) {

  const map = {
  bg1: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
  bg2: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  bg3: "https://images.unsplash.com/photo-1499084732479-de2c02d45fc4"
};

  const selectedBg = map[bg];

  socket.emit("changeBg", selectedBg);
};

socket.on("changeBg", (bg) => {
  document.getElementById("messages").style.backgroundImage = `url(${bg})`;
});

// ================= ACTIONS =================
window.clearChat = () => {
  document.getElementById("messages").innerHTML = "";
};

window.logout = () => location.reload();

});