# Kakao Maps API 설정 가이드

## 🗺️ 병원 찾기 기능 활성화

주변 동물병원 검색 기능을 사용하려면 Kakao Maps API 키가 필요합니다.

---

## 1️⃣ Kakao API 키 발급

### Step 1: Kakao Developers 가입
1. https://developers.kakao.com 접속
2. 우측 상단 "시작하기" 클릭
3. 카카오 계정으로 로그인

### Step 2: 애플리케이션 추가
1. "내 애플리케이션" 메뉴 클릭
2. "애플리케이션 추가하기" 버튼 클릭
3. 앱 이름 입력 (예: "Pet Doctor")
4. 회사명 입력 (선택사항)
5. 저장

### Step 3: JavaScript 키 확인
1. 생성한 애플리케이션 클릭
2. "앱 키" 탭에서 **"JavaScript 키"** 복사
   ```
   예시: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

### Step 4: 플랫폼 등록
1. "플랫폼" 탭 클릭
2. "Web 플랫폼 등록" 클릭
3. 사이트 도메인 추가:
   - 개발 환경: `http://localhost:3000`
   - 운영 환경: `https://pet-doctor-hw-1768795345.fly.dev`
4. 저장

---

## 2️⃣ 로컬 환경 설정

### `.env` 파일 수정

```bash
# Kakao Maps API Key 추가
KAKAO_MAPS_API_KEY=여기에_발급받은_JavaScript키_붙여넣기
```

**예시:**
```dotenv
OPENAI_API_KEY=sk-proj-wRx-XKbv...
KAKAO_MAPS_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
PORT=3000
```

### views/vet/hospitals.ejs 수정

HTML 파일 55번째 줄 근처에서 `KAKAO_MAPS_API_KEY`를 실제 키로 교체:

**Before:**
```html
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=KAKAO_MAPS_API_KEY&libraries=services"></script>
```

**After:**
```html
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6&libraries=services"></script>
```

---

## 3️⃣ Fly.io 배포 환경 설정

```bash
flyctl secrets set KAKAO_MAPS_API_KEY="여기에_발급받은_JavaScript키_붙여넣기"
```

---

## 4️⃣ 테스트

### 로컬 테스트
1. 서버 재시작: `Ctrl+C` → `node server.js`
2. 브라우저에서 http://localhost:3000/vet/hospitals 접속
3. 위치 권한 허용
4. 지도와 주변 병원 목록 확인

### 확인 사항
- ✅ 현재 위치 파란색 마커 표시
- ✅ 5km 원형 범위 표시
- ✅ 병원 마커들 표시
- ✅ 하단 병원 리스트 표시
- ✅ 전화하기/길찾기 버튼 동작

---

## 🔧 문제 해결

### "지도를 표시할 수 없습니다"
- API 키가 잘못되었거나 플랫폼 등록이 안 된 경우
- `.env` 파일과 HTML 파일 모두 확인

### "주변에 병원이 없습니다"
- 실제로 5km 내에 병원이 없을 수 있음
- 테스트용으로 "강남역" 근처로 이동 후 재검색

### 지도가 회색으로만 보임
- JavaScript 키를 REST API 키와 혼동한 경우
- JavaScript 키인지 다시 확인

---

## 💰 비용

**Kakao Maps API는 무료입니다!**
- 일일 호출 한도: 300,000회
- 월 900만회까지 무료
- 개인 프로젝트는 충분히 무료 범위 내

---

완료 후 서버를 재시작하고 테스트해주세요! 🚀
