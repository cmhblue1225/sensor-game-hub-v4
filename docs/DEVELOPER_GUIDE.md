# 📚 센서 게임 허브 v4.0 - 개발자 가이드

> **완벽한 센서 게임 개발을 위한 종합 가이드**

## 🎯 개요

센서 게임 허브 v4.0은 개발자들이 모바일 센서(자이로스코프, 가속도계, 방향센서)를 활용한 게임을 쉽게 개발하고 배포할 수 있는 완전한 플랫폼입니다.

### ✨ 주요 특징

- **🎮 완벽한 세션 매칭**: PC와 모바일 간 4자리 코드로 안전한 연결
- **👥 멀티플레이어 지원**: 최대 8명까지 실시간 멀티플레이어 게임
- **📱 다중 센서 지원**: 한 PC에 최대 2개의 센서 클라이언트 연결 가능
- **🛠️ 강력한 SDK**: JavaScript 기반 완전한 센서 게임 개발 도구
- **🔄 자동 게임 등록**: games 폴더에 추가하면 자동으로 허브에 표시
- **🌐 크로스 플랫폼**: iOS, Android, 데스크톱 모든 플랫폼 지원
- **🔒 HTTPS 지원**: iOS 센서 권한을 위한 완전한 SSL 설정

## 🚀 빠른 시작

### 1. 개발 환경 설정

```bash
# 허브 플랫폼 클론 또는 다운로드
git clone https://github.com/your-username/sensor-game-hub-v4.git
cd sensor-game-hub-v4

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 2. 첫 번째 게임 생성

```bash
# 솔로 게임 템플릿 복사
cp -r templates/solo-template games/my-first-game

# 또는 멀티플레이어 게임 템플릿 복사
cp -r templates/multiplayer-template games/my-multiplayer-game

# 게임 폴더로 이동
cd games/my-first-game

# 게임 정보 수정
nano game.json
```

### 3. 기본 게임 구조 이해

```javascript
class MyGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'my-first-game',
            gameName: 'My First Game',
            gameType: 'solo', // 'solo' 또는 'multiplayer'
            sensorTypes: ['orientation', 'accelerometer'],
            multiSensor: false, // true면 2개 센서 지원
            sensorSensitivity: {
                orientation: 0.8,    // 방향 센서 감도
                accelerometer: 0.5,  // 가속도계 감도
                gyroscope: 0.3       // 자이로스코프 감도
            }
        });
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupCallbacks();
        this.initializeGameWorld();
    }
    
    // 센서 데이터 처리
    handleSensorInput(data) {
        const { gameInput, sensorType } = data;
        
        if (gameInput.tilt) {
            this.player.x += gameInput.tilt.x * 5;
            this.player.y += gameInput.tilt.y * 5;
        }
        
        if (gameInput.shake && gameInput.shake.detected) {
            this.triggerSpecialAction();
        }
    }
}
```

## 🏗️ 프로젝트 구조

```
sensor-game-hub-v4/
├── server.js                 # 메인 서버 (WebSocket + HTTP)
├── package.json              # 프로젝트 설정 및 의존성
├── client/                   # 클라이언트 파일들
│   ├── hub.html             # 메인 허브 페이지 (PC)
│   └── sensor.html          # 센서 클라이언트 페이지 (모바일)
├── sdk/                     # 게임 개발 SDK
│   ├── sensor-game-sdk.js   # 메인 SDK
│   └── utils.js             # 유틸리티 함수들
├── games/                   # 게임들이 저장되는 폴더
│   ├── example-solo/        # 솔로 게임 예시
│   └── example-multi/       # 멀티 게임 예시
├── templates/               # 게임 개발 템플릿
│   ├── solo-template/       # 솔로 게임 템플릿
│   └── multiplayer-template/# 멀티 게임 템플릿
└── docs/                    # 문서들
    ├── LLM_GUIDE.md         # LLM 에이전트용 가이드
    ├── DEVELOPER_GUIDE.md   # 이 문서
    └── API_REFERENCE.md     # API/SDK 전문 문서
```

## 🎮 게임 개발 프로세스

### 1단계: 게임 타입 결정

#### 솔로 게임 (Solo Game)
- **특징**: 1명의 플레이어가 센서를 사용하여 플레이
- **사용 사례**: 퍼즐 게임, 액션 게임, 스포츠 시뮬레이션
- **세션 매칭**: PC에서 4자리 코드 발급 → 모바일에서 입력

#### 멀티플레이어 게임 (Multiplayer Game)
- **특징**: 2-8명의 플레이어가 함께 플레이
- **사용 사례**: 경쟁 게임, 협동 게임, 파티 게임
- **룸 시스템**: 호스트가 룸 생성 → 다른 플레이어들이 참가

#### 다중 센서 게임 (Multi-Sensor Game)
- **특징**: 한 플레이어가 2개의 센서 클라이언트 사용
- **사용 사례**: 양손 전투 게임 (왼손 방패, 오른손 칼)
- **설정**: `multiSensor: true`로 활성화

### 2단계: 템플릿 선택 및 복사

```bash
# 솔로 게임 개발
cp -r templates/solo-template games/새로운게임이름

