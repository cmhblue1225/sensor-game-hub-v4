# 🤖 센서 게임 허브 v4.0 - LLM 개발 가이드

> **Claude Code, Gemini CLI 및 모든 AI 코딩 에이전트를 위한 완벽한 개발 가이드**

## 📋 시작하기 전에

이 문서는 **Claude Code**, **Gemini CLI**, **GitHub Copilot**, **Cursor** 등 모든 AI 코딩 에이전트가 센서 게임 허브 v4.0에서 완벽한 게임을 개발할 수 있도록 작성되었습니다.

### 🎯 프로젝트 개요

- **프로젝트명**: 센서 게임 허브 v4.0
- **위치**: `/sensor-game-hub-v4/`
- **언어**: JavaScript (TypeScript 금지)
- **플랫폼**: 웹 브라우저 (모바일 센서 지원)
- **배포**: Render.com (자동 HTTPS)

---

## 🏗️ 아키텍처 이해

### 핵심 구조
```
sensor-game-hub-v4/
├── server.js              # WebSocket + HTTP 서버
├── client/                # 클라이언트 페이지들
│   ├── hub.html           # 메인 허브 (PC)
│   └── sensor.html        # 센서 클라이언트 (모바일)
├── sdk/                   # 게임 개발 SDK
│   ├── sensor-game-sdk.js # 메인 SDK
│   └── utils.js           # 유틸리티 함수들
├── games/                 # 게임들이 저장되는 폴더 ⭐
└── templates/             # 개발 템플릿
    ├── solo-template/     # 솔로 게임 템플릿
    └── multiplayer-template/ # 멀티 게임 템플릿
```

### 🔄 게임 플레이 흐름

1. **PC 접속** → 허브 페이지 → 4자리 세션 코드 발급
2. **모바일 접속** → 센서 클라이언트 → 4자리 코드 입력 → 연결
3. **게임 선택** → 솔로 게임 즉시 플레이 OR 멀티 게임 룸 생성/참가
4. **센서 데이터** → 모바일에서 PC로 실시간 전송 → 게임 입력으로 변환

---

## 🎮 게임 개발 가이드

### 1단계: 게임 타입 결정
```javascript
// 솔로 게임 (1명)
gameType: 'solo'
// 멀티플레이어 게임 (2-8명)
gameType: 'multiplayer'
```

### 2단계: 템플릿 복사
```bash
# 솔로 게임 개발 시
cp -r templates/solo-template games/my-new-game

# 멀티플레이어 게임 개발 시  
cp -r templates/multiplayer-template games/my-new-game
```

### 3단계: 게임 메타데이터 설정 (game.json)
```json
{
    "id": "my-new-game",
    "name": "🎯 내 새로운 게임",
    "description": "게임 설명을 여기에 작성하세요",
    "gameType": "solo", // "solo" 또는 "multiplayer"
    "category": "action", // action, puzzle, racing, sports 등
    "difficulty": "medium", // easy, medium, hard, expert
    "sensorTypes": ["orientation", "accelerometer"],
    "minPlayers": 1,
    "maxPlayers": 1 // 멀티플레이어는 2-8
}
```

### 4단계: 게임 클래스 구현 (game.js)
```javascript
class MyNewGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'my-new-game',
            gameName: '내 새로운 게임',
            gameType: 'solo', // 또는 'multiplayer'
            sensorTypes: ['orientation', 'accelerometer'],
            // 다중 센서 지원 (선택사항)
            multiSensor: false, // true면 2개 센서 지원
            sensorSensitivity: {
                orientation: 0.8,    // 0.1 ~ 2.0
                accelerometer: 0.5,  // 0.1 ~ 2.0
                gyroscope: 0.3       // 0.1 ~ 2.0
            }
        });
        
        // 게임 상태 초기화
        this.gameState = {
            isPlaying: false,
            score: 0,
            level: 1
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupCallbacks();
        // 기타 초기화 작업
    }
}
```

---

## 📱 센서 데이터 처리

