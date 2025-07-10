# 📖 센서 게임 허브 v4.0 - API 레퍼런스

> **개발자를 위한 완전한 API 및 SDK 문서**

## 📋 목차

1. [SDK 개요](#sdk-개요)
2. [설치 및 설정](#설치-및-설정)
3. [SensorGameSDK 클래스](#sensorgamesdk-클래스)
4. [이벤트 시스템](#이벤트-시스템)
5. [센서 데이터](#센서-데이터)
6. [멀티플레이어 API](#멀티플레이어-api)
7. [유틸리티 함수](#유틸리티-함수)
8. [로컬 라이브러리](#로컬-라이브러리)
9. [설정 옵션](#설정-옵션)
10. [에러 처리](#에러-처리)
11. [예제 코드](#예제-코드)

---

## SDK 개요

### 🎯 센서 게임 SDK v4.0

센서 게임 SDK는 개발자가 모바일 센서를 활용한 웹 게임을 쉽게 개발할 수 있도록 하는 JavaScript 라이브러리입니다.

#### 주요 특징
- **센서 통합**: 방향, 가속도계, 자이로스코프 지원
- **멀티플레이어**: 실시간 멀티플레이어 게임 지원
- **다중 센서**: 한 PC에 최대 2개 센서 연결
- **세션 관리**: 4자리 코드 기반 안전한 세션 매칭
- **크로스 플랫폼**: iOS, Android, 데스크톱 지원

---

## 설치 및 설정

### HTML에서 SDK 포함
```html
<script src="/sdk/sensor-game-sdk.js"></script>
<script src="/sdk/utils.js"></script>

<!-- 3D 물리 엔진 (선택사항) -->
<script src="/libs/cannon-es.js"></script>
```

### 기본 게임 클래스 생성
```javascript
class MyGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'my-game',
            gameName: 'My Game',
            gameType: 'solo', // 'solo' 또는 'multiplayer'
            sensorTypes: ['orientation', 'accelerometer']
        });
    }
}
```

---

## SensorGameSDK 클래스

### 생성자 (Constructor)

```javascript
new SensorGameSDK(config)
```

#### 매개변수 (config)

| 속성 | 타입 | 기본값 | 설명 |
|-----|------|--------|------|
| `gameId` | string | 필수 | 고유한 게임 식별자 |
| `gameName` | string | 필수 | 게임 이름 |
| `gameType` | string | 'solo' | 게임 타입 ('solo', 'multiplayer') |
| `sensorTypes` | Array | ['orientation'] | 사용할 센서 타입들 |
| `multiSensor` | boolean | false | 다중 센서 지원 여부 |
| `sensorSensitivity` | Object | {} | 센서별 감도 설정 |
| `smoothingFactor` | number | 3 | 센서 데이터 스무딩 계수 |
| `deadzone` | number | 0.1 | 센서 데드존 값 |
| `updateRate` | number | 60 | 데이터 업데이트 주기 (FPS) |
| `showDebug` | boolean | false | 디버그 정보 표시 여부 |

#### 예시
```javascript
const game = new SensorGameSDK({
    gameId: 'space-shooter',
    gameName: '우주 슈팅 게임',
    gameType: 'solo',
    sensorTypes: ['orientation', 'accelerometer', 'gyroscope'],
    multiSensor: false,
    sensorSensitivity: {
        orientation: 0.8,    // 0.1 ~ 2.0
        accelerometer: 0.5,  // 0.1 ~ 2.0
        gyroscope: 0.3       // 0.1 ~ 2.0
    },
    smoothingFactor: 3,
    deadzone: 0.15,
    updateRate: 60,
    showDebug: true
});
```

### 주요 메서드

#### 세션 관리

##### `createSession()`
세션을 생성하고 4자리 코드를 발급합니다.
```javascript
game.createSession()
    .then(sessionCode => {
        console.log('세션 코드:', sessionCode);
    })
    .catch(error => {
        console.error('세션 생성 실패:', error);
    });
```

##### `joinSession(sessionCode)`
기존 세션에 참가합니다.
```javascript
game.joinSession('1234')
    .then(() => {
        console.log('세션 참가 성공');
    })
    .catch(error => {
        console.error('세션 참가 실패:', error);
    });
```

##### `leaveSession()`
현재 세션에서 나갑니다.
```javascript
game.leaveSession();
```

#### 멀티플레이어 메서드

##### `createRoom(roomName, maxPlayers)`
멀티플레이어 룸을 생성합니다.
```javascript
game.createRoom('내 게임룸', 4)
    .then(roomId => {
        console.log('룸 ID:', roomId);
    });
```

##### `joinRoom(roomId)`
기존 룸에 참가합니다.
```javascript
game.joinRoom('room-uuid')
    .then(() => {
        console.log('룸 참가 성공');
    });
```

##### `leaveRoom()`
현재 룸에서 나갑니다.
```javascript
game.leaveRoom();
```

##### `startGame()`
호스트가 게임을 시작합니다.
```javascript
if (game.state.isHost) {
    game.startGame();
}
```

##### `sendGameEvent(eventType, data)`
다른 플레이어들에게 게임 이벤트를 전송합니다.
```javascript
game.sendGameEvent('player_move', {
    position: { x: 100, y: 200 },
    velocity: { x: 5, y: 0 }
});
```

#### 센서 제어

##### `calibrate()`
센서를 보정합니다.
```javascript
game.calibrate();
```

##### `setSensorSensitivity(sensorType, sensitivity)`
특정 센서의 감도를 조정합니다.
```javascript
game.setSensorSensitivity('orientation', 1.2);
```

##### `enableSimulationMode()`
키보드 시뮬레이션 모드를 활성화합니다.
```javascript
game.enableSimulationMode();
```

#### 유틸리티 메서드

##### `getStats()`
게임 통계 정보를 반환합니다.
```javascript
const stats = game.getStats();
console.log('FPS:', stats.fps);
console.log('연결 상태:', stats.isConnected);
```

##### `pause()` / `resume()`
게임을 일시정지/재개합니다.
```javascript
game.pause();   // 일시정지
game.resume();  // 재개
```

##### `destroy()`
SDK 인스턴스를 정리합니다.
```javascript
game.destroy();
```

---

## 이벤트 시스템

### 이벤트 등록

이벤트는 `on(eventName, callback)` 메서드로 등록합니다.

```javascript
game.on('onSensorData', (data) => {
    console.log('센서 데이터:', data);
});
```

### 세션 이벤트

#### `onSessionCreated`
세션이 생성되었을 때 발생합니다.
```javascript
game.on('onSessionCreated', (data) => {
    console.log('세션 코드:', data.sessionCode);
    // UI에 세션 코드 표시
    showSessionCode(data.sessionCode);
});
```

#### `onSensorConnected`
센서가 연결되었을 때 발생합니다.
```javascript
game.on('onSensorConnected', (data) => {
    console.log('센서 연결됨:', data.sensorType);
    // 세션 코드 숨기고 게임 시작
    hideSessionCode();
    startGame();
});
```

#### `onSensorDisconnected`
센서 연결이 끊어졌을 때 발생합니다.
```javascript
game.on('onSensorDisconnected', () => {
    console.log('센서 연결 끊어짐');
    pauseGame();
    showReconnectMessage();
});
```

#### `onConnectionChange`
연결 상태가 변경되었을 때 발생합니다.
```javascript
game.on('onConnectionChange', (isConnected) => {
    if (isConnected) {
        console.log('연결됨');
    } else {
        console.log('연결 끊어짐');
    }
});
```

### 센서 데이터 이벤트

#### `onSensorData`
센서 데이터를 수신했을 때 발생합니다.
```javascript
game.on('onSensorData', (data) => {
    const { gameInput, rawSensor, sensorType } = data;
    
    // 게임 입력 처리
    if (gameInput.tilt) {
        player.x += gameInput.tilt.x * speed;
        player.y += gameInput.tilt.y * speed;
    }
    
    // 흔들기 감지
    if (gameInput.shake && gameInput.shake.detected) {
        fireWeapon();
    }
    
    // 다중 센서인 경우
    if (sensorType === 'primary') {
        // 주 센서 처리
    } else if (sensorType === 'secondary') {
        // 보조 센서 처리
    }
});
```

### 멀티플레이어 이벤트

#### `onRoomCreated`
룸이 생성되었을 때 발생합니다.
```javascript
game.on('onRoomCreated', (data) => {
    console.log('룸 생성됨:', data.roomId);
    console.log('호스트:', data.isHost);
});
```

#### `onPlayerJoined`
플레이어가 룸에 참가했을 때 발생합니다.
```javascript
game.on('onPlayerJoined', (data) => {
    console.log('플레이어 참가:', data.player);
    addPlayerToGame(data.player);
    updatePlayerList(data.players);
});
```

#### `onPlayerLeft`
플레이어가 룸에서 나갔을 때 발생합니다.
```javascript
game.on('onPlayerLeft', (data) => {
    console.log('플레이어 퇴장:', data.playerId);
    removePlayerFromGame(data.playerId);
    updatePlayerList(data.players);
});
```

#### `onGameStarted`
게임이 시작되었을 때 발생합니다.
```javascript
game.on('onGameStarted', () => {
    console.log('게임 시작!');
    hideLobby();
    startGameplay();
});
```

#### `onGameEvent`
다른 플레이어의 게임 이벤트를 수신했을 때 발생합니다.
```javascript
game.on('onGameEvent', (eventData) => {
    const { sessionId, eventType, data } = eventData;
    
    switch (eventType) {
        case 'player_move':
            updateOtherPlayer(sessionId, data.position);
            break;
        case 'player_shoot':
            createBullet(data.position, data.direction);
            break;
        case 'player_score':
            updatePlayerScore(sessionId, data.score);
            break;
    }
});
```

### 에러 이벤트

#### `onError`
에러가 발생했을 때 발생합니다.
```javascript
game.on('onError', (error) => {
    console.error('게임 에러:', error);
    
    switch (error.type) {
        case 'sensor':
            enableSimulationMode();
            break;
        case 'connection':
            showConnectionError();
            break;
        case 'permission':
            showPermissionError();
            break;
    }
});
```

---

## 센서 데이터

### 데이터 구조

센서 데이터는 다음과 같은 구조로 제공됩니다:

```javascript
{
    gameInput: {
        tilt: { x: -0.5, y: 0.3 },          // -1 ~ 1 범위의 기울기
        rotation: { x: 10, y: -5, z: 0 },   // 회전각 (도)
        movement: { x: 2, y: 0, z: -1 },    // 이동량
        shake: {
            detected: true,
            intensity: 0.8,
            timestamp: 1640995200000
        },
        gesture: {
            type: 'swipe',
            direction: 'right',
            intensity: 0.6
        }
    },
    rawSensor: {
        orientation: {
            alpha: 45,    // Z축 회전 (나침반)
            beta: 10,     // X축 회전 (앞뒤 기울기)
            gamma: -5     // Y축 회전 (좌우 기울기)
        },
        accelerometer: {
            x: 2.1,       // X축 가속도
            y: 0.5,       // Y축 가속도
            z: 9.8        // Z축 가속도 (중력 포함)
        },
        gyroscope: {
            x: 0.1,       // X축 각속도
            y: -0.2,      // Y축 각속도
            z: 0.05       // Z축 각속도
        }
    },
    sensorType: 'primary', // 'primary' 또는 'secondary'
    timestamp: 1640995200000
}
```

### 센서 타입별 특징

#### 방향센서 (orientation)
- **용도**: 기기 기울기 감지
- **범위**: alpha (0-360°), beta (-180~180°), gamma (-90~90°)
- **활용**: 플레이어 이동, 카메라 제어

#### 가속도계 (accelerometer)
- **용도**: 기기 움직임 감지
- **범위**: 일반적으로 -20 ~ 20 m/s²
- **활용**: 흔들기 감지, 이동 속도 제어

#### 자이로스코프 (gyroscope)
- **용도**: 기기 회전 속도 감지
- **범위**: 일반적으로 -10 ~ 10 rad/s
- **활용**: 정밀한 회전 제어, 스핀 동작

### 게임 입력 변환

SDK는 원시 센서 데이터를 게임에서 사용하기 쉬운 형태로 변환합니다:

```javascript
// 기울기 (-1 ~ 1 정규화)
const tiltX = gameInput.tilt.x; // 좌우 기울기
const tiltY = gameInput.tilt.y; // 앞뒤 기울기

// 플레이어 이동에 적용
player.velocity.x += tiltX * speed;
player.velocity.y += tiltY * speed;

// 회전 (도 단위)
const rotation = gameInput.rotation;
player.angle = rotation.z; // Z축 회전을 플레이어 각도로 사용

// 흔들기 감지
if (gameInput.shake.detected) {
    const intensity = gameInput.shake.intensity; // 0 ~ 1
    triggerAction(intensity);
}
```

---

## 멀티플레이어 API

### 룸 관리

#### 룸 생성
```javascript
// 기본 룸 생성
game.createRoom('My Game Room', 4);

// 고급 설정으로 룸 생성
game.createRoom('Pro Game Room', 6, {
    gameMode: 'competitive',
    timeLimit: 300, // 5분
    spectatorMode: false
});
```

#### 룸 목록 조회
```javascript
game.getRoomList()
    .then(rooms => {
        rooms.forEach(room => {
            console.log(`${room.name}: ${room.playerCount}/${room.maxPlayers}`);
        });
    });
```

#### 룸 정보 조회
```javascript
const roomInfo = game.getCurrentRoom();
console.log('룸 이름:', roomInfo.name);
console.log('플레이어 수:', roomInfo.players.length);
console.log('호스트 여부:', roomInfo.isHost);
```

### 플레이어 관리

#### 플레이어 정보 조회
```javascript
const players = game.getPlayers();
players.forEach(player => {
    console.log(`${player.nickname}: ${player.score}점`);
});

const myPlayer = game.getMyPlayer();
console.log('내 닉네임:', myPlayer.nickname);
console.log('내 점수:', myPlayer.score);
```

#### 플레이어 상태 업데이트
```javascript
// 점수 업데이트
game.updatePlayerScore(100);

// 커스텀 상태 업데이트
game.updatePlayerState({
    level: 5,
    health: 80,
    powerUps: ['shield', 'speed_boost']
});
```

### 게임 이벤트 전송

#### 기본 이벤트 전송
```javascript
// 플레이어 이동
game.sendGameEvent('player_move', {
    position: { x: player.x, y: player.y },
    velocity: { x: player.vx, y: player.vy },
    timestamp: Date.now()
});

// 플레이어 액션
game.sendGameEvent('player_shoot', {
    position: { x: player.x, y: player.y },
    direction: { x: 1, y: 0 },
    weaponType: 'laser'
});

// 게임 상태 변경
game.sendGameEvent('game_state_change', {
    type: 'level_complete',
    newLevel: 3,
    bonusPoints: 500
});
```

#### 특정 플레이어에게 전송
```javascript
// 호스트에게만 전송
game.sendGameEvent('request_permission', {
    action: 'use_power_up',
    powerUpType: 'nuke'
}, { targetType: 'host' });

// 특정 플레이어에게 전송
game.sendGameEvent('private_message', {
    message: 'Good game!'
}, { targetSessionId: 'player-session-id' });
```

### 게임 플로우 제어

#### 게임 시작/종료
```javascript
// 호스트가 게임 시작
if (game.state.isHost) {
    game.startGame();
}

// 게임 종료
game.endGame({
    winner: game.getTopPlayer(),
    finalScores: game.getPlayerScores(),
    gameStats: {
        duration: gameTime,
        totalKills: totalKills
    }
});
```

#### 게임 일시정지/재개
```javascript
// 호스트가 게임 일시정지
if (game.state.isHost) {
    game.pauseGame('Technical difficulties');
}

// 게임 재개
if (game.state.isHost) {
    game.resumeGame();
}
```

---

## 유틸리티 함수

### SensorGameUtils 객체

유틸리티 함수들은 `SensorGameUtils` 전역 객체를 통해 제공됩니다.

#### 수학 유틸리티

```javascript
// 거리 계산
const distance = SensorGameUtils.math.distance(
    { x: 0, y: 0 }, 
    { x: 3, y: 4 }
); // 5

// 값 제한
const clamped = SensorGameUtils.math.clamp(150, 0, 100); // 100

// 선형 보간
const lerped = SensorGameUtils.math.lerp(0, 100, 0.5); // 50

// 각도 계산
const angle = SensorGameUtils.math.angleBetween(
    { x: 0, y: 0 }, 
    { x: 1, y: 1 }
); // 45도

// 정규화
const normalized = SensorGameUtils.math.normalize({ x: 3, y: 4 });
// { x: 0.6, y: 0.8 }

// 랜덤 값
const randomInt = SensorGameUtils.math.randomInt(1, 10); // 1-10 사이
const randomFloat = SensorGameUtils.math.randomFloat(0, 1); // 0-1 사이
```

#### 충돌 감지

```javascript
// 사각형 충돌
const collision = SensorGameUtils.collision.rectRect(
    { x: 0, y: 0, width: 50, height: 50 },
    { x: 25, y: 25, width: 50, height: 50 }
); // true

// 원형 충돌
const circleCollision = SensorGameUtils.collision.circleCircle(
    { x: 0, y: 0, radius: 25 },
    { x: 30, y: 0, radius: 25 }
); // true

// 점과 사각형 충돌
const pointInRect = SensorGameUtils.collision.pointRect(
    { x: 25, y: 25 },
    { x: 0, y: 0, width: 50, height: 50 }
); // true

// 점과 원형 충돌
const pointInCircle = SensorGameUtils.collision.pointCircle(
    { x: 10, y: 10 },
    { x: 0, y: 0, radius: 20 }
); // true
```

#### 색상 유틸리티

```javascript
// 색상 보간
const interpolated = SensorGameUtils.color.interpolate(
    '#ff0000', '#00ff00', 0.5
); // '#808000'

// 색상 변환
const rgb = SensorGameUtils.color.hexToRgb('#ff0000');
// { r: 255, g: 0, b: 0 }

const hex = SensorGameUtils.color.rgbToHex(255, 0, 0); // '#ff0000'

const hsl = SensorGameUtils.color.rgbToHsl(255, 0, 0);
// { h: 0, s: 100, l: 50 }

// 랜덤 색상
const randomColor = SensorGameUtils.color.random(); // '#a7b2c3'
```

#### 디바이스 감지

```javascript
// 디바이스 정보
const device = SensorGameUtils.detectDevice();
console.log('모바일:', device.isMobile);
console.log('태블릿:', device.isTablet);
console.log('데스크톱:', device.isDesktop);
console.log('OS:', device.os); // 'iOS', 'Android', 'Windows', etc.
console.log('브라우저:', device.browser); // 'Chrome', 'Safari', etc.

// 센서 지원 확인
const sensorSupport = SensorGameUtils.checkSensorSupport();
console.log('방향센서:', sensorSupport.orientation);
console.log('가속도계:', sensorSupport.accelerometer);
console.log('자이로스코프:', sensorSupport.gyroscope);

// 권한 상태 확인
SensorGameUtils.checkPermissions()
    .then(permissions => {
        console.log('방향센서 권한:', permissions.orientation);
        console.log('모션센서 권한:', permissions.motion);
    });
```

#### 성능 유틸리티

```javascript
// FPS 카운터
const fpsCounter = SensorGameUtils.performance.createFPSCounter();
// 게임 루프에서 호출
fpsCounter.update();
console.log('FPS:', fpsCounter.getFPS());

// 쓰로틀링
const throttledUpdate = SensorGameUtils.performance.throttle(
    updateFunction, 16 // 60fps로 제한
);

// 디바운싱
const debouncedSave = SensorGameUtils.performance.debounce(
    saveGame, 1000 // 1초 후 실행
);

// 성능 측정
SensorGameUtils.performance.measure('game_update', () => {
    // 게임 업데이트 로직
});
```

#### 저장소 유틸리티

```javascript
// 로컬 저장소
SensorGameUtils.storage.set('gameProgress', {
    level: 5,
    score: 1200,
    achievements: ['first_kill', 'level_master']
});

const progress = SensorGameUtils.storage.get('gameProgress');
console.log('현재 레벨:', progress.level);

// 기본값과 함께 가져오기
const settings = SensorGameUtils.storage.get('gameSettings', {
    volume: 0.8,
    difficulty: 'medium'
});

// 저장소 지우기
SensorGameUtils.storage.remove('gameProgress');
SensorGameUtils.storage.clear(); // 모든 데이터 삭제
```

---

## 설정 옵션

### 센서 감도 설정

```javascript
const config = {
    sensorSensitivity: {
        orientation: 1.0,    // 0.1 - 2.0 (기본: 1.0)
        accelerometer: 0.8,  // 0.1 - 2.0 (기본: 1.0)
        gyroscope: 0.6       // 0.1 - 2.0 (기본: 1.0)
    }
};
```

### 데이터 처리 설정

```javascript
const config = {
    smoothingFactor: 5,     // 1-10 (기본: 3) - 높을수록 부드러움
    deadzone: 0.1,          // 0-0.5 (기본: 0.1) - 작은 움직임 무시
    updateRate: 60,         // 10-120 (기본: 60) - 초당 업데이트 횟수
    calibrationTime: 3000   // ms (기본: 3000) - 보정 시간
};
```

### 멀티플레이어 설정

```javascript
const config = {
    multiplayer: {
        maxPlayers: 4,           // 2-8 (기본: 4)
        reconnectAttempts: 3,    // 재연결 시도 횟수
        heartbeatInterval: 5000, // 연결 확인 간격 (ms)
        gameTimeout: 300000,     // 게임 제한 시간 (ms)
        spectatorMode: false     // 관전자 모드 허용
    }
};
```

### 시각적 설정

```javascript
const config = {
    ui: {
        showSessionCode: true,    // 세션 코드 표시
        showSensorStatus: true,   // 센서 상태 표시
        showDebugInfo: false,     // 디버그 정보 표시
        theme: 'dark'             // 'dark', 'light'
    }
};
```

---

## 에러 처리

### 에러 타입

SDK는 다음과 같은 에러 타입을 제공합니다:

#### 연결 에러
```javascript
{
    type: 'connection',
    code: 'CONNECTION_LOST',
    message: '서버와의 연결이 끊어졌습니다',
    timestamp: 1640995200000
}
```

#### 센서 에러
```javascript
{
    type: 'sensor',
    code: 'SENSOR_NOT_SUPPORTED',
    message: '이 기기는 자이로스코프를 지원하지 않습니다',
    sensor: 'gyroscope',
    timestamp: 1640995200000
}
```

#### 권한 에러
```javascript
{
    type: 'permission',
    code: 'PERMISSION_DENIED',
    message: '센서 권한이 거부되었습니다',
    permission: 'deviceorientation',
    timestamp: 1640995200000
}
```

#### 세션 에러
```javascript
{
    type: 'session',
    code: 'SESSION_NOT_FOUND',
    message: '세션을 찾을 수 없습니다',
    sessionCode: '1234',
    timestamp: 1640995200000
}
```

### 에러 처리 패턴

```javascript
// 포괄적인 에러 처리
game.on('onError', (error) => {
    console.error(`[${error.type}] ${error.message}`);
    
    switch (error.type) {
        case 'connection':
            handleConnectionError(error);
            break;
        case 'sensor':
            handleSensorError(error);
            break;
        case 'permission':
            handlePermissionError(error);
            break;
        case 'session':
            handleSessionError(error);
            break;
        default:
            handleGenericError(error);
    }
});

function handleConnectionError(error) {
    // 재연결 시도
    setTimeout(() => {
        game.reconnect();
    }, 5000);
    
    // 사용자에게 알림
    showNotification('연결이 끊어졌습니다. 재연결 중...', 'warning');
}

function handleSensorError(error) {
    // 시뮬레이션 모드로 전환
    game.enableSimulationMode();
    
    // 안내 메시지 표시
    showNotification('센서를 사용할 수 없어 키보드 모드로 전환됩니다.', 'info');
}

function handlePermissionError(error) {
    // 권한 요청 안내
    showPermissionDialog(error.permission);
}
```

### 재시도 로직

```javascript
// 연결 재시도
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;

game.on('onConnectionChange', (isConnected) => {
    if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        
        setTimeout(() => {
            console.log(`재연결 시도 ${reconnectAttempts}/${maxReconnectAttempts}`);
            game.reconnect();
        }, reconnectAttempts * 2000); // 지수적 백오프
    } else if (isConnected) {
        reconnectAttempts = 0; // 성공 시 리셋
    }
});
```

---

## 로컬 라이브러리

### 🎱 Cannon-ES 물리 엔진

센서 게임 허브에는 **Cannon-ES 3D 물리 엔진**이 로컬로 포함되어 있어 오프라인 환경에서도 고성능 3D 물리 시뮬레이션을 사용할 수 있습니다.

#### 라이브러리 정보
- **버전**: v6.0.0
- **크기**: ~800KB
- **경로**: `/libs/cannon-es.js`
- **용도**: 3D 물리 시뮬레이션, 충돌 감지, 강체 역학

#### 사용 방법
```html
<!-- HTML에 라이브러리 포함 -->
<script src="/libs/cannon-es.js"></script>
```

#### API 사용 예제

**기본 물리 월드 생성:**
```javascript
// 물리 월드 초기화
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)  // 중력 설정
});

// 성능 최적화
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;
```

**강체 생성 및 추가:**
```javascript
// 구 모양 강체
const sphereShape = new CANNON.Sphere(1);
const sphereBody = new CANNON.Body({ mass: 1 });
sphereBody.addShape(sphereShape);
sphereBody.position.set(0, 10, 0);
world.add(sphereBody);

// 박스 모양 강체
const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
const boxBody = new CANNON.Body({ mass: 5 });
boxBody.addShape(boxShape);
boxBody.position.set(2, 10, 0);
world.add(boxBody);

// 바닥 (정적 강체)
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0 });  // mass 0 = 정적
groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.add(groundBody);
```

**센서 입력과 물리 통합:**
```javascript
class Physics3DGame extends SensorGameSDK {
    handleSensorInput(data) {
        const { gameInput } = data;
        
        // 센서 기울기를 물리력으로 변환
        if (gameInput.tilt && this.playerBody) {
            const force = new CANNON.Vec3(
                gameInput.tilt.x * 200,  // X축 힘
                0,                       // Y축 힘 (중력이 있으므로 보통 0)
                gameInput.tilt.y * 200   // Z축 힘
            );
            
            // 플레이어 강체에 힘 적용
            this.playerBody.applyForce(force, this.playerBody.position);
        }
        
        // 흔들기로 점프
        if (gameInput.shake && gameInput.shake.detected) {
            const jumpImpulse = new CANNON.Vec3(0, 300, 0);
            this.playerBody.applyImpulse(jumpImpulse, this.playerBody.position);
        }
    }
    
    update(deltaTime) {
        // 물리 월드 시뮬레이션 (중요!)
        this.world.step(deltaTime / 1000);
        
        // 3D 렌더링 객체와 물리 강체 위치 동기화
        if (this.playerMesh && this.playerBody) {
            this.playerMesh.position.copy(this.playerBody.position);
            this.playerMesh.quaternion.copy(this.playerBody.quaternion);
        }
    }
}
```

**고급 기능:**
```javascript
// 충돌 감지 이벤트
body.addEventListener('collide', (event) => {
    const { target, body } = event;
    console.log('충돌 발생!', target, body);
});

// 재질 설정 (마찰, 반발)
const material = new CANNON.Material('groundMaterial');
const contactMaterial = new CANNON.ContactMaterial(
    material, material, {
        friction: 0.4,
        restitution: 0.3
    }
);
world.addContactMaterial(contactMaterial);

// 제약 조건 (힌지, 로프 등)
const constraint = new CANNON.PointToPointConstraint(
    bodyA, new CANNON.Vec3(0, 0, 0),
    bodyB, new CANNON.Vec3(0, 0, 0)
);
world.addConstraint(constraint);
```

**성능 최적화 팁:**
```javascript
// 브로드페이즈 알고리즘 선택
world.broadphase = new CANNON.NaiveBroadphase();        // 적은 객체
world.broadphase = new CANNON.SAPBroadphase(world);     // 많은 객체

// 솔버 반복 횟수 조정
world.solver.iterations = 10;  // 높을수록 정확하지만 느림

// 물리 객체 풀링
class PhysicsObjectPool {
    constructor() {
        this.available = [];
        this.inUse = [];
    }
    
    get() {
        return this.available.pop() || this.create();
    }
    
    release(obj) {
        this.inUse.splice(this.inUse.indexOf(obj), 1);
        this.available.push(obj);
    }
}
```

---

## 예제 코드

### 기본 솔로 게임

```javascript
class SimpleGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'simple-game',
            gameName: 'Simple Game',
            gameType: 'solo',
            sensorTypes: ['orientation', 'accelerometer']
        });
        
        this.player = { x: 400, y: 300, size: 20 };
        this.score = 0;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupCallbacks();
        this.startGameLoop();
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
    }
    
    setupCallbacks() {
        this.on('onSessionCreated', (data) => {
            this.showSessionCode(data.sessionCode);
        });
        
        this.on('onSensorConnected', () => {
            this.hideSessionCode();
        });
        
        this.on('onSensorData', (data) => {
            this.handleInput(data);
        });
    }
    
    handleInput(data) {
        const { gameInput } = data;
        
        if (gameInput.tilt) {
            this.player.x += gameInput.tilt.x * 5;
            this.player.y += gameInput.tilt.y * 5;
        }
        
        // 경계 제한
        this.player.x = Math.max(0, Math.min(this.canvas.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height, this.player.y));
    }
    
    startGameLoop() {
        const gameLoop = () => {
            this.update();
            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    
    update() {
        // 게임 로직 업데이트
        this.score++;
    }
    
    render() {
        // 화면 지우기
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 플레이어 그리기
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(
            this.player.x - this.player.size/2,
            this.player.y - this.player.size/2,
            this.player.size,
            this.player.size
        );
        
        // 점수 표시
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    }
    
    showSessionCode(code) {
        document.getElementById('sessionCode').textContent = code;
        document.getElementById('sessionPanel').style.display = 'block';
    }
    
    hideSessionCode() {
        document.getElementById('sessionPanel').style.display = 'none';
    }
}

// 게임 시작
const game = new SimpleGame();
```

### 멀티플레이어 게임

```javascript
class MultiplayerGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'multiplayer-game',
            gameName: 'Multiplayer Game',
            gameType: 'multiplayer',
            sensorTypes: ['orientation', 'accelerometer']
        });
        
        this.players = new Map();
        this.gameState = 'lobby';
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupCallbacks();
        this.startGameLoop();
    }
    
    setupCallbacks() {
        // 기본 콜백들
        this.on('onSessionCreated', (data) => {
            this.showSessionCode(data.sessionCode);
        });
        
        this.on('onSensorConnected', () => {
            this.hideSessionCode();
            this.showLobby();
        });
        
        // 멀티플레이어 콜백들
        this.on('onRoomCreated', (data) => {
            console.log('룸 생성됨:', data.roomId);
        });
        
        this.on('onPlayerJoined', (data) => {
            this.addPlayer(data.player);
            this.updateLobby(data.players);
        });
        
        this.on('onGameStarted', () => {
            this.gameState = 'playing';
            this.hideLobby();
        });
        
        this.on('onSensorData', (data) => {
            if (this.gameState === 'playing') {
                this.handleInput(data);
            }
        });
        
        this.on('onGameEvent', (eventData) => {
            this.handlePlayerEvent(eventData);
        });
    }
    
    addPlayer(player) {
        this.players.set(player.sessionId, {
            ...player,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            color: this.getPlayerColor(this.players.size)
        });
    }
    
    handleInput(data) {
        const { gameInput } = data;
        const myPlayer = this.getMyPlayer();
        
        if (gameInput.tilt && myPlayer) {
            myPlayer.x += gameInput.tilt.x * 5;
            myPlayer.y += gameInput.tilt.y * 5;
            
            // 다른 플레이어들에게 위치 전송
            this.sendGameEvent('player_move', {
                position: { x: myPlayer.x, y: myPlayer.y },
                timestamp: Date.now()
            });
        }
    }
    
    handlePlayerEvent(eventData) {
        const { sessionId, eventType, data } = eventData;
        
        switch (eventType) {
            case 'player_move':
                const player = this.players.get(sessionId);
                if (player) {
                    player.x = data.position.x;
                    player.y = data.position.y;
                }
                break;
        }
    }
    
    render() {
        // 화면 지우기
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 모든 플레이어 그리기
        this.players.forEach((player) => {
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(
                player.x - 10, player.y - 10, 20, 20
            );
            
            // 플레이어 이름 표시
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(player.nickname, player.x - 20, player.y - 15);
        });
    }
    
    getPlayerColor(index) {
        const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FF9800'];
        return colors[index % colors.length];
    }
    
    getMyPlayer() {
        return Array.from(this.players.values())
            .find(player => player.isMe);
    }
}

// 게임 시작
const game = new MultiplayerGame();
```

### 다중 센서 게임

```javascript
class DualSensorGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'dual-sensor-game',
            gameName: 'Dual Sensor Game',
            gameType: 'solo',
            sensorTypes: ['orientation', 'accelerometer'],
            multiSensor: true // 다중 센서 활성화
        });
        
        // 각 센서별 제어 객체
        this.leftHand = { x: 200, y: 300, weapon: 'shield' };
        this.rightHand = { x: 600, y: 300, weapon: 'sword' };
        
        this.init();
    }
    
    setupCallbacks() {
        this.on('onSensorData', (data) => {
            this.handleDualSensorInput(data);
        });
    }
    
    handleDualSensorInput(data) {
        const { gameInput, sensorType } = data;
        
        if (sensorType === 'primary') {
            // 주 센서 (오른손) - 검 제어
            if (gameInput.tilt) {
                this.rightHand.x += gameInput.tilt.x * 5;
                this.rightHand.y += gameInput.tilt.y * 5;
            }
            
            if (gameInput.shake && gameInput.shake.detected) {
                this.attackWithSword();
            }
            
        } else if (sensorType === 'secondary') {
            // 보조 센서 (왼손) - 방패 제어
            if (gameInput.tilt) {
                this.leftHand.x += gameInput.tilt.x * 3;
                this.leftHand.y += gameInput.tilt.y * 3;
            }
            
            if (gameInput.shake && gameInput.shake.detected) {
                this.blockWithShield();
            }
        }
    }
    
    attackWithSword() {
        console.log('검 공격!');
        // 검 공격 로직
    }
    
    blockWithShield() {
        console.log('방패 방어!');
        // 방패 방어 로직
    }
    
    render() {
        // 화면 지우기
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 왼손 (방패)
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(this.leftHand.x - 15, this.leftHand.y - 20, 30, 40);
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillText('🛡️', this.leftHand.x - 8, this.leftHand.y + 5);
        
        // 오른손 (검)
        this.ctx.fillStyle = '#F44336';
        this.ctx.fillRect(this.rightHand.x - 15, this.rightHand.y - 20, 30, 40);
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillText('⚔️', this.rightHand.x - 8, this.rightHand.y + 5);
    }
}

// 게임 시작
const game = new DualSensorGame();
```

---

## 관리자 API

센서 게임 허브 v4.0은 서버 모니터링과 관리를 위한 완전한 관리자 API를 제공합니다.

### 관리자 대시보드 접속

```
GET /admin
```

관리자 대시보드 페이지를 반환합니다.

### 서버 상태 조회

```
GET /api/admin/status
```

#### 응답

```json
{
    "success": true,
    "status": {
        "uptime": 3600000,           // 서버 업타임 (ms)
        "memory": 52428800,          // 메모리 사용량 (bytes)
        "cpu": 15,                   // CPU 사용률 (%)
        "totalConnections": 25,      // 총 연결 수
        "sessions": {
            "active": 5,             // 활성 세션
            "today": 12              // 오늘 생성된 세션
        },
        "sensors": {
            "connected": 8           // 연결된 센서
        },
        "avgLatency": 45,            // 평균 지연시간 (ms)
        "clients": [                 // 클라이언트 목록
            {
                "id": "client-uuid",
                "type": "pc|sensor|admin",
                "userAgent": "Mozilla/5.0...",
                "connectedTime": 120000,
                "latency": 25
            }
        ],
        "rooms": [                   // 룸 목록
            {
                "id": "room-uuid",
                "name": "게임룸 이름",
                "gameId": "game-id",
                "maxPlayers": 4,
                "players": [
                    {
                        "sessionId": "session-id",
                        "nickname": "플레이어1",
                        "isHost": true
                    }
                ]
            }
        ]
    }
}
```

### 관리자 WebSocket API

관리자 대시보드는 WebSocket을 통해 실시간 데이터를 주고받습니다.

#### 관리자 연결

```javascript
// 클라이언트 → 서버
{
    "type": "admin_connect",
    "timestamp": 1640995200000
}

// 서버 → 클라이언트
{
    "type": "admin_connected",
    "message": "관리자 권한으로 연결되었습니다.",
    "timestamp": 1640995200000
}
```

#### 상태 정보 요청

```javascript
// 클라이언트 → 서버
{
    "type": "admin_status_request",
    "timestamp": 1640995200000
}

// 서버 → 클라이언트
{
    "type": "admin_status",
    "status": {
        // 위의 /api/admin/status와 동일한 구조
    },
    "timestamp": 1640995200000
}
```

#### 모든 클라이언트 연결 해제

```javascript
// 클라이언트 → 서버
{
    "type": "admin_disconnect_all",
    "timestamp": 1640995200000
}

// 서버 → 클라이언트
{
    "type": "admin_action_result",
    "action": "disconnect_all",
    "result": "25개 클라이언트 연결 해제 완료",
    "timestamp": 1640995200000
}
```

#### 실시간 이벤트 알림

```javascript
// 클라이언트 연결
{
    "type": "client_connected",
    "clientId": "client-uuid",
    "clientType": "pc|sensor|admin"
}

// 클라이언트 연결 해제
{
    "type": "client_disconnected",
    "clientId": "client-uuid"
}

// 룸 생성
{
    "type": "room_created",
    "roomName": "게임룸",
    "roomId": "room-uuid"
}

// 룸 삭제
{
    "type": "room_deleted",
    "roomId": "room-uuid"
}

// 세션 생성
{
    "type": "session_created",
    "sessionCode": "1234"
}

// 세션 매칭
{
    "type": "session_matched",
    "sessionCode": "1234"
}

// 에러 발생
{
    "type": "error",
    "message": "오류 메시지"
}
```

### QR 코드 기능

관리자 대시보드는 모바일 센서 클라이언트 접속용 QR 코드를 자동 생성합니다.

#### 특징

- **자동 URL 감지**: 현재 서버 URL을 기반으로 QR 코드 생성
- **실시간 생성**: 페이지 로드 시 즉시 생성
- **고품질**: 150x150 픽셀 고해상도 QR 코드
- **사용자 친화적**: 호버 효과와 함께 시각적 피드백

#### QR 코드 URL 형식

```
https://your-domain.com/sensor
```

### 보안 고려사항

#### 접근 제어
- 관리자 대시보드는 개발 환경에서 자유 접근 가능
- 프로덕션 환경에서는 추가 인증 시스템 구현 권장

#### 데이터 보호
- 민감한 개인 정보는 표시하지 않음
- 클라이언트 ID는 UUID로 익명화
- 시스템 로그는 클라이언트 측에서만 보관

#### 권한 관리
- 관리자만 모든 클라이언트 연결 해제 가능
- 일반 클라이언트는 관리자 기능 접근 불가
- WebSocket 메시지 타입별 권한 검증

---

## 마무리

이 API 레퍼런스를 통해 센서 게임 허브 v4.0의 모든 기능을 활용할 수 있습니다. 

### 추가 리소스
- [개발자 가이드](DEVELOPER_GUIDE.md) - 상세한 개발 방법
- [LLM 가이드](LLM_GUIDE.md) - AI 코딩 에이전트용 가이드
- 게임 템플릿 - `templates/` 폴더 참조

### 지원 및 문의
개발 중 문제가 발생하거나 추가 기능이 필요한 경우, 프로젝트 이슈 트래커를 통해 문의해주세요.

**🎮 센서 게임 허브 v4.0과 함께 혁신적인 센서 게임을 만들어보세요!**