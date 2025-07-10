# 🎮 센서 게임 허브 v4.0

> **모바일 센서를 활용한 웹 게임 플랫폼**

[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7.svg)](https://render.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 개요

센서 게임 허브 v4.0은 개발자들이 iPhone/Android의 센서(자이로스코프, 가속도계, 방향센서)를 활용한 혁신적인 웹 게임을 쉽게 개발하고 배포할 수 있는 완전한 플랫폼입니다.

### ✨ 주요 특징

- **🎯 완벽한 세션 매칭**: PC와 모바일 간 4자리 코드로 안전한 연결
- **👥 멀티플레이어 지원**: 최대 8명까지 실시간 멀티플레이어 게임
- **📱 다중 센서 지원**: 한 PC에 최대 2개의 센서 클라이언트 연결 (듀얼 핸드 게임)
- **🛠️ 강력한 SDK**: JavaScript 기반 완전한 센서 게임 개발 도구
- **🔄 자동 게임 등록**: games 폴더에 추가하면 자동으로 허브에 표시
- **🌐 크로스 플랫폼**: iOS, Android, 데스크톱 모든 플랫폼 지원
- **🔒 HTTPS 지원**: iOS 센서 권한을 위한 완전한 SSL 설정

## 📋 시스템 요구사항

- **Node.js** 18 이상
- **모던 웹 브라우저** (Chrome, Safari, Firefox, Edge)
- **HTTPS** 환경 (iOS 센서 권한용)

## 🛠️ 설치 및 실행

### 1. 로컬 개발 환경

```bash
# 프로젝트 클론
git clone <repository-url>
cd sensor-game-hub-v4

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 2. 접속 URL

개발 서버 실행 후 다음 URL로 접속:

- **PC (게임 허브)**: `https://localhost:8443/`
- **모바일 (센서)**: `https://[PC-IP]:8443/sensor`
- **대시보드**: `https://localhost:8443/dashboard`

## 🎮 사용 방법

### 기본 플레이 흐름

1. **PC**에서 허브 접속 → 4자리 세션 코드 발급
2. **모바일**에서 센서 클라이언트 접속 → 4자리 코드 입력
3. **게임 선택** → 솔로 게임 즉시 플레이 OR 멀티 게임 룸 생성/참가
4. **센서 조작** → 기기 기울이기, 흔들기로 게임 플레이

### 다중 센서 게임 (듀얼 핸드)

1. PC에서 다중 센서 지원 게임 선택
2. 첫 번째 모바일 → "주 센서" 선택 (오른손)
3. 두 번째 모바일 → "보조 센서" 선택 (왼손)
4. 양손으로 검과 방패, 총 등을 각각 조작

## 🔧 게임 개발

### 빠른 시작

```bash
# 솔로 게임 템플릿 복사
cp -r templates/solo-template games/my-new-game

# 또는 멀티플레이어 게임 템플릿 복사
cp -r templates/multiplayer-template games/my-multiplayer-game

# 게임 메타데이터 수정
nano games/my-new-game/game.json
```

### 기본 게임 구조

```javascript
class MyGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'my-game',
            gameName: 'My Game',
            gameType: 'solo', // 'solo' 또는 'multiplayer'
            sensorTypes: ['orientation', 'accelerometer'],
            multiSensor: false // true면 2개 센서 지원
        });
    }
    
    // 센서 입력 처리
    handleSensorInput(data) {
        const { gameInput } = data;
        
        if (gameInput.tilt) {
            this.player.x += gameInput.tilt.x * 5;
            this.player.y += gameInput.tilt.y * 5;
        }
        
        if (gameInput.shake && gameInput.shake.detected) {
            this.fireWeapon();
        }
    }
}
```

## 📚 문서

- **[개발자 가이드](docs/DEVELOPER_GUIDE.md)** - 완전한 게임 개발 가이드
- **[LLM 가이드](docs/LLM_GUIDE.md)** - Claude Code, Gemini CLI용 가이드
- **[API 레퍼런스](docs/API_REFERENCE.md)** - 완전한 SDK API 문서

## 🎯 게임 템플릿

### 솔로 게임 템플릿
- 기본 센서 입력 처리
- 캔버스 렌더링
- 점수 시스템
- 키보드 시뮬레이션

### 멀티플레이어 게임 템플릿
- 룸 생성/참가 시스템
- 실시간 플레이어 동기화
- 호스트 권한 관리
- 게임 결과 화면

## 🌐 배포

### Render.com 배포

1. Render.com에 계정 생성
2. GitHub 리포지토리 연결
3. Web Service로 배포 설정
4. `render.yaml` 설정 자동 적용

### 환경 변수

```env
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=*
```

## 🔗 주요 API

### SDK 초기화
```javascript
const game = new SensorGameSDK({
    gameId: 'my-game',
    gameType: 'solo',
    sensorTypes: ['orientation', 'accelerometer']
});
```

### 이벤트 처리
```javascript
game.on('onSensorData', (data) => {
    // 센서 데이터 처리
});

game.on('onPlayerJoined', (data) => {
    // 멀티플레이어 이벤트 처리
});
```

### 게임 이벤트 전송
```javascript
game.sendGameEvent('player_move', {
    position: { x: 100, y: 200 }
});
```

## 🎪 예제 게임

### 포함된 템플릿 게임
- **솔로 템플릿**: 기본 센서 조작 게임
- **멀티플레이어 템플릿**: 4명 경쟁 게임

### 개발 가능한 게임 장르
- **액션**: 슈팅, 플랫포머, 레이싱
- **퍼즐**: 미로, 볼 굴리기, 밸런스
- **스포츠**: 테니스, 골프, 볼링
- **어드벤처**: RPG, 탐험, 시뮬레이션

## 🐛 문제 해결

### 일반적인 문제

#### 센서가 동작하지 않을 때
- HTTPS 접속 확인
- iOS 13+ 권한 허용 확인
- 키보드 시뮬레이션 모드 활용 (WASD + 스페이스)

#### 연결이 불안정할 때
- 같은 Wi-Fi 네트워크 확인
- 방화벽/보안 프로그램 확인
- 포트 8443 접근 가능 여부 확인

## 📄 라이선스

이 프로젝트는 MIT 라이선스하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여

센서 게임 허브 v4.0 개선에 기여하고 싶으시다면:

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📞 지원

- **이슈 트래커**: GitHub Issues
- **문서**: `docs/` 폴더 참조
- **예제**: `templates/` 폴더 참조

---

**🎮 센서 게임 허브 v4.0과 함께 혁신적인 센서 게임을 만들어보세요!**