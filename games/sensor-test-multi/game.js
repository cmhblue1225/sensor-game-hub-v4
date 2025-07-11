/**
 * 멀티플레이어 센서 테스트 게임 v4.0
 * 최대 4명이 함께 센서를 테스트하고 경쟁하는 게임
 */

class MultiplayerSensorTestGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'sensor-test-multi',
            gameName: '센서 테스트 (멀티)',
            gameType: 'multiplayer',
            version: '1.0.0',
            
            // 센서 설정 - 모든 센서 활성화
            sensorTypes: ['orientation', 'accelerometer', 'gyroscope'],
            multiSensor: false,
            sensorSensitivity: {
                orientation: 1.0,
                accelerometer: 1.0,
                gyroscope: 1.0
            },
            
            // 멀티플레이어 설정
            maxPlayers: 4,
            minPlayers: 2,
            
            // 데이터 처리 설정
            smoothingFactor: 1,
            deadzone: 0.05,
            updateRate: 60
        });
        
        // 게임 상태
        this.gameState = {
            isPlaying: false,
            isPaused: false,
            gameStartTime: 0,
            timeLeft: 180, // 3분
            winner: null
        };
        
        // 멀티플레이어 플레이어 관리
        this.players = new Map();
        this.playerColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b']; // player1~4 색상
        
        // 내 플레이어 정보
        this.myPlayer = {
            id: null,
            nickname: 'Player',
            score: 0,
            position: { x: 0, y: 0 },
            color: '#6366f1',
            sensorActivity: {
                orientation: 0,
                accelerometer: 0,
                gyroscope: 0,
                total: 0
            },
            trail: [],
            particles: []
        };
        
        // 렌더링
        this.canvas = null;
        this.ctx = null;
        this.lastFrameTime = 0;
        this.gameLoopId = null;
        
        // 센서 테스트 데이터
        this.sensorTest = {
            lastUpdate: 0,
            maxValues: { accel: 0, gyro: 0 }
        };
        
        // 게임 타이머
        this.gameTimer = null;
        
        this.init();
    }
    
    /**
     * 게임 초기화
     */
    init() {
        console.log('🧪 멀티플레이어 센서 테스트 게임 초기화');
        
        // URL 파라미터에서 세션 정보 추출
        const urlParams = new URLSearchParams(window.location.search);
        const sessionCode = urlParams.get('sessionCode');
        const sessionId = urlParams.get('sessionId');
        
        if (sessionCode && sessionId) {
            console.log('🔄 기존 세션 복원:', sessionCode);
            this.state.sessionCode = sessionCode;
            this.state.sessionId = sessionId;
            
            // 기존 세션 코드 즉시 표시
            this.showSessionCode(sessionCode);
            
            // 서버에 기존 세션 복원 요청
            setTimeout(() => {
                console.log('🔄 기존 세션으로 룸 생성 시작...');
                this.createRoom('sensor-test-multi', '센서 테스트 룸');
            }, 1000);
        }
        
        // 캔버스 설정
        this.setupCanvas();
        
        // SDK 콜백 등록
        this.setupCallbacks();
        
        // 게임 월드 초기화
        this.initializeGameWorld();
        
        console.log('✅ 멀티플레이어 센서 테스트 게임 초기화 완료');
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
        
        // 내 플레이어 초기 위치 설정
        this.myPlayer.position.x = window.innerWidth / 2;
        this.myPlayer.position.y = window.innerHeight / 2;
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
            // 기존 세션이 있으면 새 세션 생성 무시
            if (this.state.sessionCode && this.state.sessionId) {
                console.log('🔄 기존 세션 있음, 새 세션 생성 무시');
                return;
            }
            
            this.showSessionCode(data.sessionCode);
            
            // 새 세션 생성 후 룸 생성 (멀티플레이어 게임)
            console.log('🆕 새 세션 생성 완료, 룸 생성 시작...');
            this.createRoom('sensor-test-multi', '센서 테스트 룸');
        });
        
        // 센서 연결
        this.on('onSensorConnected', (data) => {
            this.hideSessionCode();
            this.updateSensorStatus(true);
        });
        
        // 룸 생성 완료
        this.on('onRoomCreated', (data) => {
            console.log('🏠 룸 생성 완료:', data.roomId);
            // 대기실 표시
            if (typeof window.showLobby === 'function') {
                window.showLobby([]);
            }
        });
        
        // 플레이어 참가
        this.on('onPlayerJoined', (data) => {
            console.log('👥 플레이어 참가:', data.player);
            this.addPlayer(data.player);
            this.updateLobbyDisplay();
        });
        
        // 플레이어 퇴장
        this.on('onPlayerLeft', (data) => {
            console.log('👤 플레이어 퇴장:', data.sessionId);
            this.removePlayer(data.sessionId);
            this.updateLobbyDisplay();
        });
        
        // 게임 시작
        this.on('onGameStarted', (data) => {
            console.log('🚀 게임 시작!');
            this.startGameplay();
        });
        
        // 게임 이벤트 수신
        this.on('onGameEvent', (data) => {
            this.handleGameEvent(data);
        });
        
        // 룸 종료
        this.on('onRoomClosed', (data) => {
            console.log('🚪 룸 종료:', data.reason);
            window.location.href = '/';
        });
        
        // 오류 처리
        this.on('onError', (error) => {
            console.error('게임 오류:', error);
        });
    }
    
    /**
     * 게임 월드 초기화
     */
    initializeGameWorld() {
        // 내 플레이어 초기화
        this.myPlayer.trail = [];
        this.myPlayer.particles = [];
        this.myPlayer.score = 0;
        this.myPlayer.sensorActivity = {
            orientation: 0,
            accelerometer: 0,
            gyroscope: 0,
            total: 0
        };
        
        console.log('🌍 멀티플레이어 게임 월드 초기화 완료');
    }
    
    /**
     * 플레이어 추가
     */
    addPlayer(playerData) {
        const colorIndex = this.players.size % this.playerColors.length;
        const player = {
            id: playerData.sessionId,
            nickname: playerData.nickname || `Player ${this.players.size + 1}`,
            score: 0,
            position: { 
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                y: window.innerHeight / 2 + (Math.random() - 0.5) * 200
            },
            color: this.playerColors[colorIndex],
            sensorActivity: {
                orientation: 0,
                accelerometer: 0,
                gyroscope: 0,
                total: 0
            },
            trail: [],
            particles: [],
            isHost: playerData.isHost || false
        };
        
        this.players.set(playerData.sessionId, player);
        
        // 내가 참가한 경우
        if (playerData.sessionId === this.state.sessionId) {
            this.myPlayer = player;
        }
    }
    
    /**
     * 플레이어 제거
     */
    removePlayer(sessionId) {
        this.players.delete(sessionId);
    }
    
    /**
     * 대기실 UI 업데이트
     */
    updateLobbyDisplay() {
        const playerArray = Array.from(this.players.values());
        if (typeof window.showLobby === 'function') {
            window.showLobby(playerArray);
        }
        if (typeof window.updateScoreboard === 'function') {
            window.updateScoreboard(playerArray);
        }
    }
    
    /**
     * 게임플레이 시작
     */
    startGameplay() {
        this.gameState.isPlaying = true;
        this.gameState.gameStartTime = Date.now();
        this.gameState.timeLeft = 180; // 3분
        
        // 대기실 숨기기
        if (typeof window.hideLobby === 'function') {
            window.hideLobby();
        }
        
        // 게임 루프 시작
        this.startGameLoop();
        
        // 타이머 시작
        this.startGameTimer();
        
        this.updateGameStatus('게임 진행 중...');
    }
    
    /**
     * 게임 타이머 시작
     */
    startGameTimer() {
        this.gameTimer = setInterval(() => {
            this.gameState.timeLeft--;
            
            if (typeof window.updateTimer === 'function') {
                window.updateTimer(this.gameState.timeLeft);
            }
            
            if (this.gameState.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    /**
     * 게임 종료
     */
    endGame() {
        this.gameState.isPlaying = false;
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // 우승자 결정 (점수가 가장 높은 플레이어)
        const playerArray = Array.from(this.players.values());
        const sortedPlayers = playerArray.sort((a, b) => b.score - a.score);
        
        const results = {
            winner: sortedPlayers[0],
            scores: sortedPlayers.map((player, index) => ({
                nickname: player.nickname,
                score: player.score,
                isWinner: index === 0
            }))
        };
        
        // 결과 화면 표시
        if (typeof window.showResults === 'function') {
            window.showResults(results);
        }
        
        console.log('🏁 게임 종료. 우승자:', results.winner.nickname);
    }
    
    /**
     * 센서 입력 처리
     */
    handleSensorInput(data) {
        const { gameInput, sensorType } = data;
        this.sensorTest.lastUpdate = Date.now();
        
        let activityScore = 0;
        
        // 1. 방향 센서 (기울기) - 플레이어 이동
        if (gameInput.tilt) {
            const moveSpeed = 8;
            this.myPlayer.position.x += gameInput.tilt.x * moveSpeed;
            this.myPlayer.position.y += gameInput.tilt.y * moveSpeed;
            
            // 화면 경계 처리
            this.myPlayer.position.x = this.clamp(this.myPlayer.position.x, 25, window.innerWidth - 25);
            this.myPlayer.position.y = this.clamp(this.myPlayer.position.y, 25, window.innerHeight - 25);
            
            // 활동 점수 계산
            const tiltIntensity = Math.abs(gameInput.tilt.x) + Math.abs(gameInput.tilt.y);
            activityScore += tiltIntensity * 10;
            this.myPlayer.sensorActivity.orientation += tiltIntensity;
            
            // 궤적 추가
            this.addPlayerTrail();
        }
        
        // 2. 가속도계 - 파티클 효과 및 점수
        if (gameInput.movement) {
            const intensity = Math.sqrt(
                gameInput.movement.x * gameInput.movement.x + 
                gameInput.movement.y * gameInput.movement.y + 
                gameInput.movement.z * gameInput.movement.z
            );
            
            this.sensorTest.maxValues.accel = Math.max(this.sensorTest.maxValues.accel, intensity);
            activityScore += intensity * 5;
            this.myPlayer.sensorActivity.accelerometer += intensity;
        }
        
        // 3. 흔들기 감지 - 특별 파티클
        if (gameInput.shake && gameInput.shake.detected) {
            this.createPlayerParticles(
                this.myPlayer.position.x, 
                this.myPlayer.position.y, 
                this.myPlayer.color, 
                Math.min(gameInput.shake.intensity, 15)
            );
            
            activityScore += 50; // 흔들기 보너스
        }
        
        // 4. 자이로스코프 - 색상 변경 및 점수
        if (gameInput.rotation) {
            const gyroIntensity = Math.sqrt(
                gameInput.rotation.x * gameInput.rotation.x + 
                gameInput.rotation.y * gameInput.rotation.y + 
                gameInput.rotation.z * gameInput.rotation.z
            );
            
            this.sensorTest.maxValues.gyro = Math.max(this.sensorTest.maxValues.gyro, gyroIntensity);
            activityScore += gyroIntensity * 3;
            this.myPlayer.sensorActivity.gyroscope += gyroIntensity;
        }
        
        // 점수 업데이트
        if (activityScore > 0) {
            this.addScore(Math.floor(activityScore));
        }
        
        // 총 활동량 업데이트
        this.myPlayer.sensorActivity.total = 
            this.myPlayer.sensorActivity.orientation + 
            this.myPlayer.sensorActivity.accelerometer + 
            this.myPlayer.sensorActivity.gyroscope;
        
        // 다른 플레이어들에게 내 상태 전송
        this.sendGameEvent('player_update', {
            position: this.myPlayer.position,
            score: this.myPlayer.score,
            sensorActivity: this.myPlayer.sensorActivity
        });
    }
    
    /**
     * 게임 이벤트 처리
     */
    handleGameEvent(data) {
        const { sessionId, eventType, data: eventData } = data;
        
        switch (eventType) {
            case 'player_update':
                // 다른 플레이어 상태 업데이트
                if (this.players.has(sessionId)) {
                    const player = this.players.get(sessionId);
                    if (eventData.position) {
                        player.position = eventData.position;
                    }
                    if (eventData.score !== undefined) {
                        player.score = eventData.score;
                    }
                    if (eventData.sensorActivity) {
                        player.sensorActivity = eventData.sensorActivity;
                    }
                }
                break;
                
            case 'particle_effect':
                // 다른 플레이어의 파티클 효과
                if (this.players.has(sessionId)) {
                    const player = this.players.get(sessionId);
                    this.createPlayerParticles(
                        eventData.x || player.position.x,
                        eventData.y || player.position.y,
                        player.color,
                        eventData.count || 10
                    );
                }
                break;
        }
        
        // 스코어보드 업데이트
        const playerArray = Array.from(this.players.values());
        if (typeof window.updateScoreboard === 'function') {
            window.updateScoreboard(playerArray);
        }
    }
    
    /**
     * 플레이어 궤적 추가
     */
    addPlayerTrail() {
        this.myPlayer.trail.push({
            x: this.myPlayer.position.x,
            y: this.myPlayer.position.y,
            life: 30,
            timestamp: Date.now()
        });
        
        // 오래된 궤적 제거
        this.myPlayer.trail = this.myPlayer.trail.filter(point => point.life-- > 0);
        if (this.myPlayer.trail.length > 40) {
            this.myPlayer.trail.shift();
        }
    }
    
    /**
     * 플레이어 파티클 생성
     */
    createPlayerParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.myPlayer.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 120,
                color: color,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    /**
     * 점수 추가
     */
    addScore(points) {
        this.myPlayer.score += points;
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
            if (this.gameState.isPlaying) {
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
        
        // 파티클 업데이트
        this.updateParticles();
        
        // 다른 플레이어들의 궤적도 업데이트
        this.players.forEach(player => {
            if (player.trail) {
                player.trail = player.trail.filter(point => point.life-- > 0);
            }
        });
    }
    
    /**
     * 파티클 업데이트
     */
    updateParticles() {
        for (let i = this.myPlayer.particles.length - 1; i >= 0; i--) {
            const particle = this.myPlayer.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.size *= 0.97;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.myPlayer.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 렌더링
     */
    render() {
        if (!this.ctx || !this.canvas) return;
        
        // 배경 지우기
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        // 렌더링 순서
        this.renderAllPlayerTrails();
        this.renderAllPlayers();
        this.renderParticles();
        this.renderGameInfo();
    }
    
    /**
     * 모든 플레이어 궤적 렌더링
     */
    renderAllPlayerTrails() {
        this.players.forEach(player => {
            if (player.trail && player.trail.length > 1) {
                this.renderPlayerTrail(player);
            }
        });
    }
    
    /**
     * 플레이어 궤적 렌더링
     */
    renderPlayerTrail(player) {
        this.ctx.save();
        this.ctx.strokeStyle = player.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(player.trail[0].x, player.trail[0].y);
        
        for (let i = 1; i < player.trail.length; i++) {
            const point = player.trail[i];
            const alpha = point.life / 30;
            this.ctx.globalAlpha = alpha * 0.6;
            this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * 모든 플레이어 렌더링
     */
    renderAllPlayers() {
        this.players.forEach(player => {
            this.renderPlayer(player);
        });
    }
    
    /**
     * 플레이어 렌더링
     */
    renderPlayer(player) {
        const radius = 20;
        
        this.ctx.save();
        
        // 그림자
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(player.position.x + 3, player.position.y + 3, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 플레이어 메인 (그라디언트)
        const gradient = this.ctx.createRadialGradient(
            player.position.x - radius * 0.3,
            player.position.y - radius * 0.3,
            0,
            player.position.x,
            player.position.y,
            radius
        );
        
        // 색상 밝기 조정
        const color = player.color;
        const lightColor = this.lightenColor(color, 0.3);
        const darkColor = this.darkenColor(color, 0.3);
        
        gradient.addColorStop(0, lightColor);
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, darkColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(player.position.x, player.position.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 테두리
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 하이라이트
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(player.position.x - radius * 0.4, player.position.y - radius * 0.4, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 플레이어 이름
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.nickname, player.position.x, player.position.y - radius - 10);
        
        this.ctx.restore();
    }
    
    /**
     * 파티클 렌더링
     */
    renderParticles() {
        this.myPlayer.particles.forEach(particle => {
            this.ctx.save();
            
            this.ctx.globalAlpha = particle.life / 120;
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
     * 게임 정보 렌더링
     */
    renderGameInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '14px Arial';
        
        // 내 센서 활동량 표시 (좌하단)
        let y = window.innerHeight - 120;
        this.ctx.fillText('내 센서 활동:', 20, y);
        y += 20;
        this.ctx.fillText(`기울기: ${this.myPlayer.sensorActivity.orientation.toFixed(1)}`, 20, y);
        y += 20;
        this.ctx.fillText(`가속도: ${this.myPlayer.sensorActivity.accelerometer.toFixed(1)}`, 20, y);
        y += 20;
        this.ctx.fillText(`자이로: ${this.myPlayer.sensorActivity.gyroscope.toFixed(1)}`, 20, y);
        y += 20;
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(`총합: ${this.myPlayer.sensorActivity.total.toFixed(1)}`, 20, y);
        
        this.ctx.restore();
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
    
    // ========== 유틸리티 함수들 ==========
    
    /**
     * 색상 밝게 만들기
     */
    lightenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    /**
     * 색상 어둡게 만들기
     */
    darkenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 + (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 + (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * 게임 정리
     */
    destroy() {
        this.gameState.isPlaying = false;
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // SDK 정리
        super.destroy();
        
        console.log('🗑️ 멀티플레이어 센서 테스트 게임 정리 완료');
    }
}

// DOM 로드 완료 시 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧪 멀티플레이어 센서 테스트 게임 로딩 완료');
    
    try {
        window.gameInstance = new MultiplayerSensorTestGame();
        window.game = window.gameInstance; // 호환성을 위한 별칭
        
        console.log('✅ 멀티플레이어 센서 테스트 게임 인스턴스 생성 완료');
    } catch (error) {
        console.error('❌ 멀티플레이어 센서 테스트 게임 초기화 실패:', error);
    }
});