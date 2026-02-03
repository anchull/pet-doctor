# OpenAI API 설정 가이드

## 1. OpenAI API 키 발급받기

### 단계 1: OpenAI 계정 생성
1. https://platform.openai.com 방문
2. "Sign up" 클릭하여 계정 생성
3. 이메일 인증 완료

### 단계 2: API 키 생성
1. https://platform.openai.com/api-keys 방문
2. "+ Create new secret key" 클릭
3. 이름 입력 (예: "PetDoctor App")
4. 생성된 키를 **안전한 곳에 복사** (다시 볼 수 없음!)

### 단계 3: 결제 방법 등록
1. https://platform.openai.com/settings/organization/billing/overview
2. "Add payment method" 클릭
3. 신용카드 정보 입력
4. 사용량 한도 설정 (권장: $5~$10/월)

## 2. 프로젝트 설정

### .env 파일 생성
```bash
cd /Users/chul/.gemini/antigravity/scratch/pet_doctor_hotwire
cp .env.example .env
```

### API 키 입력
`.env` 파일을 열어서:
```
OPENAI_API_KEY=sk-proj-여기에-발급받은-키-붙여넣기
```

## 3. 서버 재시작
```bash
# 기존 서버 종료 (Ctrl+C)
# 서버 재시작
node server.js
```

## 4. 테스트
1. http://localhost:3000/vet/chat 접속
2. "소변에서 피가 보여요" 클릭 또는 직접 질문 입력
3. AI 응답 확인

## 주의사항

⚠️ **API 키 보안**
- `.env` 파일을 절대 GitHub에 올리지 마세요
- `.gitignore`에 `.env`가 포함되어 있는지 확인

💰 **비용 관리**
- OpenAI 대시보드에서 사용량 모니터링
- 월 사용 한도 설정 권장

🔧 **문제 해결**
- API 키가 작동하지 않으면: 키가 올바르게 복사되었는지 확인
- "insufficient_quota" 오류: 결제 방법이 등록되어 있는지 확인
- 서버 에러: 서버 콘솔에서 에러 메시지 확인

## 비용 모니터링

OpenAI 대시보드에서 실시간 사용량 확인:
https://platform.openai.com/usage
