/**
 * 센서 게임 SDK v4.0
 * 완전한 센서 게임 개발을 위한 통합 SDK
 */

class SensorGameSDK {
    constructor(config = {}) {
        // 기본 설정
        this.config = {
            gameId: config.gameId || 'unknown-game',
            gameName: config.gameName || 'Unknown Game',
            gameType: config.gameType || 'solo', // 'solo' 또는 'multiplayer'
            version: config.version || '1.0.0',
            
            // 센서 설정
            sensorTypes: config.sensorTypes || ['orientation'],
            multiSensor: config.multiSensor || false, // 다중 센서 지원
            sensorSensitivity: {
                orientation: 1.0,
                accelerometer: 1.0,
                gyroscope: 1.0,
                ...config.sensorSensitivity
            },
            
            // 데이터 처리 설정
            smoothingFactor: config.smoothingFactor || 3,
            deadzone: config.deadzone || 0.1,
            updateRate: config.updateRate || 60,
            
            // 멀티플레이어 설정
            maxPlayers: config.maxPlayers || 4,
            minPlayers: config.minPlayers || 1,
            
            // 서버 설정
            serverUrl: config.serverUrl || this.getServerUrl(),
            ...config
        };
        
        // 상태 관리
        this.state = {
            isConnected: false,
            sessionId: null,
            sessionCode: null,
            sensorConnected: false,
            sensorCount: 0,
            gameMode: this.config.gameType,
            roomId: null,
            isHost: false,
            players: new Map(),
            gameStarted: false
        };
        
        // 센서 데이터
        this.sensorData = {
            primary: {
                orientation: null,
                accelerometer: null,
                gyroscope: null,
                lastUpdate: 0
            },
            secondary: {
                orientation: null,
                accelerometer: null,
                gyroscope: null,
                lastUpdate: 0
            }
        };
        
        // 게임 입력 (가공된 센서 데이터)
        this.gameInput = {
            primary: {
                tilt: { x: 0, y: 0 },
                movement: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                shake: { detected: false, intensity: 0 },
                gesture: null
            },
            secondary: {
                tilt: { x: 0, y: 0 },
                movement: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                shake: { detected: false, intensity: 0 },
                gesture: null
            }
        };
        
        // 이벤트 콜백
        this.callbacks = {
            onReady: [],
            onSensorData: [],
            onConnectionChange: [],
            onSessionCreated: [],
            onSensorConnected: [],
            onSensorDisconnected: [],
            onRoomCreated: [],
            onRoomJoined: [],
            onPlayerJoined: [],
            onPlayerLeft: [],
            onGameStarted: [],
            onGameEvent: [],
            onRoomClosed: [],
            onError: []
        };
        
        // WebSocket 연결
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // 데이터 처리
        this.dataBuffer = [];
        this.lastProcessTime = 0;
        
        // 시뮬레이션 모드 (센서 없을 때)
        this.simulationMode = false;
        this.keyboardState = {};
        
        this.init();
    }
    
    /**
     * SDK 초기화
     */
    init() {
        console.log(`🎮 센서 게임 SDK v4.0 초기화: ${this.config.gameName}`);
        
        // 서버 연결
        this.connect();
        
        // 키보드 시뮬레이션 설정
        this.setupKeyboardSimulation();
        
        // 데이터 처리 루프 시작
        this.startDataProcessing();
        
        // 준비 완료 이벤트
        setTimeout(() => {
            this.emit('onReady', {
                gameId: this.config.gameId,
                gameName: this.config.gameName,
                gameType: this.config.gameType,
                config: this.config
            });
        }, 100);
    }
    
