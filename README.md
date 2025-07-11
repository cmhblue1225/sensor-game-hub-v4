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
- **⚙️ 관리자 대시보드**: 실시간 서버 모니터링 및 클라이언트 관리
- **📱 QR 코드 지원**: 모바일 접속을 위한 간편한 QR 코드 스캔
- **🛠️ 개발자 센터**: 완전한 개발 문서 및 도구 제공
- **🎱 3D 물리 엔진**: Cannon-ES 로컬 통합으로 고급 3D 게임 개발

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
- **관리자 대시보드**: `https://localhost:8443/admin`
- **개발자 센터**: `https://localhost:8443/developer`

## 🎮 사용 방법

### 기본 플레이 흐름

1. **PC**에서 허브 접속 → 4자리 세션 코드 발급
2. **모바일**에서 센서 클라이언트 접속 → 4자리 코드 입력 OR QR 코드 스캔
3. **게임 선택** → 솔로 게임 즉시 플레이 OR 멀티 게임 룸 생성/참가
4. **센서 조작** → 기기 기울이기, 흔들기로 게임 플레이

### 다중 센서 게임 (듀얼 핸드)

1. PC에서 다중 센서 지원 게임 선택
2. 첫 번째 모바일 → "주 센서" 선택 (오른손)
3. 두 번째 모바일 → "보조 센서" 선택 (왼손)
4. 양손으로 검과 방패, 총 등을 각각 조작

### 관리자 대시보드

1. **실시간 모니터링**: 서버 상태, 메모리, CPU 사용량
2. **클라이언트 관리**: 연결된 모든 클라이언트 상태 및 지연시간 확인
3. **세션 통계**: 활성 세션, 연결된 센서, 오늘 생성된 세션 수
4. **멀티플레이어 룸**: 생성된 룸과 참가자 정보 실시간 확인
5. **QR 코드**: 모바일 접속용 QR 코드 생성 및 스캔
6. **제어 기능**: 모든 클라이언트 연결 해제, 로그 관리

### 개발자 센터

1. **완전한 문서**: 개발자 가이드, API 레퍼런스, LLM 가이드
2. **빠른 시작**: 템플릿 복사부터 게임 배포까지 5분 가이드
3. **라이브러리 지원**: Cannon-ES 3D 물리 엔진 로컬 통합
4. **예제 코드**: 복사 가능한 실용적인 코드 스니펫
5. **고급 기능**: 다중 센서 지원, 3D 물리 엔진 활용법
6. **다운로드**: 모든 SDK, 문서, 템플릿 다운로드 지원

### QR 코드 기능

1. **허브 페이지**: 메인 허브에서 센서 접속용 QR 코드 자동 생성
2. **관리자 페이지**: 관리 도구에서 QR 코드 모니터링
3. **스마트 URL**: 현재 서버 주소를 자동 감지하여 QR 코드 생성
4. **모바일 최적화**: 스캔 즉시 센서 클라이언트로 연결

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

### 3D 물리 엔진 사용

```html
<!-- HTML에 Cannon-ES 물리 엔진 추가 -->
<script src="/libs/cannon-es.js"></script>
```

