/**
 * 솔로 게임 템플릿 v4.0
 * 개발자들이 쉽게 확장할 수 있는 기본 게임 구조
 */

class SensorTestGame extends SensorGameSDK {
    constructor() {
        // URL 파라미터에서 세션 정보 미리 추출
        const urlParams = new URLSearchParams(window.location.search);
        const existingSessionCode = urlParams.get('sessionCode');
        const existingSessionId = urlParams.get('sessionId');
        
        console.log('🔍 URL 파라미터 추출:', { existingSessionCode, existingSessionId });
        console.log('🌐 현재 URL:', window.location.href);
        console.log('🔍 URL 검색 파라미터:', window.location.search);
        
        super({
            gameId: 'sensor-test-solo',
            gameName: '센서 테스트 (솔로)',
            gameType: 'solo',
            version: '1.0.0',
            
            // 센서 설정 - 모든 센서 활성화
            sensorTypes: ['orientation', 'accelerometer', 'gyroscope'],
            multiSensor: false, // 단일 센서 사용
            sensorSensitivity: {
                orientation: 1.0,
                accelerometer: 1.0,
                gyroscope: 1.0
            },
            
            // 데이터 처리 설정
            smoothingFactor: 1,
            deadzone: 0.05,
            updateRate: 60,
            
            // 기존 세션 정보 전달
            existingSessionCode,
            existingSessionId
        });
        
        // 중요: 시각적 요소를 먼저 초기화 (resizeCanvas에서 사용)
        this.visualElements = {
            // 메인 테스트 볼
            ball: {
                x: 0,
                y: 0,
                radius: 25,
                color: '#ef4444', // 빨간색
                trail: []
            },
            // 배경 색상 (자이로스코프 반응)
            backgroundColor: '#0f172a',
            // 파티클 (가속도계 반응)
            particles: [],
            // 센서 히스토리
            sensorHistory: {
                orientation: [],
                accelerometer: [],
                gyroscope: []
            }
        };
        
        // 테스트 설정
        this.config = {
            ballSpeed: 8,
            maxSpeed: 20,
            friction: 0.92,
            boundaryBounce: 0.7,
            particleLifetime: 120,
            shakeThreshold: 12,
            gyroColorSpeed: 0.02,
            historyLength: 100
        };
        
        // 게임 상태
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            testStartTime: 0
        };
        
        // 센서 테스트 데이터
        this.sensorTest = {
            orientation: { tilt: { x: 0, y: 0 }, rotation: 0 },
            accelerometer: { x: 0, y: 0, z: 0, shake: false },
            gyroscope: { x: 0, y: 0, z: 0 },
            lastUpdate: 0,
            maxValues: { accel: 0, gyro: 0 }
        };
        
        // 플레이어 객체 (미리 초기화)
        this.player = {
            x: 400,
            y: 300,
            velocity: { x: 0, y: 0 },
            trail: [],
            radius: 20,
            color: '#3b82f6'
        };
        
        // 렌더링
        this.canvas = null;
        this.ctx = null;
        this.lastFrameTime = 0;
        this.gameLoopId = null;
        