### 센서 입력 콜백 등록
```javascript
// SDK 콜백 설정
setupCallbacks() {
    // 센서 데이터 수신
    this.on('onSensorData', (data) => {
        this.handleSensorInput(data);
    });
    
    // 세션 연결 상태
    this.on('onSessionCreated', (data) => {
        this.showSessionCode(data.sessionCode);
    });
    
    this.on('onSensorConnected', () => {
        this.hideSessionCode();
        this.startGame();
    });
}
```

### 센서 데이터 처리
```javascript
handleSensorInput(data) {
    const { gameInput, sensorType } = data;
    
    // 기울기 입력 (-1 ~ 1)
    if (gameInput.tilt) {
        this.player.velocity.x += gameInput.tilt.x * this.speed;
        this.player.velocity.y += gameInput.tilt.y * this.speed;
    }
    
    // 흔들기 감지
    if (gameInput.shake && gameInput.shake.detected) {
        this.triggerSpecialAction();
    }
    
    // 다중 센서 지원 시
    if (sensorType === 'primary') {
        // 주 센서 (오른손) 처리
    } else if (sensorType === 'secondary') {
        // 보조 센서 (왼손) 처리
    }
}
```

### 키보드 시뮬레이션 (개발/테스트용)
```javascript
// 자동으로 WASD + 스페이스바 지원
// 개발자가 추가 구현할 필요 없음
```

---

## 🎯 멀티플레이어 개발

### 멀티플레이어 콜백 등록
```javascript
setupCallbacks() {
    // 기본 센서 콜백들 + 멀티플레이어 콜백들
    
    this.on('onRoomCreated', (data) => {
        console.log('룸 생성:', data.roomId);
    });
    
    this.on('onPlayerJoined', (data) => {
        this.addPlayer(data.player);
        this.updatePlayerList();
    });
    
    this.on('onGameStarted', () => {
        this.hideLobby();
        this.startGameplay();
    });
    
    this.on('onGameEvent', (data) => {
        this.handlePlayerEvent(data);
    });
}
```

### 플레이어 간 이벤트 전송
```javascript
// 다른 플레이어들에게 이벤트 전송
sendPlayerAction(action, data) {
    this.sendGameEvent(action, {
        playerId: this.myPlayerId,
        position: this.player.position,
        action: action,
        data: data
    });
}

// 다른 플레이어 이벤트 수신
handlePlayerEvent(eventData) {
    const { sessionId, eventType, data } = eventData;
    
    switch (eventType) {
        case 'player_move':
            this.updateOtherPlayer(sessionId, data.position);
            break;
        case 'player_shoot':
            this.createBullet(data.position, data.direction);
            break;
    }
}
```

---

## 🎨 UI 및 화면 구성

### 필수 UI 요소들
```html
<!-- 세션 코드 표시 패널 (자동 표시/숨김) -->
<div id="sessionCodePanel" class="hidden">
    <div id="sessionCodeDisplay">----</div>
</div>

<!-- 점수 및 상태 -->
<div id="scoreValue">0</div>
<div id="gameStatus">게임 준비중...</div>
<div id="sensorStatus">센서 연결 대기중...</div>
```

### UI 업데이트 함수들
```javascript
// 점수 업데이트
updateScore() {
    document.getElementById('scoreValue').textContent = this.gameState.score;
}

// 세션 코드 표시/숨김 (SDK가 자동 호출)
showSessionCode(code) {
    const panel = document.getElementById('sessionCodePanel');
    const display = document.getElementById('sessionCodeDisplay');
    display.textContent = code;
    panel.classList.remove('hidden');
}

hideSessionCode() {
    document.getElementById('sessionCodePanel').classList.add('hidden');
}
```

---

## 🎪 게임 로직 구현

### 기본 게임 루프
```javascript
start() {
    this.gameState.isPlaying = true;
    this.startGameLoop();
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
    // 1. 물리 계산
    this.updatePhysics();
    
    // 2. 충돌 감지
    this.checkCollisions();
    
    // 3. 게임 로직
    this.updateGameLogic();
    
    // 4. AI/적 업데이트
    this.updateEnemies();
}

render() {
    // 1. 화면 지우기
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 2. 배경 그리기
    this.renderBackground();
    
    // 3. 게임 객체들 그리기
    this.renderPlayer();
    this.renderEnemies();
    this.renderUI();
}
```

