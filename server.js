/**
 * 센서 게임 허브 v4.0 - 메인 서버
 * 완전한 세션 매칭, 멀티플레이어, 다중 센서 지원
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

// 환경 설정
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Express 앱 설정
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 미들웨어 설정
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));
app.use('/sdk', express.static(path.join(__dirname, 'sdk')));
app.use('/games', express.static(path.join(__dirname, 'games')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/libs', express.static(path.join(__dirname, 'libs')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// ========== 데이터 구조 ==========

// 세션 관리 (PC ↔ 센서 매칭)
const sessions = new Map(); // sessionCode -> sessionData
const usedCodes = new Set(); // 중복 방지용
const clients = new Map(); // clientId -> clientData

// 멀티플레이어 룸 관리
const rooms = new Map(); // roomId -> roomData
const roomList = new Map(); // 공개 룸 목록

// 게임 레지스트리
const gameRegistry = new Map(); // gameId -> gameMetadata

// 관리자 모니터링
const adminClients = new Set(); // 관리자 클라이언트들
const serverStats = {
    startTime: Date.now(),
    totalConnections: 0,
    sessionsToday: 0,
    totalSensorsConnected: 0
};

// ========== 핵심 함수들 ==========

/**
 * 고유한 4자리 세션 코드 생성
 */
function generateSessionCode() {
    let attempts = 0;
    const maxAttempts = 10000;
    
    while (attempts < maxAttempts) {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        
        if (!sessions.has(code) && !usedCodes.has(code)) {
            usedCodes.add(code);
            
            // 사용된 코드 목록 정리 (1000개 초과 시)
            if (usedCodes.size > 1000) {
                const codes = Array.from(usedCodes);
                codes.slice(0, 100).forEach(oldCode => usedCodes.delete(oldCode));
            }
            
            return code;
        }
        attempts++;
    }
    
    throw new Error('사용 가능한 세션 코드가 없습니다.');
}

/**
 * 세션 생성
 */
