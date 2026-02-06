# Generated Projects

이 폴더에는 AI가 생성한 고객 프로젝트가 저장됩니다.

## 네이밍 규칙

```
proj-{번호}-{간단한이름}/
```

예시:
- `proj-001-shopping-mall/`
- `proj-002-dashboard/`
- `proj-003-chatbot/`

## 프로젝트 구조

각 프로젝트는 독립적인 구조를 가집니다:

```
proj-xxx-name/
├── README.md           # 프로젝트 설명, 요청 요약
├── .env.example        # 환경 변수 템플릿
├── backend/            # 백엔드 코드 (있는 경우)
├── frontend/           # 프론트엔드 코드 (있는 경우)
├── docs/               # 자동 생성된 문서
│   ├── requirements.md # 분석된 요구사항
│   ├── proposal.md     # 제안서
│   └── architecture.md # 아키텍처 설계
└── deploy/             # 배포 설정
    ├── Dockerfile
    └── docker-compose.yml
```

## 메타데이터

각 프로젝트 README.md에는 다음 정보가 포함됩니다:

```yaml
---
project_id: proj-001
created_at: 2026-02-06
status: deployed | staging | development | archived
customer: (익명 또는 ID)
original_request: "원본 요청 내용 요약"
tech_stack:
  - React
  - .NET 9
  - PostgreSQL
staging_url: https://proj-001.staging.ai-dev-request.kr
production_url: https://proj-001.ai-dev-request.kr
---
```

## 주의사항

- 고객 민감 정보는 이 레포에 커밋하지 않습니다
- API 키, 비밀번호 등은 `.env` 파일로 관리 (gitignore)
- 고객이 소유권 이전 요청 시 별도 레포로 분리 가능