# 멀티플레이어 게임 개발
cp -r templates/multiplayer-template games/새로운게임이름
```

### 3단계: 게임 메타데이터 설정

`game.json` 파일을 수정하여 게임 정보를 설정합니다:

```json
{
    "id": "unique-game-id",
    "name": "🎮 게임 이름",
    "description": "게임에 대한 설명",
    "author": "개발자 이름",
    "version": "1.0.0",
    "category": "action",
    "difficulty": "medium",
    "gameType": "solo",
    "icon": "🎮",
    "sensorTypes": ["orientation", "accelerometer"],
    "features": ["sensor-control", "single-player"],
    "minPlayers": 1,
    "maxPlayers": 1,
    "estimatedPlayTime": "5-10분",
    "controls": {
        "orientation": "기기 기울이기로 이동",
        "accelerometer": "흔들기로 특수 액션",
        "keyboard": "시뮬레이션 모드: WASD + 스페이스바"
    },
    "requirements": {
        "sensors": ["orientation"],
        "permissions": ["deviceorientation"],
        "browsers": ["Chrome", "Safari", "Firefox"],
        "platforms": ["iOS", "Android", "Desktop"]
    }
}
```

### 4단계: 게임 로직 구현

`game.js` 파일에서 게임의 핵심 로직을 구현합니다.

## 📖 센서 게임 SDK v4.0 상세 가이드

### SDK 초기화

```javascript
class MyGame extends SensorGameSDK {
    constructor() {
        super({
            // 필수 설정
            gameId: 'unique-game-id',
            gameName: 'My Awesome Game',
            gameType: 'solo', // 'solo' 또는 'multiplayer'
            version: '1.0.0',
            
            // 센서 설정
            sensorTypes: ['orientation', 'accelerometer', 'gyroscope'],
            multiSensor: false, // 다중 센서 지원 여부
            sensorSensitivity: {
                orientation: 1.0,    // 방향 센서 감도 (0.1 ~ 2.0)
                accelerometer: 1.0,  // 가속도계 감도 (0.1 ~ 2.0)
                gyroscope: 1.0       // 자이로스코프 감도 (0.1 ~ 2.0)
            },
            
            // 데이터 처리 설정
            smoothingFactor: 3,      // 데이터 스무싱 정도 (1 ~ 10)
            deadzone: 0.1,           // 데드존 크기 (0 ~ 0.5)
            updateRate: 60,          // 업데이트 주기 (FPS)
            
            // 멀티플레이어 설정 (gameType이 'multiplayer'인 경우)
            maxPlayers: 4,           // 최대 플레이어 수
            minPlayers: 2            // 최소 플레이어 수
        });
    }
}
```

### 센서 데이터 처리

```javascript
// 기본 센서 데이터 콜백
setupCallbacks() {
    this.on('onSensorData', (data) => {
        const { gameInput, sensorType, rawData } = data;
        
        // 기울기 입력 (-1 ~ 1 범위)
        if (gameInput.tilt) {
            console.log('기울기:', gameInput.tilt); // { x: -1~1, y: -1~1 }
            this.player.velocity.x += gameInput.tilt.x * this.speed;
            this.player.velocity.y += gameInput.tilt.y * this.speed;
        }
        
        // 움직임 입력 (가속도계)
        if (gameInput.movement) {
            console.log('움직임:', gameInput.movement); // { x, y, z }
            this.handleMovement(gameInput.movement);
        }
        
        // 회전 입력 (자이로스코프)
        if (gameInput.rotation) {
            console.log('회전:', gameInput.rotation); // { x, y, z }
            this.handleRotation(gameInput.rotation);
        }
        
        // 흔들기 감지
        if (gameInput.shake && gameInput.shake.detected) {
            console.log('흔들기 강도:', gameInput.shake.intensity);
            this.triggerSpecialAction();
        }
        
        // 제스처 감지
        if (gameInput.gesture) {
            console.log('제스처:', gameInput.gesture); // { type, confidence }
            this.handleGesture(gameInput.gesture);
        }
        
        // 다중 센서 처리
        if (sensorType === 'primary') {
            // 주 센서 (오른손) 처리
        } else if (sensorType === 'secondary') {
            // 보조 센서 (왼손) 처리
        }
    });
    
    // 연결 상태 변경
    this.on('onConnectionChange', (isConnected) => {
        if (isConnected) {
            console.log('서버 연결됨');
        } else {
            console.log('서버 연결 끊김 - 시뮬레이션 모드');
        }
    });
    
    // 세션 코드 생성
    this.on('onSessionCreated', (data) => {
        console.log('세션 코드 생성:', data.sessionCode);
        this.showSessionCode(data.sessionCode);
    });
    
    // 센서 연결
    this.on('onSensorConnected', (data) => {
        console.log('센서 연결 성공:', data.sensorType);
        this.hideSessionCode();
        this.onSensorReady();
    });
    
    // 센서 연결 해제
    this.on('onSensorDisconnected', () => {
        console.log('센서 연결 해제');
        this.onSensorLost();
    });
    
    // 센서 보정 완료
    this.on('onCalibration', (calibrationData) => {
        console.log('센서 보정 완료:', calibrationData);
    });
    
    // 오류 처리
    this.on('onError', (error) => {
        console.error('게임 오류:', error);
        this.handleError(error);
    });
}
```

### 멀티플레이어 기능

```javascript
// 멀티플레이어 게임 설정
class MyMultiplayerGame extends SensorGameSDK {
    constructor() {
        super({
            gameType: 'multiplayer',
            maxPlayers: 4,
            minPlayers: 2
        });
        
        this.players = new Map();
        this.setupMultiplayerCallbacks();
    }
    
    setupMultiplayerCallbacks() {
        // 룸 생성 완료
        this.on('onRoomCreated', (data) => {
            console.log('룸 생성됨:', data.roomId);
            this.showLobby([{ nickname: '호스트', isHost: true }]);
        });
        
        // 룸 참가 완료
        this.on('onRoomJoined', (roomData) => {
            console.log('룸 참가:', roomData);
            this.showLobby(Array.from(roomData.players.values()));
        });
        
        // 플레이어 참가
        this.on('onPlayerJoined', (data) => {
            console.log('새 플레이어:', data.player.nickname);
            this.players.set(data.player.sessionId, data.player);
            this.updatePlayerList();
        });
        
        // 플레이어 퇴장
        this.on('onPlayerLeft', (data) => {
            console.log('플레이어 퇴장:', data.sessionId);
            this.players.delete(data.sessionId);
            this.updatePlayerList();
        });
        
        // 게임 시작
        this.on('onGameStarted', (data) => {
            console.log('게임 시작:', data);
            this.hideLobby();
            this.startGameplay();
        });
        
        // 멀티플레이어 이벤트 수신
        this.on('onGameEvent', (data) => {
            console.log('플레이어 이벤트:', data);
            this.handlePlayerEvent(data);
        });
        
        // 룸 종료
        this.on('onRoomClosed', (data) => {
            console.log('룸 종료:', data.reason);
            this.returnToHub();
        });
    }
    
    // 다른 플레이어들에게 이벤트 전송
    sendPlayerAction(actionType, actionData) {
        this.sendGameEvent(actionType, {
            playerId: this.state.sessionId,
            position: this.player.position,
            action: actionData,
            timestamp: Date.now()
        });
    }
    
    // 다른 플레이어 이벤트 처리
    handlePlayerEvent(eventData) {
        const { sessionId, eventType, data } = eventData;
        
        switch (eventType) {
            case 'player_move':
                this.updateOtherPlayerPosition(sessionId, data.position);
                break;
            case 'player_action':
                this.executePlayerAction(sessionId, data.action);
                break;
            case 'player_score':
                this.updatePlayerScore(sessionId, data.score);
                break;
        }
    }
}
```

### 커스텀 센서 처리

```javascript
// 센서 데이터를 게임 입력으로 변환하는 메서드 오버라이드
convertToGameInput(sensorType, rawData) {
    // 부모 클래스의 기본 처리 실행
    super.convertToGameInput(sensorType, rawData);
    
    // 커스텀 처리 추가
    const gameInput = this.gameInput[sensorType];
    const { orientation, accelerometer, gyroscope } = rawData;
    
    if (orientation) {
        // 특별한 기울기 처리
        gameInput.customTilt = {
            forward: Math.max(0, -orientation.beta / 45),
            backward: Math.max(0, orientation.beta / 45),
            left: Math.max(0, -orientation.gamma / 45),
            right: Math.max(0, orientation.gamma / 45)
        };
        
        // 휴대폰 방향 감지
        gameInput.deviceOrientation = this.detectDeviceOrientation(orientation);
    }
    
    if (accelerometer) {
        // 점프 감지
        gameInput.jump = accelerometer.y > 8;
        
        // 보행 감지
        gameInput.walking = this.detectWalkingPattern(accelerometer);
    }
    
    if (gyroscope) {
        // 회전 제스처 감지
        const rotationSpeed = Math.abs(gyroscope.alpha);
        if (rotationSpeed > 100) {
            gameInput.spinGesture = {
                type: 'spin',
                direction: gyroscope.alpha > 0 ? 'clockwise' : 'counterclockwise',
                intensity: Math.min(rotationSpeed / 200, 1)
            };
        }
    }
}