function createSession(pcClientId, gameMode = 'solo') {
    try {
        const sessionCode = generateSessionCode();
        const sessionId = uuidv4();
        
        const sessionData = {
            sessionId,
            sessionCode,
            pcClientId,
            sensorClients: new Map(), // sensorId -> sensorData (다중 센서 지원)
            gameMode, // 'solo' 또는 'multiplayer'
            roomId: null,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            isActive: true
        };
        
        sessions.set(sessionCode, sessionData);
        
        // PC 클라이언트에 세션 정보 전송
        const pcClient = clients.get(pcClientId);
        if (pcClient && pcClient.ws.readyState === WebSocket.OPEN) {
            pcClient.ws.send(JSON.stringify({
                type: 'session_created',
                sessionCode,
                sessionId,
                gameMode
            }));
        }
        
        console.log(`🔑 세션 생성: ${sessionCode} (${sessionId})`);
        return { success: true, sessionCode, sessionId };
        
    } catch (error) {
        console.error('❌ 세션 생성 실패:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 센서 클라이언트를 세션에 연결
 */
function connectSensorToSession(sessionCode, sensorClientId, sensorType = 'primary') {
    const sessionData = sessions.get(sessionCode);
    
    if (!sessionData) {
        return { success: false, error: '유효하지 않은 세션 코드입니다.' };
    }
    
    if (!sessionData.isActive) {
        return { success: false, error: '비활성화된 세션입니다.' };
    }
    
    // 다중 센서 지원 확인
    if (sessionData.sensorClients.size >= 2) {
        return { success: false, error: '세션에 이미 최대 센서 개수가 연결되어 있습니다.' };
    }
    
    // 센서 클라이언트 정보 저장
    const sensorData = {
        clientId: sensorClientId,
        sensorType, // 'primary', 'secondary'
        connectedAt: Date.now(),
        lastActivity: Date.now()
    };
    
    sessionData.sensorClients.set(sensorClientId, sensorData);
    sessionData.lastActivity = Date.now();
    
    // PC 클라이언트에 센서 연결 알림
    const pcClient = clients.get(sessionData.pcClientId);
    if (pcClient && pcClient.ws.readyState === WebSocket.OPEN) {
        pcClient.ws.send(JSON.stringify({
            type: 'sensor_connected',
            sensorType,
            sensorCount: sessionData.sensorClients.size
        }));
    }
    
    // 센서 클라이언트에 연결 확인
    const sensorClient = clients.get(sensorClientId);
    if (sensorClient && sensorClient.ws.readyState === WebSocket.OPEN) {
        sensorClient.ws.send(JSON.stringify({
            type: 'session_joined',
            sessionCode,
            sensorType,
            success: true
        }));
    }
    
    console.log(`📱 센서 연결: ${sessionCode} (${sensorType})`);
    return { success: true, sensorType, sessionId: sessionData.sessionId };
}

/**
 * 멀티플레이어 룸 생성
 */
function createRoom(hostSessionId, gameId, roomName, maxPlayers = 4) {
    try {
        const roomId = uuidv4();
        const game = gameRegistry.get(gameId);
        
        if (!game) {
            return { success: false, error: '존재하지 않는 게임입니다.' };
        }
        
        const roomData = {
            roomId,
            roomName,
            gameId,
            hostSessionId,
            maxPlayers,
            players: new Map(), // sessionId -> playerData
            status: 'waiting', // 'waiting', 'playing', 'finished'
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        // 호스트를 플레이어로 추가
        const hostSession = Array.from(sessions.values())
            .find(s => s.sessionId === hostSessionId);
        
        if (hostSession) {
            roomData.players.set(hostSessionId, {
                sessionId: hostSessionId,
                nickname: '호스트',
                isHost: true,
                joinedAt: Date.now()
            });
        }
        
        rooms.set(roomId, roomData);
        roomList.set(roomId, {
            roomId,
            roomName,
            gameId,
            gameName: game.name,
            currentPlayers: 1,
            maxPlayers,
            status: 'waiting',
            createdAt: Date.now()
        });
        
        console.log(`🏠 룸 생성: ${roomName} (${roomId})`);
        return { success: true, roomId, roomData };
        
    } catch (error) {
        console.error('❌ 룸 생성 실패:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 룸 참가
 */
function joinRoom(roomId, sessionId, nickname) {
    const roomData = rooms.get(roomId);
    
    if (!roomData) {
        return { success: false, error: '존재하지 않는 룸입니다.' };
    }
    
    if (roomData.status !== 'waiting') {
        return { success: false, error: '참가할 수 없는 룸 상태입니다.' };
    }
    
    if (roomData.players.size >= roomData.maxPlayers) {
        return { success: false, error: '룸이 가득 찼습니다.' };
    }
    
    // 플레이어 추가
    roomData.players.set(sessionId, {
        sessionId,
        nickname,
        isHost: false,
        joinedAt: Date.now()
    });
    
    // 룸 목록 업데이트
    const roomListData = roomList.get(roomId);
    if (roomListData) {
        roomListData.currentPlayers = roomData.players.size;
    }
    
    // 룸의 모든 플레이어에게 알림
    broadcastToRoom(roomId, {
        type: 'player_joined',
        player: {
            sessionId,
            nickname,
            isHost: false
        },
        playerCount: roomData.players.size
    });
    
    console.log(`👥 플레이어 참가: ${nickname} → ${roomData.roomName}`);
    return { success: true, roomData };
}

/**
 * 룸 내 브로드캐스트
 */
function broadcastToRoom(roomId, message, excludeSessionId = null) {
    const roomData = rooms.get(roomId);
    if (!roomData) return;
    
    for (const [sessionId, player] of roomData.players) {
        if (sessionId !== excludeSessionId) {
            const sessionData = Array.from(sessions.values())
                .find(s => s.sessionId === sessionId);
            
            if (sessionData) {
                const pcClient = clients.get(sessionData.pcClientId);
                if (pcClient && pcClient.ws.readyState === WebSocket.OPEN) {
                    pcClient.ws.send(JSON.stringify(message));
                }
            }
        }
    }
}

/**
 * 게임 레지스트리 로드
 */
function loadGameRegistry() {
    try {
        const gamesDir = path.join(__dirname, 'games');
        
        if (!fs.existsSync(gamesDir)) {
            fs.mkdirSync(gamesDir, { recursive: true });
            console.log('📁 games 디렉토리 생성');
        }
        
        const gameDirectories = fs.readdirSync(gamesDir)
            .filter(dir => {
                const dirPath = path.join(gamesDir, dir);
                return fs.statSync(dirPath).isDirectory();
            });
        
        gameRegistry.clear();
        
        for (const gameDir of gameDirectories) {
            const gameJsonPath = path.join(gamesDir, gameDir, 'game.json');
            const gameHtmlPath = path.join(gamesDir, gameDir, 'index.html');
            
            if (fs.existsSync(gameJsonPath) && fs.existsSync(gameHtmlPath)) {
                try {
                    const gameJson = JSON.parse(fs.readFileSync(gameJsonPath, 'utf8'));
                    gameJson.id = gameDir;
                    gameJson.isActive = true;
                    gameJson.playCount = 0;
                    gameJson.lastUpdate = Date.now();
                    
                    gameRegistry.set(gameDir, gameJson);
                    console.log(`🎮 게임 로드: ${gameJson.name} (${gameDir})`);
                } catch (error) {
                    console.error(`❌ 게임 로드 실패: ${gameDir}`, error.message);
                }
            }
        }
        
        console.log(`📦 총 ${gameRegistry.size}개 게임 로드 완료`);
        
    } catch (error) {
        console.error('❌ 게임 레지스트리 로드 실패:', error);
    }
}

// ========== API 엔드포인트 ==========

// 헬스체크
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        stats: {
            sessions: sessions.size,
            rooms: rooms.size,
            clients: clients.size,
            games: gameRegistry.size
        }
    });
});

// 게임 목록 API
app.get('/api/games', (req, res) => {
    const games = Array.from(gameRegistry.values())
        .filter(game => game.isActive)
        .sort((a, b) => b.playCount - a.playCount);
    
    res.json({
        success: true,
        games,
        total: games.length
    });
});

// 특정 게임 정보 API
app.get('/api/games/:gameId', (req, res) => {
    const game = gameRegistry.get(req.params.gameId);
    if (!game) {
        return res.status(404).json({
            success: false,
            error: '게임을 찾을 수 없습니다.'
        });
    }
    
    res.json({
        success: true,
        game
    });
});

// 룸 목록 API
app.get('/api/rooms', (req, res) => {
    const publicRooms = Array.from(roomList.values())
        .filter(room => room.status === 'waiting')
        .sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({
        success: true,
        rooms: publicRooms,
        total: publicRooms.length
    });
});

// 서버 상태 API
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: {
            uptime: process.uptime(),
            totalGames: gameRegistry.size,
            activeSessions: sessions.size,
            activeRooms: rooms.size,
            connectedClients: clients.size,
            memoryUsage: process.memoryUsage(),
            timestamp: Date.now()
        }
    });
});

