# Phase 1 우선순위 기능 상세 기획서

**작성일**: 2025-08-08  
**프로젝트**: EduCanvas v2.0  
**Phase**: 1 (즉시 수익 창출 기능)  
**예상 기간**: 2-3개월  
**문서 버전**: v1.0

---

## 📋 Phase 1 개요

### 목표
경쟁사 대비 부족한 핵심 수익 창출 기능들을 신속히 구현하여 **월 매출 25% 증가** 및 **신규 학생 전환율 30% 향상**을 달성합니다.

### 주요 기능
1. **교재 관리 시스템** (수익 다각화)
2. **상담 관리 시스템** (신규 학생 확보)  
3. **대여 관리 시스템** (자산 활용 극대화)

---

## 🏆 Feature 1: 교재 관리 시스템

### 비즈니스 요구사항
- **목표**: 월 매출 15-25% 증가
- **대상 사용자**: 관리자, 실장, 회계 담당자
- **핵심 가치**: 교재 판매를 통한 추가 수익 창출

### 주요 기능 명세

#### 1.1 교재 등록 및 관리
```yaml
기능명: 교재 마스터 관리
설명: 교재 정보를 등록하고 관리하는 기능

입력 항목:
  - 교재 코드: 자동 생성 또는 수동 입력
  - 교재명: 필수, 최대 100자
  - 출판사: 선택 목록 + 직접 입력
  - 저자: 선택사항, 최대 50자
  - ISBN: 선택사항, 13자리
  - 정가: 필수, 숫자만 입력
  - 판매가: 필수, 정가 대비 할인율 자동 계산
  - 과목: 드롭다운 선택 (국어, 영어, 수학 등)
  - 학년: 다중 선택 가능
  - 수준: 기초/중급/고급/심화
  - 교재 이미지: 업로드 기능 (선택사항)
  - 설명: 텍스트 에리어, 최대 500자

출력:
  - 교재 목록 (검색, 정렬, 필터링 지원)
  - 교재 상세 정보
  - 교재별 판매 통계
```

#### 1.2 재고 관리
```yaml
기능명: 재고 관리 시스템
설명: 교재 재고를 실시간으로 추적하고 관리

기능:
  입고 관리:
    - 교재별 입고 수량 등록
    - 입고 날짜 및 단가 기록
    - 거래처 정보 연동
    - 입고 내역 조회

  재고 현황:
    - 실시간 재고 수량 표시
    - 안전 재고 수준 설정
    - 재고 부족 알림 (자동 알림)
    - 재고 회전율 분석

  자동 발주:
    - 최소 재고 기준 설정
    - 자동 발주 알림
    - 거래처별 발주 내역 관리
    - 예상 소요량 계산 (과거 데이터 기반)
```

#### 1.3 판매 관리
```yaml
기능명: 교재 판매 시스템
설명: 개별, 반별, 일괄 교재 판매 처리

판매 방식:
  개별 판매:
    - 학생 검색 후 교재 선택
    - 수량 및 할인 적용
    - 즉시 결제 또는 수강료 연동
    
  반별 일괄 판매:
    - 반 선택 후 교재 일괄 적용
    - 학생별 구매 여부 선택
    - 일괄 결제 처리

  온라인 주문:
    - 학부모 앱에서 교재 주문
    - 재고 확인 후 자동 예약
    - 픽업/배송 선택

결제 연동:
  - 현금 결제: 즉시 처리
  - 수강료 연동: 다음 달 수강료에 포함
  - 카드 결제: PG 연동
  - 할부 결제: 2-3개월 분할 가능
```

#### 1.4 수익 분석
```yaml
기능명: 교재 수익 분석 대시보드
설명: 교재 판매 현황 및 수익성 분석

분석 지표:
  매출 분석:
    - 일/주/월별 교재 매출
    - 교재별 매출 순위
    - 과목별 매출 비교
    - 학년별 구매 패턴

  수익성 분석:
    - 교재별 마진율
    - 베스트셀러 교재 선별
    - 재고회전율 분석
    - ROI 계산

  예측 분석:
    - 다음 달 예상 매출
    - 교재별 수요 예측
    - 계절별 판매 패턴
```

