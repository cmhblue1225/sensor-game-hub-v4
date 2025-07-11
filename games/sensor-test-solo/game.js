/**
 * 센서 테스트 (솔로) 게임 v4.0
 * 모든 센서 입력을 시각적으로 확인하고 테스트할 수 있는 솔로 게임
 */

class SensorTestGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'sensor-test-solo',
            gameName: '센서 테스트 (솔로)',
            gameType: 'solo',
            version: '1.0.0',
            
            // 센서 설정 - 모든 센서 활성화
            sensorTypes: ['orientation', 'accelerometer', 'gyroscope'],
            multiSensor: false,
            sensorSensitivity: {
                orientation: 1.0,
                accelerometer: 1.0,
                gyroscope: 1.0
            },
            
            // 데이터 처리 설정
            smoothingFactor: 1,
            deadzone: 0.05,
            updateRate: 60,
            showDebug: false
        });
        
        // 게임 상태
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            testStartTime: 0
        };
        
        // 시각적 요소들
        this.visualElements = {
            // 메인 테스트 볼 (방향 센서 반응)
            ball: {
                x: 0,
                y: 0,
                radius: 30,
                color: '#ef4444',
                trail: [],
                velocity: { x: 0, y: 0 }
            },
            // 파티클 시스템 (가속도계 반응)
            particles: [],
            // 배경 색상 (자이로스코프 반응)
            backgroundColor: '#0f172a',
            // 센서 데이터 히스토리
            sensorHistory: {
                orientation: [],
                accelerometer: [],
                gyroscope: []
            }
        };
        
        // 게임 설정
        this.config = {
            ballSpeed: 6,
            maxSpeed: 15,
            friction: 0.95,
            boundaryBounce: 0.8,
            particleLifetime: 90,
            shakeThreshold: 10,
            historyLength: 60
        };
        
        // 센서 테스트 데이터
        this.sensorTest = {
            orientation: { tilt: { x: 0, y: 0 }, rotation: 0 },
            accelerometer: { x: 0, y: 0, z: 0, intensity: 0 },
            gyroscope: { x: 0, y: 0, z: 0, intensity: 0 },
            lastUpdate: 0,
            maxValues: { accel: 0, gyro: 0 }
        };
        
        // 렌더링
        this.canvas = null;
        this.ctx = null;
        this.lastFrameTime = 0;
        this.gameLoopId = null;
        
        this.init();
    }
    
    /**
     * 게임 초기화
     */
    init() {
        console.log('🧪 센서 테스트 (솔로) 게임 초기화');
        
        // 캔버스 설정
        this.setupCanvas();
        
        // SDK 콜백 등록
        this.setupCallbacks();
        
        // 키보드 입력 설정 (시뮬레이션 모드)
        this.setupKeyboardControls();
        
        // 게임 월드 초기화
        this.initializeGameWorld();
        
        console.log('✅ 센서 테스트 게임 초기화 완료');
    }
    
    /**
     * 캔버스 설정
     */
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('게임 캔버스를 찾을 수 없습니다.');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // 캔버스 크기를 화면에 맞춤
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * 캔버스 크기 조정
     */
    resizeCanvas() {
        if (!this.canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        
        // 볼 초기 위치 설정
        this.visualElements.ball.x = window.innerWidth / 2;
        this.visualElements.ball.y = window.innerHeight / 2;
    }
    
    /**
     * SDK 콜백 설정
     */
    setupCallbacks() {
        // 센서 데이터 수신
        this.on('onSensorData', (data) => {
            if (this.gameState.isPlaying) {
                this.handleSensorInput(data);
            }
        });
        
        // 연결 상태 변경
        this.on('onConnectionChange', (isConnected) => {
            this.updateSensorStatus(isConnected);
        });
        
        // 세션 코드 생성
        this.on('onSessionCreated', (data) => {
            console.log('🔑 세션 생성:', data.sessionCode);
            this.showSessionCode(data.sessionCode);
        });
        
        // 센서 연결
        this.on('onSensorConnected', (data) => {
            console.log('📱 센서 연결됨');
            this.hideSessionCode();
            this.updateSensorStatus(true);
            this.startGameplay();
        });
        
        // 오류 처리
        this.on('onError', (error) => {
            console.error('게임 오류:', error);
        });
    }
    
    /**
     * 키보드 컨트롤 설정 (시뮬레이션 모드)
     */
    setupKeyboardControls() {
        this.keys = {};
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // 특수 키 처리
            switch (e.code) {
                case 'KeyR':
                    this.resetGame();
                    break;
                case 'KeyP':
                    this.togglePause();
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    /**
     * 키보드 입력 처리 (시뮬레이션 모드)
     */
    handleKeyboardInput() {
        if (!this.keys) return;
        
        let moveX = 0;
        let moveY = 0;
        
        // WASD로 볼 이동 (방향 센서 시뮬레이션)
        if (this.keys['KeyA']) moveX -= this.config.ballSpeed;
        if (this.keys['KeyD']) moveX += this.config.ballSpeed;
        if (this.keys['KeyW']) moveY -= this.config.ballSpeed;
        if (this.keys['KeyS']) moveY += this.config.ballSpeed;
        
        // 화살표 키로도 이동 가능
        if (this.keys['ArrowLeft']) moveX -= this.config.ballSpeed;
        if (this.keys['ArrowRight']) moveX += this.config.ballSpeed;
        if (this.keys['ArrowUp']) moveY -= this.config.ballSpeed;
        if (this.keys['ArrowDown']) moveY += this.config.ballSpeed;
        
        if (moveX !== 0 || moveY !== 0) {
            this.visualElements.ball.velocity.x += moveX * 0.3;
            this.visualElements.ball.velocity.y += moveY * 0.3;
            
            // 최대 속도 제한
            const speed = Math.sqrt(
                this.visualElements.ball.velocity.x ** 2 + 
                this.visualElements.ball.velocity.y ** 2
            );
            if (speed > this.config.maxSpeed) {
                this.visualElements.ball.velocity.x = (this.visualElements.ball.velocity.x / speed) * this.config.maxSpeed;
                this.visualElements.ball.velocity.y = (this.visualElements.ball.velocity.y / speed) * this.config.maxSpeed;
            }
            
            // 궤적 추가
            this.addTrailPoint();
        }
        
        // 스페이스바로 파티클 생성 (흔들기 시뮬레이션)
        if (this.keys['Space']) {
            this.createParticles(
                this.visualElements.ball.x, 
                this.visualElements.ball.y, 
                '#10b981',
                8
            );
        }
        
        // 숫자 키로 배경 색상 변경 (자이로스코프 시뮬레이션)
        if (this.keys['Digit1']) this.visualElements.backgroundColor = '#1e40af';
        if (this.keys['Digit2']) this.visualElements.backgroundColor = '#dc2626';
        if (this.keys['Digit3']) this.visualElements.backgroundColor = '#059669';
        if (this.keys['Digit4']) this.visualElements.backgroundColor = '#7c2d12';
        if (this.keys['Digit5']) this.visualElements.backgroundColor = '#4c1d95';
    }
    
    /**
     * 게임 월드 초기화
     */
    initializeGameWorld() {
        // 볼 초기화
        this.visualElements.ball.x = window.innerWidth / 2;
        this.visualElements.ball.y = window.innerHeight / 2;
        this.visualElements.ball.velocity = { x: 0, y: 0 };
        this.visualElements.ball.trail = [];
        
        // 파티클 초기화
        this.visualElements.particles = [];
        
        // 배경 색상 초기화
        this.visualElements.backgroundColor = '#0f172a';
        
        // 센서 히스토리 초기화
        this.visualElements.sensorHistory = {
            orientation: [],
            accelerometer: [],
            gyroscope: []
        };
        
        console.log('🌍 게임 월드 초기화 완료');
    }
    
    /**
     * 게임플레이 시작
     */
    startGameplay() {
        this.gameState.isPlaying = true;
        this.gameState.testStartTime = Date.now();
        
        // 게임 루프 시작
        this.startGameLoop();
        
        this.updateGameStatus('센서 테스트 진행 중...');
        console.log('🚀 센서 테스트 시작');
    }
    
    /**
     * 센서 입력 처리
     */
    handleSensorInput(data) {
        const { gameInput, sensorType } = data;
        this.sensorTest.lastUpdate = Date.now();
        
        // 1. 방향 센서 (기울기) - 볼 이동
        if (gameInput.tilt) {
            this.sensorTest.orientation.tilt = gameInput.tilt;
            
            // 볼 속도 업데이트
            this.visualElements.ball.velocity.x += gameInput.tilt.x * this.config.ballSpeed * 0.5;
            this.visualElements.ball.velocity.y += gameInput.tilt.y * this.config.ballSpeed * 0.5;
            
            // 최대 속도 제한
            const speed = Math.sqrt(
                this.visualElements.ball.velocity.x ** 2 + 
                this.visualElements.ball.velocity.y ** 2
            );
            if (speed > this.config.maxSpeed) {
                this.visualElements.ball.velocity.x = (this.visualElements.ball.velocity.x / speed) * this.config.maxSpeed;
                this.visualElements.ball.velocity.y = (this.visualElements.ball.velocity.y / speed) * this.config.maxSpeed;
            }
            
            // 센서 히스토리 업데이트
            this.updateSensorHistory('orientation', gameInput.tilt);
        }
        
        // 2. 가속도계 - 파티클 효과
        if (gameInput.movement) {
            this.sensorTest.accelerometer = gameInput.movement;
            
            const intensity = Math.sqrt(
                gameInput.movement.x ** 2 + 
                gameInput.movement.y ** 2 + 
                gameInput.movement.z ** 2
            );
            
            this.sensorTest.accelerometer.intensity = intensity;
            this.sensorTest.maxValues.accel = Math.max(this.sensorTest.maxValues.accel, intensity);
            
            // 센서 히스토리 업데이트
            this.updateSensorHistory('accelerometer', { intensity });
            
            // 임계값 이상이면 파티클 생성
            if (intensity > 2) {
                this.createParticles(
                    this.visualElements.ball.x,
                    this.visualElements.ball.y,
                    '#f59e0b',
                    Math.min(Math.floor(intensity * 2), 15)
                );
            }
        }
        
        // 3. 흔들기 감지 - 특별 파티클
        if (gameInput.shake && gameInput.shake.detected) {
            this.createParticles(
                this.visualElements.ball.x,
                this.visualElements.ball.y,
                '#10b981',
                Math.min(gameInput.shake.intensity || 10, 20)
            );
        }
        
        // 4. 자이로스코프 - 배경 색상 변경
        if (gameInput.rotation) {
            this.sensorTest.gyroscope = gameInput.rotation;
            
            const gyroIntensity = Math.sqrt(
                gameInput.rotation.x ** 2 + 
                gameInput.rotation.y ** 2 + 
                gameInput.rotation.z ** 2
            );
            
            this.sensorTest.gyroscope.intensity = gyroIntensity;
            this.sensorTest.maxValues.gyro = Math.max(this.sensorTest.maxValues.gyro, gyroIntensity);
            
            // 센서 히스토리 업데이트
            this.updateSensorHistory('gyroscope', { intensity: gyroIntensity });
            
            // 자이로스코프에 따라 배경 색상 변경
            if (gyroIntensity > 0.5) {
                const hue = (Date.now() * 0.1) % 360;
                this.visualElements.backgroundColor = `hsl(${hue}, 70%, 15%)`;
            }
        }
    }
    
    /**
     * 센서 히스토리 업데이트
     */
    updateSensorHistory(sensorType, data) {
        if (!this.visualElements.sensorHistory[sensorType]) return;
        
        this.visualElements.sensorHistory[sensorType].push({
            data: data,
            timestamp: Date.now()
        });
        
        // 히스토리 길이 제한
        if (this.visualElements.sensorHistory[sensorType].length > this.config.historyLength) {
            this.visualElements.sensorHistory[sensorType].shift();
        }
    }
    
    /**
     * 궤적 점 추가
     */
    addTrailPoint() {
        this.visualElements.ball.trail.push({
            x: this.visualElements.ball.x,
            y: this.visualElements.ball.y,
            life: 20,
            timestamp: Date.now()
        });
        
        // 오래된 궤적 제거
        this.visualElements.ball.trail = this.visualElements.ball.trail.filter(point => point.life-- > 0);
        if (this.visualElements.ball.trail.length > 30) {
            this.visualElements.ball.trail.shift();
        }
    }
    
    /**
     * 파티클 생성
     */
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.visualElements.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: this.config.particleLifetime,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    /**
     * 게임 루프 시작
     */
    startGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
        }
        
        this.lastFrameTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (this.gameState.isPlaying && !this.gameState.isPaused) {
                this.update(currentTime);
                this.render();
            }
            this.gameLoopId = requestAnimationFrame(gameLoop);
        };
        
        this.gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    /**
     * 게임 업데이트
     */
    update(currentTime) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // 키보드 입력 처리 (시뮬레이션 모드)
        this.handleKeyboardInput();
        
        // 볼 물리 업데이트
        this.updateBall();
        
        // 파티클 업데이트
        this.updateParticles();
        
        // 궤적 업데이트
        this.addTrailPoint();
    }
    
    /**
     * 볼 물리 업데이트
     */
    updateBall() {
        // 위치 업데이트
        this.visualElements.ball.x += this.visualElements.ball.velocity.x;
        this.visualElements.ball.y += this.visualElements.ball.velocity.y;
        
        // 마찰력 적용
        this.visualElements.ball.velocity.x *= this.config.friction;
        this.visualElements.ball.velocity.y *= this.config.friction;
        
        // 경계 충돌 처리
        const radius = this.visualElements.ball.radius;
        
        if (this.visualElements.ball.x - radius < 0) {
            this.visualElements.ball.x = radius;
            this.visualElements.ball.velocity.x *= -this.config.boundaryBounce;
        }
        if (this.visualElements.ball.x + radius > window.innerWidth) {
            this.visualElements.ball.x = window.innerWidth - radius;
            this.visualElements.ball.velocity.x *= -this.config.boundaryBounce;
        }
        if (this.visualElements.ball.y - radius < 0) {
            this.visualElements.ball.y = radius;
            this.visualElements.ball.velocity.y *= -this.config.boundaryBounce;
        }
        if (this.visualElements.ball.y + radius > window.innerHeight) {
            this.visualElements.ball.y = window.innerHeight - radius;
            this.visualElements.ball.velocity.y *= -this.config.boundaryBounce;
        }
    }
    
    /**
     * 파티클 업데이트
     */
    updateParticles() {
        for (let i = this.visualElements.particles.length - 1; i >= 0; i--) {
            const particle = this.visualElements.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.size *= 0.98;
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.visualElements.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 렌더링
     */
    render() {
        if (!this.ctx || !this.canvas) return;
        
        // 배경 지우기
        this.ctx.fillStyle = this.visualElements.backgroundColor;
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        // 렌더링 순서
        this.renderTrail();
        this.renderBall();
        this.renderParticles();
        this.renderSensorInfo();
        this.renderControls();
    }
    
    /**
     * 궤적 렌더링
     */
    renderTrail() {
        if (this.visualElements.ball.trail.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.visualElements.ball.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.visualElements.ball.trail[0].x, this.visualElements.ball.trail[0].y);
        
        for (let i = 1; i < this.visualElements.ball.trail.length; i++) {
            const point = this.visualElements.ball.trail[i];
            const alpha = point.life / 20;
            this.ctx.globalAlpha = alpha * 0.5;
            this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * 볼 렌더링
     */
    renderBall() {
        const ball = this.visualElements.ball;
        
        this.ctx.save();
        
        // 그림자
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 메인 볼 (그라디언트)
        const gradient = this.ctx.createRadialGradient(
            ball.x - ball.radius * 0.3,
            ball.y - ball.radius * 0.3,
            0,
            ball.x,
            ball.y,
            ball.radius
        );
        
        gradient.addColorStop(0, '#fca5a5');
        gradient.addColorStop(0.7, ball.color);
        gradient.addColorStop(1, '#991b1b');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 테두리
        this.ctx.strokeStyle = ball.color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 하이라이트
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x - ball.radius * 0.4, ball.y - ball.radius * 0.4, ball.radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 파티클 렌더링
     */
    renderParticles() {
        this.visualElements.particles.forEach(particle => {
            this.ctx.save();
            
            this.ctx.globalAlpha = particle.life / this.config.particleLifetime;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 5;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    /**
     * 센서 정보 렌더링
     */
    renderSensorInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '14px Arial';
        
        let y = 30;
        const lineHeight = 20;
        
        // 제목
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('🧪 센서 테스트 데이터', 20, y);
        y += lineHeight * 1.5;
        
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        // 방향 센서
        this.ctx.fillText(`📱 기울기: X=${this.sensorTest.orientation.tilt.x.toFixed(2)}, Y=${this.sensorTest.orientation.tilt.y.toFixed(2)}`, 20, y);
        y += lineHeight;
        
        // 가속도계
        this.ctx.fillText(`⚡ 가속도: 강도=${this.sensorTest.accelerometer.intensity?.toFixed(2) || '0.00'}`, 20, y);
        y += lineHeight;
        
        // 자이로스코프
        this.ctx.fillText(`🔄 자이로: 강도=${this.sensorTest.gyroscope.intensity?.toFixed(2) || '0.00'}`, 20, y);
        y += lineHeight;
        
        // 최대값
        y += lineHeight * 0.5;
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(`📊 최대 가속도: ${this.sensorTest.maxValues.accel.toFixed(2)}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`📊 최대 자이로: ${this.sensorTest.maxValues.gyro.toFixed(2)}`, 20, y);
        
        this.ctx.restore();
    }
    
    /**
     * 컨트롤 정보 렌더링
     */
    renderControls() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px Arial';
        
        let y = window.innerHeight - 120;
        const lineHeight = 18;
        
        // 키보드 컨트롤
        this.ctx.fillText('⌨️ 키보드 시뮬레이션:', 20, y);
        y += lineHeight;
        this.ctx.fillText('WASD / 화살표 = 볼 이동', 20, y);
        y += lineHeight;
        this.ctx.fillText('Space = 파티클 생성', 20, y);
        y += lineHeight;
        this.ctx.fillText('1-5 = 배경 색상 변경', 20, y);
        y += lineHeight;
        this.ctx.fillText('R = 리셋, P = 일시정지', 20, y);
        
        this.ctx.restore();
    }
    
    /**
     * 게임 리셋
     */
    resetGame() {
        this.initializeGameWorld();
        this.sensorTest.maxValues = { accel: 0, gyro: 0 };
        console.log('🔄 게임 리셋');
    }
    
    /**
     * 일시정지 토글
     */
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        console.log(this.gameState.isPaused ? '⏸️ 일시정지' : '▶️ 재생');
    }
    
    // ========== UI 업데이트 메서드들 ==========
    
    /**
     * 게임 상태 업데이트
     */
    updateGameStatus(status) {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    /**
     * 센서 상태 업데이트
     */
    updateSensorStatus(isConnected) {
        const statusElement = document.getElementById('sensorStatus');
        if (statusElement) {
            if (isConnected) {
                statusElement.textContent = '📱 센서 연결됨';
                statusElement.style.color = '#10b981';
            } else {
                statusElement.textContent = '⌨️ 키보드 모드';
                statusElement.style.color = '#f59e0b';
            }
        }
    }
    
    /**
     * 세션 코드 표시
     */
    showSessionCode(sessionCode) {
        const panel = document.getElementById('sessionCodePanel');
        const display = document.getElementById('sessionCodeDisplay');
        
        if (panel && display) {
            display.textContent = sessionCode;
            panel.classList.remove('hidden');
        }
    }
    
    /**
     * 세션 코드 숨기기
     */
    hideSessionCode() {
        const panel = document.getElementById('sessionCodePanel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }
    
    /**
     * 게임 정리
     */
    destroy() {
        this.gameState.isPlaying = false;
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // SDK 정리
        super.destroy();
        
        console.log('🗑️ 센서 테스트 게임 정리 완료');
    }
}

// 게임 인스턴스 생성 및 초기화
console.log('🧪 센서 테스트 (솔로) 게임 로딩 완료');

try {
    console.log('🚀 게임 인스턴스 생성 시도...');
    window.gameInstance = new SensorTestGame();
    window.game = window.gameInstance; // 호환성을 위한 별칭
    
    console.log('✅ 센서 테스트 게임 인스턴스 생성 완료');
    console.log('🔗 인스턴스 연결 상태:', window.gameInstance.state?.isConnected || 'unknown');
} catch (error) {
    console.error('❌ 센서 테스트 게임 초기화 실패:', error);
    console.error('❌ 오류 상세:', error.stack);
}