// ========== 정적 파일 라우트 ==========

// 메인 허브
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'hub.html'));
});

// 센서 클라이언트
app.get('/sensor', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'sensor.html'));
});

// 게임 플레이
app.get('/play/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const gamePath = path.join(__dirname, 'games', gameId, 'index.html');
    
    if (fs.existsSync(gamePath)) {
        res.sendFile(gamePath);
    } else {
        res.status(404).send('게임을 찾을 수 없습니다.');
    }
});

// 게임별 정적 파일 서빙
app.get('/play/:gameId/*', (req, res) => {
    const gameId = req.params.gameId;
    const filePath = req.params[0]; // * 부분
    const fullPath = path.join(__dirname, 'games', gameId, filePath);
    
    if (fs.existsSync(fullPath)) {
        res.sendFile(fullPath);
    } else {
        res.status(404).send('파일을 찾을 수 없습니다.');
    }
});

// 관리자 페이지
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'admin.html'));
});

// 개발자 페이지
app.get('/developer', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'developer.html'));
});

app.get('/dev', (req, res) => {
    res.redirect('/developer');
});

// 관리자 API - 서버 상태
app.get('/api/admin/status', (req, res) => {
    const now = Date.now();
    const uptime = now - serverStats.startTime;
    
    // 클라이언트 정보 수집
    const clientList = Array.from(clients.values()).map(client => ({
        id: client.id,
        type: client.type,
        userAgent: client.userAgent || 'Unknown',
        connectedTime: now - client.connectedAt,
        latency: client.latency || 0
    }));
    
    // 룸 정보 수집
    const roomList = Array.from(rooms.values()).map(room => ({
        id: room.roomId,
        name: room.roomName,
        gameId: room.gameId,
        maxPlayers: room.maxPlayers,
        players: Array.from(room.players.values()).map(player => ({
            sessionId: player.sessionId,
            nickname: player.nickname,
            isHost: player.isHost
        }))
    }));
    
    // 평균 지연시간 계산
    const latencies = clientList.map(c => c.latency).filter(l => l > 0);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    
    res.json({
        success: true,
        status: {
            uptime: uptime,
            memory: process.memoryUsage().heapUsed,
            cpu: Math.round(Math.random() * 20 + 10), // 임시 CPU 사용량
            totalConnections: serverStats.totalConnections,
            sessions: {
                active: sessions.size,
                today: serverStats.sessionsToday
            },
            sensors: {
                connected: Array.from(clients.values()).filter(c => c.type === 'sensor').length
            },
            avgLatency: avgLatency,
            clients: clientList,
            rooms: roomList
        }
    });
});