// 커스텀 제스처 감지
detectGestures(sensorType, rawData) {
    super.detectGestures(sensorType, rawData);
    
    const gameInput = this.gameInput[sensorType];
    
    // 원형 제스처 감지
    if (this.isCircularMotion(rawData.gyroscope)) {
        gameInput.gesture = {
            type: 'circle',
            direction: this.getCircleDirection(rawData.gyroscope),
            confidence: this.calculateGestureConfidence(rawData)
        };
    }
    
    // 더블 탭 감지
    if (this.isDoubleTap(rawData.accelerometer)) {
        gameInput.gesture = {
            type: 'double_tap',
            confidence: 0.9,
            timestamp: Date.now()
        };
    }
}
```

## 📋 game.json 상세 명세

### 필수 필드

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | string | 고유한 게임 식별자 | "my-awesome-game" |
| `name` | string | 게임 이름 (이모지 포함 가능) | "🎮 My Awesome Game" |
| `description` | string | 게임 설명 | "센서로 조종하는 액션 게임" |
| `author` | string | 개발자 이름 | "홍길동" |
| `version` | string | 게임 버전 (Semantic Versioning) | "1.0.0" |
| `gameType` | string | 게임 타입 | "solo" 또는 "multiplayer" |
| `category` | string | 게임 카테고리 | "action", "puzzle", "racing" 등 |
| `difficulty` | string | 난이도 | "easy", "medium", "hard", "expert" |
| `sensorTypes` | array | 사용하는 센서 타입들 | ["orientation", "accelerometer"] |
| `minPlayers` | number | 최소 플레이어 수 | 1 |
| `maxPlayers` | number | 최대 플레이어 수 | 1 (솔로), 2-8 (멀티) |

### 선택적 필드

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `icon` | string | 게임 아이콘 (이모지 권장) | "🎮" |
| `features` | array | 게임 특징들 | ["sensor-control", "physics"] |
| `estimatedPlayTime` | string | 예상 플레이 타임 | "5-10분" |
| `controls` | object | 조작법 설명 | 아래 예시 참조 |
| `requirements` | object | 게임 요구사항 | 아래 예시 참조 |
| `multiplayerSettings` | object | 멀티플레이어 설정 | 아래 예시 참조 |

### 카테고리 목록

- `action` - 액션 게임
- `puzzle` - 퍼즐 게임  
- `racing` - 레이싱 게임
- `sports` - 스포츠 게임
- `adventure` - 어드벤처 게임
- `simulation` - 시뮬레이션 게임
- `strategy` - 전략 게임
- `casual` - 캐주얼 게임
- `multiplayer` - 멀티플레이어 전용
- `template` - 개발 템플릿

### 센서 타입

- `orientation` - 방향 센서 (기울기) - **필수 권장**
- `accelerometer` - 가속도계 (움직임, 흔들기)
- `gyroscope` - 자이로스코프 (회전)

### 완전한 game.json 예시

```json
{
    "id": "space-battle-arena",
    "name": "🚀 우주 전투 아레나",
    "description": "센서로 우주선을 조종하여 적들과 전투하는 멀티플레이어 게임입니다.",
    "author": "우주게임 스튜디오",
    "version": "2.1.0",
    "category": "action",
    "difficulty": "hard",
    "gameType": "multiplayer",
    "icon": "🚀",
    "sensorTypes": ["orientation", "accelerometer", "gyroscope"],
    "features": [
        "multiplayer",
        "sensor-control", 
        "real-time",
        "competitive",
        "physics",
        "3d-graphics"
    ],
    "minPlayers": 2,
    "maxPlayers": 6,
    "estimatedPlayTime": "10-15분",
    "controls": {
        "orientation": "기기 기울이기로 우주선 조종",
        "accelerometer": "흔들기로 미사일 발사",
        "gyroscope": "회전으로 스핀 공격",
        "keyboard": "시뮬레이션 모드: WASD + 스페이스바 + 화살표"
    },
    "requirements": {
        "sensors": ["orientation"],
        "permissions": ["deviceorientation", "devicemotion"],
        "browsers": ["Chrome", "Safari", "Firefox", "Edge"],
        "platforms": ["iOS", "Android", "Desktop"],
        "minScreenSize": "320x480",
        "recommendedRAM": "1GB"
    },
    "multiplayerSettings": {
        "roomCapacity": 6,
        "spectatorMode": true,
        "teamMode": false,
        "realTimeSync": true,
        "hostMigration": false,
        "matchmaking": "manual"
    },
    "gameMode": {
        "type": "battle_royale",
        "description": "마지막 한 명이 남을 때까지 치열한 우주 전투",
        "objective": "다른 플레이어들을 모두 격파하고 최후의 생존자가 되세요",
        "winCondition": "마지막 생존자",
        "timeLimit": "10분"
    },
    "screenshots": [
        "screenshot1.jpg",
        "screenshot2.jpg",
        "screenshot3.jpg"
    ],
    "changelog": {
        "2.1.0": "새로운 무기 시스템 추가, 밸런스 조정",
        "2.0.0": "멀티플레이어 모드 추가",
        "1.5.0": "그래픽 개선 및 성능 최적화",
        "1.0.0": "초기 릴리즈"
    },
    "tags": ["space", "battle", "multiplayer", "competitive"],
    "ageRating": "12+",
    "language": ["ko", "en"],
    "repository": "https://github.com/username/space-battle-arena"
}
```

## 🎮 게임 개발 패턴

### 1. 솔로 게임 패턴

```javascript
class SinglePlayerGame extends SensorGameSDK {
    constructor() {
        super({
            gameType: 'solo',
            sensorTypes: ['orientation', 'accelerometer']
        });
        
        this.setupSoloGame();
        this.setupCallbacks();
        this.initGame();
    }
    
    setupCallbacks() {
        this.on('onSensorData', (data) => {
            this.handleInput(data.gameInput);
        });
        
        this.on('onSessionCreated', (data) => {
            this.showSessionCode(data.sessionCode);
        });
        
        this.on('onSensorConnected', () => {
            this.hideSessionCode();
            this.startGame();
        });
    }
    
    setupSoloGame() {
        this.gameState = {
            isPlaying: false,
            score: 0,
            level: 1,
            lives: 3
        };
        
        this.player = {
            x: 0, y: 0,
            velocity: { x: 0, y: 0 },
            health: 100
        };
    }
    
    handleInput(gameInput) {
        if (!this.gameState.isPlaying) return;
        
        // 기울기로 플레이어 이동
        if (gameInput.tilt) {
            this.player.velocity.x += gameInput.tilt.x * this.config.speed;
            this.player.velocity.y += gameInput.tilt.y * this.config.speed;
        }
        
        // 흔들기로 특수 액션
        if (gameInput.shake && gameInput.shake.detected) {
            this.performSpecialAction();
        }
    }
    
    startGame() {
        this.gameState.isPlaying = true;
        this.gameLoop();
    }
    
