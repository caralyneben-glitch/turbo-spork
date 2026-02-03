// Simple falling-drop game (canvas). Controls: click or Space to float upward.
// Drop is a circle; obstacles are pipe pairs that scroll left.
// Score increments when the drop passes an obstacle pair.
// Game over when drop hits an obstacle or falls off bottom/top.
// After game over: "You delivered water to X people. Real clean water lasts a lifetime."

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;

  // UI elements
  const scoreUI = document.getElementById('scoreUI');
  const overlay = document.getElementById('overlay');
  const gameoverText = document.getElementById('gameoverText');
  const restartBtn = document.getElementById('restartBtn');

  // Game state
  let drop = null;
  let obstacles = [];
  let lastSpawn = 0;
  let spawnInterval = 1400; // ms
  let speed = 2.2;
  let gravity = 0.45;
  let lift = -8.8;
  let running = false;
  let lastTime = 0;
  let score = 0;

  function reset() {
    drop = {
      x: 110,
      y: H / 2,
      r: 14,
      vy: 0,
      color: '#3fe6ff'
    };
    obstacles = [];
    lastSpawn = performance.now();
    score = 0;
    running = true;
    overlay.style.display = 'none';
    scoreUI.textContent = `Water delivered: ${score}`;
    lastTime = performance.now();
    // optional: ramp difficulty over time
    speed = 2.2;
  }

  function spawnObstacle(now) {
    const gapHeight = 140; // space for the drop to pass
    const minGapY = 90;
    const maxGapY = H - 90 - gapHeight;
    const gapY = Math.floor(Math.random() * (maxGapY - minGapY + 1)) + minGapY;
    const width = 84;
    obstacles.push({
      x: W + 10,
      w: width,
      gapY,
      gapH: gapHeight,
      scored: false,
      type: 'pipe' // placeholder for future types: pollution, crack...
    });
  }

  function circleRectColliding(cx, cy, r, rx, ry, rw, rh) {
    // Find closest point to circle within rectangle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= r * r;
  }

  function update(dt, now) {
    if (!running) return;

    // physics
    drop.vy += gravity;
    drop.y += drop.vy;

    // spawn
    if (now - lastSpawn > spawnInterval) {
      spawnObstacle(now);
      lastSpawn = now;
      // small chance to tighten gap or increase speed slightly
      if (Math.random() < 0.12) speed += 0.05;
      if (Math.random() < 0.07) spawnInterval = Math.max(900, spawnInterval - 20);
    }

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed;
      // scoring: when obstacle passed drop.x
      if (!ob.scored && (ob.x + ob.w) < drop.x - drop.r) {
        ob.scored = true;
        score += 1;
        scoreUI.textContent = `Water delivered: ${score}`;
      }
      // remove off-screen
      if (ob.x + ob.w < -50) obstacles.splice(i, 1);
    }

    // collisions with pipes
    for (const ob of obstacles) {
      // top rect
      if (circleRectColliding(drop.x, drop.y, drop.r, ob.x, 0, ob.w, ob.gapY)) {
        endGame();
        return;
      }
      // bottom rect
      if (circleRectColliding(drop.x, drop.y, drop.r, ob.x, ob.gapY + ob.gapH, ob.w, H - (ob.gapY + ob.gapH))) {
        endGame();
        return;
      }
    }

    // falling off bottom or above top
    if (drop.y - drop.r > H || drop.y + drop.r < 0) {
      endGame();
      return;
    }
  }

  function draw() {
    // clear
    ctx.clearRect(0, 0, W, H);

    // background water gradient (sky -> ground)
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#a7eafe');
    g.addColorStop(1, '#6ec6ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // ground (small strip) to hint well/village
    ctx.fillStyle = '#2b7a78';
    ctx.fillRect(0, H - 26, W, 26);

    // obstacles (pipes/pollution)
    for (const ob of obstacles) {
      // pipe color
      ctx.fillStyle = '#6b4226'; // rusty pipe brown
      // top
      ctx.fillRect(ob.x, 0, ob.w, ob.gapY);
      // bottom
      ctx.fillRect(ob.x, ob.gapY + ob.gapH, ob.w, H - (ob.gapY + ob.gapH));

      // decorative "pollution" blotches on some pipes
      if (Math.random() < 0.02) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(ob.x + ob.w * 0.6, Math.min(ob.gapY, 60), 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // drop (circle) with highlight
    ctx.beginPath();
    ctx.fillStyle = drop.color;
    ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
    ctx.fill();

    // highlight
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.arc(drop.x - 4, drop.y - 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    update(dt, now);
    draw();
    lastTime = now;
    if (running) requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    // show overlay with your exact message
    gameoverText.textContent = `You delivered water to ${score} people. Real clean water lasts a lifetime.`;
    overlay.style.display = 'flex';
  }

  // Inputs
  function flap() {
    if (!running) {
      reset();
      requestAnimationFrame(loop);
      return;
    }
    drop.vy = lift;
  }

  // Click/tap
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    flap();
  });

  // Spacebar
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      flap();
    }
  });

  restartBtn.addEventListener('click', () => {
    reset();
    requestAnimationFrame(loop);
  });

  // Start the first run
  reset();
  requestAnimationFrame(loop);
})();