// ========== WebSocket 처리 ==========

wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    const clientData = {
        id: clientId,
        ws: ws,
        type: null, // 'pc', 'sensor'
        sessionId: null,
        connectedAt: Date.now(),
        lastActivity: Date.now()
    };
    
    clients.set(clientId, clientData);
    serverStats.totalConnections++;
    
    console.log(`🔗 클라이언트 연결: ${clientId}`);
    
    // 연결 확인 메시지 전송
    ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: Date.now()
    }));
    
    // 관리자에게 새 클라이언트 연결 알림
    broadcastToAdmins({
        type: 'client_connected',
        clientId: clientId,
        clientType: 'unknown'
    });
    
    // 메시지 처리
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(clientId, message);
        } catch (error) {
            console.error('메시지 처리 오류:', error);
        }
    });
    
    // 연결 종료 처리
    ws.on('close', () => {
        handleDisconnect(clientId);
    });
    
    // 오류 처리
    ws.on('error', (error) => {
        console.error(`클라이언트 ${clientId} 오류:`, error);
    });
});

/**
 * WebSocket 메시지 처리
 */
function handleMessage(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    client.lastActivity = Date.now();
    
    switch (message.type) {
        case 'register_pc':
            handleRegisterPC(clientId, message);
            break;
            
        case 'register_sensor':
            handleRegisterSensor(clientId, message);
            break;
            
        case 'create_session':
            handleCreateSession(clientId, message);
            break;
            
        case 'join_session':
            handleJoinSession(clientId, message);
            break;
            
        case 'sensor_data':
            handleSensorData(clientId, message);
            break;
            
        case 'create_room':
            handleCreateRoom(clientId, message);
            break;
            
        case 'join_room':
            handleJoinRoom(clientId, message);
            break;
            
        case 'start_game':
            handleStartGame(clientId, message);
            break;
            
        case 'game_event':
            handleGameEvent(clientId, message);
            break;
            
        case 'leave_room':
            handleLeaveRoom(clientId, message);
            break;
            
        case 'admin_connect':
            handleAdminConnect(clientId, message);
            break;
            
        case 'admin_status_request':
            handleAdminStatusRequest(clientId, message);
            break;
            
        case 'admin_disconnect_all':
            handleAdminDisconnectAll(clientId, message);
            break;
            
        case 'ping':
            handlePing(clientId, message);
            break;
            
        case 'client_disconnect':
            handleClientDisconnect(clientId, message);
            break;
            
        default:
            console.warn('알 수 없는 메시지 타입:', message.type);
    }
}

