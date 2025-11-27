/* ============================
   FINAL JAVA SCRIPT.js
   Clean, single-file game logic
   - CSS sprite
   - spawn obstacles/coins/hearts properly
   - popups & citations
   - no audio
============================ */

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

/* ---------- STATE ---------- */
let gameRunning = false;
let gamePaused = false;
let score = 0;

let isJumping = false;
let playerBottom = 5;
const jumpHeight = 120;    // bigger jump suitable for larger sprite
const gravity = 6;

let obstacleTimer = 0;
let nextObstacleSpawn = 80;
const baseSpeed = 4;
let gameSpeed = baseSpeed;

/* To avoid clustering: track last few spawns */
let lastSpawns = []; // store last 5 element types

/* ---------- Game Content (facts + citations) ---------- */
const gameContent = {
  donationURL: "https://sarcomaalliance.org/",
  facts: [
    {
      text: "Chondrosarcoma is the second most common primary malignant tumor of bone (after myeloma and osteosarcoma).",
      citation: "1. Trovato F, et al. Chondrosarcoma. StatPearls. Updated 2023."
    },
    {
      text: "Most patients with conventional chondrosarcoma are typically older than 50 years at diagnosis.",
      citation: "2. Trovato F, et al. Chondrosarcoma. StatPearls. Updated 2023."
    },
    {
      text: "Chondrosarcoma most often occurs in the pelvis, hip, and shoulder bones, where cartilage is present.",
      citation: "3. Mayo Clinic Staff. Chondrosarcoma — Symptoms and Causes. Mayo Clinic. 2024."
    },
    {
      text: "A common symptom is dull, worsening pain — especially at night — that may be persistent.",
      citation: "4. Bone Cancer Research Trust. Chondrosarcoma. 2025."
    },
    {
      text: "Treatment often requires complete surgical removal; many chondrosarcomas are resistant to chemo and radiation.",
      citation: "5. Cancer.Net Editorial Team. Chondrosarcoma — Treatment. 2023."
    }
  ],
  // meta citations
  meta: {
    images: "CSS-generated pixel artwork for skyline and character (no external image files used).",
    audio: "No audio used in this build (user requested no sound).",
    ai: "Code and asset concepts assisted by a large language model (AI) at user request — adapted and hand-checked by developer.",
    font: "Google Fonts. Press Start 2P. https://fonts.google.com/specimen/Press+Start+2P"
  }
};

/* ---------- INPUT ---------- */
const keys = { space: false, right: false };

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    keys.space = true;
    e.preventDefault();
    if (gamePaused) {
      hidePopup();
    } else if (gameRunning && !isJumping) {
      jump();
    }
  } else if (e.code === 'ArrowRight') {
    keys.right = true;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') keys.space = false;
  if (e.code === 'ArrowRight') keys.right = false;
});

/* ---------- SCREEN CONTROL ---------- */
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

/* start game */
startButton.addEventListener('click', () => {
  showScreen(gameContainer);
  resetGame();
  gameRunning = true;
  gameLoop();
});

/* restart */
restartButton.addEventListener('click', () => {
  showScreen(gameContainer);
  resetGame();
  gameRunning = true;
  gameLoop();
});

/* works cited */
worksCitedButton.addEventListener('click', () => {
  populateCitations();
  showScreen(citationsScreen);
});

closeCitationsButton.addEventListener('click', () => {
  showScreen(gameOverScreen);
});

/* ---------- GAME FUNCTIONS ---------- */

function resetGame() {
  score = 0;
  scoreBoard.textContent = score;
  gameTrack.innerHTML = '';
  gameTrack.appendChild(player);
  player.style.bottom = '5px';
  playerBottom = 5;
  isJumping = false;
  gamePaused = false;
  obstacleTimer = 0;
  nextObstacleSpawn = 80;
  gameSpeed = baseSpeed;
  lastSpawns = [];
}

/* jump implementation */
function jump() {
  if (isJumping || gamePaused || !gameRunning) return;
  isJumping = true;
  const upInterval = 20;
  const target = playerBottom + jumpHeight;
  // simple smooth jump using setInterval
  let upTimer = setInterval(() => {
    if (playerBottom >= target) {
      clearInterval(upTimer);
      // fall
      let downTimer = setInterval(() => {
        if (playerBottom > 5) {
          playerBottom -= gravity;
          player.style.bottom = playerBottom + 'px';
        } else {
          clearInterval(downTimer);
          isJumping = false;
          player.style.bottom = '5px';
        }
      }, 20);
    } else {
      playerBottom += gravity;
      player.style.bottom = playerBottom + 'px';
    }
  }, upInterval);
}

/* spawn elements: avoid clustering by checking lastSpawns */
function spawnElement() {
  obstacleTimer++;
  if (obstacleTimer < nextObstacleSpawn) return;

  // decide type with weighted chance but avoid clustering of hearts
  let r = Math.random();
  let type;
  if (r < 0.65) type = 'traffic-cone';
  else if (r < 0.9) type = 'coin';
  else type = 'heart';

  // prevent 3 hearts/coins in a row: if lastSpawns ends with the same twice, force traffic cone
  const lastTwo = lastSpawns.slice(-2);
  if (lastTwo.length === 2 && lastTwo[0] === lastTwo[1] && (type === lastTwo[0])) {
    type = 'traffic-cone';
  }

  createElement(type);

  lastSpawns.push(type);
  if (lastSpawns.length > 6) lastSpawns.shift();

  obstacleTimer = 0;
  nextObstacleSpawn = Math.floor(Math.random() * 80) + 60; // 60-140 frames
}