### 기술 명세

#### 데이터베이스 설계
```sql
-- 교재 마스터
CREATE TABLE textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  publisher_id UUID REFERENCES publishers(id),
  author VARCHAR(50),
  isbn VARCHAR(13),
  list_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  grade_levels INTEGER[] NOT NULL,
  level_type VARCHAR(20) DEFAULT 'basic',
  description TEXT,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 재고 관리
CREATE TABLE textbook_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID REFERENCES textbooks(id),
  organization_id UUID REFERENCES organizations(id),
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  reserved_stock INTEGER DEFAULT 0,
  total_received INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  last_restocked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 입고 내역
CREATE TABLE textbook_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID REFERENCES textbooks(id),
  organization_id UUID REFERENCES organizations(id),
  supplier_id UUID REFERENCES suppliers(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(8,2) NOT NULL,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  received_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 판매 내역
CREATE TABLE textbook_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID REFERENCES textbooks(id),
  student_id UUID REFERENCES students(id),
  organization_id UUID REFERENCES organizations(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(8,2) NOT NULL,
  discount_amount DECIMAL(8,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price - discount_amount) STORED,
  sale_date DATE NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  is_paid BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES invoices(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### API 설계
```typescript
// 교재 API
interface TextbookAPI {
  // 교재 관리
  getTextbooks(filters: TextbookFilters): Promise<PaginatedResponse<Textbook>>
  createTextbook(data: CreateTextbookRequest): Promise<Textbook>
  updateTextbook(id: string, data: UpdateTextbookRequest): Promise<Textbook>
  deleteTextbook(id: string): Promise<void>

  // 재고 관리  
  getInventory(textbookId: string): Promise<TextbookInventory>
  updateStock(textbookId: string, adjustment: StockAdjustment): Promise<TextbookInventory>
  getReceiptHistory(textbookId: string): Promise<TextbookReceipt[]>
  
  // 판매 관리
  createSale(data: CreateSaleRequest): Promise<TextbookSale>
  bulkCreateSales(data: BulkSaleRequest): Promise<TextbookSale[]>
  getSaleHistory(filters: SaleFilters): Promise<PaginatedResponse<TextbookSale>>
  
  // 분석
  getSalesAnalytics(period: DateRange): Promise<SalesAnalytics>
  getInventoryAnalytics(): Promise<InventoryAnalytics>
}
```

---

## 📞 Feature 2: 상담 관리 시스템

### 비즈니스 요구사항
- **목표**: 신규 학생 전환율 30% 향상
- **대상 사용자**: 상담 담당자, 실장, 원장
- **핵심 가치**: 체계적인 상담 관리를 통한 신규 학생 확보

### 주요 기능 명세

#### 2.1 상담 예약 관리
```yaml
기능명: 상담 예약 시스템
설명: 신규 문의부터 상담 완료까지 전 과정 관리

예약 채널:
  온라인 예약:
    - 웹사이트 예약 폼
    - 카카오톡 상담 신청
    - 전화 예약 등록
    
  오프라인 예약:
    - 방문 상담 직접 등록
    - 기존 학부모 추천

예약 정보:
  - 상담 희망 날짜/시간 (1지망, 2지망)
  - 학생 기본 정보 (이름, 학년, 학교)
  - 보호자 연락처
  - 상담 목적 (신규 입학, 반 변경, 기타)
  - 관심 과목/반
  - 특이사항

자동 기능:
  - 예약 확인 문자 발송
  - 상담 1일 전 리마인더
  - 상담 담당자 자동 배정
```

#### 2.2 상담 진행 관리
```yaml
기능명: 상담 진행 시스템
설명: 상담 과정을 체계적으로 기록하고 관리

상담 기록:
  기본 정보:
    - 상담 날짜/시간
    - 상담 담당자
    - 상담 방식 (대면/전화/화상)
    - 참석자 (학생/학부모)

  상담 내용:
    - 학생 현재 상황 (성적, 학습 습관)
    - 목표 및 희망 사항
    - 추천 반/과목
    - 학습 계획 제안
    - 수강료 안내

  상담 결과:
    - 상담 만족도 (5점 척도)
    - 입학 의향도 (즉시/검토중/보류/거절)
    - 다음 액션 계획
    - 팔로업 일정