/**
 * PC 클라이언트 등록
 */
function handleRegisterPC(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    client.type = 'pc';
    client.gameMode = message.gameMode || 'solo';
    
    // 기존 세션 정보가 있는지 확인
    if (message.existingSessionCode && message.existingSessionId) {
        console.log(`🔄 기존 세션 복원 시도: ${message.existingSessionCode}`);
        
        // 기존 세션 찾기
        const existingSession = Array.from(sessions.values()).find(session => 
            session.sessionCode === message.existingSessionCode && 
            session.sessionId === message.existingSessionId
        );
        
        if (existingSession) {
            console.log(`✅ 기존 세션 발견: ${message.existingSessionCode}`);
            
            // 기존 세션에 PC 클라이언트 연결
            client.sessionId = existingSession.sessionId;
            client.sessionCode = existingSession.sessionCode;
            existingSession.pcClient = clientId;
            
            // 기존 세션 정보 전송 (새 세션 생성 알림 없이)
            client.ws.send(JSON.stringify({
                type: 'session_restored',
                sessionId: existingSession.sessionId,
                sessionCode: existingSession.sessionCode,
                gameMode: client.gameMode,
                sensorConnected: existingSession.sensorClient !== null
            }));
            
            console.log(`🔗 기존 세션 복원 완료: ${message.existingSessionCode}`);
            return;
        } else {
            console.log(`⚠️ 기존 세션을 찾을 수 없음: ${message.existingSessionCode}`);
        }
    }
    
    // 기존 세션이 없거나 찾을 수 없는 경우에만 새 세션 생성
    console.log('🆕 새 세션 생성');
    const result = createSession(clientId, client.gameMode);
    
    if (!result.success) {
        client.ws.send(JSON.stringify({
            type: 'error',
            message: result.error
        }));
    }
}

/**
 * 센서 클라이언트 등록
 */
function handleRegisterSensor(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    client.type = 'sensor';
    client.sensorType = message.sensorType || 'primary';
}

/**
 * 세션 생성 처리
 */
function handleCreateSession(clientId, message) {
    const result = createSession(clientId, message.gameMode);
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
            type: 'session_create_result',
            ...result
        }));
    }
}

/**
 * 세션 참가 처리
 */
function handleJoinSession(clientId, message) {
    const { sessionCode, sensorType } = message;
    const result = connectSensorToSession(sessionCode, clientId, sensorType);
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
            type: 'session_join_result',
            ...result
        }));
    }
}

/**
 * 센서 데이터 처리
 */
function handleSensorData(clientId, message) {
    const client = clients.get(clientId);
    if (!client || client.type !== 'sensor') return;
    
    // 센서 클라이언트가 속한 세션 찾기
    const sessionData = Array.from(sessions.values())
        .find(s => s.sensorClients.has(clientId));
    
    if (!sessionData) return;
    
    // PC 클라이언트로 센서 데이터 전송
    const pcClient = clients.get(sessionData.pcClientId);
    if (pcClient && pcClient.ws.readyState === WebSocket.OPEN) {
        const sensorInfo = sessionData.sensorClients.get(clientId);
        pcClient.ws.send(JSON.stringify({
            type: 'sensor_data',
            sensorType: sensorInfo.sensorType,
            data: message.data,
            timestamp: Date.now()
        }));
    }
}

/**
 * 룸 생성 처리
 */
