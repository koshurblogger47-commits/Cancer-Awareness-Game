/* ============================================================
   FINAL JAVA SCRIPT.js — Space OR Touch Controls
   Full mobile/desktop compatibility
============================================================ */

/* ---------- DOM ---------- */
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const gameTrack = document.getElementById('game-track');
const startButton = document.getElementById('start-button');

const scoreBoard = document.getElementById('score');
const factPopup = document.getElementById('fact-popup');
const factContent = document.getElementById('fact-content');
const heartPopup = document.getElementById('heart-popup');
const donationLink = document.getElementById('donation-link');

const gameOverScreen = document.getElementById('game-over-screen');
const finalScore = document.getElementById('final-score');
const worksCitedButton = document.getElementById('works-cited-button');
const restartButton = document.getElementById('restart-button');

const citationsScreen = document.getElementById('citations-screen');
const citationList = document.getElementById('citation-list');
const closeCitationsButton = document.getElementById('close-citations-button');

const player = document.getElementById('player');

/* ---------- State ---------- */
let gameRunning = false;
let gamePaused = false;
let score = 0;

let isJumping = false;
let playerBottom = 5;
const jumpHeight = 120;
const gravity = 6;

let obstacleTimer = 0;
let nextObstacleSpawn = 80;

const baseSpeed = 4;
let gameSpeed = baseSpeed;

let lastSpawns = [];

/* ---------- FACTS + CITATIONS (unchanged) ---------- */
const gameContent = {
  donationURL: "https://sarcomaalliance.org/",
  facts: [
    {
      text: "Chondrosarcoma is the second most common primary malignant bone tumor.",
      citation: "1. Trovato F, et al. Chondrosarcoma. StatPearls. 2023."
    },
    {
      text: "Most patients with conventional chondrosarcoma are over 50 years old.",
      citation: "2. Trovato F, et al. Chondrosarcoma. StatPearls. 2023."
    },
    {
      text: "Chondrosarcoma often develops in the pelvis, hip, or shoulder.",
      citation: "3. Mayo Clinic Staff. Chondrosarcoma. Mayo Clinic. 2024."
    },
    {
      text: "A common symptom is dull, persistent nighttime pain.",
      citation: "4. Bone Cancer Research Trust. Chondrosarcoma. 2025."
    },
    {
      text: "Chondrosarcoma is often resistant to chemotherapy and radiation.",
      citation: "5. Cancer.Net Editorial Team. Chondrosarcoma Treatment. 2023."
    }
  ],
  meta: {
    images: "CSS-generated pixel skyline and pixel sprite.",
    audio: "No audio used.",
    ai: "AI-assisted generation & editing per user request.",
    font: "Press Start 2P — Google Fonts."
  }
};

/* ---------- Input ---------- */
const keys = { space: false, right: false };

/* SPACEBAR */
document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    if (gamePaused) { hidePopup(); return; }
    jump();
  }
  if (e.code === "ArrowRight") keys.right = true;
});
document.addEventListener("keyup", e => {
  if (e.code === "ArrowRight") keys.right = false;
});

/* TOUCH CONTROL — TAP TO JUMP / TAP TO CLOSE POPUP */
window.addEventListener("touchstart", () => {
  if (gamePaused) { hidePopup(); return; }
  jump();
});

/* ---------- Screen Navigation ---------- */
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

startButton.addEventListener('click', () => {
  showScreen(gameContainer);
  resetGame();
  gameRunning = true;
  gameLoop();
});

restartButton.addEventListener('click', () => {
  showScreen(gameContainer);
  resetGame();
  gameRunning = true;
  gameLoop();
});

worksCitedButton.addEventListener('click', () => {
  populateCitations();
  showScreen(citationsScreen);
});

closeCitationsButton.addEventListener('click', () => {
  showScreen(gameOverScreen);
});

/* ---------- Game Logic ---------- */

function resetGame() {
  score = 0;
  scoreBoard.textContent = score;
  gameTrack.innerHTML = "";
  gameTrack.appendChild(player);

  playerBottom = 5;
  player.style.bottom = "5px";
  isJumping = false;

  gamePaused = false;
  gameRunning = true;

  obstacleTimer = 0;
  nextObstacleSpawn = 80;
  gameSpeed = baseSpeed;
  lastSpawns = [];
}

function jump() {
  if (isJumping || gamePaused || !gameRunning) return;
  isJumping = true;

  const target = playerBottom + jumpHeight;

  let upTimer = setInterval(() => {
    if (playerBottom >= target) {
      clearInterval(upTimer);

      let downTimer = setInterval(() => {
        if (playerBottom > 5) {
          playerBottom -= gravity;
          player.style.bottom = playerBottom + "px";
        } else {
          clearInterval(downTimer);
          playerBottom = 5;
          player.style.bottom = "5px";
          isJumping = false;
        }
      }, 20);

    } else {
      playerBottom += gravity;
      player.style.bottom = playerBottom + "px";
    }
  }, 20);
}