### 충돌 감지
```javascript
checkCollisions() {
    // 플레이어와 적 충돌
    this.enemies.forEach(enemy => {
        if (this.isColliding(this.player, enemy)) {
            this.handlePlayerEnemyCollision(enemy);
        }
    });
    
    // 플레이어와 아이템 충돌
    this.items.forEach(item => {
        if (this.isColliding(this.player, item)) {
            this.collectItem(item);
        }
    });
}

isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
```

---

## 🛠️ 유틸리티 함수 활용

### SensorGameUtils 사용
```javascript
// 디바이스 감지
const device = SensorGameUtils.detectDevice();
if (device.isMobile) {
    // 모바일 전용 로직
}

// 수학 유틸리티
const distance = SensorGameUtils.math.distance(point1, point2);
const clamped = SensorGameUtils.math.clamp(value, 0, 100);
const lerped = SensorGameUtils.math.lerp(start, end, 0.5);

// 충돌 감지
const collision = SensorGameUtils.collision.rectRect(player, enemy);

// 색상 보간
const color = SensorGameUtils.color.interpolate('#ff0000', '#00ff00', 0.5);

// 성능 최적화
const fpsCounter = SensorGameUtils.performance.createFPSCounter();
const throttled = SensorGameUtils.performance.throttle(updateFunction, 16);
```

---

## 🎯 게임 카테고리별 가이드

### Action 게임
```javascript
// 빠른 반응, 연속 입력 처리
handleSensorInput(data) {
    if (data.gameInput.tilt) {
        // 즉각적인 플레이어 이동
        this.player.x += data.gameInput.tilt.x * this.speed;
        this.player.y += data.gameInput.tilt.y * this.speed;
    }
    
    if (data.gameInput.shake.detected) {
        // 즉각적인 액션 (총 발사, 점프 등)
        this.fireWeapon();
    }
}
```

### Puzzle 게임
```javascript
// 정밀한 제어, 상태 기반 로직
handleSensorInput(data) {
    // 미세한 기울기 변화 감지
    const tiltThreshold = 0.3;
    
    if (Math.abs(data.gameInput.tilt.x) > tiltThreshold) {
        this.movePlayer(data.gameInput.tilt.x > 0 ? 'right' : 'left');
    }
    
    if (data.gameInput.gesture && data.gameInput.gesture.type === 'swipe') {
        this.rotatePiece(data.gameInput.gesture.direction);
    }
}
```

### Racing 게임
```javascript
// 연속적인 조향 입력
handleSensorInput(data) {
    // 기울기를 조향각으로 변환
    this.car.steeringAngle = data.gameInput.tilt.x * this.maxSteeringAngle;
    
    // 가속도계로 가속/브레이크
    if (data.gameInput.movement.y > 5) {
        this.car.acceleration = this.maxAcceleration;
    } else if (data.gameInput.movement.y < -5) {
        this.car.braking = true;
    }
}
```

### Sports 게임
```javascript
// 실제 스포츠 동작 모방
handleSensorInput(data) {
    // 테니스: 스윙 동작 감지
    if (data.gameInput.gesture && data.gameInput.gesture.type === 'swipe') {
        this.swing(data.gameInput.gesture.direction, data.gameInput.gesture.intensity);
    }
    
    // 골프: 백스윙 → 다운스윙 감지
    this.detectSwingMotion(data.gameInput.rotation);
}
```

---

## 🔧 개발 모범 사례

### 1. 에러 처리
```javascript
handleSensorInput(data) {
    // 데이터 검증
    if (!data || !data.gameInput) {
        console.warn('Invalid sensor data received');
        return;
    }
    
    // 안전한 속성 접근
    const tilt = data.gameInput.tilt || { x: 0, y: 0 };
    
    // 범위 제한
    const clampedX = this.clamp(tilt.x, -1, 1);
    const clampedY = this.clamp(tilt.y, -1, 1);
    
    // 게임 로직 적용
    this.updatePlayer(clampedX, clampedY);
}
```