function handleCreateRoom(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    // 클라이언트의 세션 찾기
    const sessionData = Array.from(sessions.values())
        .find(s => s.pcClientId === clientId);
    
    if (!sessionData) {
        client.ws.send(JSON.stringify({
            type: 'error',
            message: '세션을 찾을 수 없습니다.'
        }));
        return;
    }
    
    const result = createRoom(
        sessionData.sessionId,
        message.gameId,
        message.roomName,
        message.maxPlayers
    );
    
    client.ws.send(JSON.stringify({
        type: 'room_create_result',
        ...result
    }));
}

/**
 * 룸 참가 처리
 */
function handleJoinRoom(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    // 클라이언트의 세션 찾기
    const sessionData = Array.from(sessions.values())
        .find(s => s.pcClientId === clientId);
    
    if (!sessionData) {
        client.ws.send(JSON.stringify({
            type: 'error',
            message: '세션을 찾을 수 없습니다.'
        }));
        return;
    }
    
    const result = joinRoom(message.roomId, sessionData.sessionId, message.nickname);
    
    client.ws.send(JSON.stringify({
        type: 'room_join_result',
        ...result
    }));
}

/**
 * 게임 시작 처리
 */
function handleStartGame(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    // 호스트인지 확인
    const sessionData = Array.from(sessions.values())
        .find(s => s.pcClientId === clientId);
    
    if (!sessionData) return;
    
    const roomData = Array.from(rooms.values())
        .find(r => r.hostSessionId === sessionData.sessionId);
    
    if (!roomData) return;
    
    roomData.status = 'playing';
    
    // 룸의 모든 플레이어에게 게임 시작 알림
    broadcastToRoom(roomData.roomId, {
        type: 'game_started',
        gameId: roomData.gameId,
        timestamp: Date.now()
    });
    
    console.log(`🎮 게임 시작: ${roomData.roomName}`);
}

/**
 * 게임 이벤트 처리
 */
function handleGameEvent(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    const sessionData = Array.from(sessions.values())
        .find(s => s.pcClientId === clientId);
    
    if (!sessionData || !sessionData.roomId) return;
    
    // 룸의 다른 플레이어들에게 게임 이벤트 전송
    broadcastToRoom(sessionData.roomId, {
        type: 'game_event',
        sessionId: sessionData.sessionId,
        eventType: message.eventType,
        data: message.data,
        timestamp: Date.now()
    }, sessionData.sessionId);
}

/**
 * 룸 나가기 처리
 */
function handleLeaveRoom(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    const sessionData = Array.from(sessions.values())
        .find(s => s.pcClientId === clientId);
    
    if (!sessionData) return;
    
    const roomData = Array.from(rooms.values())
        .find(r => r.players.has(sessionData.sessionId));
    
    if (!roomData) return;
    
    const player = roomData.players.get(sessionData.sessionId);
    
    if (player.isHost) {
        // 호스트가 나가면 룸 삭제
        broadcastToRoom(roomData.roomId, {
            type: 'room_closed',
            reason: 'host_left'
        });
        
        rooms.delete(roomData.roomId);
        roomList.delete(roomData.roomId);
        
        console.log(`🏠 룸 삭제: ${roomData.roomName} (호스트 퇴장)`);
    } else {
        // 일반 플레이어가 나가면 룸에서 제거
        roomData.players.delete(sessionData.sessionId);
        
        const roomListData = roomList.get(roomData.roomId);
        if (roomListData) {
            roomListData.currentPlayers = roomData.players.size;
        }
        
        broadcastToRoom(roomData.roomId, {
            type: 'player_left',
            sessionId: sessionData.sessionId,
            playerCount: roomData.players.size
        });
        
        console.log(`👤 플레이어 퇴장: ${roomData.roomName}`);
    }
}

/**
 * 클라이언트 연결 해제 처리
 */