첨부 기능:
  - 상담 자료 첨부 (시간표, 커리큘럼)
  - 학생 시험 성적 업로드
  - 상담 사진 (필요시)
```

#### 2.3 팔로업 관리
```yaml
기능명: 상담 후 팔로업 시스템
설명: 상담 후 지속적인 관리로 입학률 극대화

팔로업 스케줄:
  자동 스케줄:
    - 상담 후 3일: 첫 번째 팔로업
    - 1주일 후: 두 번째 팔로업
    - 2주일 후: 최종 팔로업
    
  수동 스케줄:
    - 담당자가 직접 일정 설정
    - 특별 이벤트 알림
    - 맞춤형 프로모션 제안

팔로업 방식:
  - 전화 통화: 통화 기록 자동 저장
  - 문자/카카오톡: 템플릿 메시지 활용
  - 이메일: 상세 정보 및 자료 발송
  - 방문 유도: 무료 체험 수업 제안

성과 추적:
  - 팔로업 응답률
  - 단계별 전환율
  - 담당자별 성과
  - 최적 팔로업 타이밍 분석
```

#### 2.4 상담 분석 대시보드
```yaml
기능명: 상담 성과 분석 시스템
설명: 상담 데이터를 분석하여 개선점 도출

분석 지표:
  전환율 분석:
    - 전체 상담 대비 입학률
    - 상담 방식별 전환율
    - 담당자별 성과 비교
    - 시기별 상담 효과

  상담 품질 분석:
    - 평균 상담 시간
    - 상담 만족도 분포
    - 재상담 요청률
    - 추천 입학률

  마케팅 효과:
    - 유입 채널별 상담 수
    - 채널별 전환율
    - CAC (고객 획득 비용)
    - LTV (고객 생애 가치)

예측 기능:
  - 다음 달 예상 입학 수
  - 시즌별 상담 패턴
  - 최적 상담 시간대
  - 성공률 높은 상담 스크립트
```

### 기술 명세

#### 데이터베이스 설계
```sql
-- 상담 예약
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  student_name VARCHAR(50) NOT NULL,
  student_grade VARCHAR(10),
  student_school VARCHAR(100),
  parent_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  consultation_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  assigned_to UUID REFERENCES users(id),
  source VARCHAR(20) DEFAULT 'direct', -- online, phone, referral, walk-in
  purpose TEXT,
  interests VARCHAR(100)[], -- 관심 과목들
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 상담 기록
CREATE TABLE consultation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),
  current_situation TEXT,
  goals_and_needs TEXT,
  recommended_classes VARCHAR(100)[],
  learning_plan TEXT,
  tuition_discussed BOOLEAN DEFAULT false,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  enrollment_interest VARCHAR(20), -- immediate, considering, pending, declined
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 팔로업 관리
CREATE TABLE consultation_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),
  followup_date DATE NOT NULL,
  followup_type VARCHAR(20) NOT NULL, -- call, message, email, visit
  content TEXT,
  response VARCHAR(20), -- positive, neutral, negative, no-response
  next_action_date DATE,
  next_action_type VARCHAR(50),
  completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📦 Feature 3: 대여 관리 시스템

### 비즈니스 요구사항
- **목표**: 기존 자산 활용도 50% 향상
- **대상 사용자**: 관리자, 실장, 학생/학부모
- **핵심 가치**: 교재 및 기자재의 효율적 활용

### 주요 기능 명세

#### 3.1 대여 품목 관리
```yaml
기능명: 대여 품목 등록 시스템
설명: 대여 가능한 모든 품목을 등록하고 관리

품목 유형:
  교재류:
    - 참고서, 문제집
    - 과년도 교재
    - 특수 교재 (원서, 전문서적)
    
  기자재:
    - 계산기, 컴퍼스
    - 태블릿, 노트북
    - 실험 도구

품목 정보:
  기본 정보:
    - 품목 코드 (자동 생성)
    - 품목명
    - 카테고리
    - 브랜드/출판사
    - 모델/버전
    
  대여 정보:
    - 일일 대여료
    - 주간/월간 대여료
    - 최대 대여 기간
    - 보증금
    - 연체료 (일당)
    
  상태 관리:
    - 현재 상태 (대여가능/대여중/수리중/폐기)
    - 품질 등급 (A/B/C)
    - 구입 날짜 및 가격
    - 사용 이력
```