### 2. 성능 최적화
```javascript
// 객체 풀링
class BulletPool {
    constructor(size) {
        this.pool = [];
        for (let i = 0; i < size; i++) {
            this.pool.push(this.createBullet());
        }
    }
    
    getBullet() {
        return this.pool.pop() || this.createBullet();
    }
    
    releaseBullet(bullet) {
        bullet.reset();
        this.pool.push(bullet);
    }
}

// 프레임 제한
update(currentTime) {
    if (currentTime - this.lastUpdateTime < 16) return; // 60fps 제한
    this.lastUpdateTime = currentTime;
    
    // 게임 로직...
}
```

### 3. 반응형 디자인
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
        
        // 게임 객체들 위치 재조정
        this.repositionGameObjects();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}
```

---

## 🚀 배포 준비

### 1. 게임 파일 구조 확인
```
games/my-new-game/
├── game.json     # 메타데이터 (필수)
├── index.html    # 게임 페이지 (필수) 
├── game.js       # 게임 로직 (필수)
└── assets/       # 리소스 (선택사항)
    ├── images/
    ├── sounds/
    └── fonts/
```

### 2. game.json 최종 검증
```json
{
    "id": "고유한 게임 ID (소문자, 하이픈만 사용)",
    "name": "이모지 포함 게임 이름",
    "description": "게임 설명 (100자 이내)",
    "gameType": "solo 또는 multiplayer",
    "category": "action, puzzle, racing, sports, adventure, simulation, strategy, casual 중 하나",
    "difficulty": "easy, medium, hard, expert 중 하나",
    "sensorTypes": ["사용하는 센서 타입들"],
    "minPlayers": 1,
    "maxPlayers": "멀티플레이어면 2-8, 솔로면 1"
}
```

### 3. 자동 등록 확인
```javascript
// 게임을 games/ 폴더에 저장하면 자동으로 허브에 등록됩니다
// 서버가 감지하여 즉시 게임 목록에 추가됩니다
```

---

## 🐛 디버깅 및 테스트

### 1. 개발 도구 활용
```javascript
// 디버그 모드 활성화
this.config.showDebug = true;

// 센서 시뮬레이션 (키보드)
// WASD: 기울기
// 스페이스: 흔들기
// R: 센서 보정

// 콘솔 로그 활용
console.log('센서 데이터:', data);
console.log('게임 상태:', this.gameState);
```

### 2. 성능 모니터링
```javascript
// FPS 확인
const stats = this.getStats();
console.log('FPS:', stats.fps);
console.log('연결 상태:', stats.isConnected);
console.log('센서 연결:', stats.sensorConnected);
```

### 3. 일반적인 문제 해결
```javascript
// 센서 데이터가 안 올 때
this.on('onError', (error) => {
    if (error.type === 'sensor') {
        // 시뮬레이션 모드로 전환
        this.enableSimulationMode();
    }
});

