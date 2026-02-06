<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The EscapeRun - Versus Edition</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        body {
            margin: 0;
            overflow: hidden;
            background-color: #020617;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: white;
            font-family: 'Press Start 2P', cursive;
            touch-action: none;
        }

        canvas {
            image-rendering: pixelated;
            border: 8px solid #475569;
            background-color: #000;
            box-shadow: 0 0 0 4px #1e293b, 0 20px 50px rgba(0, 0, 0, 0.8);
            max-width: 95vw;
            max-height: 65vh;
        }

        .menu-btn {
            position: relative;
            width: 320px;
            padding: 20px;
            margin-bottom: 24px;
            background-color: #1e293b;
            color: white;
            font-size: 12px;
            text-transform: uppercase;
            transition: all 0.1s;
            border: 4px solid #475569;
            box-shadow: 6px 6px 0px #000;
        }

        .menu-btn:hover {
            background-color: #ef4444;
            border-color: #b91c1c;
            transform: translate(-2px, -2px);
            box-shadow: 8px 8px 0px #000;
        }

        .menu-btn:active {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px #000;
        }

        .title-text {
            font-size: 48px;
            color: #ef4444;
            text-shadow: 6px 6px 0px #7f1d1d, 10px 10px 0px #000;
            margin-bottom: 50px;
            text-align: center;
            line-height: 1.2;
        }
        
        .hud-text {
            font-size: 10px;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>

    <!-- MENÚ PRINCIPAL -->
    <div id="mainMenu" class="flex flex-col items-center">
        <h1 class="title-text">THE<br>ESCAPERUN</h1>
        
        <button onclick="startGame('normal')" class="menu-btn">
            Modo Normal (Coop)
        </button>
        
        <button onclick="showKillerOptions()" class="menu-btn" style="color: #fca5a5; border-color: #991b1b;">
            Modo Asesino (1vs1)
        </button>
        
        <button onclick="quitGame()" class="menu-btn" style="background-color: #334155; font-size: 10px;">
            Salir del Juego
        </button>
    </div>

    <!-- SUBMENÚ MODO ASESINO -->
    <div id="killerSubMenu" class="hidden flex flex-col items-center">
        <h2 class="text-2xl text-red-500 mb-8">DIFICULTAD ASESINO</h2>
        
        <button onclick="startGame('asesino_normal')" class="menu-btn">
            Normal
        </button>
        
        <button onclick="startGame('asesino_dificil')" class="menu-btn" style="border-color: #991b1b; color: #f87171;">
            Difícil
        </button>

        <button onclick="backToMain()" class="text-xs mt-4 opacity-50 hover:opacity-100 transition-opacity">
            < VOLVER
        </button>
    </div>

    <!-- CONTENEDOR DE JUEGO -->
    <div id="gameContainer" class="hidden flex flex-col items-center">
        <div class="mb-4 text-center">
            <h2 id="modeIndicator" class="text-lg mb-2">MODO: NORMAL</h2>
            <div id="score" class="text-3xl text-yellow-400 mb-2">0.0</div>
            <div id="controlsHint" class="flex gap-6 hud-text opacity-60">
                <p>P1: WASD/FLECHAS</p>
                <p>P2: IJKL</p>
            </div>
        </div>
        <canvas id="gameCanvas"></canvas>
    </div>

    <!-- OVERLAY GAME OVER -->
    <div id="overlay" class="hidden fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-10 p-4 text-center">
        <h2 class="text-4xl text-red-600 mb-4" id="deathMessage">¡GAME OVER!</h2>
        <p id="finalScore" class="text-sm mb-12 leading-relaxed whitespace-pre-line"></p>
        <div class="flex flex-col gap-4">
            <button id="retryBtn" class="menu-btn" style="background-color: #ef4444;">REINTENTAR</button>
            <button onclick="location.reload()" class="menu-btn" style="background-color: #475569;">MENÚ</button>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');
        const overlay = document.getElementById('overlay');
        const finalScoreElement = document.getElementById('finalScore');
        const deathMessage = document.getElementById('deathMessage');
        const mainMenu = document.getElementById('mainMenu');
        const killerSubMenu = document.getElementById('killerSubMenu');
        const gameContainer = document.getElementById('gameContainer');
        const modeIndicator = document.getElementById('modeIndicator');
        const controlsHint = document.getElementById('controlsHint');

        canvas.width = 800;
        canvas.height = 500;

        const pScale = 4;
        let gameMode = 'normal';
        let keys = {};
        let startTime;
        let gameActive = false;
        let particles = [];

        let player1 = { x: 0, y: 0, w: 24, h: 32, speed: 4.8, color: '#FFFFFF', sec: '#94a3b8', type: 'P1' };
        let player2 = { x: 0, y: 0, w: 24, h: 32, speed: 4.8, color: '#3b82f6', sec: '#1d4ed8', type: 'P2' };
        let enemy = { x: 0, y: 0, w: 24, h: 32, speed: 2.5, color: '#ef4444', sec: '#7f1d1d', type: 'E' };

        window.addEventListener('keydown', (e) => keys[e.code] = true);
        window.addEventListener('keyup', (e) => keys[e.code] = false);

        function showKillerOptions() {
            mainMenu.classList.add('hidden');
            killerSubMenu.classList.remove('hidden');
        }

        function backToMain() {
            killerSubMenu.classList.add('hidden');
            mainMenu.classList.remove('hidden');
        }

        function startGame(mode) {
            gameMode = mode;
            mainMenu.classList.add('hidden');
            killerSubMenu.classList.add('hidden');
            gameContainer.classList.remove('hidden');
            
            if(mode === 'asesino_normal' || mode === 'asesino_dificil') {
                const isHard = mode === 'asesino_dificil';
                modeIndicator.innerText = isHard ? "MODO: ASESINO (DIFÍCIL)" : "MODO: ASESINO (NORMAL)";
                modeIndicator.style.color = "#ef4444";
                controlsHint.innerHTML = "<p>P1: ESCAPA (Blanco)</p><p>P2: ASESINA (Azul)</p>";
                
                // Ajustes de velocidad segun dificultad
                enemy.speed = isHard ? 2.5 : 1.5; 
                player2.speed = isHard ? 5.8 : 5.2; 
                player1.speed = 5.0;
            } else {
                modeIndicator.innerText = "MODO: NORMAL (COOP)";
                modeIndicator.style.color = "#3b82f6";
                controlsHint.innerHTML = "<p>P1: WASD/FLECHAS</p><p>P2: IJKL</p>";
                enemy.speed = 2.5;
                player1.speed = 4.8;
                player2.speed = 4.8;
            }

            document.getElementById('retryBtn').onclick = () => startGame(mode);
            resetGame();
        }

        function resetGame() {
            player1.x = 600; player1.y = 350;
            player2.x = 150; player2.y = 350;
            enemy.x = 388; enemy.y = 50;
            particles = [];
            keys = {};
            startTime = Date.now();
            gameActive = true;
            overlay.classList.add('hidden');
            update();
        }

        function createParticle(x, y, color) {
            particles.push({
                x: x + 10, y: y + 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0, color: color
            });
        }

        function drawPixelCharacter(p, isKiller = false) {
            const s = pScale;
            const x = Math.floor(p.x);
            const y = Math.floor(p.y);

            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(x, y + p.h - s, p.w, s);

            ctx.fillStyle = p.color;
            ctx.shadowBlur = gameActive ? 15 : 0;
            ctx.shadowColor = p.color;

            // Cabeza
            ctx.fillRect(x + s, y, s * 4, s * 4);
            
            // Ojos
            ctx.shadowBlur = 0;
            ctx.fillStyle = (isKiller && (gameMode.includes('asesino'))) ? 'red' : 'black';
            ctx.fillRect(x + s * 1, y + s * 1, s, s);
            ctx.fillRect(x + s * 4, y + s * 1, s, s);

            // Cuerpo
            ctx.fillStyle = p.color;
            ctx.fillRect(x, y + s * 3, s * 6, s * 4);
            
            ctx.fillStyle = p.sec;
            ctx.fillRect(x + s, y + s * 5, s * 4, s * 2);
            
            if (gameActive && Math.random() > 0.8) createParticle(x, y, p.color);
        }

        function drawBackground() {
            const tileSize = 40;
            for(let y = 0; y < canvas.height; y += tileSize) {
                for(let x = 0; x < canvas.width; x += tileSize) {
                    ctx.fillStyle = (Math.floor(x/tileSize) + Math.floor(y/tileSize)) % 2 === 0 ? '#0f172a' : '#020617';
                    ctx.fillRect(x, y, tileSize, tileSize);
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, tileSize, tileSize);
                }
            }
        }

        function update() {
            if (!gameActive) return;

            drawBackground();

            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.02;
                if(p.life <= 0) particles.splice(i, 1);
                ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
                ctx.fillRect(p.x, p.y, pScale, pScale); ctx.globalAlpha = 1.0;
            });

            // Movimiento P1
            if (keys['ArrowUp'] || keys['KeyW']) player1.y -= player1.speed;
            if (keys['ArrowDown'] || keys['KeyS']) player1.y += player1.speed;
            if (keys['ArrowLeft'] || keys['KeyA']) player1.x -= player1.speed;
            if (keys['ArrowRight'] || keys['KeyD']) player1.x += player1.speed;

            // Movimiento P2
            if (keys['KeyI']) player2.y -= player2.speed;
            if (keys['KeyK']) player2.y += player2.speed;
            if (keys['KeyJ']) player2.x -= player2.speed;
            if (keys['KeyL']) player2.x += player2.speed;

            [player1, player2].forEach(p => {
                p.x = Math.max(0, Math.min(canvas.width - p.w, p.x));
                p.y = Math.max(0, Math.min(canvas.height - p.h, p.y));
            });

            // IA Enemiga (Ataca al más cercano)
            const d1 = Math.hypot(player1.x - enemy.x, player1.y - enemy.y);
            const d2 = Math.hypot(player2.x - enemy.x, player2.y - enemy.y);
            const target = d1 < d2 ? player1 : player2;
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const elapsed = (Date.now() - startTime) / 1000;
            
            // Factor de incremento segun dificultad
            const speedInc = gameMode === 'asesino_dificil' ? 0.12 : 0.05;
            const currentEnemySpeed = enemy.speed + (elapsed * speedInc);

            if (dist > 0) {
                enemy.x += (dx / dist) * currentEnemySpeed;
                enemy.y += (dy / dist) * currentEnemySpeed;
            }

            // --- Lógica de Colisión según el Modo ---
            if (gameMode.includes('asesino')) {
                if (checkCollision(player1, player2)) {
                    victory('JUGADOR 2 (ASESINO)', elapsed);
                }
                if (checkCollision(player1, enemy)) victory('EL PÍXEL ROJO (P1 CAÍDO)', elapsed);
                if (checkCollision(player2, enemy)) victory('EL PÍXEL ROJO (P2 CAÍDO)', elapsed);
            } else {
                if (checkCollision(player1, enemy)) victory('IA (P1 ELIMINADO)', elapsed, true);
                if (checkCollision(player2, enemy)) victory('IA (P2 ELIMINADO)', elapsed, true);
            }

            drawPixelCharacter(player1);
            drawPixelCharacter(player2, true);
            drawPixelCharacter(enemy);

            scoreElement.innerText = elapsed.toFixed(1);
            requestAnimationFrame(update);
        }

        function checkCollision(a, b) {
            return a.x < b.x + b.w && a.x + a.w > b.x &&
                   a.y < b.y + b.h && a.y + a.h > b.y;
        }

        function victory(winner, time, isCoopFail = false) {
            gameActive = false;
            deathMessage.innerText = isCoopFail ? "¡ELIMINADOS!" : "¡CAZA LOGRADA!";
            deathMessage.style.color = isCoopFail ? "#ef4444" : "#3b82f6";
            
            let msg = isCoopFail ? `Sobrevivieron: ${time.toFixed(2)}s` : `GANADOR: ${winner}\n\nTiempo de caza: ${time.toFixed(2)}s`;
            finalScoreElement.innerText = msg;
            overlay.classList.remove('hidden');
        }

        function quitGame() {
            document.body.innerHTML = `<div class="text-center"><h1 class="title-text" style="font-size: 24px;">¡ADIÓS!</h1><button onclick="location.reload()" class="menu-btn">VOLVER</button></div>`;
        }
    </script>
</body>
</html>