#### 3.2 대여 신청 및 승인
```yaml
기능명: 대여 신청 처리 시스템
설명: 학생/학부모의 대여 신청을 받고 처리

신청 프로세스:
  온라인 신청:
    - 학부모 앱에서 품목 검색
    - 대여 기간 선택
    - 보증금 및 대여료 확인
    - 신청서 제출
    
  오프라인 신청:
    - 학원에서 직접 신청
    - 즉시 대여 가능
    - 현금/카드 결제

승인 프로세스:
  자동 승인:
    - 품목 재고 확인
    - 학생 연체 이력 검증
    - 보증금 결제 확인
    
  수동 승인:
    - 고가 품목
    - 특별 관리 품목
    - 연체 이력 있는 학생

알림 기능:
  - 신청 접수 확인
  - 승인/거절 통지
  - 대여 준비 완료
  - 반납 예정일 알림
```

#### 3.3 반납 및 연체 관리
```yaml
기능명: 반납 처리 및 연체 관리
설명: 대여품 반납 및 연체 상황 관리

반납 처리:
  품목 상태 확인:
    - 외관 상태 체크
    - 기능 동작 확인
    - 부속품 완전성 검증
    
  상태별 처리:
    - 정상 반납: 보증금 전액 환불
    - 경미한 손상: 보증금에서 수리비 차감
    - 심한 손상: 변상비 청구
    - 분실: 품목 원가 청구

연체 관리:
  연체 알림:
    - 반납 예정일 3일 전 알림
    - 반납일 당일 알림
    - 연체 1일 후부터 매일 알림
    
  연체료 부과:
    - 자동 계산 및 청구
    - 수강료와 연동 가능
    - 연체 이력 누적 관리
    
  제재 조치:
    - 3회 연체: 대여 제한
    - 장기 연체: 학부모 면담
    - 분실 시: 변상 완료까지 대여 정지
```

### 기술 명세

#### 데이터베이스 설계
```sql
-- 대여 품목
CREATE TABLE rental_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  item_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  brand VARCHAR(50),
  model VARCHAR(50),
  daily_rate DECIMAL(8,2) NOT NULL,
  weekly_rate DECIMAL(8,2),
  monthly_rate DECIMAL(8,2),
  deposit DECIMAL(8,2) NOT NULL DEFAULT 0,
  late_fee_per_day DECIMAL(6,2) DEFAULT 1000,
  max_rental_days INTEGER DEFAULT 30,
  condition_grade VARCHAR(1) DEFAULT 'A',
  status VARCHAR(20) DEFAULT 'available',
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  description TEXT,
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 대여 신청/기록
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_item_id UUID REFERENCES rental_items(id),
  student_id UUID REFERENCES students(id),
  organization_id UUID REFERENCES organizations(id),
  rental_date DATE NOT NULL,
  due_date DATE NOT NULL,
  actual_return_date DATE,
  daily_rate DECIMAL(8,2) NOT NULL,
  total_days INTEGER GENERATED ALWAYS AS (due_date - rental_date + 1) STORED,
  rental_fee DECIMAL(10,2) GENERATED ALWAYS AS (daily_rate * total_days) STORED,
  deposit_paid DECIMAL(8,2) NOT NULL,
  late_fee DECIMAL(8,2) DEFAULT 0,
  damage_fee DECIMAL(8,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active, returned, overdue, lost
  return_condition_notes TEXT,
  approved_by UUID REFERENCES users(id),
  returned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔧 통합 기술 아키텍처

### Frontend 아키텍처
```
Next.js 15 App Router
├── 교재 관리 모듈
│   ├── /textbooks - 교재 목록 및 관리
│   ├── /inventory - 재고 현황
│   └── /sales - 판매 관리
├── 상담 관리 모듈  
│   ├── /consultations - 상담 예약
│   ├── /records - 상담 기록
│   └── /followups - 팔로업 관리
└── 대여 관리 모듈
    ├── /rentals - 대여 현황
    ├── /items - 품목 관리
    └── /returns - 반납 처리