function handleDisconnect(clientId) {
    const client = clients.get(clientId);
    if (!client) return;
    
    console.log(`🔌 클라이언트 연결 해제: ${clientId}`);
    
    // 세션에서 클라이언트 제거
    if (client.type === 'pc') {
        // PC 클라이언트인 경우 세션 비활성화
        const sessionData = Array.from(sessions.values())
            .find(s => s.pcClientId === clientId);
        
        if (sessionData) {
            sessionData.isActive = false;
            
            // 연결된 센서 클라이언트들에게 알림
            for (const [sensorClientId, sensorData] of sessionData.sensorClients) {
                const sensorClient = clients.get(sensorClientId);
                if (sensorClient && sensorClient.ws.readyState === WebSocket.OPEN) {
                    sensorClient.ws.send(JSON.stringify({
                        type: 'session_disconnected',
                        reason: 'pc_disconnected'
                    }));
                }
            }
        }
    } else if (client.type === 'sensor') {
        // 센서 클라이언트인 경우 세션에서 제거
        const sessionData = Array.from(sessions.values())
            .find(s => s.sensorClients.has(clientId));
        
        if (sessionData) {
            sessionData.sensorClients.delete(clientId);
            
            // PC 클라이언트에게 센서 연결 해제 알림
            const pcClient = clients.get(sessionData.pcClientId);
            if (pcClient && pcClient.ws.readyState === WebSocket.OPEN) {
                pcClient.ws.send(JSON.stringify({
                    type: 'sensor_disconnected',
                    sensorCount: sessionData.sensorClients.size
                }));
            }
        }
    } else if (client.type === 'admin') {
        // 관리자 클라이언트 제거
        adminClients.delete(clientId);
        console.log(`👑 관리자 연결 해제: ${clientId}`);
    }
    
    // 룸에서 플레이어 제거
    handleLeaveRoom(clientId, {});
    
    clients.delete(clientId);
    
    // 관리자에게 클라이언트 연결 해제 알림
    broadcastToAdmins({
        type: 'client_disconnected',
        clientId: clientId
    });
}

// ========== 관리자 기능 ==========

/**
 * 관리자 클라이언트 등록
 */
function handleAdminConnect(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    client.type = 'admin';
    client.userAgent = message.userAgent || 'Admin Dashboard';
    adminClients.add(clientId);
    
    console.log(`👑 관리자 연결: ${clientId}`);
    
    // 관리자에게 연결 확인 메시지 전송
    client.ws.send(JSON.stringify({
        type: 'admin_connected',
        message: '관리자 권한으로 연결되었습니다.',
        timestamp: Date.now()
    }));
}

/**
 * 관리자 상태 요청 처리
 */
function handleAdminStatusRequest(clientId, message) {
    const client = clients.get(clientId);
    if (!client || client.type !== 'admin') return;
    
    const now = Date.now();
    const uptime = now - serverStats.startTime;
    
    // 클라이언트 정보 수집
    const clientList = Array.from(clients.values())
        .filter(c => c.type !== 'admin')
        .map(client => ({
            id: client.id,
            type: client.type,
            userAgent: client.userAgent || 'Unknown',
            connectedTime: now - client.connectedAt,
            latency: client.latency || Math.round(Math.random() * 50 + 10) // 임시 지연시간
        }));
    
    // 룸 정보 수집
    const roomList = Array.from(rooms.values()).map(room => ({
        id: room.roomId,
        name: room.roomName,
        gameId: room.gameId,
        maxPlayers: room.maxPlayers,
        players: Array.from(room.players.values()).map(player => ({
            sessionId: player.sessionId,
            nickname: player.nickname,
            isHost: player.isHost
        }))
    }));
    
    // 평균 지연시간 계산
    const latencies = clientList.map(c => c.latency).filter(l => l > 0);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    
    client.ws.send(JSON.stringify({
        type: 'admin_status',
        status: {
            uptime: uptime,
            memory: process.memoryUsage().heapUsed,
            cpu: Math.round(Math.random() * 30 + 5), // 임시 CPU 사용량
            totalConnections: serverStats.totalConnections,
            sessions: {
                active: sessions.size,
                today: serverStats.sessionsToday
            },
            sensors: {
                connected: Array.from(clients.values()).filter(c => c.type === 'sensor').length
            },
            avgLatency: avgLatency,
            clients: clientList,
            rooms: roomList
        },
        timestamp: Date.now()
    }));
}

