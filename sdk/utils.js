/**
 * 센서 게임 SDK 유틸리티 함수들
 * 게임 개발에 유용한 도구들
 */

const SensorGameUtils = {
    /**
     * 디바이스 타입 감지
     */
    detectDevice() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        return {
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isAndroid: /Android/.test(userAgent),
            isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            platform: platform,
            userAgent: userAgent,
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            orientation: window.orientation || 0
        };
    },
    
    /**
     * 센서 지원 여부 확인
     */
    checkSensorSupport() {
        return {
            orientation: 'DeviceOrientationEvent' in window,
            motion: 'DeviceMotionEvent' in window,
            permissions: 'permissions' in navigator,
            requestPermission: typeof DeviceOrientationEvent.requestPermission === 'function',
            isSecureContext: window.isSecureContext
        };
    },
    
    /**
     * iOS 센서 권한 요청
     */
    async requestIOSPermissions() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                return permission === 'granted';
            } catch (error) {
                console.error('iOS 센서 권한 요청 실패:', error);
                return false;
            }
        }
        return true; // iOS가 아니거나 권한이 필요 없음
    },
    
    /**
     * 수학 유틸리티
     */
    math: {
        // 값 제한
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },
        
        // 선형 보간
        lerp(a, b, t) {
            return a + (b - a) * t;
        },
        
        // 각도 정규화 (0-360)
        normalizeAngle(angle) {
            return ((angle % 360) + 360) % 360;
        },
        
        // 라디안을 도로 변환
        radToDeg(rad) {
            return rad * (180 / Math.PI);
        },
        
        // 도를 라디안으로 변환
        degToRad(deg) {
            return deg * (Math.PI / 180);
        },
        
        // 두 점 간의 거리
        distance(p1, p2) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        },
        
        // 벡터 크기
        magnitude(vector) {
            const { x, y, z = 0 } = vector;
            return Math.sqrt(x * x + y * y + z * z);
        },
        
        // 벡터 정규화
        normalize(vector) {
            const mag = this.magnitude(vector);
            if (mag === 0) return { x: 0, y: 0, z: 0 };
            
            return {
                x: vector.x / mag,
                y: vector.y / mag,
                z: (vector.z || 0) / mag
            };
        },
        
        // 벡터 내적
        dot(v1, v2) {
            return v1.x * v2.x + v1.y * v2.y + (v1.z || 0) * (v2.z || 0);
        },
        
        // 랜덤 범위
        randomRange(min, max) {
            return Math.random() * (max - min) + min;
        },
        
        // 랜덤 정수
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    },
    
    /**
     * 애니메이션 유틸리티
     */
    animation: {
        // 이징 함수들
        easing: {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
        },
        
        // 애니메이션 생성
        animate(options) {
            const {
                duration = 1000,
                easing = 'linear',
                onUpdate,
                onComplete
            } = options;
            
            const startTime = Date.now();
            const easingFn = this.easing[easing] || this.easing.linear;
            
            const step = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easingFn(progress);
                
                if (onUpdate) onUpdate(easedProgress);
                
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else if (onComplete) {
                    onComplete();
                }
            };
            
            requestAnimationFrame(step);
        }
    },
    
    /**
     * DOM 유틸리티
     */
    dom: {
        // 요소 생성
        create(tag, className, parent) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (parent) parent.appendChild(element);
            return element;
        },
        
        // CSS 적용
        css(element, styles) {
            Object.assign(element.style, styles);
        },
        
        // 이벤트 리스너 추가
        on(element, event, handler) {
            element.addEventListener(event, handler);
            return () => element.removeEventListener(event, handler);
        },
        
        // 요소 제거
        remove(element) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    },
    
    /**
     * 색상 유틸리티
     */
    color: {
        // RGB를 HEX로 변환
        rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        
        // HEX를 RGB로 변환
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        // HSL을 RGB로 변환
        hslToRgb(h, s, l) {
            h /= 360;
            s /= 100;
            l /= 100;
            
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            return {
                r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
                g: Math.round(hue2rgb(p, q, h) * 255),
                b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
            };
        },
        
        // 색상 보간
        interpolate(color1, color2, t) {
            const c1 = this.hexToRgb(color1);
            const c2 = this.hexToRgb(color2);
            
            if (!c1 || !c2) return color1;
            
            const r = Math.round(c1.r + (c2.r - c1.r) * t);
            const g = Math.round(c1.g + (c2.g - c1.g) * t);
            const b = Math.round(c1.b + (c2.b - c1.b) * t);
            
            return this.rgbToHex(r, g, b);
        }
    },
    
    /**
     * 충돌 감지
     */
    collision: {
        // 사각형 충돌
        rectRect(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        },
        
        // 원 충돌
        circleCircle(circle1, circle2) {
            const dx = circle1.x - circle2.x;
            const dy = circle1.y - circle2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < circle1.radius + circle2.radius;
        },
        
        // 점과 사각형 충돌
        pointRect(point, rect) {
            return point.x >= rect.x &&
                   point.x <= rect.x + rect.width &&
                   point.y >= rect.y &&
                   point.y <= rect.y + rect.height;
        },
        
        // 점과 원 충돌
        pointCircle(point, circle) {
            const dx = point.x - circle.x;
            const dy = point.y - circle.y;
            return Math.sqrt(dx * dx + dy * dy) <= circle.radius;
        }
    },
    
    /**
     * 성능 유틸리티
     */
    performance: {
        // FPS 측정
        createFPSCounter() {
            let frames = 0;
            let lastTime = Date.now();
            let fps = 0;
            
            return {
                update() {
                    frames++;
                    const now = Date.now();
                    if (now - lastTime >= 1000) {
                        fps = Math.round((frames * 1000) / (now - lastTime));
                        frames = 0;
                        lastTime = now;
                    }
                    return fps;
                },
                getFPS() {
                    return fps;
                }
            };
        },
        
        // 객체 풀
        createPool(createFn, resetFn, initialSize = 10) {
            const pool = [];
            
            // 초기 객체 생성
            for (let i = 0; i < initialSize; i++) {
                pool.push(createFn());
            }
            
            return {
                get() {
                    return pool.pop() || createFn();
                },
                
                release(obj) {
                    if (resetFn) resetFn(obj);
                    pool.push(obj);
                },
                
                size() {
                    return pool.length;
                }
            };
        },
        
        // 디바운스
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // 스로틀
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    },
    
    /**
     * 저장소 유틸리티
     */
    storage: {
        // 로컬 스토리지에 객체 저장
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        // 로컬 스토리지에서 객체 가져오기
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },
        
        // 키 삭제
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },
        
        // 모든 키 삭제
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    },
    
    /**
     * 랜덤 ID 생성
     */
    generateId(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    /**
     * 딥 클론
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },
    
    /**
     * 네트워크 상태 확인
     */
    network: {
        isOnline() {
            return navigator.onLine;
        },
        
        // 연결 품질 추정
        async estimateConnectionQuality() {
            if (!('connection' in navigator)) {
                return { type: 'unknown', quality: 'unknown' };
            }
            
            const connection = navigator.connection;
            return {
                type: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                quality: this.getQualityFromConnection(connection)
            };
        },
        
        getQualityFromConnection(connection) {
            if (connection.effectiveType === '4g' && connection.downlink > 5) {
                return 'excellent';
            } else if (connection.effectiveType === '4g' || connection.downlink > 1.5) {
                return 'good';
            } else if (connection.effectiveType === '3g' || connection.downlink > 0.5) {
                return 'fair';
            } else {
                return 'poor';
            }
        }
    }
};

// 전역 노출
if (typeof window !== 'undefined') {
    window.SensorGameUtils = SensorGameUtils;
}

// Node.js 환경 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SensorGameUtils;
}