```

### 상태 관리
```typescript
// Zustand Store 구조
interface EduCanvasState {
  // 교재 관리
  textbooks: TextbookState
  inventory: InventoryState
  
  // 상담 관리
  consultations: ConsultationState
  followups: FollowupState
  
  // 대여 관리
  rentals: RentalState
  rentalItems: RentalItemState
}
```

### API 설계 원칙
- RESTful API 설계
- OpenAPI 3.0 스펙 준수
- 인증: JWT + RBAC
- 입력 검증: Zod 스키마
- 에러 처리: 표준화된 에러 응답
- 로깅: 모든 API 호출 기록

---

## 📊 성공 지표 및 검증 방법

### 교재 관리 KPI
- 교재 매출 증가율: 월 15% 이상
- 재고 회전율: 분기 4회 이상  
- 재고 정확도: 99% 이상
- 자동 발주 정확도: 95% 이상

### 상담 관리 KPI
- 상담 신청 증가율: 월 20% 이상
- 상담 → 입학 전환율: 35% 이상
- 평균 상담 처리 시간: 30분 이하
- 상담 만족도: 4.5/5.0 이상

### 대여 관리 KPI
- 대여 품목 가동률: 70% 이상
- 연체율: 5% 이하
- 분실률: 1% 이하
- 대여 수익률: 품목가 대비 연 30% 이상

---

## ⏱️ 개발 일정 및 마일스톤

### Week 1-2: 설계 및 기초 작업
- 데이터베이스 스키마 설계
- API 명세 작성  
- UI/UX 와이어프레임
- 개발 환경 구축

### Week 3-6: 교재 관리 시스템
- 교재 등록/관리 기능
- 재고 관리 시스템
- 판매 처리 기능
- 분석 대시보드

### Week 7-9: 상담 관리 시스템  
- 상담 예약 시스템
- 상담 기록 관리
- 팔로업 자동화
- 분석 리포트

### Week 10-12: 대여 관리 시스템
- 품목 등록 관리
- 대여 신청/처리
- 반납 및 연체 관리
- 통합 테스트

### Week 13-14: 통합 및 배포
- 전체 시스템 통합
- 성능 최적화
- 사용자 교육
- 프로덕션 배포

---

## 🛡️ 품질 보증 및 테스트 전략

### 테스트 계획
```
단위 테스트 (Unit Tests)
├── 비즈니스 로직 테스트
├── API 엔드포인트 테스트  
└── 데이터 검증 테스트

통합 테스트 (Integration Tests)
├── 데이터베이스 연동 테스트
├── 외부 시스템 연동 테스트
└── 워크플로우 테스트

E2E 테스트 (End-to-End Tests)  
├── 사용자 시나리오 테스트
├── 결제 프로세스 테스트
└── 알림 기능 테스트
```

### 성능 기준
- 페이지 로딩 시간: 2초 이하
- API 응답 시간: 95%ile < 300ms  
- 동시 사용자: 100명 이상 지원
- 데이터베이스 응답: 평균 50ms 이하

---

## 🚀 다음 단계 실행 계획

### 즉시 실행 (이번 주)
1. 개발팀 킥오프 미팅
2. 데이터베이스 스키마 검토 및 확정
3. API 명세서 상세 작성
4. UI/UX 디자인 시작

### 1주일 내 완료
1. 개발 환경 구축
2. 기본 CRUD 기능 프로토타입
3. 첫 번째 사용자 스토리 구현
4. 초기 테스트 시나리오 작성

### 1개월 내 목표
1. 교재 관리 시스템 MVP 완성
2. 베타 테스터 그룹 선정
3. 초기 사용자 피드백 수집
4. 다음 기능 개발 착수

Phase 1 완성 후에는 즉시 Phase 2 (차량 관리, 키오스크, CTI) 기획에 착수하여 연속적인 개발 사이클을 유지할 예정입니다.