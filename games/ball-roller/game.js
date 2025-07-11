class BallRollerGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'ball-roller',
            gameName: 'Ball Roller',
            gameType: 'solo',
            sensorTypes: ['orientation'],
            multiSensor: false,
            sensorSensitivity: {
                orientation: 1.0
            }
        });

        this.gameState = {
            isPlaying: false,
            ball: {
                x: 0,
                y: 0,
                radius: 20,
                color: 'blue',
                vx: 0,
                vy: 0,
                speed: 5
            }
        };

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupCallbacks();
        this.resizeCanvas(); // Initial call to set canvas size and ball position
        this.resetGame();
    }

    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);

        // Center the ball initially or adjust its position if already playing
        
    }

    setupCallbacks() {
        this.on('onSensorData', (data) => {
            this.handleSensorInput(data);
        });

        this.on('onSensorConnected', () => {
            this.hideSessionCode();
            this.startGame();
        });

        this.on('onSessionCreated', (data) => {
            this.showSessionCode(data.sessionCode);
        });

        this.on('onConnectionChange', (isConnected) => {
            if (!isConnected) {
                this.pauseGame();
                // Optionally show a reconnect message
            }
        });
    }

    handleSensorInput(data) {
        if (!this.gameState.isPlaying) return;

        const { gameInput } = data;
        const ball = this.gameState.ball;

        if (gameInput.tilt) {
            // Invert Y-axis for intuitive control (tilting phone forward moves ball up)
            ball.vx = gameInput.tilt.x * ball.speed;
            ball.vy = -gameInput.tilt.y * ball.speed; 
        }
    }

    resetGame() {
        this.gameState.isPlaying = false;
        // Use current canvas dimensions for centering
        const dpr = window.devicePixelRatio || 1;
        this.gameState.ball.x = this.canvas.width / (2 * dpr);
        this.gameState.ball.y = this.canvas.height / (2 * dpr);
        this.gameState.ball.vx = 0;
        this.gameState.ball.vy = 0;
        document.getElementById('gameStatus').textContent = '센서 연결 대기중...';
    }

    startGame() {
        this.gameState.isPlaying = true;
        document.getElementById('gameStatus').textContent = '게임 시작!';
        this.startGameLoop();
    }

    pauseGame() {
        this.gameState.isPlaying = false;
        document.getElementById('gameStatus').textContent = '연결 끊김! 재연결 중...';
    }

    startGameLoop() {
        const gameLoop = (currentTime) => {
            if (this.gameState.isPlaying) {
                this.update(currentTime);
                this.render();
                requestAnimationFrame(gameLoop);
            }
        };
        requestAnimationFrame(gameLoop);
    }

    update(currentTime) {
        const ball = this.gameState.ball;
        const dpr = window.devicePixelRatio || 1;

        // Update ball position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Boundary checks
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = 0;
        } else if (ball.x + ball.radius > this.canvas.width / dpr) {
            ball.x = this.canvas.width / dpr - ball.radius;
            ball.vx = 0;
        }

        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy = 0;
        } else if (ball.y + ball.radius > this.canvas.height / dpr) {
            ball.y = this.canvas.height / dpr - ball.radius;
            ball.vy = 0;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const ball = this.gameState.ball;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = ball.color;
        this.ctx.fill();
        this.ctx.closePath();
    }
}

// Instantiate the game
window.game = new BallRollerGame();