/**
 * 모든 클라이언트 연결 해제 (관리자 기능)
 */
function handleAdminDisconnectAll(clientId, message) {
    const client = clients.get(clientId);
    if (!client || client.type !== 'admin') return;
    
    console.log(`👑 관리자 요청: 모든 클라이언트 연결 해제 (${clientId})`);
    
    let disconnectedCount = 0;
    
    // 관리자가 아닌 모든 클라이언트 연결 해제
    for (const [id, clientData] of clients.entries()) {
        if (clientData.type !== 'admin' && clientData.ws.readyState === WebSocket.OPEN) {
            clientData.ws.send(JSON.stringify({
                type: 'admin_disconnect',
                message: '관리자에 의해 연결이 해제되었습니다.',
                timestamp: Date.now()
            }));
            clientData.ws.close();
            disconnectedCount++;
        }
    }
    
    // 관리자에게 결과 전송
    client.ws.send(JSON.stringify({
        type: 'admin_action_result',
        action: 'disconnect_all',
        result: `${disconnectedCount}개 클라이언트 연결 해제 완료`,
        timestamp: Date.now()
    }));
}

/**
 * 핑 메시지 처리
 */
function handlePing(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    // 퐁으로 응답
    client.ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now(),
        originalTimestamp: message.timestamp
    }));
}

/**
 * 클라이언트 연결 해제 메시지 처리
 */
function handleClientDisconnect(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    console.log(`📄 클라이언트 정상 연결 해제: ${clientId} (${message.reason || 'unknown'})`);
    
    // 정상적인 연결 해제 처리
    handleDisconnect(clientId);
}

/**
 * 관리자들에게 브로드캐스트
 */
function broadcastToAdmins(message) {
    for (const adminClientId of adminClients) {
        const admin = clients.get(adminClientId);
        if (admin && admin.ws.readyState === WebSocket.OPEN) {
            admin.ws.send(JSON.stringify(message));
        }
    }
}

// ========== 정리 작업 ==========

/**
 * 비활성 세션 정리
 */
function cleanupInactiveSessions() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30분
    
    for (const [sessionCode, sessionData] of sessions.entries()) {
        if (now - sessionData.lastActivity > timeout) {
            sessions.delete(sessionCode);
            usedCodes.delete(sessionCode);
            console.log(`🧹 비활성 세션 정리: ${sessionCode}`);
        }
    }
}

/**
 * 빈 룸 정리
 */
function cleanupEmptyRooms() {
    for (const [roomId, roomData] of rooms.entries()) {
        if (roomData.players.size === 0) {
            rooms.delete(roomId);
            roomList.delete(roomId);
            console.log(`🧹 빈 룸 정리: ${roomId}`);
        }
    }
}

// 정리 작업 스케줄링
setInterval(cleanupInactiveSessions, 5 * 60 * 1000); // 5분마다
setInterval(cleanupEmptyRooms, 1 * 60 * 1000); // 1분마다

// ========== 서버 시작 ==========

// 게임 레지스트리 로드
loadGameRegistry();

// 파일 시스템 감시 (게임 자동 등록)
const gamesDir = path.join(__dirname, 'games');
fs.watch(gamesDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('game.json')) {
        console.log(`📁 게임 파일 변경 감지: ${filename}`);
        setTimeout(() => loadGameRegistry(), 1000); // 1초 후 다시 로드
    }
});

// 서버 시작
server.listen(PORT, HOST, () => {
    console.log(`
🚀 센서 게임 허브 v4.0 시작!
==============================================
🌐 메인 허브: http://${HOST}:${PORT}
📱 센서 클라이언트: http://${HOST}:${PORT}/sensor
🎮 게임 수: ${gameRegistry.size}개
📊 API: http://${HOST}:${PORT}/api
==============================================
`);
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
    console.log('\n🛑 서버 종료 중...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 서버 종료 중...');
    process.exit(0);
});