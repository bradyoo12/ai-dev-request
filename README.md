# AI Dev Request Platform

AI 개발 요청 접수 → 분석 → 제안 → 제작 자동화 SaaS 플랫폼

## 프로젝트 구조

```
ai-dev-request/
├── platform/           # SaaS 플랫폼 코드
│   ├── backend/        # .NET 9 API 서버
│   ├── frontend/       # React + Vite 웹앱
│   └── ai-engine/      # Claude API 통합, 분석/제안/코드생성
├── projects/           # 생성된 고객 프로젝트들
│   └── [proj-xxx-name]/
├── templates/          # 프로젝트 생성 템플릿
│   ├── web-app/
│   ├── api-server/
│   └── automation/
└── docs/               # 문서
```

## 핵심 기능

1. **요청 접수** - 자연어로 개발 요청 작성
2. **AI 분석** - 요청을 기술적 요구사항으로 변환
3. **제안 생성** - 구현 방안, 기술 스택, 견적 제안
4. **자동 제작** - 승인 시 AI가 코드 생성 및 배포

## 기술 스택

- **Backend**: .NET 9 + BradYoo.Core
- **Frontend**: React + Vite + shadcn/ui + Zustand
- **AI**: Claude API (분석 + 코드 생성)
- **Database**: PostgreSQL
- **Infra**: Azure Container Apps

## 관련 링크

- [Project Board](https://github.com/users/bradyoo12/projects/25)
- [BradYoo Ecosystem](https://github.com/users/bradyoo12/projects/23)

## 프로젝트 네이밍 규칙

생성된 프로젝트는 `projects/` 폴더에 저장됩니다:
```
projects/
├── proj-001-쇼핑몰/
├── proj-002-대시보드/
└── proj-003-챗봇/
```

형식: `proj-{번호}-{간단한이름}/`