        // 성능 통계
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastFpsUpdate: 0
        };
        
        this.init();
    }
    
    /**
     * 게임 초기화
     */
    init() {
        console.log('🧪 센서 테스트 게임 초기화');
        
        // 기존 세션 정보가 있으면 즉시 표시
        if (this.state.sessionCode && this.state.sessionId) {
            console.log('🔄 기존 세션 정보 확인:', this.state.sessionCode);
            this.showSessionCode(this.state.sessionCode);
            
            // 강제 연결 상태 확인
            setTimeout(() => {
                if (!this.state.isConnected) {
                    console.log('⚠️ 5초 후에도 연결되지 않음, 강제 재연결 시도');
                    this.connect();
                }
            }, 5000);
        } else {
            console.log('❌ 게임 페이지에서 세션 정보를 찾을 수 없음!');
            console.log('🔍 현재 state:', this.state);
        }
        
        // 캔버스 설정
        this.setupCanvas();
        
        // SDK 콜백 등록
        this.setupCallbacks();
        
        // 테스트 환경 초기화
        this.initializeTestEnvironment();
        
        // 키보드 입력 설정 (시뮬레이션 모드)
        this.setupKeyboardControls();
        
        console.log('✅ 센서 테스트 초기화 완료');
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
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // 테스트 볼 초기 위치 설정 (방어 코드)
        if (this.visualElements && this.visualElements.ball) {
            this.visualElements.ball.x = rect.width / 2;
            this.visualElements.ball.y = rect.height / 2;
        }
    }
    
    /**
     * SDK 콜백 설정
     */
    setupCallbacks() {
        // 센서 데이터 수신 (센서 테스트를 위해 항상 처리)
        this.on('onSensorData', (data) => {
            // 센서 테스트 모드에서는 게임 상태와 관계없이 항상 처리
            this.handleSensorInput(data);
        });
        
        // 연결 상태 변경
        this.on('onConnectionChange', (isConnected) => {
            this.updateSensorStatus(isConnected);
        });
        
        // 세션 코드 생성
        this.on('onSessionCreated', (data) => {
            console.log('🔑 세션 이벤트 수신:', data.sessionCode, '복원여부:', data.restored);
            
            // 새 세션 생성인 경우에만 기존 세션 결래 확인
            if (!data.restored && this.state.sessionCode && this.state.sessionId && this.state.sessionCode !== data.sessionCode) {
                console.log('⚠️ 기존 세션과 다른 새 세션 생성 무시:', this.state.sessionCode, '->', data.sessionCode);
                return;
            }
            
            // 세션 코드 표시 (복원된 세션이라면 이미 표시되어 있으므로 업데이트)
            this.showSessionCode(data.sessionCode);
        });
        
        // 센서 연결
        this.on('onSensorConnected', (data) => {
            this.hideSessionCode();
            this.updateSensorStatus(true);
            this.showMessage('📱 센서 연결됨! 센서 테스트를 시작합니다.', 'success');
            
            // 센서 테스트를 위해 즉시 렌더링 시작 (게임 시작 없이)
            console.log('🎮 센서 연결됨 - 렌더링 시작');
            if (!this.gameLoopId) {
                this.startGameLoop();
            }
        });
        
        // 센서 연결 해제
        this.on('onSensorDisconnected', () => {
            this.updateSensorStatus(false);
            this.showMessage('📱 센서 연결 해제됨', 'warning');
        });
        
        // 보정 완료
        this.on('onCalibration', () => {
            this.showMessage('⚖️ 센서 보정 완료!', 'success');
        });
        
        // 오류 처리
        this.on('onError', (error) => {
            console.error('게임 오류:', error);
            this.showMessage('❌ 오류: ' + error.message, 'error');
        });
    }
    
    /**
     * 테스트 환경 초기화
     */
    initializeTestEnvironment() {
        // visualElements가 없으면 다시 초기화
        if (!this.visualElements) {
            this.visualElements = {
                ball: {
                    x: 0,
                    y: 0,
                    radius: 25,
                    color: '#ef4444',
                    trail: []
                },
                backgroundColor: '#0f172a',
                particles: [],
                sensorHistory: {
                    orientation: [],
                    accelerometer: [],
                    gyroscope: []
                }
            };
        }
        
        // 테스트 볼 궤적 초기화
        this.visualElements.ball.trail = [];
        
        // 파티클 초기화
        this.visualElements.particles = [];
        
        // 센서 히스토리 초기화
        this.visualElements.sensorHistory = {
            orientation: [],
            accelerometer: [],
            gyroscope: []
        };
        
        console.log('🧪 테스트 환경 초기화 완료');
    }
    
    /**
     * 초기 수집 아이템 생성
     */
    generateInitialCollectibles() {
        this.collectibles = [];
        const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
        
        for (let i = 0; i < 3; i++) {
            this.spawnCollectible(rect);
        }
    }
    
    /**
     * 수집 아이템 생성
     */
    spawnCollectible(rect) {
        this.collectibles.push({
            x: Math.random() * (rect.width - 40) + 20,
            y: Math.random() * (rect.height - 40) + 20,
            width: 20,
            height: 20,
            color: '#10b981',
            collected: false,
            pulse: Math.random() * Math.PI * 2,
            value: 100,
            type: 'normal'
        });
    }
    
    /**
     * 장애물 생성
     */
    spawnObstacle(rect) {
        this.obstacles.push({
            x: Math.random() * (rect.width - 60) + 30,
            y: Math.random() * (rect.height - 60) + 30,
            width: 40,
            height: 40,
            color: '#ef4444',
            speed: Math.random() * 2 + 1,
            direction: Math.random() * Math.PI * 2
        });
    }
    
    /**
     * 키보드 컨트롤 설정
     */
    setupKeyboardControls() {
        this.keys = {};
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // 특수 키 처리
            switch (e.code) {
                case 'KeyR':
                    this.calibrate();
                    break;
                case 'KeyP':
                    this.pause();
                    break;
                case 'Escape':
                    this.pause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    /**
     * 게임 시작
     */
    start() {
        if (this.gameState.isPlaying) return;
        
        this.gameState.isPlaying = true;
        this.gameState.isPaused = false;
        this.gameState.gameStartTime = Date.now();
        this.updateGameStatus('게임 진행 중...');
        
        console.log('🚀 게임 시작 - 상태:', {
            isPlaying: this.gameState.isPlaying,
            isPaused: this.gameState.isPaused,
            hasCanvas: !!this.canvas,
            hasCtx: !!this.ctx
        });
        
        // 게임 루프 시작
        this.startGameLoop();
        
        console.log('✅ 게임 루프 시작됨');
        
        // 테스트 볼 초기 위치 설정
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            this.visualElements.ball.x = rect.width / 2;
            this.visualElements.ball.y = rect.height / 2;
            console.log('🎾 테스트 볼 위치 설정:', this.visualElements.ball);
        }
    }
    
    /**
     * 게임 정지/재개
     */
    pause() {
        if (!this.gameState.isPlaying) return;
        
        this.gameState.isPaused = !this.gameState.isPaused;
        this.updateGameStatus(this.gameState.isPaused ? '일시 정지' : '게임 진행 중...');
        
        if (!this.gameState.isPaused) {
            this.startGameLoop();
        }
    }
    
    /**
     * 게임 재시작
     */
    restart() {
        // 게임 루프 중지
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // 상태 초기화
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            score: 0,
            level: 1,
            lives: 3,
            timeLeft: 60,
            gameStartTime: 0
        };
        
        // 플레이어 객체 초기화
        const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
        this.player = {
            x: rect.width / 2,
            y: rect.height / 2,
            velocity: { x: 0, y: 0 },
            trail: [],
            radius: 20,
            color: '#3b82f6'
        };
        
        // 게임 객체들 초기화
        this.collectibles = [];
        this.obstacles = [];
        this.particles = [];
        
        // 게임 월드 재생성
        this.initializeGameWorld();
        
        // UI 업데이트
        this.updateScore();
        this.updateGameStatus('게임 재시작됨');
        
        console.log('🔄 게임 재시작');
    }
    
    /**
     * 센서 입력 처리 - 모든 센서 데이터 시각화
     */
    handleSensorInput(data) {
        const { gameInput, rawData, sensorType } = data;
        this.sensorTest.lastUpdate = Date.now();
        
        console.log('📱 센서 데이터 수신:', { gameInput, sensorType });
        
        // 1. 방향 센서 (기울기) - 빨간 볼 이동
        if (gameInput.tilt) {
            this.sensorTest.orientation.tilt = gameInput.tilt;
            
            // 볼 이동 (화면 전체를 활용)
            const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
            this.visualElements.ball.x += gameInput.tilt.x * this.config.ballSpeed;
            this.visualElements.ball.y += gameInput.tilt.y * this.config.ballSpeed;
            
            // 경계 처리
            this.visualElements.ball.x = this.clamp(this.visualElements.ball.x, 
                this.visualElements.ball.radius, 
                rect.width - this.visualElements.ball.radius);
            this.visualElements.ball.y = this.clamp(this.visualElements.ball.y, 
                this.visualElements.ball.radius, 
                rect.height - this.visualElements.ball.radius);
        }
        
        // 2. 가속도계 - 파티클 효과
        if (gameInput.movement) {
            this.sensorTest.accelerometer = gameInput.movement;
            
            // 가속도 강도 계산
            const intensity = Math.sqrt(
                gameInput.movement.x * gameInput.movement.x + 
                gameInput.movement.y * gameInput.movement.y + 
                gameInput.movement.z * gameInput.movement.z
            );
            
            this.sensorTest.maxValues.accel = Math.max(this.sensorTest.maxValues.accel, intensity);
        }
        
        // 3. 흔들기 감지 - 파티클 폭발
        if (gameInput.shake && gameInput.shake.detected) {
            this.sensorTest.accelerometer.shake = true;
            this.createTestParticles(
                this.visualElements.ball.x, 
                this.visualElements.ball.y, 
                '#fbbf24', 
                Math.min(gameInput.shake.intensity, 20)
            );
            
            setTimeout(() => {
                this.sensorTest.accelerometer.shake = false;
            }, 200);
        }
        
        // 4. 자이로스코프 - 배경 색상 변경
        if (gameInput.rotation) {
            this.sensorTest.gyroscope = gameInput.rotation;
            
            const gyroIntensity = Math.sqrt(
                gameInput.rotation.x * gameInput.rotation.x + 
                gameInput.rotation.y * gameInput.rotation.y + 
                gameInput.rotation.z * gameInput.rotation.z
            );
            
            this.sensorTest.maxValues.gyro = Math.max(this.sensorTest.maxValues.gyro, gyroIntensity);
            
            // 배경 색상 변경
            this.updateBackgroundColor(gyroIntensity);
        }
        
        // 센서 히스토리 업데이트
        this.updateSensorHistory(gameInput);
        
        // 볼 궤적 추가
        this.addBallTrail();
    }
    
    /**
     * 키보드 입력 처리 (시뮬레이션 모드)
     */
    handleKeyboardInput() {
        if (!this.state.sensorConnected) {
            // 센서가 연결되지 않았을 때만 키보드 시뮬레이션
            let moveX = 0;
            let moveY = 0;
            
            // WASD로 볼 이동
            if (this.keys['KeyA']) moveX -= this.config.ballSpeed;
            if (this.keys['KeyD']) moveX += this.config.ballSpeed;
            if (this.keys['KeyW']) moveY -= this.config.ballSpeed;
            if (this.keys['KeyS']) moveY += this.config.ballSpeed;
            
            if (moveX !== 0 || moveY !== 0) {
                this.visualElements.ball.x += moveX;
                this.visualElements.ball.y += moveY;
                
                // 경계 처리
                const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
                this.visualElements.ball.x = this.clamp(this.visualElements.ball.x, 
                    this.visualElements.ball.radius, 
                    rect.width - this.visualElements.ball.radius);
                this.visualElements.ball.y = this.clamp(this.visualElements.ball.y, 
                    this.visualElements.ball.radius, 
                    rect.height - this.visualElements.ball.radius);
                
                this.addBallTrail();
            }
            
            // 스페이스바로 파티클 테스트
            if (this.keys['Space']) {
                this.createTestParticles(
                    this.visualElements.ball.x, 
                    this.visualElements.ball.y, 
                    '#fbbf24', 
                    10
                );
            }
            
            // 화살표로 배경 색상 테스트
            if (this.keys['ArrowLeft'] || this.keys['ArrowRight'] || 
                this.keys['ArrowUp'] || this.keys['ArrowDown']) {
                this.updateBackgroundColor(5);
            }
        }
    }
    
    /**
     * 센서 히스토리 업데이트
     */
    updateSensorHistory(gameInput) {
        const history = this.visualElements.sensorHistory;
        const maxLength = this.config.historyLength;
        
        // 방향 센서 히스토리
        if (gameInput.tilt) {
            history.orientation.push({
                timestamp: Date.now(),
                x: gameInput.tilt.x,
                y: gameInput.tilt.y
            });
            if (history.orientation.length > maxLength) {
                history.orientation.shift();
            }
        }
        
        // 가속도계 히스토리
        if (gameInput.movement) {
            const intensity = Math.sqrt(
                gameInput.movement.x * gameInput.movement.x + 
                gameInput.movement.y * gameInput.movement.y + 
                gameInput.movement.z * gameInput.movement.z
            );
            history.accelerometer.push({
                timestamp: Date.now(),
                intensity: intensity,
                data: { ...gameInput.movement }
            });
            if (history.accelerometer.length > maxLength) {
                history.accelerometer.shift();
            }
        }
        
        // 자이로스코프 히스토리
        if (gameInput.rotation) {
            const intensity = Math.sqrt(
                gameInput.rotation.x * gameInput.rotation.x + 
                gameInput.rotation.y * gameInput.rotation.y + 
                gameInput.rotation.z * gameInput.rotation.z
            );
            history.gyroscope.push({
                timestamp: Date.now(),
                intensity: intensity,
                data: { ...gameInput.rotation }
            });
            if (history.gyroscope.length > maxLength) {
                history.gyroscope.shift();
            }
        }
    }
    
    /**
     * 배경 색상 업데이트 (자이로스코프 반응)
     */
    updateBackgroundColor(gyroIntensity) {
        // 자이로스코프 강도에 따라 배경 색상 변경
        const normalized = Math.min(gyroIntensity / 10, 1); // 0-1 범위로 정규화
        
        const colors = {
            r: Math.floor(15 + normalized * 100),  // 15-115
            g: Math.floor(23 + normalized * 80),   // 23-103
            b: Math.floor(42 + normalized * 120)   // 42-162
        };
        
        this.visualElements.backgroundColor = `rgb(${colors.r}, ${colors.g}, ${colors.b})`;
    }
    
    /**
     * 볼 궤적 추가
     */
    addBallTrail() {
        this.visualElements.ball.trail.push({
            x: this.visualElements.ball.x,
            y: this.visualElements.ball.y,
            life: 30,
            timestamp: Date.now()
        });
        
        // 오래된 궤적 제거
        this.visualElements.ball.trail = this.visualElements.ball.trail.filter(point => point.life-- > 0);
        if (this.visualElements.ball.trail.length > 50) {
            this.visualElements.ball.trail.shift();
        }
    }
    
    /**
     * 테스트 파티클 생성
     */
    createTestParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.visualElements.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: this.config.particleLifetime,
                color: color,
                size: Math.random() * 6 + 3
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
            // 센서 테스트를 위해 게임 상태와 관계없이 항상 렌더링
            this.update(currentTime);
            this.render();
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
        
        // FPS 계산
        this.updateFPS(currentTime);
        
        // 키보드 입력 처리
        this.handleKeyboardInput();
        
        // 물리 계산
        this.updatePhysics();
        
        // 게임 객체 업데이트
        this.updateGameObjects();
        
        // 충돌 감지
        this.checkCollisions();
        
        // 파티클 업데이트
        this.updateParticles();
        
        // 게임 로직 업데이트
        this.updateGameLogic();
        
        // 새로운 객체 생성
        this.spawnNewObjects();
    }
    
    /**
     * FPS 계산
     */
    updateFPS(currentTime) {
        this.stats.frameCount++;
        
        if (currentTime - this.stats.lastFpsUpdate >= 1000) {
            this.stats.fps = Math.round(this.stats.frameCount * 1000 / (currentTime - this.stats.lastFpsUpdate));
            this.stats.frameCount = 0;
            this.stats.lastFpsUpdate = currentTime;
        }
    }
    
    /**
     * 물리 계산
     */
    updatePhysics() {
        // player 객체가 없거나 velocity가 없으면 초기화
        if (!this.player || !this.player.velocity) {
            const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
            this.player = {
                x: rect.width / 2,
                y: rect.height / 2,
                velocity: { x: 0, y: 0 },
                trail: [],
                radius: 20,
                color: '#3b82f6'
            };
            console.log('⚠️ updatePhysics에서 player 객체 재초기화');
            return;
        }
        
        const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
        
        // 속도 제한
        const maxSpeed = this.config.maxSpeed;
        this.player.velocity.x = this.clamp(this.player.velocity.x, -maxSpeed, maxSpeed);
        this.player.velocity.y = this.clamp(this.player.velocity.y, -maxSpeed, maxSpeed);
        
        // 마찰 적용
        this.player.velocity.x *= this.config.friction;
        this.player.velocity.y *= this.config.friction;
        
        // 위치 업데이트
        this.player.x += this.player.velocity.x;
        this.player.y += this.player.velocity.y;
        
        // 플레이어 궤적 추가
        this.player.trail.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            life: 30
        });
        
        // 오래된 궤적 제거
        this.player.trail = this.player.trail.filter(point => point.life-- > 0);
        if (this.player.trail.length > 50) {
            this.player.trail.shift();
        }
        
        // 경계 충돌
        if (this.player.x < 0) {
            this.player.x = 0;
            this.player.velocity.x *= -this.config.boundaryBounce;
        }
        if (this.player.x > rect.width - this.player.width) {
            this.player.x = rect.width - this.player.width;
            this.player.velocity.x *= -this.config.boundaryBounce;
        }
        if (this.player.y < 0) {
            this.player.y = 0;
            this.player.velocity.y *= -this.config.boundaryBounce;
        }
        if (this.player.y > rect.height - this.player.height) {
            this.player.y = rect.height - this.player.height;
            this.player.velocity.y *= -this.config.boundaryBounce;
        }
    }
    
    /**
     * 게임 객체 업데이트
     */
    updateGameObjects() {
        const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
        
        // 수집 아이템 애니메이션
        this.collectibles.forEach(item => {
            if (!item.collected) {
                item.pulse += 0.1;
            }
        });
        
        // 장애물 이동
        this.obstacles.forEach(obstacle => {
            obstacle.x += Math.cos(obstacle.direction) * obstacle.speed;
            obstacle.y += Math.sin(obstacle.direction) * obstacle.speed;
            
            // 경계에서 반사
            if (obstacle.x < 0 || obstacle.x > rect.width - obstacle.width) {
                obstacle.direction = Math.PI - obstacle.direction;
            }
            if (obstacle.y < 0 || obstacle.y > rect.height - obstacle.height) {
                obstacle.direction = -obstacle.direction;
            }
        });
    }
    
    /**
     * 충돌 감지
     */
    checkCollisions() {
        // 수집 아이템 충돌
        this.collectibles.forEach((item, index) => {
            if (!item.collected && this.isColliding(this.player, item)) {
                item.collected = true;
                this.addScore(item.value);
                this.createParticles(item.x + item.width / 2, item.y + item.height / 2, item.color, 8);
                
                // 수집된 아이템 제거
                setTimeout(() => {
                    this.collectibles.splice(index, 1);
                }, 100);
            }
        });
        
        // 장애물 충돌
        this.obstacles.forEach(obstacle => {
            if (this.isColliding(this.player, obstacle)) {
                this.handleObstacleCollision(obstacle);
            }
        });
    }
    
    /**
     * 충돌 감지 함수
     */
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * 장애물 충돌 처리
     */
    handleObstacleCollision(obstacle) {
        // 플레이어를 장애물에서 밀어냄
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        const dx = playerCenterX - centerX;
        const dy = playerCenterY - centerY;
        
        const pushPower = 8;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.player.velocity.x = dx > 0 ? pushPower : -pushPower;
        } else {
            this.player.velocity.y = dy > 0 ? pushPower : -pushPower;
        }
        
        // 파티클 효과
        this.createParticles(this.player.x + this.player.width / 2, 
                           this.player.y + this.player.height / 2, 
                           '#ef4444', 5);
        
        // 점수 감소
        this.addScore(-50);
    }
    
    /**
     * 게임 로직 업데이트
     */
    updateGameLogic() {
        // 레벨업 조건 확인
        if (this.gameState.score > this.gameState.level * 1000) {
            this.levelUp();
        }
        
        // 게임 오버 조건 확인
        if (this.gameState.lives <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * 새로운 객체 생성
     */
    spawnNewObjects() {
        const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
        
        // 수집 아이템 생성
        if (Math.random() < this.config.collectibleSpawnRate && this.collectibles.length < 5) {
            this.spawnCollectible(rect);
        }
        
        // 장애물 생성 (레벨이 높을수록 더 많이)
        const obstacleChance = this.config.obstacleSpawnRate * this.gameState.level;
        if (Math.random() < obstacleChance && this.obstacles.length < 3) {
            this.spawnObstacle(rect);
        }
    }
    
    /**
     * 파티클 시스템
     */
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: this.config.particleLifetime,
                color: color,
                size: Math.random() * 4 + 2
            });
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
            particle.size *= 0.97;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.visualElements.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 주변 아이템 수집
     */
    collectNearbyItems() {
        const collectRadius = 100;
        
        this.collectibles.forEach(item => {
            if (!item.collected) {
                const dx = (item.x + item.width / 2) - (this.player.x + this.player.width / 2);
                const dy = (item.y + item.height / 2) - (this.player.y + this.player.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < collectRadius) {
                    item.collected = true;
                    this.addScore(item.value);
                    this.createParticles(item.x + item.width / 2, item.y + item.height / 2, item.color, 5);
                }
            }
        });
    }
    
    /**
     * 센서 테스트 렌더링
     */
    render() {
        if (!this.ctx || !this.canvas) {
            console.log('❌ 렌더링 불가:', { hasCtx: !!this.ctx, hasCanvas: !!this.canvas });
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        
        // 배경 청소 (자이로스코프 반응 색상)
        this.ctx.fillStyle = this.visualElements.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 렌더링 카운터 (디버깅)
        if (!this.renderCount) this.renderCount = 0;
        this.renderCount++;
        if (this.renderCount % 60 === 1) { // 1초마다 한 번씩 로그
            console.log('🎨 렌더링 중:', this.renderCount, '프레임');
        }
        
        // 렌더링 순서
        this.renderBallTrail();
        this.renderTestBall();
        this.renderParticles();
        this.renderSensorData();
        this.renderInstructions();
        
        // 디버그 모드
        if (this.config.showDebug) {
            this.renderDebugInfo();
        }
    }
    
    /**
     * 테스트 볼 궤적 렌더링
     */
    renderBallTrail() {
        const trail = this.visualElements.ball.trail;
        if (trail.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(trail[0].x, trail[0].y);
        
        for (let i = 1; i < trail.length; i++) {
            const point = trail[i];
            const alpha = point.life / 30;
            this.ctx.globalAlpha = alpha * 0.6;
            this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * 메인 테스트 볼 렌더링
     */
    renderTestBall() {
        const ball = this.visualElements.ball;
        
        this.ctx.save();
        
        // 그림자
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x + 3, ball.y + 3, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 볼 메인 (그라디언트)
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
        gradient.addColorStop(1, '#7f1d1d');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 강조 테두리
        this.ctx.strokeStyle = '#dc2626';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 하이라이트
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x - ball.radius * 0.4, ball.y - ball.radius * 0.4, ball.radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 수집 아이템 렌더링
     */
    renderCollectibles() {
        this.collectibles.forEach(item => {
            if (item.collected) return;
            
            this.ctx.save();
            
            // 펄스 효과
            const scale = 1 + Math.sin(item.pulse) * 0.2;
            const size = item.width * scale;
            const x = item.x - (size - item.width) / 2;
            const y = item.y - (size - item.height) / 2;
            
            // 발광 효과
            this.ctx.shadowColor = item.color;
            this.ctx.shadowBlur = 15;
            
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(x, y, size, size);
            
            // 내부 하이라이트
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.3, size * 0.3);
            
            this.ctx.restore();
        });
    }
    
    /**
     * 장애물 렌더링
     */
    renderObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            
            // 그림자
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(
                obstacle.x + 3,
                obstacle.y + 3,
                obstacle.width,
                obstacle.height
            );
            
            // 장애물 메인
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // 경고 테두리
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(obstacle.x + 2, obstacle.y + 2, obstacle.width - 4, obstacle.height - 4);
            
            this.ctx.restore();
        });
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
            this.ctx.shadowBlur = 8;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    /**
     * 센서 데이터 렌더링
     */
    renderSensorData() {
        const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '14px Arial, sans-serif';
        
        let y = 30;
        const lineHeight = 22;
        
        // 센서 상태 표시
        const isConnected = this.state.sensorConnected;
        this.ctx.fillStyle = isConnected ? '#10b981' : '#f59e0b';
        this.ctx.fillText(`센서 상태: ${isConnected ? '📱 연결됨' : '⌨️ 키보드 모드'}`, 20, y);
        y += lineHeight;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        // 방향 센서 데이터
        this.ctx.fillText(`방향 센서 (기울기):`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  X: ${this.sensorTest.orientation.tilt.x.toFixed(2)}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  Y: ${this.sensorTest.orientation.tilt.y.toFixed(2)}`, 20, y);
        y += lineHeight + 5;
        
        // 가속도계 데이터
        this.ctx.fillText(`가속도계 (흔들기):`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  X: ${this.sensorTest.accelerometer.x.toFixed(2)}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  Y: ${this.sensorTest.accelerometer.y.toFixed(2)}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  Z: ${this.sensorTest.accelerometer.z.toFixed(2)}`, 20, y);
        y += lineHeight;
        
        this.ctx.fillStyle = this.sensorTest.accelerometer.shake ? '#ef4444' : 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText(`  흔들기: ${this.sensorTest.accelerometer.shake ? '감지됨!' : '없음'}`, 20, y);
        y += lineHeight + 5;
        
        // 자이로스코프 데이터
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText(`자이로스코프 (회전):`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  X: ${this.sensorTest.gyroscope.x.toFixed(2)}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  Y: ${this.sensorTest.gyroscope.y.toFixed(2)}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  Z: ${this.sensorTest.gyroscope.z.toFixed(2)}`, 20, y);
        y += lineHeight + 5;
        
        // 최대값 표시
        this.ctx.fillText(`최대 값:`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  가속도: ${this.sensorTest.maxValues.accel.toFixed(2)}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`  자이로: ${this.sensorTest.maxValues.gyro.toFixed(2)}`, 20, y);
        
        this.ctx.restore();
    }
    
    /**
     * 사용 지침 렌더링
     */
    renderInstructions() {
        const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '16px Arial, sans-serif';
        this.ctx.textAlign = 'right';
        
        let y = rect.height - 150;
        const lineHeight = 22;
        
        if (this.state.sensorConnected) {
            // 센서 모드 지침
            this.ctx.fillText('📱 센서 모드:', rect.width - 20, y);
            y += lineHeight;
            this.ctx.fillText('기기 기울이기 → 빨간 볼 이동', rect.width - 20, y);
            y += lineHeight;
            this.ctx.fillText('흔들기 → 파티클 효과', rect.width - 20, y);
            y += lineHeight;
            this.ctx.fillText('회전 → 배경 색상 변경', rect.width - 20, y);
        } else {
            // 키보드 모드 지침
            this.ctx.fillText('⌨️ 키보드 모드:', rect.width - 20, y);
            y += lineHeight;
            this.ctx.fillText('WASD → 빨간 볼 이동', rect.width - 20, y);
            y += lineHeight;
            this.ctx.fillText('스페이스바 → 파티클 효과', rect.width - 20, y);
            y += lineHeight;
            this.ctx.fillText('화살표 → 배경 색상 변경', rect.width - 20, y);
        }
        
        y += lineHeight + 10;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '14px Arial, sans-serif';
        this.ctx.fillText('R → 센서 보정 | P → 일시정지', rect.width - 20, y);
        
        this.ctx.restore();
    }
    
    /**
     * 디버그 정보 렌더링
     */
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px monospace';
        
        const debugInfo = [
            `FPS: ${this.stats.fps}`,
            `Score: ${this.gameState.score}`,
            `Level: ${this.gameState.level}`,
            `Collectibles: ${this.collectibles.length}`,
            `Obstacles: ${this.obstacles.length}`,
            `Particles: ${this.particles.length}`,
            `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
            `Velocity: (${this.player.velocity.x.toFixed(1)}, ${this.player.velocity.y.toFixed(1)})`
        ];
        
        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 10, 20 + index * 15);
        });
        
        this.ctx.restore();
    }
    
    /**
     * 점수 추가
     */
    addScore(points) {
        this.gameState.score = Math.max(0, this.gameState.score + points);
        this.updateScore();
    }
    
    /**
     * 레벨업
     */
    levelUp() {
        this.gameState.level++;
        this.addScore(500); // 레벨업 보너스
        this.showMessage(`🎉 레벨 ${this.gameState.level}!`, 'success');
        
        // 게임 속도 증가
        this.config.collectibleSpawnRate *= 1.1;
        this.config.obstacleSpawnRate *= 1.2;
        
        console.log(`🆙 레벨업: ${this.gameState.level}`);
    }
    
    /**
     * 게임 오버
     */
    gameOver() {
        this.gameState.isPlaying = false;
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        console.log(`💀 게임 오버 - 최종 점수: ${this.gameState.score}`);
        
        // 게임 오버 화면 표시
        if (typeof window.showGameOver === 'function') {
            window.showGameOver(this.gameState.score);
        }
    }
    
    // ========== UI 업데이트 메서드들 ==========
    
    /**
     * 점수 업데이트
     */
    updateScore() {
        const scoreElement = document.getElementById('scoreValue');
        if (scoreElement) {
            scoreElement.textContent = this.gameState.score;
        }
    }
    
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
                statusElement.textContent = '⌨️ 키보드 모드 (WASD)';
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
     * 메시지 표시
     */
    showMessage(message, type = 'info') {
        console.log(`📢 ${message}`);
        // 실제 게임에서는 토스트 알림 또는 게임 내 메시지 시스템 구현
    }
    
    /**
     * 유틸리티 함수 - 값 제한
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
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
        
        console.log('🗑️ 게임 정리 완료');
    }
}

// 게임 인스턴스 생성 및 초기화 (즉시 실행)
console.log('🧪 센서 테스트 게임 로딩 완료');

try {
    console.log('🚀 게임 인스턴스 생성 시도...');
    window.gameInstance = new SensorTestGame();
    window.game = window.gameInstance; // 호환성을 위한 별칭
    
    console.log('✅ 센서 테스트 게임 인스턴스 생성 완료');
    console.log('🔗 인스턴스 연결 상태:', window.gameInstance.state.isConnected);
} catch (error) {
    console.error('❌ 센서 테스트 게임 초기화 실패:', error);
    console.error('❌ 오류 상세:', error.stack);
}