/* Spawning elements */
function spawnElement() {
  obstacleTimer++;
  if (obstacleTimer < nextObstacleSpawn) return;

  let r = Math.random();
  let type = r < 0.65 ? "traffic-cone" : r < 0.9 ? "coin" : "heart";

  const lastTwo = lastSpawns.slice(-2);
  if (lastTwo[0] === lastTwo[1] && type === lastTwo[0]) {
    type = "traffic-cone";
  }

  createElement(type);

  lastSpawns.push(type);
  if (lastSpawns.length > 6) lastSpawns.shift();

  obstacleTimer = 0;
  nextObstacleSpawn = Math.floor(Math.random() * 80) + 60;
}

function createElement(type) {
  const el = document.createElement("div");
  el.classList.add("game-element", type);
  el.style.right = "-150px";
  gameTrack.appendChild(el);
}

function updateElements() {
  const elements = [...document.querySelectorAll(".game-element")];

  elements.forEach(el => {
    const cur = parseFloat(el.style.right) || -150;
    const speed = gameSpeed + (keys.right ? 1.4 : 0);
    const next = cur + speed;

    el.style.right = next + "px";

    if (next > window.innerWidth + 200) el.remove();
  });
}

function handleCollisions() {
  const pRect = player.getBoundingClientRect();
  const elements = [...document.querySelectorAll(".game-element")];

  for (let el of elements) {
    const eRect = el.getBoundingClientRect();

    if (
      pRect.left < eRect.right &&
      pRect.right > eRect.left &&
      pRect.top < eRect.bottom &&
      pRect.bottom > eRect.top
    ) {
      el.remove();

      if (el.classList.contains("traffic-cone")) {
        return gameOver();
      }
      if (el.classList.contains("coin")) {
        score++;
        scoreBoard.textContent = score;
        showFactPopup();
      }
      if (el.classList.contains("heart")) {
        showHeartPopup();
      }
    }
  }
}

/* -------- Popups -------- */
function showFactPopup() {
  gamePaused = true;
  const fact = gameContent.facts[Math.floor(Math.random() * gameContent.facts.length)];
  factContent.innerText = fact.text;
  factPopup.querySelector(".popup-instruction").innerText = "Press space or touch to resume";
  factPopup.style.display = "flex";
}

function showHeartPopup() {
  gamePaused = true;
  donationLink.href = gameContent.donationURL;
  heartPopup.querySelector(".popup-instruction").innerText = "Press space or touch to resume";
  heartPopup.style.display = "flex";
}

function hidePopup() {
  factPopup.style.display = "none";
  heartPopup.style.display = "none";

  gamePaused = false;
  if (gameRunning) {
    cancelAnimationFrame(rafId);
    gameLoop();
  }
}

/* -------- Game Over -------- */
function gameOver() {
  gameRunning = false;
  finalScore.innerText = score;
  showScreen(gameOverScreen);
}

/* -------- Citations -------- */
function populateCitations() {
  citationList.innerHTML = "";

  const factsHeader = document.createElement("p");
  factsHeader.innerHTML = `<strong>FUN FACTS (AMA Citations):</strong>`;
  citationList.appendChild(factsHeader);

  gameContent.facts.forEach((f, i) => {
    const p = document.createElement("p");
    p.innerHTML = `<strong>Fact ${i+1}:</strong> ${f.text}<br><strong>Source:</strong> ${f.citation}`;
    citationList.appendChild(p);
  });

  const meta = gameContent.meta;

  const img = document.createElement("p");
  img.innerHTML = `<strong>Images:</strong> ${meta.images}`;
  citationList.appendChild(img);

  const audio = document.createElement("p");
  audio.innerHTML = `<strong>Audio:</strong> ${meta.audio}`;
  citationList.appendChild(audio);

  const ai = document.createElement("p");
  ai.innerHTML = `<strong>AI Assistance:</strong> ${meta.ai}`;
  citationList.appendChild(ai);

  const font = document.createElement("p");
  font.innerHTML = `<strong>Font:</strong> ${meta.font}`;
  citationList.appendChild(font);

  const donate = document.createElement("p");
  donate.innerHTML = `<strong>Donation Link:</strong> ${gameContent.donationURL}`;
  citationList.appendChild(donate);
}

/* -------- Game Loop -------- */
let rafId;
function gameLoop() {
  if (!gameRunning || gamePaused) return;
  spawnElement();
  updateElements();
  handleCollisions();
  rafId = requestAnimationFrame(gameLoop);
}

/* -------- Start Screen -------- */
showScreen(startScreen);