    /**
     * 서버 URL 자동 감지
     */
    getServerUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}`;
    }
    
    /**
     * 서버 연결
     */
    connect() {
        try {
            this.ws = new WebSocket(this.config.serverUrl);
            
            this.ws.onopen = () => {
                console.log('🔗 서버 연결 성공');
                this.state.isConnected = true;
                this.reconnectAttempts = 0;
                
                // PC 클라이언트로 등록
                this.send({
                    type: 'register_pc',
                    gameMode: this.config.gameType,
                    gameId: this.config.gameId
                });
                
                this.emit('onConnectionChange', true);
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('메시지 처리 오류:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('🔌 서버 연결 종료');
                this.state.isConnected = false;
                this.emit('onConnectionChange', false);
                
                // 자동 재연결
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => {
                        console.log(`🔄 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                        this.connect();
                    }, 2000 * this.reconnectAttempts);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket 오류:', error);
                this.emit('onError', { type: 'connection', error });
            };
            
        } catch (error) {
            console.error('연결 실패:', error);
            this.emit('onError', { type: 'connection', error });
        }
    }
    
    /**
     * 메시지 전송
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    
    /**
     * 서버 메시지 처리
     */
    handleMessage(message) {
        switch (message.type) {
            case 'session_created':
                this.handleSessionCreated(message);
                break;
                
            case 'sensor_connected':
                this.handleSensorConnected(message);
                break;
                
            case 'sensor_disconnected':
                this.handleSensorDisconnected(message);
                break;
                
            case 'sensor_data':
                this.handleSensorDataReceived(message);
                break;
                
            case 'room_create_result':
                this.handleRoomCreateResult(message);
                break;
                
            case 'room_join_result':
                this.handleRoomJoinResult(message);
                break;
                
            case 'player_joined':
                this.handlePlayerJoined(message);
                break;
                
            case 'player_left':
                this.handlePlayerLeft(message);
                break;
                
            case 'game_started':
                this.handleGameStarted(message);
                break;
                
            case 'game_event':
                this.handleGameEvent(message);
                break;
                
            case 'room_closed':
                this.handleRoomClosed(message);
                break;
                
            case 'error':
                this.emit('onError', { type: 'server', message: message.message });
                break;
                
            case 'pong':
                this.handlePong(message);
                break;
                
            default:
                console.warn('알 수 없는 메시지:', message);
        }
    }
    
    /**
     * 세션 생성 처리
     */
    handleSessionCreated(message) {
        this.state.sessionId = message.sessionId;
        this.state.sessionCode = message.sessionCode;
        
        console.log(`🔑 세션 생성: ${message.sessionCode}`);
        
        this.emit('onSessionCreated', {
            sessionId: message.sessionId,
            sessionCode: message.sessionCode,
            gameMode: message.gameMode
        });
    }
    
    /**
     * 센서 연결 처리
     */
    handleSensorConnected(message) {
        this.state.sensorConnected = true;
        this.state.sensorCount = message.sensorCount;
        
        console.log(`📱 센서 연결: ${message.sensorType} (총 ${message.sensorCount}개)`);
        
        this.emit('onSensorConnected', {
            sensorType: message.sensorType,
            sensorCount: message.sensorCount
        });
    }
    
    /**
     * 센서 연결 해제 처리
     */
    handleSensorDisconnected(message) {
        this.state.sensorCount = message.sensorCount;
        
        if (message.sensorCount === 0) {
            this.state.sensorConnected = false;
        }
        
        console.log(`📱 센서 연결 해제 (남은 센서: ${message.sensorCount}개)`);
        
        this.emit('onSensorDisconnected', {
            sensorCount: message.sensorCount
        });
    }
    
    /**
     * 센서 데이터 수신 처리
     */
    handleSensorDataReceived(message) {
        const sensorType = message.sensorType || 'primary';
        const rawData = message.data;
        
        // 원시 센서 데이터 저장
        this.sensorData[sensorType] = {
            ...rawData,
            lastUpdate: Date.now()
        };
        
        // 게임 입력으로 변환
        this.convertToGameInput(sensorType, rawData);
        
        // 센서 데이터 이벤트 발생
        this.emit('onSensorData', {
            sensorType,
            rawData,
            gameInput: this.gameInput[sensorType],
            allSensors: this.gameInput
        });
    }
    
    /**
     * 룸 생성 결과 처리
     */
    handleRoomCreateResult(message) {
        if (message.success) {
            this.state.roomId = message.roomId;
            this.state.isHost = true;
            
            console.log(`🏠 룸 생성 성공: ${message.roomId}`);
            
            this.emit('onRoomCreated', {
                roomId: message.roomId,
                roomData: message.roomData
            });
        } else {
            this.emit('onError', {
                type: 'room_creation',
                message: message.error
            });
        }
    }
    
    /**
     * 룸 참가 결과 처리
     */
    handleRoomJoinResult(message) {
        if (message.success) {
            this.state.roomId = message.roomData.roomId;
            this.state.isHost = false;
            
            console.log(`🏠 룸 참가 성공: ${message.roomData.roomId}`);
            
            this.emit('onRoomJoined', {
                roomData: message.roomData
            });
        } else {
            this.emit('onError', {
                type: 'room_join',
                message: message.error
            });
        }
    }
    
    /**
     * 플레이어 참가 처리
     */
    handlePlayerJoined(message) {
        this.state.players.set(message.player.sessionId, message.player);
        
        console.log(`👥 플레이어 참가: ${message.player.nickname}`);
        
        this.emit('onPlayerJoined', {
            player: message.player,
            playerCount: message.playerCount,
            players: Array.from(this.state.players.values())
        });
    }
    
    /**
     * 플레이어 퇴장 처리
     */
    handlePlayerLeft(message) {
        this.state.players.delete(message.sessionId);
        
        console.log(`👤 플레이어 퇴장: ${message.sessionId}`);
        
        this.emit('onPlayerLeft', {
            sessionId: message.sessionId,
            playerCount: message.playerCount,
            players: Array.from(this.state.players.values())
        });
    }
    
    /**
     * 게임 시작 처리
     */
    handleGameStarted(message) {
        this.state.gameStarted = true;
        
        console.log(`🎮 게임 시작: ${message.gameId}`);
        
        this.emit('onGameStarted', {
            gameId: message.gameId,
            timestamp: message.timestamp
        });
    }
    
    /**
     * 게임 이벤트 처리
     */
    handleGameEvent(message) {
        this.emit('onGameEvent', {
            sessionId: message.sessionId,
            eventType: message.eventType,
            data: message.data,
            timestamp: message.timestamp
        });
    }
    
    /**
     * 룸 종료 처리
     */
    handleRoomClosed(message) {
        this.state.roomId = null;
        this.state.isHost = false;
        this.state.gameStarted = false;
        this.state.players.clear();
        
        console.log(`🏠 룸 종료: ${message.reason}`);
        
        this.emit('onRoomClosed', {
            reason: message.reason
        });
    }
    
    /**
     * 원시 센서 데이터를 게임 입력으로 변환
     */
    convertToGameInput(sensorType, rawData) {
        const input = this.gameInput[sensorType];
        
        // 방향 센서 (기울기)
        if (rawData.orientation) {
            const { alpha, beta, gamma } = rawData.orientation;
            
            // 기울기 계산 (-1 ~ 1 범위)
            input.tilt.x = this.clamp(gamma / 45, -1, 1);
            input.tilt.y = this.clamp(beta / 45, -1, 1);
            
            // 회전 계산
            input.rotation.z = this.normalizeAngle(alpha);
        }
        
        // 가속도계 (움직임, 흔들기)
        if (rawData.accelerometer) {
            const { x, y, z } = rawData.accelerometer;
            
            // 움직임 계산
            input.movement.x = this.applyDeadzone(x, this.config.deadzone);
            input.movement.y = this.applyDeadzone(y, this.config.deadzone);
            input.movement.z = this.applyDeadzone(z, this.config.deadzone);
            
            // 흔들기 감지
            const intensity = Math.sqrt(x*x + y*y + z*z);
            input.shake.intensity = intensity;
            input.shake.detected = intensity > 15; // 임계값
        }
        
        // 자이로스코프 (회전)
        if (rawData.gyroscope) {
            const { alpha, beta, gamma } = rawData.gyroscope;
            
            input.rotation.x = this.applyDeadzone(beta, this.config.deadzone);
            input.rotation.y = this.applyDeadzone(gamma, this.config.deadzone);
            input.rotation.z = this.applyDeadzone(alpha, this.config.deadzone);
        }
        
        // 제스처 감지 (확장 가능)
        this.detectGestures(sensorType, rawData);
    }
    
    /**
     * 제스처 감지
     */
    detectGestures(sensorType, rawData) {
        // 기본 제스처 감지 로직
        // 개발자가 오버라이드하여 커스텀 제스처 구현 가능
        const input = this.gameInput[sensorType];
        
        // 스와이프 제스처 예시
        if (rawData.accelerometer) {
            const { x, y } = rawData.accelerometer;
            
            if (Math.abs(x) > 10) {
                input.gesture = {
                    type: 'swipe',
                    direction: x > 0 ? 'right' : 'left',
                    intensity: Math.abs(x),
                    timestamp: Date.now()
                };
            } else if (Math.abs(y) > 10) {
                input.gesture = {
                    type: 'swipe',
                    direction: y > 0 ? 'up' : 'down',
                    intensity: Math.abs(y),
                    timestamp: Date.now()
                };
            } else {
                input.gesture = null;
            }
        }
    }
    
    /**
     * 키보드 시뮬레이션 설정
     */
    setupKeyboardSimulation() {
        document.addEventListener('keydown', (e) => {
            this.keyboardState[e.code] = true;
            
            // 특수 키 처리
            switch (e.code) {
                case 'KeyR':
                    this.calibrate();
                    break;
                case 'KeyC':
                    this.createSession();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keyboardState[e.code] = false;
        });
        
        // 페이지 이동/종료 시 연결 정리
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });
        
        // 다른 탭/윈도우로 이동 시 연결 유지 처리
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('🔄 페이지가 백그라운드로 이동');
            } else {
                console.log('🔄 페이지가 포그라운드로 복귀');
                // 연결 상태 확인 및 필요 시 재연결
                this.checkConnectionStatus();
            }
        });
        
        // 키보드 시뮬레이션 데이터 생성
        this.keyboardSimulationLoop();
    }
    
    /**
     * 키보드 시뮬레이션 루프
     */
    keyboardSimulationLoop() {
        if (!this.state.sensorConnected) {
            this.simulationMode = true;
            
            // 키보드 입력을 센서 데이터로 변환
            const simulatedData = {
                orientation: {
                    alpha: 0,
                    beta: this.keyboardState['KeyW'] ? -30 : this.keyboardState['KeyS'] ? 30 : 0,
                    gamma: this.keyboardState['KeyA'] ? -30 : this.keyboardState['KeyD'] ? 30 : 0
                },
                accelerometer: {
                    x: this.keyboardState['ArrowLeft'] ? -10 : this.keyboardState['ArrowRight'] ? 10 : 0,
                    y: this.keyboardState['ArrowUp'] ? -10 : this.keyboardState['ArrowDown'] ? 10 : 0,
                    z: this.keyboardState['Space'] ? 20 : 0
                },
                gyroscope: {
                    alpha: 0,
                    beta: 0,
                    gamma: 0
                }
            };
            
            // 시뮬레이션 데이터 처리
            this.convertToGameInput('primary', simulatedData);
            
            // 센서 데이터 이벤트 발생
            this.emit('onSensorData', {
                sensorType: 'primary',
                rawData: simulatedData,
                gameInput: this.gameInput.primary,
                allSensors: this.gameInput,
                isSimulation: true
            });
        } else {
            this.simulationMode = false;
        }
        
        requestAnimationFrame(() => this.keyboardSimulationLoop());
    }
    
    /**
     * 데이터 처리 루프
     */
    startDataProcessing() {
        const processData = () => {
            const now = Date.now();
            
            if (now - this.lastProcessTime >= 1000 / this.config.updateRate) {
                this.processBuffer();
                this.lastProcessTime = now;
            }
            
            requestAnimationFrame(processData);
        };
        
        requestAnimationFrame(processData);
    }
    
    /**
     * 데이터 버퍼 처리
     */
    processBuffer() {
        // 스무싱 및 필터링 로직
        // 현재는 기본 구현
    }
    
    // ========== 공개 API 메서드들 ==========
    
    /**
     * 세션 생성
     */
    createSession() {
        this.send({
            type: 'create_session',
            gameMode: this.config.gameType
        });
    }
    
    /**
     * 센서 보정
     */
    calibrate() {
        // 센서 보정 로직
        console.log('🎯 센서 보정');
        
        // 기준값 설정
        this.calibrationOffset = {
            primary: { ...this.sensorData.primary },
            secondary: { ...this.sensorData.secondary }
        };
        
        this.emit('onCalibration', {
            timestamp: Date.now()
        });
    }
    
    /**
     * 룸 생성 (멀티플레이어)
     */
    createRoom(gameId, roomName, maxPlayers = 4) {
        // 허브는 모든 타입의 룸을 생성할 수 있음
        if (this.config.gameId !== 'hub' && this.config.gameType !== 'multiplayer') {
            console.warn('솔로 게임에서는 룸을 생성할 수 없습니다.');
            return;
        }
        
        this.send({
            type: 'create_room',
            gameId,
            roomName,
            maxPlayers
        });
    }
    
    /**
     * 룸 참가 (멀티플레이어)
     */
    joinRoom(roomId, nickname) {
        // 허브는 모든 타입의 룸에 참가할 수 있음
        if (this.config.gameId !== 'hub' && this.config.gameType !== 'multiplayer') {
            console.warn('솔로 게임에서는 룸에 참가할 수 없습니다.');
            return;
        }
        
        this.send({
            type: 'join_room',
            roomId,
            nickname
        });
    }
    
    /**
     * 게임 시작 (호스트만)
     */
    startGame() {
        if (!this.state.isHost) {
            console.warn('호스트만 게임을 시작할 수 있습니다.');
            return;
        }
        
        this.send({
            type: 'start_game'
        });
    }
    
    /**
     * 게임 이벤트 전송 (멀티플레이어)
     */
    sendGameEvent(eventType, data) {
        if (this.config.gameType !== 'multiplayer') {
            return;
        }
        
        this.send({
            type: 'game_event',
            eventType,
            data
        });
    }
    
    /**
     * 룸 나가기
     */
    leaveRoom() {
        this.send({
            type: 'leave_room'
        });
    }
    
    /**
     * 이벤트 리스너 등록
     */
    on(eventName, callback) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].push(callback);
        }
    }
    
    /**
     * 이벤트 리스너 제거
     */
    off(eventName, callback) {
        if (this.callbacks[eventName]) {
            const index = this.callbacks[eventName].indexOf(callback);
            if (index > -1) {
                this.callbacks[eventName].splice(index, 1);
            }
        }
    }
    
    /**
     * 이벤트 발생
     */
    emit(eventName, data) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`이벤트 콜백 오류 (${eventName}):`, error);
                }
            });
        }
    }
    
    /**
     * 현재 상태 반환
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * 센서 데이터 반환
     */
    getSensorData(sensorType = 'primary') {
        return this.sensorData[sensorType];
    }
    
    /**
     * 게임 입력 반환
     */
    getGameInput(sensorType = 'primary') {
        return this.gameInput[sensorType];
    }
    
    /**
     * 성능 통계 반환
     */
    getStats() {
        return {
            isConnected: this.state.isConnected,
            sensorConnected: this.state.sensorConnected,
            sensorCount: this.state.sensorCount,
            simulationMode: this.simulationMode,
            updateRate: this.config.updateRate,
            lastUpdate: Math.max(
                this.sensorData.primary.lastUpdate,
                this.sensorData.secondary.lastUpdate
            )
        };
    }
    
    /**
     * Pong 메시지 처리 (연결 상태 확인)
     */
    handlePong(message) {
        const latency = Date.now() - message.originalTimestamp;
        console.log(`🏓 서버 응답 (지연시간: ${latency}ms)`);
        
        // 연결이 정상임을 확인
        this.state.isConnected = true;
        this.state.lastPong = Date.now();
    }
    
    /**
     * 페이지 언로드 처리
     */
    handlePageUnload() {
        try {
            // 서버에 정상적인 연결 해제 알림
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendMessage({
                    type: 'client_disconnect',
                    reason: 'page_unload',
                    sessionId: this.state.sessionId,
                    timestamp: Date.now()
                });
                
                // 즉시 연결 종료
                this.ws.close();
            }
            
            console.log('📄 페이지 언로드 처리 완료');
        } catch (error) {
            console.error('페이지 언로드 처리 오류:', error);
        }
    }
    
    /**
     * 연결 상태 확인 및 재연결
     */
    checkConnectionStatus() {
        if (!this.state.isConnected && this.ws && this.ws.readyState === WebSocket.CLOSED) {
            console.log('🔄 연결이 끊어진 것을 감지, 재연결 시도');
            
            // 잠시 후 재연결 시도
            setTimeout(() => {
                this.connect();
            }, 1000);
        } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // 연결이 살아있는지 핑 테스트
            this.sendMessage({
                type: 'ping',
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * SDK 정리
     */
    destroy() {
        this.handlePageUnload();
        
        this.callbacks = {};
        this.sensorData = {};
        this.gameInput = {};
        
        console.log('🗑️ 센서 게임 SDK 정리 완료');
    }
    
    // ========== 유틸리티 함수들 ==========
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    normalizeAngle(angle) {
        return ((angle % 360) + 360) % 360;
    }
    
    applyDeadzone(value, deadzone) {
        return Math.abs(value) < deadzone ? 0 : value;
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    magnitude(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y + (vector.z || 0) * (vector.z || 0));
    }
}

// 전역 노출
if (typeof window !== 'undefined') {
    window.SensorGameSDK = SensorGameSDK;
}

// Node.js 환경 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SensorGameSDK;
}