/* create element DOM node */
function createElement(type) {
  const el = document.createElement('div');
  el.classList.add('game-element', type);
  // start offscreen: use right style to animate leftwards
  el.style.right = '-150px';

  // adjust bottom for coins/hearts so they appear higher (so player must jump)
  if (type === 'coin') el.style.bottom = '95px';
  if (type === 'heart') el.style.bottom = '85px';

  gameTrack.appendChild(el);
}

/* move elements (called per-frame) */
function updateElements() {
  const elements = Array.from(document.querySelectorAll('.game-element'));
  elements.forEach(el => {
    // parse current numeric right
    const cur = parseFloat(el.style.right) || -150;
    const speed = gameSpeed + (keys.right ? 1.6 : 0); // slight acceleration visual if ArrowRight held
    const next = cur + speed;
    el.style.right = next + 'px';
    // remove off-screen
    if (next > (gameContainer.offsetWidth + 200)) {
      el.remove();
    }
  });
}

/* collisions */
function handleCollisions() {
  const pRect = player.getBoundingClientRect();
  const elements = Array.from(document.querySelectorAll('.game-element'));

  for (let el of elements) {
    const eRect = el.getBoundingClientRect();

    // basic AABB
    if (pRect.left < eRect.right &&
        pRect.right > eRect.left &&
        pRect.top < eRect.bottom &&
        pRect.bottom > eRect.top) {

      // prevent re-processing
      el.remove();

      if (el.classList.contains('traffic-cone')) {
        // hit obstacle
        gameOver();
        return;
      } else if (el.classList.contains('coin')) {
        score++;
        scoreBoard.textContent = score;
        showFactPopup();
      } else if (el.classList.contains('heart')) {
        showHeartPopup();
      }
    }
  }
}

/* main loop */
let rafId;
function gameLoop() {
  if (!gameRunning || gamePaused) return;
  // spawn
  spawnElement();
  // update positions
  updateElements();
  // collisions
  handleCollisions();
  // subtle player run animation class when running
  player.classList.add('run');

  rafId = requestAnimationFrame(gameLoop);
}

/* pause/resume helpers for popups */
function showFactPopup() {
  gamePaused = true;
  // pick next fact
  const fact = gameContent.facts[Math.floor(Math.random() * gameContent.facts.length)];
  factContent.innerText = fact.text;
  factPopup.style.display = 'flex';
}
function showHeartPopup() {
  gamePaused = true;
  donationLink.href = gameContent.donationURL;
  heartPopup.style.display = 'flex';
}
function hidePopup() {
  factPopup.style.display = 'none';
  heartPopup.style.display = 'none';
  gamePaused = false;
  // resume loop
  if (gameRunning) {
    cancelAnimationFrame(rafId);
    gameLoop();
  }
}

/* game over */
function gameOver() {
  gameRunning = false;
  finalScore.innerText = score;
  showScreen(gameOverScreen);
}

/* ---------- CITATIONS PAGE ---------- */
function populateCitations() {
  citationList.innerHTML = '';

  const factsHeader = document.createElement('p');
  factsHeader.innerHTML = `<strong>Fun Facts & Sources:</strong>`;
  citationList.appendChild(factsHeader);

  gameContent.facts.forEach((f, i) => {
    const p = document.createElement('p');
    p.innerHTML = `<strong>Fact ${i+1}:</strong> ${f.text} <br> <strong>Source:</strong> ${f.citation}`;
    citationList.appendChild(p);
  });

  // Image / Skyline
  const imgP = document.createElement('p');
  imgP.innerHTML = `<strong>Images / Graphics:</strong> ${gameContent.meta.images} <br> <strong>Note:</strong> Pixel skyline & character created with CSS gradients layered to simulate pixel-art.`;
  citationList.appendChild(imgP);

  // Audio
  const audioP = document.createElement('p');
  audioP.innerHTML = `<strong>Audio:</strong> ${gameContent.meta.audio}`;
  citationList.appendChild(audioP);

  // AI usage
  const aiP = document.createElement('p');
  aiP.innerHTML = `<strong>AI Assistance:</strong> ${gameContent.meta.ai}`;
  citationList.appendChild(aiP);

  // Font / Code
  const fontP = document.createElement('p');
  fontP.innerHTML = `<strong>Font / Libraries:</strong> ${gameContent.meta.font} <br> <strong>Code:</strong> Game logic and assets written by developer; structure and suggestions adapted from user requirements and assisted by AI.`;
  citationList.appendChild(fontP);

  // Donation link source
  const donateP = document.createElement('p');
  donateP.innerHTML = `<strong>Donation Link:</strong> Sarcoma Alliance. Donate to chondrosarcoma research. ${gameContent.donationURL}`;
  citationList.appendChild(donateP);
}

/* ---------- INITIAL SCREEN ---------- */
showScreen(startScreen);

/* ---------- Ensure focus captures and spacebar doesn't scroll ---------- */
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') e.preventDefault();
});

/* ---------- End of Script ---------- */
