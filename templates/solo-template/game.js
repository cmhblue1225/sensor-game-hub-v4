/**
 * 솔로 게임 템플릿 v4.0
 * 개발자들이 쉽게 확장할 수 있는 기본 게임 구조
 */

class SoloGameTemplate extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'solo-template',
            gameName: '솔로 게임 템플릿',
            gameType: 'solo',
            version: '1.0.0',
            
            // 센서 설정
            sensorTypes: ['orientation', 'accelerometer'],
            multiSensor: false, // 단일 센서 사용
            sensorSensitivity: {
                orientation: 0.8,
                accelerometer: 0.5,
                gyroscope: 0.3
            },
            
            // 데이터 처리 설정
            smoothingFactor: 3,
            deadzone: 0.1,
            updateRate: 60
        });
        
        // 게임 상태
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            score: 0,
            level: 1,
            lives: 3,
            timeLeft: 60,
            gameStartTime: 0
        };
        
        // 게임 객체들
        this.player = {
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            velocity: { x: 0, y: 0 },
            color: '#6366f1',
            trail: [] // 플레이어 이동 궤적
        };
        
        this.collectibles = [];
        this.obstacles = [];
        this.particles = [];
        
        // 게임 설정
        this.config = {
            playerSpeed: 5,
            maxSpeed: 15,
            friction: 0.95,
            boundaryBounce: 0.8,
            collectibleSpawnRate: 0.02,
            obstacleSpawnRate: 0.01,
            particleLifetime: 60
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
        console.log('🎮 솔로 게임 템플릿 초기화');
        
        // 캔버스 설정
        this.setupCanvas();
        
        // SDK 콜백 등록
        this.setupCallbacks();
        
        // 게임 월드 초기화
        this.initializeGameWorld();
        
        // 키보드 입력 설정 (시뮬레이션 모드)
        this.setupKeyboardControls();
        
        console.log('✅ 게임 초기화 완료');
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
        
        // 플레이어 초기 위치 설정
        this.player.x = rect.width / 2;
        this.player.y = rect.height / 2;
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
            this.showSessionCode(data.sessionCode);
        });
        
        // 센서 연결
        this.on('onSensorConnected', (data) => {
            this.hideSessionCode();
            this.updateSensorStatus(true);
            this.showMessage('📱 센서 연결됨! 게임을 시작하세요.', 'success');
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
     * 게임 월드 초기화
     */
    initializeGameWorld() {
        // 초기 수집 아이템 생성
        this.generateInitialCollectibles();
        
        // 플레이어 궤적 초기화
        this.player.trail = [];
        
        console.log('🌍 게임 월드 초기화 완료');
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
        
        // 게임 루프 시작
        this.startGameLoop();
        
        console.log('🚀 게임 시작');
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
        
        // 플레이어 위치 초기화
        const rect = this.canvas?.getBoundingClientRect() || { width: 800, height: 600 };
        this.player.x = rect.width / 2;
        this.player.y = rect.height / 2;
        this.player.velocity = { x: 0, y: 0 };
        this.player.trail = [];
        
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
     * 센서 입력 처리
     */
    handleSensorInput(data) {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        const { gameInput, sensorType } = data;
        
        // 주 센서의 기울기로 플레이어 이동
        if (sensorType === 'primary' && gameInput.tilt) {
            this.player.velocity.x += gameInput.tilt.x * this.config.playerSpeed;
            this.player.velocity.y += gameInput.tilt.y * this.config.playerSpeed;
        }
        
        // 흔들기로 특수 액션
        if (gameInput.shake && gameInput.shake.detected) {
            this.triggerSpecialAction();
        }
        
        // 제스처 감지
        if (gameInput.gesture) {
            this.handleGesture(gameInput.gesture);
        }
    }
    
    /**
     * 키보드 입력 처리 (시뮬레이션 모드)
     */
    handleKeyboardInput() {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        let forceX = 0;
        let forceY = 0;
        
        // 방향키 또는 WASD
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) forceX -= this.config.playerSpeed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) forceX += this.config.playerSpeed;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) forceY -= this.config.playerSpeed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) forceY += this.config.playerSpeed;
        
        this.player.velocity.x += forceX;
        this.player.velocity.y += forceY;
        
        // 스페이스바로 특수 액션
        if (this.keys['Space']) {
            this.triggerSpecialAction();
        }
    }
    
    /**
     * 특수 액션 트리거
     */
    triggerSpecialAction() {
        // 파티클 효과 생성
        this.createParticles(this.player.x + this.player.width / 2, 
                           this.player.y + this.player.height / 2, 
                           '#f59e0b', 15);
        
        // 점수 추가
        this.addScore(50);
        
        // 주변 수집 아이템 자동 수집
        this.collectNearbyItems();
        
        console.log('✨ 특수 액션 발동!');
    }
    
    /**
     * 제스처 처리
     */
    handleGesture(gesture) {
        switch (gesture.type) {
            case 'swipe':
                // 스와이프 방향으로 부스트
                const boostPower = 10;
                if (gesture.direction === 'left') this.player.velocity.x -= boostPower;
                if (gesture.direction === 'right') this.player.velocity.x += boostPower;
                if (gesture.direction === 'up') this.player.velocity.y -= boostPower;
                if (gesture.direction === 'down') this.player.velocity.y += boostPower;
                break;
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
                this.gameLoopId = requestAnimationFrame(gameLoop);
            }
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
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.size *= 0.98;
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
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
     * 렌더링
     */
    render() {
        if (!this.ctx || !this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        
        // 화면 지우기
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, rect.width, rect.height);
        
        // 배경 그라디언트
        const gradient = this.ctx.createLinearGradient(0, 0, rect.width, rect.height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, rect.width, rect.height);
        
        // 플레이어 궤적 렌더링
        this.renderPlayerTrail();
        
        // 수집 아이템 렌더링
        this.renderCollectibles();
        
        // 장애물 렌더링
        this.renderObstacles();
        
        // 플레이어 렌더링
        this.renderPlayer();
        
        // 파티클 렌더링
        this.renderParticles();
        
        // 디버그 정보 렌더링 (개발 모드)
        if (this.config.showDebug) {
            this.renderDebugInfo();
        }
    }
    
    /**
     * 플레이어 궤적 렌더링
     */
    renderPlayerTrail() {
        if (this.player.trail.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.trail[0].x, this.player.trail[0].y);
        
        for (let i = 1; i < this.player.trail.length; i++) {
            const point = this.player.trail[i];
            const alpha = point.life / 30;
            this.ctx.globalAlpha = alpha * 0.5;
            this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * 플레이어 렌더링
     */
    renderPlayer() {
        this.ctx.save();
        
        // 그림자
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(
            this.player.x + 3,
            this.player.y + 3,
            this.player.width,
            this.player.height
        );
        
        // 플레이어 메인
        const gradient = this.ctx.createRadialGradient(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            0,
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            this.player.width / 2
        );
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, this.player.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 하이라이트
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(
            this.player.x + 5,
            this.player.y + 5,
            this.player.width - 10,
            8
        );
        
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
        this.particles.forEach(particle => {
            this.ctx.save();
            
            this.ctx.globalAlpha = particle.life / this.config.particleLifetime;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
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

// 게임 인스턴스 생성
let game;

// DOM 로드 완료 시 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 솔로 게임 템플릿 로딩 완료');
    
    try {
        game = new SoloGameTemplate();
        window.game = game; // 전역 접근용
        
        console.log('✅ 게임 인스턴스 생성 완료');
    } catch (error) {
        console.error('❌ 게임 초기화 실패:', error);
    }
});