    gameLoop() {
        if (this.gameState.isPlaying) {
            this.update();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}
```

### 2. 멀티플레이어 게임 패턴

```javascript
class MultiplayerGame extends SensorGameSDK {
    constructor() {
        super({
            gameType: 'multiplayer',
            maxPlayers: 4,
            minPlayers: 2
        });
        
        this.players = new Map();
        this.isHost = false;
        this.setupMultiplayerGame();
    }
    
    setupMultiplayerGame() {
        this.setupCallbacks();
        this.setupLobbyUI();
    }
    
    setupCallbacks() {
        // 기본 센서 콜백들
        this.on('onSensorData', (data) => {
            if (this.gameState.isPlaying) {
                this.handleInput(data.gameInput);
            }
        });
        
        // 멀티플레이어 콜백들
        this.on('onRoomCreated', (data) => {
            this.isHost = true;
            this.showLobby([{ 
                nickname: '호스트', 
                isHost: true,
                isReady: true 
            }]);
        });
        
        this.on('onPlayerJoined', (data) => {
            this.players.set(data.player.sessionId, data.player);
            this.updateLobby();
        });
        
        this.on('onGameStarted', () => {
            this.hideLobby();
            this.startMultiplayerGame();
        });
        
        this.on('onGameEvent', (data) => {
            this.handlePlayerEvent(data);
        });
    }
    
    startMultiplayerGame() {
        this.gameState.isPlaying = true;
        this.syncGameState();
        this.gameLoop();
    }
    
    handlePlayerEvent(eventData) {
        const { sessionId, eventType, data } = eventData;
        
        switch (eventType) {
            case 'player_move':
                this.updatePlayerPosition(sessionId, data.position);
                break;
            case 'player_attack':
                this.processPlayerAttack(sessionId, data);
                break;
            case 'player_powerup':
                this.activatePlayerPowerup(sessionId, data.powerupType);
                break;
        }
    }
    
    sendPlayerAction(actionType, actionData) {
        this.sendGameEvent(actionType, {
            playerId: this.state.sessionId,
            timestamp: Date.now(),
            ...actionData
        });
    }
}
```

### 3. 다중 센서 게임 패턴

```javascript
class DualSensorGame extends SensorGameSDK {
    constructor() {
        super({
            gameType: 'solo',
            multiSensor: true, // 2개 센서 지원 활성화
            sensorTypes: ['orientation', 'accelerometer']
        });
        
        this.setupDualSensorGame();
    }
    
    setupDualSensorGame() {
        this.leftHand = {
            weapon: 'shield',
            position: { x: 0, y: 0, angle: 0 },
            action: null
        };
        
        this.rightHand = {
            weapon: 'sword',
            position: { x: 0, y: 0, angle: 0 },
            action: null
        };
        
        this.setupCallbacks();
    }
    
    setupCallbacks() {
        this.on('onSensorData', (data) => {
            this.handleDualSensorInput(data);
        });
        
        this.on('onSensorConnected', (data) => {
            console.log(`${data.sensorType} 센서 연결됨`);
            this.updateSensorStatus();
        });
    }
    
    handleDualSensorInput(data) {
        const { gameInput, sensorType } = data;
        
        if (sensorType === 'primary') {
            // 주 센서 (오른손) - 검 조작
            this.rightHand.position.angle = gameInput.tilt.x * 90;
            
            if (gameInput.shake && gameInput.shake.detected) {
                this.rightHand.action = 'slash';
                this.performSwordAttack();
            }
            
            if (gameInput.gesture && gameInput.gesture.type === 'swipe') {
                this.rightHand.action = 'combo';
                this.performComboAttack(gameInput.gesture.direction);
            }
            
        } else if (sensorType === 'secondary') {
            // 보조 센서 (왼손) - 방패 조작
            this.leftHand.position.angle = gameInput.tilt.x * 90;
            
            if (gameInput.shake && gameInput.shake.detected) {
                this.leftHand.action = 'block';
                this.activateShieldBlock();
            }
            
            if (gameInput.movement && gameInput.movement.z > 8) {
                this.leftHand.action = 'bash';
                this.performShieldBash();
            }
        }
        
        // 양손 조합 액션
        this.checkCombinationActions();
    }
    
    checkCombinationActions() {
        // 양손 동시 흔들기 = 특수 공격
        if (this.leftHand.action === 'block' && 
            this.rightHand.action === 'slash') {
            this.performUltimateAttack();
        }
        
        // 양손 기울기 조합 = 방어 자세
        const avgAngle = (this.leftHand.position.angle + this.rightHand.position.angle) / 2;
        if (Math.abs(avgAngle) > 45) {
            this.activateDefenseStance();
        }
    }
}
```

## 🛠️ 유틸리티 함수들

SDK에는 게임 개발에 유용한 유틸리티 함수들이 포함되어 있습니다.

### 수학 유틸리티

```javascript
// 기본 수학 함수들
const distance = SensorGameUtils.math.distance({ x: 0, y: 0 }, { x: 3, y: 4 }); // 5
const clamped = SensorGameUtils.math.clamp(150, 0, 100); // 100
const lerped = SensorGameUtils.math.lerp(0, 100, 0.5); // 50
const normalized = SensorGameUtils.math.normalizeAngle(370); // 10

// 벡터 계산
const magnitude = SensorGameUtils.math.magnitude({ x: 3, y: 4 }); // 5
const normalized = SensorGameUtils.math.normalize({ x: 3, y: 4 }); // { x: 0.6, y: 0.8 }
const dotProduct = SensorGameUtils.math.dot({ x: 1, y: 0 }, { x: 0, y: 1 }); // 0

// 랜덤 함수들
const randomFloat = SensorGameUtils.math.randomRange(0, 100); // 0~100 사이 소수
const randomInt = SensorGameUtils.math.randomInt(1, 6); // 1~6 사이 정수
```

### 충돌 감지

```javascript
// 사각형 충돌
const rectCollision = SensorGameUtils.collision.rectRect(
    { x: 0, y: 0, width: 50, height: 50 },
    { x: 25, y: 25, width: 50, height: 50 }
); // true

// 원 충돌
const circleCollision = SensorGameUtils.collision.circleCircle(
    { x: 0, y: 0, radius: 25 },
    { x: 30, y: 0, radius: 25 }
); // true

// 점과 사각형 충돌
const pointRectCollision = SensorGameUtils.collision.pointRect(
    { x: 25, y: 25 },
    { x: 0, y: 0, width: 50, height: 50 }
); // true

// 점과 원 충돌
const pointCircleCollision = SensorGameUtils.collision.pointCircle(
    { x: 10, y: 10 },
    { x: 0, y: 0, radius: 15 }
); // true
```

### 디바이스 및 센서 감지

```javascript
// 디바이스 감지
const device = SensorGameUtils.detectDevice();
console.log(device.isMobile); // true/false
console.log(device.isIOS); // true/false
console.log(device.isAndroid); // true/false
console.log(device.platform); // "iPhone", "Android" 등

// 센서 지원 여부 확인
const sensorSupport = SensorGameUtils.checkSensorSupport();
console.log(sensorSupport.orientation); // true/false
console.log(sensorSupport.motion); // true/false
console.log(sensorSupport.permissions); // true/false

// iOS 센서 권한 요청
const permissionGranted = await SensorGameUtils.requestIOSPermissions();
```

### 성능 최적화

```javascript
// FPS 카운터 생성
const fpsCounter = SensorGameUtils.performance.createFPSCounter();
const fps = fpsCounter.update(); // 매 프레임마다 호출

// 객체 풀 생성
const bulletPool = SensorGameUtils.performance.createPool(
    () => new Bullet(),          // 생성 함수
    (bullet) => bullet.reset(),  // 리셋 함수
    20                          // 초기 크기
);

const bullet = bulletPool.get();    // 풀에서 가져오기
bulletPool.release(bullet);         // 풀에 반환

// 디바운스 및 스로틀
const debouncedFunction = SensorGameUtils.performance.debounce(
    () => console.log('실행됨'), 300
);

const throttledFunction = SensorGameUtils.performance.throttle(
    () => console.log('실행됨'), 100
);
```

### 색상 및 애니메이션

```javascript
// 색상 변환
const rgb = SensorGameUtils.color.hexToRgb('#ff0000'); // { r: 255, g: 0, b: 0 }
const hex = SensorGameUtils.color.rgbToHex(255, 0, 0); // "#ff0000"
const hslRgb = SensorGameUtils.color.hslToRgb(120, 100, 50); // 녹색

// 색상 보간
const interpolated = SensorGameUtils.color.interpolate('#ff0000', '#00ff00', 0.5);

// 애니메이션
SensorGameUtils.animation.animate({
    duration: 1000,
    easing: 'easeInOutQuad',
    onUpdate: (progress) => {
        this.player.x = SensorGameUtils.math.lerp(0, 100, progress);
    },
    onComplete: () => {
        console.log('애니메이션 완료');
    }
});
```

### DOM 및 저장소

```javascript
// DOM 조작
const element = SensorGameUtils.dom.create('div', 'my-class', parentElement);
SensorGameUtils.dom.css(element, { color: 'red', fontSize: '16px' });
const removeListener = SensorGameUtils.dom.on(element, 'click', handleClick);

// 로컬 저장소
SensorGameUtils.storage.set('game-save', { score: 1000, level: 5 });
const saveData = SensorGameUtils.storage.get('game-save', { score: 0, level: 1 });
SensorGameUtils.storage.remove('game-save');

// 유틸리티 함수들
const id = SensorGameUtils.generateId(8); // "a1b2c3d4"
const cloned = SensorGameUtils.deepClone(originalObject);
```

## 🎨 UI 개발 가이드

### CSS 변수 활용

```css
:root {
    --primary: #6366f1;
    --secondary: #ec4899;
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --background: #0f172a;
    --surface: #1e293b;
    --card: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --border: #475569;
    
    /* 플레이어 색상 (멀티플레이어용) */
    --player1: #6366f1;
    --player2: #ec4899;
    --player3: #10b981;
    --player4: #f59e0b;
}
```

### 필수 UI 요소들

```html
<!-- 세션 코드 패널 (자동 표시/숨김) -->
<div class="ui-panel session-code-panel hidden" id="sessionCodePanel">
    <div class="session-code-title">📱 모바일에서 입력하세요</div>
    <div class="session-code-display" id="sessionCodeDisplay">----</div>
</div>

<!-- 게임 정보 패널 -->
<div class="ui-panel top-left">
    <div class="score">점수: <span id="scoreValue">0</span></div>
    <div class="status" id="gameStatus">게임 준비중...</div>
    <div class="status" id="sensorStatus">센서 연결 대기중...</div>
</div>

<!-- 멀티플레이어 스코어보드 -->
<div class="ui-panel scoreboard" id="playerScoreboard">
    <div class="scoreboard-title">🏆 점수</div>
    <div id="playerScores">
        <!-- 플레이어 점수들이 동적으로 생성됩니다 -->
    </div>
</div>

<!-- 컨트롤 버튼 -->
<div class="ui-panel bottom-center">
    <button class="btn btn-secondary" onclick="game.calibrate()">⚖️ 센서 보정</button>
    <button class="btn btn-secondary" onclick="game.restart()">🔄 다시 시작</button>
    <button class="btn btn-secondary" onclick="window.open('/', '_blank')">🏠 허브로</button>
</div>
```

### UI 업데이트 함수들

```javascript
// 점수 업데이트
updateScore() {
    const scoreElement = document.getElementById('scoreValue');
    if (scoreElement) {
        scoreElement.textContent = this.gameState.score;
    }
}

// 게임 상태 업데이트
updateGameStatus(status) {
    const statusElement = document.getElementById('gameStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// 센서 상태 업데이트
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

// 세션 코드 표시/숨김 (SDK가 자동 호출)
showSessionCode(sessionCode) {
    const panel = document.getElementById('sessionCodePanel');
    const display = document.getElementById('sessionCodeDisplay');
    
    if (panel && display) {
        display.textContent = sessionCode;
        panel.classList.remove('hidden');
    }
}

hideSessionCode() {
    const panel = document.getElementById('sessionCodePanel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

// 멀티플레이어 스코어보드 업데이트
updatePlayerScoreboard(players) {
    const scoreboard = document.getElementById('playerScores');
    if (!scoreboard) return;
    
    scoreboard.innerHTML = '';
    players.forEach((player, index) => {
        const scoreElement = document.createElement('div');
        scoreElement.className = `player-score player${index + 1}`;
        scoreElement.innerHTML = `
            <div class="player-name">
                <div class="player-color"></div>
                <span>${player.nickname}</span>
            </div>
            <div>${player.score || 0}</div>
        `;
        scoreboard.appendChild(scoreElement);
    });
}
```

### 반응형 캔버스 설정

```javascript
setupCanvas() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // 게임 객체들 위치 재조정
        this.repositionGameObjects();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}
```

## 🧪 테스트 및 디버깅

### 센서 시뮬레이션

개발 중에는 실제 센서 없이도 테스트할 수 있습니다:

```javascript
// 키보드로 센서 시뮬레이션 (자동 지원됨)
// WASD - 기울기
// 화살표 키 - 가속도계
// 스페이스 - 흔들기
// R - 센서 보정

// 커스텀 시뮬레이션 데이터 생성
generateSimulationData() {
    return {
        orientation: {
            alpha: this.simulationState.alpha,
            beta: this.simulationState.beta,
            gamma: this.simulationState.gamma
        },
        accelerometer: {
            x: this.simulationState.accelX,
            y: this.simulationState.accelY,
            z: this.simulationState.accelZ
        },
        gyroscope: {
            alpha: this.simulationState.gyroAlpha,
            beta: this.simulationState.gyroBeta,
            gamma: this.simulationState.gyroGamma
        }
    };
}
```

### 디버그 정보 출력

```javascript
// 성능 통계 확인
const stats = this.getStats();
console.log('FPS:', stats.fps);
console.log('연결 상태:', stats.isConnected);
console.log('센서 연결:', stats.sensorConnected);
console.log('시뮬레이션 모드:', stats.simulationMode);

// 현재 센서 데이터 확인
const sensorData = this.getSensorData('primary');
console.log('주 센서 데이터:', sensorData);

const secondarySensorData = this.getSensorData('secondary');
console.log('보조 센서 데이터:', secondarySensorData);

// 현재 게임 입력 확인
const gameInput = this.getGameInput('primary');
console.log('주 센서 게임 입력:', gameInput);

// 전체 상태 확인
const state = this.getState();
console.log('SDK 전체 상태:', state);
```

### 연결 상태 확인

```javascript
// 연결 상태 모니터링
this.on('onConnectionChange', (isConnected) => {
    console.log('서버 연결 상태:', isConnected);
    
    if (!isConnected) {
        // 시뮬레이션 모드로 전환
        this.enableSimulationMode();
    }
});

// 센서 연결 상태 모니터링
this.on('onSensorConnected', (data) => {
    console.log(`센서 연결: ${data.sensorType} (총 ${data.sensorCount}개)`);
});

this.on('onSensorDisconnected', (data) => {
    console.log(`센서 연결 해제 (남은 센서: ${data.sensorCount}개)`);
});

// 디버그 모드 활성화
this.config.showDebug = true; // 화면에 디버그 정보 표시
```

### 일반적인 문제 해결

```javascript
// 센서 데이터가 수신되지 않을 때
this.on('onError', (error) => {
    console.error('오류 발생:', error);
    
    switch (error.type) {
        case 'sensor_permission':
            this.showPermissionGuide();
            break;
        case 'connection':
            this.showConnectionError();
            break;
        case 'session':
            this.resetSession();
            break;
    }
});

// NaN 값 처리
function safePosition(value, defaultValue = 0) {
    return isNaN(value) ? defaultValue : value;
}

updatePlayerPosition(x, y) {
    this.player.x = safePosition(x, this.player.x);
    this.player.y = safePosition(y, this.player.y);
}

// 메모리 누수 방지
destroy() {
    // 게임 루프 중지
    if (this.gameLoopId) {
        cancelAnimationFrame(this.gameLoopId);
        this.gameLoopId = null;
    }
    
    // 이벤트 리스너 제거
    this.removeAllListeners();
    
    // 배열 정리
    this.entities = [];
    this.particles = [];
    this.players.clear();
    
    // SDK 정리
    super.destroy();
}
```

## 📦 배포 가이드

### 게임 파일 구조

배포할 게임은 다음 구조를 가져야 합니다:

```
games/my-awesome-game/
├── game.json          # 게임 메타데이터 (필수)
├── index.html         # 게임 메인 페이지 (필수)
├── game.js            # 게임 로직 (필수)
├── style.css          # 게임 스타일 (선택)
├── assets/            # 리소스 폴더 (선택)
│   ├── images/
│   │   ├── player.png
│   │   └── background.jpg
│   ├── sounds/
│   │   ├── bgm.mp3
│   │   └── effects/
│   │       ├── jump.wav
│   │       └── collect.wav
│   └── fonts/
│       └── game-font.woff2
└── README.md          # 게임 설명 (권장)
```

### 자동 게임 등록

게임을 `games/` 폴더에 저장하면 서버가 자동으로 감지하여 허브에 등록합니다:

1. **파일 감시**: 서버가 `games/` 폴더를 실시간 감시
2. **자동 스캔**: `game.json` 파일이 있는 폴더를 게임으로 인식
3. **즉시 등록**: 새로운 게임이 감지되면 즉시 허브에 표시
4. **핫 리로드**: 게임 파일 수정 시 자동으로 업데이트 반영

### 성능 최적화 가이드

```javascript
// 1. 프레임 레이트 관리
update(currentTime) {
    if (currentTime - this.lastUpdateTime < 16) return; // 60fps 제한
    this.lastUpdateTime = currentTime;
    
    // 게임 로직...
}

// 2. 객체 풀링 사용
this.bulletPool = SensorGameUtils.performance.createPool(
    () => new Bullet(),
    (bullet) => bullet.reset(),
    50
);

// 3. 화면 밖 객체 제거
this.entities = this.entities.filter(entity => {
    return this.isOnScreen(entity);
});

// 4. 센서 업데이트 주기 조정
super({
    updateRate: 30, // 60fps → 30fps로 배터리 절약
    smoothingFactor: 5 // 더 부드러운 움직임
});

// 5. 불필요한 렌더링 최소화
render() {
    if (!this.needsRedraw) return;
    this.needsRedraw = false;
    
    // 렌더링 로직...
}
```

## 🔒 보안 및 모범 사례

### 센서 데이터 검증

```javascript
handleSensorInput(data) {
    // 데이터 유효성 검사
    if (!data || !data.gameInput) {
        console.warn('Invalid sensor data received');
        return;
    }
    
    const { gameInput } = data;
    
    // 범위 검증
    if (gameInput.tilt) {
        const tiltX = this.clamp(gameInput.tilt.x || 0, -1, 1);
        const tiltY = this.clamp(gameInput.tilt.y || 0, -1, 1);
        
        // 검증된 데이터로 게임 로직 실행
        this.movePlayer(tiltX, tiltY);
    }
    
    // NaN 값 필터링
    if (gameInput.movement) {
        const movement = {
            x: isNaN(gameInput.movement.x) ? 0 : gameInput.movement.x,
            y: isNaN(gameInput.movement.y) ? 0 : gameInput.movement.y,
            z: isNaN(gameInput.movement.z) ? 0 : gameInput.movement.z
        };
        
        this.handleMovement(movement);
    }
}
```

### 멀티플레이어 보안

```javascript
// 클라이언트 사이드 검증
sendPlayerAction(action, data) {
    // 액션 유효성 검사
    if (!this.isValidAction(action, data)) {
        console.warn('Invalid action attempted:', action);
        return;
    }
    
    // 스팸 방지 (최소 간격 50ms)
    if (Date.now() - this.lastActionTime < 50) {
        return;
    }
    
    // 데이터 크기 제한
    if (JSON.stringify(data).length > 1024) {
        console.warn('Action data too large');
        return;
    }
    
    this.sendGameEvent(action, data);
    this.lastActionTime = Date.now();
}

// 게임 상태 동기화 검증
validateGameState(remoteState) {
    // 점수 범위 검증
    if (remoteState.score < 0 || remoteState.score > this.maxScore) {
        console.warn('Invalid score received:', remoteState.score);
        return false;
    }
    
    // 위치 범위 검증
    if (remoteState.position) {
        const { x, y } = remoteState.position;
        if (x < 0 || x > this.worldWidth || y < 0 || y > this.worldHeight) {
            console.warn('Invalid position received:', remoteState.position);
            return false;
        }
    }
    
    return true;
}
```

### 에러 처리 및 복구

```javascript
// 견고한 에러 처리
this.on('onError', (error) => {
    console.error('Game error:', error);
    
    switch (error.type) {
        case 'sensor_permission':
            this.showPermissionDialog();
            break;
            
        case 'connection_lost':
            this.enableOfflineMode();
            break;
            
        case 'room_full':
            this.showRoomFullMessage();
            break;
            
        case 'game_state_sync':
            this.requestGameStateSync();
            break;
            
        default:
            this.showGenericError(error.message);
    }
});

// 자동 복구 시스템
setupAutoRecovery() {
    // 연결 복구
    this.on('onConnectionChange', (isConnected) => {
        if (!isConnected) {
            this.startConnectionRecovery();
        }
    });
    
    // 게임 상태 복구
    setInterval(() => {
        this.saveGameState();
    }, 30000); // 30초마다 상태 저장
}

startConnectionRecovery() {
    this.recoveryAttempts = 0;
    this.connectionRecoveryTimer = setInterval(() => {
        this.recoveryAttempts++;
        
        if (this.recoveryAttempts > 10) {
            clearInterval(this.connectionRecoveryTimer);
            this.showConnectionFailedDialog();
            return;
        }
        
        if (this.state.isConnected) {
            clearInterval(this.connectionRecoveryTimer);
            this.onConnectionRecovered();
        }
    }, 2000);
}
```

## 🚀 고급 기능 구현

### 게임 저장/로딩 시스템

```javascript
// 게임 저장
saveGameState() {
    const saveData = {
        version: this.config.version,
        timestamp: Date.now(),
        gameState: {
            score: this.gameState.score,
            level: this.gameState.level,
            lives: this.gameState.lives,
            progress: this.gameState.progress
        },
        playerState: {
            position: this.player.position,
            stats: this.player.stats,
            inventory: this.player.inventory
        },
        worldState: {
            completedLevels: this.completedLevels,
            unlockedFeatures: this.unlockedFeatures
        }
    };
    
    SensorGameUtils.storage.set(`${this.config.gameId}_save`, saveData);
    console.log('게임 저장 완료');
}

// 게임 로딩
loadGameState() {
    const saveData = SensorGameUtils.storage.get(`${this.config.gameId}_save`);
    
    if (!saveData) {
        console.log('저장된 게임이 없습니다.');
        return false;
    }
    
    // 버전 호환성 확인
    if (saveData.version !== this.config.version) {
        console.warn('저장 파일 버전이 다릅니다. 새 게임을 시작합니다.');
        return false;
    }
    
    // 게임 상태 복원
    this.gameState = { ...this.gameState, ...saveData.gameState };
    this.player.position = saveData.playerState.position;
    this.player.stats = saveData.playerState.stats;
    this.player.inventory = saveData.playerState.inventory;
    this.completedLevels = saveData.worldState.completedLevels;
    this.unlockedFeatures = saveData.worldState.unlockedFeatures;
    
    console.log('게임 로딩 완료');
    return true;
}

// 자동 저장
enableAutoSave() {
    setInterval(() => {
        if (this.gameState.isPlaying) {
            this.saveGameState();
        }
    }, 30000); // 30초마다 자동 저장
}
```

### 설정 시스템

```javascript
// 게임 설정 관리
class GameSettings {
    constructor(gameId) {
        this.gameId = gameId;
        this.defaults = {
            // 센서 설정
            sensorSensitivity: 0.8,
            sensorSmoothing: 3,
            sensorDeadzone: 0.1,
            
            // 오디오 설정
            masterVolume: 0.7,
            musicVolume: 0.5,
            effectsVolume: 0.8,
            
            // 그래픽 설정
            graphicsQuality: 'medium',
            particleCount: 'normal',
            showFPS: false,
            
            // 게임플레이 설정
            difficulty: 'medium',
            autoSave: true,
            tutorials: true
        };
        
        this.load();
    }
    
    load() {
        this.settings = SensorGameUtils.storage.get(
            `${this.gameId}_settings`, 
            this.defaults
        );
        
        // 누락된 설정값 보완
        this.settings = { ...this.defaults, ...this.settings };
    }
    
    save() {
        SensorGameUtils.storage.set(`${this.gameId}_settings`, this.settings);
    }
    
    get(key) {
        return this.settings[key];
    }
    
    set(key, value) {
        this.settings[key] = value;
        this.save();
        this.applySettings();
    }
    
    applySettings() {
        // 센서 설정 적용
        if (this.game) {
            this.game.config.sensorSensitivity.orientation = this.get('sensorSensitivity');
            this.game.config.smoothingFactor = this.get('sensorSmoothing');
            this.game.config.deadzone = this.get('sensorDeadzone');
        }
        
        // 오디오 설정 적용
        this.applyAudioSettings();
        
        // 그래픽 설정 적용
        this.applyGraphicsSettings();
    }
}

// 설정 UI 생성
createSettingsMenu() {
    const settingsHTML = `
        <div class="settings-menu">
            <h3>게임 설정</h3>
            
            <div class="setting-group">
                <h4>센서 설정</h4>
                <label>
                    센서 감도: <span id="sensitivity-value">${this.settings.get('sensorSensitivity')}</span>
                    <input type="range" id="sensor-sensitivity" 
                           min="0.1" max="2.0" step="0.1" 
                           value="${this.settings.get('sensorSensitivity')}">
                </label>
            </div>
            
            <div class="setting-group">
                <h4>오디오 설정</h4>
                <label>
                    마스터 볼륨: <span id="master-volume-value">${this.settings.get('masterVolume')}</span>
                    <input type="range" id="master-volume" 
                           min="0" max="1" step="0.1" 
                           value="${this.settings.get('masterVolume')}">
                </label>
            </div>
            
            <div class="setting-group">
                <h4>그래픽 설정</h4>
                <label>
                    품질:
                    <select id="graphics-quality">
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                    </select>
                </label>
            </div>
            
            <button onclick="this.resetSettings()">기본값으로 복원</button>
        </div>
    `;
    
    // 설정 변경 이벤트 리스너 등록
    this.bindSettingsEvents();
}
```

### 성과 시스템 (Achievement)

```javascript
// 성과 시스템
class AchievementSystem {
    constructor(gameId) {
        this.gameId = gameId;
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        
        this.defineAchievements();
        this.loadProgress();
    }
    
    defineAchievements() {
        this.addAchievement('first_game', {
            name: '첫 게임',
            description: '첫 게임을 완료하세요',
            icon: '🎮',
            points: 10,
            condition: (stats) => stats.gamesPlayed >= 1
        });
        
        this.addAchievement('score_master', {
            name: '점수 대가',
            description: '1000점 이상을 획득하세요',
            icon: '🏆',
            points: 50,
            condition: (stats) => stats.highScore >= 1000
        });
        
        this.addAchievement('sensor_expert', {
            name: '센서 전문가',
            description: '센서 게임을 100번 플레이하세요',
            icon: '📱',
            points: 100,
            condition: (stats) => stats.gamesPlayed >= 100
        });
    }
    
    addAchievement(id, achievement) {
        this.achievements.set(id, {
            id,
            unlocked: false,
            unlockedAt: null,
            ...achievement
        });
    }
    
    checkAchievements(gameStats) {
        for (const [id, achievement] of this.achievements) {
            if (!achievement.unlocked && achievement.condition(gameStats)) {
                this.unlockAchievement(id);
            }
        }
    }
    
    unlockAchievement(id) {
        const achievement = this.achievements.get(id);
        if (!achievement || achievement.unlocked) return;
        
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.unlockedAchievements.add(id);
        
        this.saveProgress();
        this.showAchievementNotification(achievement);
        
        console.log(`🏆 성과 달성: ${achievement.name}`);
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">성과 달성!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}
```

## 🔧 문제 해결 가이드

### 자주 발생하는 문제들

#### 1. 센서 데이터가 수신되지 않음

**증상**: 모바일에서 센서를 움직여도 게임에 반응이 없음

**원인 및 해결법**:
```javascript
// iOS에서 HTTPS 필요
if (!window.isSecureContext) {
    console.error('HTTPS 환경이 필요합니다.');
    // Render 배포 시 자동으로 HTTPS 제공
}

// 센서 권한 확인
const support = SensorGameUtils.checkSensorSupport();
if (!support.orientation) {
    console.error('이 기기는 방향 센서를 지원하지 않습니다.');
}

// iOS 센서 권한 요청
if (support.requestPermission) {
    const granted = await SensorGameUtils.requestIOSPermissions();
    if (!granted) {
        console.error('센서 권한이 거부되었습니다.');
    }
}
```

#### 2. 연결이 자주 끊어짐

**증상**: 게임 중 센서 연결이 불안정함

**원인 및 해결법**:
```javascript
// 네트워크 상태 모니터링
this.on('onConnectionChange', (isConnected) => {
    if (!isConnected) {
        console.log('연결 끊어짐, 재연결 시도 중...');
        this.enableSimulationMode(); // 임시로 키보드 모드 활성화
    }
});

// 하트비트 구현
setInterval(() => {
    if (this.state.isConnected) {
        this.send({ type: 'ping' });
    }
}, 5000);

// 연결 복구 로직
setupConnectionRecovery() {
    let reconnectAttempts = 0;
    
    this.on('onConnectionChange', (isConnected) => {
        if (!isConnected && reconnectAttempts < 5) {
            reconnectAttempts++;
            setTimeout(() => {
                this.connect();
            }, 2000 * reconnectAttempts);
        }
    });
}
```

#### 3. 게임 성능 문제

**증상**: 게임이 느리거나 끊어짐

**원인 및 해결법**:
```javascript
// FPS 모니터링
const fpsCounter = SensorGameUtils.performance.createFPSCounter();

update() {
    const fps = fpsCounter.update();
    if (fps < 30) {
        console.warn('성능 저하 감지:', fps);
        this.reduceQuality();
    }
}

// 성능 최적화
reduceQuality() {
    // 파티클 수 감소
    this.maxParticles = Math.floor(this.maxParticles * 0.5);
    
    // 업데이트 주기 조정
    this.config.updateRate = 30; // 60fps → 30fps
    
    // 그래픽 품질 조정
    this.graphicsQuality = 'low';
}

// 메모리 사용량 모니터링
monitorMemory() {
    if (performance.memory) {
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        
        if (usedMB > 100) { // 100MB 초과 시
            console.warn('메모리 사용량 높음:', usedMB.toFixed(2), 'MB');
            this.cleanupMemory();
        }
    }
}
```

#### 4. 멀티플레이어 동기화 문제

**증상**: 플레이어 간 게임 상태가 다름

**원인 및 해결법**:
```javascript
// 주기적 상태 동기화
setupStateSync() {
    setInterval(() => {
        if (this.state.isHost) {
            this.broadcastGameState();
        }
    }, 1000); // 1초마다 동기화
}

// 충돌 해결
handleStateMismatch(remoteState, localState) {
    // 호스트 상태를 우선으로 함
    if (!this.state.isHost) {
        this.gameState = { ...this.gameState, ...remoteState };
        return;
    }
    
    // 타임스탬프로 최신 상태 선택
    if (remoteState.timestamp > localState.timestamp) {
        this.resolveStateConflict(remoteState, localState);
    }
}

// 지연 보상
compensateForLatency(eventData) {
    const latency = Date.now() - eventData.timestamp;
    
    // 위치 예측
    if (eventData.position && eventData.velocity) {
        const compensatedPosition = {
            x: eventData.position.x + eventData.velocity.x * (latency / 1000),
            y: eventData.position.y + eventData.velocity.y * (latency / 1000)
        };
        
        return { ...eventData, position: compensatedPosition };
    }
    
    return eventData;
}
```

### 디버깅 팁

```javascript
// 상세한 로깅 활성화
this.config.debug = true;
this.config.logLevel = 'debug'; // 'debug', 'info', 'warn', 'error'

// 센서 데이터 로깅
this.on('onSensorData', (data) => {
    if (this.config.debug) {
        console.log('Sensor data:', {
            type: data.sensorType,
            tilt: data.gameInput.tilt,
            movement: data.gameInput.movement,
            timestamp: Date.now()
        });
    }
});

// 성능 프로파일링
class PerformanceProfiler {
    constructor() {
        this.measurements = new Map();
    }
    
    start(label) {
        this.measurements.set(label, performance.now());
    }
    
    end(label) {
        const startTime = this.measurements.get(label);
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`${label}: ${duration.toFixed(2)}ms`);
            this.measurements.delete(label);
        }
    }
}

// 사용 예시
const profiler = new PerformanceProfiler();

update() {
    profiler.start('gameUpdate');
    
    profiler.start('physics');
    this.updatePhysics();
    profiler.end('physics');
    
    profiler.start('rendering');
    this.render();
    profiler.end('rendering');
    
    profiler.end('gameUpdate');
}
```

## 🎓 마스터 클래스

### 고급 센서 활용

```javascript
// 고급 제스처 인식
class AdvancedGestureRecognition {
    constructor() {
        this.gestureBuffer = [];
        this.gesturePatterns = new Map();
        
        this.defineGesturePatterns();
    }
    
    defineGesturePatterns() {
        // 원형 제스처 패턴
        this.gesturePatterns.set('circle', {
            minPoints: 8,
            maxPoints: 20,
            similarity: 0.8,
            template: this.createCircleTemplate()
        });
        
        // 지그재그 패턴
        this.gesturePatterns.set('zigzag', {
            minPoints: 6,
            maxPoints: 15,
            similarity: 0.7,
            template: this.createZigzagTemplate()
        });
    }
    
    addGesturePoint(acceleration) {
        this.gestureBuffer.push({
            x: acceleration.x,
            y: acceleration.y,
            timestamp: Date.now()
        });
        
        // 버퍼 크기 제한
        if (this.gestureBuffer.length > 50) {
            this.gestureBuffer.shift();
        }
        
        // 제스처 인식 시도
        this.recognizeGesture();
    }
    
    recognizeGesture() {
        if (this.gestureBuffer.length < 5) return null;
        
        for (const [name, pattern] of this.gesturePatterns) {
            const similarity = this.calculateSimilarity(
                this.gestureBuffer, 
                pattern.template
            );
            
            if (similarity > pattern.similarity) {
                this.gestureBuffer = []; // 인식 후 버퍼 초기화
                return { type: name, confidence: similarity };
            }
        }
        
        return null;
    }
}

// 3D 공간 센서 활용
class 3DSensorManager {
    constructor(sdk) {
        this.sdk = sdk;
        this.position3D = { x: 0, y: 0, z: 0 };
        this.rotation3D = { x: 0, y: 0, z: 0 };
        this.setupCalibration();
    }
    
    update(sensorData) {
        // 3D 위치 추정
        this.estimate3DPosition(sensorData);
        
        // 3D 회전 계산
        this.calculate3DRotation(sensorData);
        
        // 깊이 감지 (Z축)
        this.detectDepthMovement(sensorData);
    }
    
    estimate3DPosition(data) {
        if (data.accelerometer) {
            // 가속도를 적분하여 속도 계산
            this.velocity.x += data.accelerometer.x * 0.016; // 60fps 기준
            this.velocity.y += data.accelerometer.y * 0.016;
            this.velocity.z += data.accelerometer.z * 0.016;
            
            // 마찰 적용
            this.velocity.x *= 0.95;
            this.velocity.y *= 0.95;
            this.velocity.z *= 0.95;
            
            // 위치 업데이트
            this.position3D.x += this.velocity.x;
            this.position3D.y += this.velocity.y;
            this.position3D.z += this.velocity.z;
        }
    }
}
```

### 인공지능 통합

```javascript
// 간단한 AI 적 구현
class AIEnemy {
    constructor(player) {
        this.player = player;
        this.position = { x: 0, y: 0 };
        this.state = 'patrol'; // 'patrol', 'chase', 'attack'
        this.sightRange = 100;
        this.attackRange = 30;
        this.speed = 2;
        this.pathfinder = new SimplePathfinder();
    }
    
    update() {
        const distanceToPlayer = this.getDistanceToPlayer();
        
        switch (this.state) {
            case 'patrol':
                this.patrol();
                if (distanceToPlayer < this.sightRange) {
                    this.state = 'chase';
                }
                break;
                
            case 'chase':
                this.chasePlayer();
                if (distanceToPlayer < this.attackRange) {
                    this.state = 'attack';
                } else if (distanceToPlayer > this.sightRange * 1.5) {
                    this.state = 'patrol';
                }
                break;
                
            case 'attack':
                this.attackPlayer();
                if (distanceToPlayer > this.attackRange) {
                    this.state = 'chase';
                }
                break;
        }
    }
    
    chasePlayer() {
        const path = this.pathfinder.findPath(this.position, this.player.position);
        if (path.length > 1) {
            const nextPoint = path[1];
            this.moveTowards(nextPoint);
        }
    }
    
    predictPlayerMovement() {
        // 플레이어 움직임 예측
        const velocity = this.player.velocity;
        const predictedPosition = {
            x: this.player.position.x + velocity.x * 30, // 30프레임 후 예측
            y: this.player.position.y + velocity.y * 30
        };
        
        return predictedPosition;
    }
}

// 적응형 난이도 조정
class AdaptiveDifficulty {
    constructor() {
        this.playerSkillLevel = 0.5; // 0.0 ~ 1.0
        this.recentPerformance = [];
        this.adjustmentRate = 0.02;
    }
    
    recordPlayerPerformance(score, time, mistakes) {
        const performance = this.calculatePerformance(score, time, mistakes);
        this.recentPerformance.push(performance);
        
        if (this.recentPerformance.length > 10) {
            this.recentPerformance.shift();
        }
        
        this.updateSkillLevel();
    }
    
    updateSkillLevel() {
        const avgPerformance = this.recentPerformance.reduce((a, b) => a + b, 0) 
                             / this.recentPerformance.length;
        
        if (avgPerformance > 0.7) {
            this.playerSkillLevel = Math.min(1.0, this.playerSkillLevel + this.adjustmentRate);
        } else if (avgPerformance < 0.3) {
            this.playerSkillLevel = Math.max(0.0, this.playerSkillLevel - this.adjustmentRate);
        }
    }
    
    getDifficultyMultipliers() {
        return {
            enemySpeed: 0.5 + this.playerSkillLevel * 0.8,
            enemyCount: Math.floor(2 + this.playerSkillLevel * 4),
            spawRate: 1000 - this.playerSkillLevel * 500,
            playerHealth: 100 + (1 - this.playerSkillLevel) * 50
        };
    }
}
```

## 🌟 마무리

이 가이드를 통해 센서 게임 허브 v4.0에서 완벽한 센서 게임을 개발할 수 있습니다. 

### 개발 완료 체크리스트

- [ ] ✅ 게임 타입 결정 (솔로/멀티플레이어)
- [ ] ✅ 템플릿 기반 개발
- [ ] ✅ game.json 메타데이터 완성
- [ ] ✅ 센서 입력 처리 구현
- [ ] ✅ UI/UX 설계 및 구현
- [ ] ✅ 키보드 시뮬레이션 지원
- [ ] ✅ 에러 처리 및 예외 상황 대응
- [ ] ✅ 성능 최적화 적용
- [ ] ✅ 크로스 플랫폼 테스트
- [ ] ✅ 게임 배포 및 등록

### 추가 학습 자료

- **[LLM 가이드](LLM_GUIDE.md)**: AI 에이전트용 개발 가이드
- **[API 레퍼런스](API_REFERENCE.md)**: 상세한 SDK API 문서
- **템플릿 코드**: `templates/` 폴더의 예시 코드

### 커뮤니티 및 지원

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Discussions**: 개발 관련 질문 및 토론
- **Wiki**: 추가 예제 및 튜토리얼

---

**🎉 이제 센서 게임 허브 v4.0에서 혁신적인 센서 게임을 개발할 준비가 완료되었습니다!**

Happy Coding! 🚀