class EscapeHospital extends SensorGameSDK {
  constructor() {
    super({
      gameId: 'escape-hospital',
      gameName: '🏥 좀비 병원 탈출',
      gameType: 'solo',
      sensorTypes: ['orientation', 'accelerometer'],
      multiSensor: false,
      sensorSensitivity: {
        orientation: 1.0,
        accelerometer: 0.5
      },
      smoothingFactor: 3,
      deadzone: 0.05
    });

    this.aimX = 0;
    this.aimY = 0;
    this.enemies = [];
    this.gameState = { score: 0, isPlaying: true };
    this.enemyTimer = 0;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupCallbacks();
    this.spawnEnemy();
  }

  setupCallbacks() {
    this.on('onSensorData', (data) => this.handleSensorInput(data));
    this.on('onSensorConnected', () => this.updateSensorStatus(true));
    this.on('onSensorDisconnected', () => this.updateSensorStatus(false));
  }

  handleSensorInput(data) {
    const { tilt, shake } = data.gameInput;

    if (tilt) {
      this.aimX += tilt.x * 5;
      this.aimY += tilt.y * 5;
    }

    if (shake?.detected || data.gameInput.tap?.detected) {
      this.shoot();
    }
  }

  spawnEnemy() {
    setInterval(() => {
      const type = Math.random() < 0.5 ? 'walker' : 'dropper';
      const enemy = {
        x: Math.random() * this.canvas.width,
        y: type === 'walker' ? this.canvas.height + 40 : -50,
        vx: 0,
        vy: type === 'walker' ? -1 : 4,
        width: 40,
        height: 40,
        type
      };
      this.enemies.push(enemy);
    }, 1500);
  }

  shoot() {
    this.enemies = this.enemies.filter(enemy => {
      const dx = enemy.x - this.aimX;
      const dy = enemy.y - this.aimY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 40) {
        this.gameState.score += 100;
        return false;
      }
      return true;
    });
    this.updateScore();
  }

  update() {
    this.enemies.forEach(e => { e.y += e.vy; });
    this.enemies = this.enemies.filter(e => e.y < this.canvas.height + 50);
  }

  renderUI() {
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff4444';
    this.enemies.forEach(e => {
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(this.aimX, this.aimY, 20, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.clearRect(this.aimX - 4, this.aimY - 4, 8, 8);
  }

  updateScore() {
    const el = document.getElementById('scoreValue');
    if (el) el.textContent = this.gameState.score;
  }
}