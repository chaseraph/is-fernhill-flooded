document.addEventListener('DOMContentLoaded', () => {
    // 1. Set the Date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // 2. Handle the "Flooded" Logic
    const statusText = document.getElementById('status-text');
    const statusImage = document.getElementById('status-image');

    if (typeof CONFIG !== 'undefined') {
        if (CONFIG.isFlooded) {
            statusText.textContent = "YES";
            statusText.classList.add('yes');
            statusText.classList.remove('no');
            statusImage.src = "Fernhillisflooded.png"; // Ensure this matches your file extension!
            statusImage.alt = "Fern Hill Road is currently flooded";
        } else {
            statusText.textContent = "NO";
            statusText.classList.add('no');
            statusText.classList.remove('yes');
            statusImage.src = "fernhillisnotflooded.jpg";
            statusImage.alt = "Fern Hill Road is currently dry";
        }

        updateCams();
        setInterval(updateCams, 300000); // 5 minutes
    } else {
        console.error("Config file not found.");
    }

    function updateCams() {
        const timestamp = new Date().getTime();
        const buildUrl = (url) => {
            if (!url) return '';
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}t=${timestamp}`;
        };
        if (CONFIG.cam1) document.getElementById('cam1').src = buildUrl(CONFIG.cam1);
        if (CONFIG.cam2) document.getElementById('cam2').src = buildUrl(CONFIG.cam2);
        if (CONFIG.cam3) document.getElementById('cam3').src = buildUrl(CONFIG.cam3);
    }

    // --- FLOOD SIMULATOR LOGIC ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let gameRunning = false;
    let frameCount = 0;
    let obstacles = [];

    // GAME SETTINGS
    const roadWidth = 300;
    const ditchSize = 60;
    const safeZoneStart = ditchSize;
    const safeZoneEnd = roadWidth - ditchSize;

    // The Player (Car)
    const car = { x: 130, y: 350, width: 40, height: 60 };

    // Controls
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('close-game-btn').addEventListener('click', stopGame);
    document.getElementById('quit-btn').addEventListener('click', stopGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        if (e.key === 'ArrowLeft' && car.x > 0) car.x -= 20;
        if (e.key === 'ArrowRight' && car.x < canvas.width - car.width) car.x += 20;
    });

    // Touch
    canvas.addEventListener('touchstart', (e) => {
        if (!gameRunning) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        if (touchX < canvas.width / 2) {
            if (car.x > 0) car.x -= 20;
        } else {
            if (car.x < canvas.width - car.width) car.x += 20;
        }
    }, { passive: false });

    function startGame() {
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('start-game-btn').classList.add('hidden');

        // Update instructions
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        document.querySelector('.game-instructions').innerHTML = isMobile
            ? "Tap Left/Right to dodge logs.<br>Stay on the pavement."
            : "Use Arrow Keys to dodge logs.<br>Stay on the pavement.";

        // Reset
        car.x = 130;
        obstacles = [];
        frameCount = 0;
        gameRunning = true;
        gameLoop();
    }

    function stopGame() {
        gameRunning = false;
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('start-game-btn').classList.remove('hidden');
    }

    function triggerGameOver(reason) {
        gameRunning = false;
        document.getElementById('game-over-modal').classList.remove('hidden');

        const deathMsg = document.getElementById('death-message');
        const linkContainer = document.getElementById('rescue-link-container');

        if (reason === 'ditch') {
            deathMsg.innerText = "You couldn't see the edge of the road. You slid into the ditch and your car submerged.";
            deathMsg.style.color = "cyan";
            linkContainer.classList.remove('hidden'); // Show link
        } else {
            deathMsg.innerText = "You hit a submerged log and stalled your engine.";
            deathMsg.style.color = "orange";
            linkContainer.classList.add('hidden');
        }
    }

    function gameLoop() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Water
        ctx.fillStyle = "#2b3e50";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Ditch Markers
        ctx.strokeStyle = "#3a4f63";
        ctx.setLineDash([10, 20]);
        ctx.beginPath();
        ctx.moveTo(safeZoneStart, 0);
        ctx.lineTo(safeZoneStart, canvas.height);
        ctx.moveTo(safeZoneEnd, 0);
        ctx.lineTo(safeZoneEnd, canvas.height);
        ctx.stroke();

        // 3. Draw Car
        ctx.fillStyle = "#d32f2f";
        ctx.fillRect(car.x, car.y, car.width, car.height);

        // --- DITCH CHECK ---
        if (car.x < safeZoneStart - 10 || car.x + car.width > safeZoneEnd + 10) {
            triggerGameOver('ditch');
            return;
        }

        // 4. Spawn Obstacles
        // Changed from 50 to 70 to make them appear less frequently (easier)
        if (frameCount % 70 === 0 && frameCount < 350) {
            let obsWidth = 50;
            let obsX = Math.random() * (safeZoneEnd - safeZoneStart - obsWidth) + safeZoneStart;
            obstacles.push({ x: obsX, y: -50, width: obsWidth, height: 20, type: 'log' });
        }

        // THE TRAP: Now happens a bit later (Frame 400 instead of 300)
        if (frameCount === 400) {
            obstacles.push({
                x: safeZoneStart,
                y: -100,
                width: safeZoneEnd - safeZoneStart,
                height: 40,
                type: 'trap-log'
            });
        }

        // 5. Update Obstacles
        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];

            // SLOW DOWN: Changed speed from 6 to 3
            obs.y += 3;

            ctx.fillStyle = "#5c4033";
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

            // Collision with Log
            if (
                car.x < obs.x + obs.width &&
                car.x + car.width > obs.x &&
                car.y < obs.y + obs.height &&
                car.height + car.y > obs.y
            ) {
                triggerGameOver('log');
            }
        }

        frameCount++;
        requestAnimationFrame(gameLoop);
    }
});