// 연결이 끊어질 때
this.on('onConnectionChange', (isConnected) => {
    if (!isConnected) {
        this.pause();
        this.showReconnectMessage();
    }
});
```

---

## 💡 창의적인 센서 활용법

### 1. 고급 제스처 감지
```javascript
detectCustomGestures(data) {
    // 원형 제스처 감지
    if (this.isCircularMotion(data.gameInput.rotation)) {
        this.triggerSpinAttack();
    }
    
    // 더블 탭 감지
    if (this.isDoubleTap(data.gameInput.shake)) {
        this.jump();
    }
    
    // 휴대폰 뒤집기 감지
    if (Math.abs(data.gameInput.tilt.y) > 0.8) {
        this.flipScreen();
    }
}
```

### 2. 다중 센서 활용 (2개 센서)
```javascript
handleSensorInput(data) {
    if (data.sensorType === 'primary') {
        // 오른손 센서: 검 조작
        this.sword.angle = data.gameInput.tilt.x * 90;
        
        if (data.gameInput.shake.detected) {
            this.slashSword();
        }
    } else if (data.sensorType === 'secondary') {
        // 왼손 센서: 방패 조작
        this.shield.angle = data.gameInput.tilt.x * 90;
        
        if (data.gameInput.shake.detected) {
            this.blockAttack();
        }
    }
}
```

### 3. 물리 엔진 통합
```javascript
updatePhysics() {
    // 센서 데이터를 물리력으로 변환
    const forceX = this.player.gameInput.tilt.x * this.forceMultiplier;
    const forceY = this.player.gameInput.tilt.y * this.forceMultiplier;
    
    // 물리 엔진에 힘 적용
    this.player.body.applyForce(forceX, forceY);
    
    // 중력, 마찰 등 물리 법칙 적용
    this.physicsWorld.step(deltaTime);
}
```

---

## 📊 성공적인 게임을 위한 체크리스트

### ✅ 기본 요구사항
- [ ] 템플릿 기반으로 개발
- [ ] game.json 메타데이터 완성
- [ ] 센서 입력 처리 구현
- [ ] 키보드 시뮬레이션 지원
- [ ] 세션 코드 표시/숨김 구현
- [ ] 에러 처리 및 예외 상황 대응

### ✅ 게임플레이
- [ ] 명확한 게임 목표
- [ ] 직관적인 센서 조작
- [ ] 즉각적인 피드백
- [ ] 적절한 난이도 곡선
- [ ] 재플레이 가치

### ✅ 기술적 품질
- [ ] 60fps 이상 성능
- [ ] 메모리 누수 없음
- [ ] 모든 브라우저에서 동작
- [ ] 모바일 기기 최적화
- [ ] 네트워크 연결 불안정 대응

### ✅ 멀티플레이어 (해당하는 경우)
- [ ] 대기실 시스템 구현
- [ ] 플레이어 간 실시간 동기화
- [ ] 호스트 권한 관리
- [ ] 게임 시작/종료 처리
- [ ] 플레이어 퇴장 처리

---

## 🎓 고급 기능 구현

### 1. 게임 저장/로딩
```javascript
saveGameState() {
    const saveData = {
        score: this.gameState.score,
        level: this.gameState.level,
        playerPosition: this.player.position,
        timestamp: Date.now()
    };
    
    SensorGameUtils.storage.set('my-game-save', saveData);
}

loadGameState() {
    const saveData = SensorGameUtils.storage.get('my-game-save');
    if (saveData) {
        this.gameState.score = saveData.score;
        this.gameState.level = saveData.level;
        this.player.position = saveData.playerPosition;
    }
}
```

### 2. 리더보드 시스템
```javascript
submitScore(score) {
    const leaderboard = SensorGameUtils.storage.get('leaderboard', []);
    leaderboard.push({
        score: score,
        date: new Date().toISOString(),
        deviceId: this.generateDeviceId()
    });
    
    // 상위 10개만 유지
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.splice(10);
    
    SensorGameUtils.storage.set('leaderboard', leaderboard);
}
```

### 3. 설정 시스템
```javascript
setupSettings() {
    this.settings = SensorGameUtils.storage.get('game-settings', {
        sensorSensitivity: 0.8,
        soundVolume: 0.7,
        graphicsQuality: 'medium'
    });
    
    // 설정 적용
    this.config.sensorSensitivity.orientation = this.settings.sensorSensitivity;
}
```

---

## 🌟 마무리 가이드

### 개발 완료 후 확인사항

1. **기능 테스트**
   - PC에서 게임 로딩 확인
   - 모바일에서 센서 연결 확인
   - 센서 입력이 게임에 반영되는지 확인
   - 키보드 시뮬레이션 동작 확인

2. **성능 테스트**
   - 60fps 유지 여부
   - 메모리 사용량 확인
   - 장시간 플레이 시 안정성

3. **사용자 경험**
   - 직관적인 조작법
   - 명확한 UI/UX
   - 적절한 피드백

4. **호환성 테스트**
   - iOS Safari
   - Android Chrome
   - Desktop 브라우저들

### 최종 배포

게임 개발이 완료되면 `games/` 폴더에 저장하는 것만으로 자동으로 허브에 등록됩니다. 추가 작업은 필요하지 않습니다.

---

**🎉 이제 센서 게임 허브 v4.0에서 멋진 게임을 개발할 준비가 되었습니다!**

이 가이드를 따라 개발하면 완벽하게 동작하는 센서 게임을 만들 수 있습니다. 추가 질문이나 도움이 필요하면 개발자 가이드와 SDK 문서를 참조하세요.