```javascript
class Physics3DGame extends SensorGameSDK {
    constructor() {
        super({
            gameId: 'physics-game',
            sensorTypes: ['orientation', 'accelerometer', 'gyroscope']
        });
        
        // 3D 물리 월드 초기화
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
    }
    
    // 센서 입력을 3D 물리력으로 변환
    handleSensorInput(data) {
        const { gameInput } = data;
        
        if (gameInput.tilt && this.playerBody) {
            const force = new CANNON.Vec3(
                gameInput.tilt.x * 100,
                0,
                gameInput.tilt.y * 100
            );
            this.playerBody.applyForce(force, this.playerBody.position);
        }
    }
    
    update(deltaTime) {
        // 물리 시뮬레이션 업데이트
        this.world.step(deltaTime / 1000);
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

## ✨ 새로운 기능 (v4.0 최신 업데이트)

### 🔄 페이지 이동 시 연결 유지
- **안정적인 연결 관리**: 페이지 이동 시에도 세션 정보 보존
- **자동 재연결**: 연결 끊김 시 자동 복구
- **실시간 모니터링**: ping/pong으로 연결 상태 추적
- **정상적인 연결 해제**: beforeunload 이벤트 처리

### 📱 QR 코드 시스템
- **자동 생성**: 허브 페이지에서 QR 코드 자동 생성
- **간편 접속**: 모바일에서 QR 스캔으로 즉시 센서 클라이언트 접속
- **스마트 URL**: 현재 서버 주소 자동 감지
- **로컬 라이브러리**: 오프라인 환경에서도 작동

### 🛠️ 개발자 센터
- **완전한 개발 환경**: `/developer` 접속으로 모든 도구 제공
- **문서 통합**: 개발자 가이드, API 레퍼런스, LLM 가이드 한 곳에서
- **실시간 예제**: 복사 가능한 코드 스니펫
- **템플릿 다운로드**: 솔로/멀티플레이어 템플릿 즉시 접근

### 📊 관리자 대시보드
- **실시간 모니터링**: 서버 성능, 메모리, CPU 사용량
- **클라이언트 추적**: 연결된 모든 클라이언트 상태 및 지연시간
- **세션 관리**: 활성 세션, 룸 정보 실시간 확인
- **원격 제어**: 클라이언트 연결 해제, 로그 관리

### 🎱 3D 물리 엔진 (Cannon-ES)
- **로컬 통합**: 외부 의존성 없이 3D 물리 시뮬레이션
- **완전한 지원**: 강체 역학, 충돌 감지, 제약 조건
- **센서 통합**: 모바일 센서 → 3D 물리력 변환
- **성능 최적화**: 객체 풀링, 브로드페이즈 최적화

## 🐛 문제 해결

### 일반적인 문제

#### 센서가 동작하지 않을 때
- HTTPS 접속 확인
- iOS 13+ 권한 허용 확인
- QR 코드로 간편 접속 시도
- 키보드 시뮬레이션 모드 활용 (WASD + 스페이스)

#### 연결이 불안정할 때
- 같은 Wi-Fi 네트워크 확인
- 관리자 대시보드에서 연결 상태 모니터링
- 자동 재연결 기능 활용
- 방화벽/보안 프로그램 확인

#### QR 코드가 표시되지 않을 때
- 페이지 새로고침
- JavaScript 활성화 확인
- 로컬 라이브러리 로딩 상태 확인

## 📄 라이선스

이 프로젝트는 MIT 라이선스하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🔗 빠른 접속

### 개발 환경
- **메인 허브**: `http://localhost:3000/`
- **센서 클라이언트**: `http://localhost:3000/sensor` (QR 코드 스캔)
- **개발자 센터**: `http://localhost:3000/developer`
- **관리자 대시보드**: `http://localhost:3000/admin`

### 프로덕션 환경
- **메인 허브**: `https://your-domain.com/`
- **센서 클라이언트**: QR 코드 자동 생성 및 스캔
- **개발자 센터**: `https://your-domain.com/developer`
- **관리자 대시보드**: `https://your-domain.com/admin`

## 📚 문서 및 가이드

### 완전한 문서화
- **[개발자 가이드](docs/DEVELOPER_GUIDE.md)** - 완벽한 게임 개발 방법론
- **[API 레퍼런스](docs/API_REFERENCE.md)** - 모든 SDK API 및 최신 기능
- **[LLM 가이드](docs/LLM_GUIDE.md)** - Claude Code, Gemini CLI용 개발 가이드

### 개발 리소스
- **템플릿**: `templates/` 폴더의 솔로/멀티플레이어 게임 템플릿
- **SDK**: `sdk/` 폴더의 센서 게임 개발 도구
- **라이브러리**: `libs/` 폴더의 Cannon-ES, QR 코드 등
- **예제**: 개발자 센터의 실시간 코드 예제

## 🚀 최신 업데이트 (v4.0)

### 주요 개선사항
- ✅ **페이지 이동 연결 유지**: 안정적인 세션 관리
- ✅ **QR 코드 시스템**: 간편한 모바일 접속
- ✅ **개발자 센터**: 통합 개발 환경
- ✅ **관리자 대시보드**: 실시간 모니터링
- ✅ **3D 물리 엔진**: Cannon-ES 로컬 통합
- ✅ **향상된 SDK**: 자동 재연결 및 상태 관리
- ✅ **문서 완전화**: 개발자/LLM/API 가이드 최신화

### 기술적 개선
- **WebSocket 안정성**: ping/pong 및 자동 재연결
- **로컬 라이브러리**: 외부 의존성 최소화
- **성능 최적화**: 메모리 사용량 및 연결 관리 개선
- **사용자 경험**: QR 코드로 모바일 접속 간소화

## 🤝 기여

센서 게임 허브 v4.0 개선에 기여하고 싶으시다면:

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📞 지원

- **개발자 센터**: `/developer` - 모든 개발 도구 및 문서
- **관리자 대시보드**: `/admin` - 실시간 모니터링 및 디버깅
- **이슈 트래커**: GitHub Issues
- **문서**: `docs/` 폴더 완전한 가이드
- **예제**: `templates/` 폴더 실용적인 템플릿

---

**🎉 센서 게임 허브 v4.0 - 가장 완벽한 센서 게임 개발 플랫폼!**

혁신적인 센서 게임을 만들고, 관리자 도구로 모니터링하고, 개발자 센터에서 모든 리소스를 활용하세요! 🚀