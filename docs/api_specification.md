# EduCanvas API 명세서 v2.0

**작성일**: 2025-08-08  
**프로젝트**: EduCanvas 학원관리 시스템  
**API 버전**: v2.0  
**기반**: database_schema_v2.sql

---

## 📋 목차

1. [API 개요](#1-api-개요)
2. [인증 및 권한](#2-인증-및-권한)
3. [학생 관리 API](#3-학생-관리-api)
4. [클래스 관리 API](#4-클래스-관리-api)
5. [ClassFlow API](#5-classflow-api)
6. [강사 관리 API](#6-강사-관리-api)
7. [결제 시스템 API](#7-결제-시스템-api)
8. [급여 시스템 API](#8-급여-시스템-api)
9. [통계 및 리포트 API](#9-통계-및-리포트-api)
10. [실시간 API](#10-실시간-api)
11. [에러 처리](#11-에러-처리)
12. [API 사용 예시](#12-api-사용-예시)

---

## 1. API 개요

### 1.1 기본 정보
```yaml
Base URL: https://api.educanvas.com/v2
Protocol: HTTPS only
Content-Type: application/json
Character Set: UTF-8
Rate Limiting: 1000 requests/hour per user
```

### 1.2 API 아키텍처
```
┌─────────────────────────────────────────────┐
│           Client Applications               │
│  (Web App, Mobile App, Third-party)        │
└─────────────────────────────────────────────┘
                       │
                   HTTPS/WSS
                       │
┌─────────────────────────────────────────────┐
│              API Gateway                    │
│  • Authentication                           │
│  • Rate Limiting                            │
│  • Request Validation                       │
└─────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────┐
│           Supabase Backend                  │
│  • PostgreSQL Database                      │
│  • Row Level Security (RLS)                 │
│  • Real-time Subscriptions                  │
│  • Edge Functions                           │
└─────────────────────────────────────────────┘
```

### 1.3 API 설계 원칙
- **RESTful**: HTTP 메서드와 상태 코드 표준 준수
- **일관성**: 동일한 응답 형식 및 에러 처리
- **보안**: JWT 인증 + RLS 기반 권한 제어
- **성능**: 페이지네이션, 캐싱, 최적화된 쿼리
- **확장성**: 버전 관리 및 하위 호환성

---

## 2. 인증 및 권한

### 2.1 인증 흐름
```yaml
JWT 기반 인증:
  1. 로그인 요청 → Access Token 발급
  2. API 요청 시 Authorization 헤더에 토큰 포함
  3. 서버에서 토큰 검증 및 권한 확인
  4. RLS를 통한 데이터 접근 제어

토큰 구조:
  Access Token: 1시간 유효
  Refresh Token: 30일 유효
  자동 갱신: 만료 10분 전 자동 갱신
```

### 2.2 인증 API

#### 로그인
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "admin@example.com",
      "name": "관리자",
      "role": "admin",
      "avatar_url": null,
      "last_login": "2025-08-08T10:30:00Z"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_at": "2025-08-08T11:30:00Z"
    }
  },
  "message": "로그인 성공"
}
```

#### 토큰 갱신
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 로그아웃
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

### 2.3 권한 체계 (RBAC)
```yaml
역할 계층:
  admin: 모든 권한 (최고 권한)
    ├── 사용자 관리
    ├── 시스템 설정
    └── 모든 데이터 접근
  
  staff: 일반 업무 권한
    ├── 학생 관리 (등록/수정/조회)
    ├── 출결 관리
    ├── 결제 처리
    └── 상담 기록
  
  instructor: 담당 클래스 권한
    ├── 담당 학생만 조회/수정
    ├── 담당 클래스 출결 관리
    ├── 본인 급여 조회
    └── 성적 입력
  
  viewer: 읽기 전용 권한
    ├── 데이터 조회만 가능
    ├── 보고서 확인
    └── 수정/삭제 불가
```

---

## 3. 학생 관리 API

### 3.1 학생 목록 조회
```http
GET /students?page=1&limit=20&class_id=<uuid>&status=active&search=김철수
Authorization: Bearer <access_token>
```

**쿼리 매개변수**:
- `page`: 페이지 번호 (기본: 1)
- `limit`: 페이지 크기 (기본: 20, 최대: 100)
- `class_id`: 클래스 필터 (UUID)
- `status`: 상태 필터 (active/waiting/inactive/graduated)
- `search`: 이름/연락처 검색
- `sort`: 정렬 (name/enrollment_date/position_in_class)
- `order`: 정렬 순서 (asc/desc)

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "김철수",
        "phone": "010-1234-5678",
        "parent_name": "김아버지",
        "parent_phone": "010-9876-5432",
        "grade": "중2",
        "class_id": "456e7890-e89b-12d3-a456-426614174000",
        "class_name": "중등 수학 A반",
        "instructor_name": "이강사",
        "status": "active",
        "enrollment_date": "2025-01-01",
        "position_in_class": 1,
        "display_color": "#3B82F6",
        "memo": "성실한 학생",
        "current_enrollment": {
          "id": "789e0123-e89b-12d3-a456-426614174000",
          "package_name": "10회 수업권",
          "billing_type": "sessions",
          "remaining_sessions": 7,
          "remaining_hours": null,
          "end_date": "2025-04-01"
        },
        "created_at": "2025-08-08T10:30:00Z",
        "updated_at": "2025-08-08T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8,
      "has_more": true
    }
  }
}
```

### 3.2 학생 상세 조회
```http
GET /students/{student_id}
Authorization: Bearer <access_token>
```

### 3.3 학생 등록
```http
POST /students
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "김철수",
  "phone": "010-1234-5678",
  "parent_name": "김아버지", 
  "parent_phone": "010-9876-5432",
  "grade": "중2",
  "class_id": "456e7890-e89b-12d3-a456-426614174000",
  "status": "active",
  "memo": "성실한 학생",
  "display_color": "#3B82F6"
}
```

### 3.4 학생 정보 수정
```http
PUT /students/{student_id}
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "김철수",
  "phone": "010-1234-5678",
  "parent_name": "김아버지",
  "parent_phone": "010-9876-5432",
  "grade": "중3",
  "memo": "성실하고 열심히 하는 학생"
}
```

### 3.5 학생 상태 변경
```http
PATCH /students/{student_id}/status
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "status": "inactive",
  "reason": "휴학 신청",
  "effective_date": "2025-08-15"
}
```

### 3.6 학생 삭제 (소프트 삭제)
```http
DELETE /students/{student_id}
Authorization: Bearer <access_token>
```

---

## 4. 클래스 관리 API

### 4.1 클래스 목록 조회
```http
GET /classes?instructor_id=<uuid>&status=active&include_stats=true
Authorization: Bearer <access_token>
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174000",
        "name": "중등 수학 A반",
        "subject": "수학",
        "grade_level": "중2",
        "max_students": 20,
        "current_students": 15,
        "occupancy_rate": 75.0,
        "instructor_id": "789e0123-e89b-12d3-a456-426614174000",
        "instructor_name": "이강사",
        "classroom": "201호",
        "color": "#3B82F6",
        "status": "active",
        "order_index": 1,
        "start_date": "2025-01-01",
        "end_date": "2025-06-30",
        "schedules": [
          {
            "day_of_week": "monday",
            "start_time": "19:00",
            "end_time": "21:00"
          },
          {
            "day_of_week": "wednesday", 
            "start_time": "19:00",
            "end_time": "21:00"
          }
        ],
        "stats": {
          "total_revenue": 2700000,
          "average_attendance_rate": 92.5,
          "total_enrollments": 18
        }
      }
    ]
  }
}
```

### 4.2 클래스 생성
```http
POST /classes
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "중등 수학 B반",
  "subject": "수학",
  "grade_level": "중2",
  "max_students": 20,
  "instructor_id": "789e0123-e89b-12d3-a456-426614174000",
  "classroom": "202호",
  "color": "#10B981",
  "start_date": "2025-09-01",
  "end_date": "2025-12-31",
  "schedules": [
    {
      "day_of_week": "tuesday",
      "start_time": "19:00",
      "end_time": "21:00"
    },
    {
      "day_of_week": "thursday",
      "start_time": "19:00", 
      "end_time": "21:00"
    }
  ]
}
```

### 4.3 클래스 수정
```http
PUT /classes/{class_id}
Content-Type: application/json
Authorization: Bearer <access_token>
```

### 4.4 클래스 삭제
```http
DELETE /classes/{class_id}
Authorization: Bearer <access_token>
```

---

## 5. ClassFlow API

### 5.1 학생 이동 (드래그앤드롭 핵심)
```http
POST /classflow/move-student
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "from_class_id": "456e7890-e89b-12d3-a456-426614174000",
  "to_class_id": "789e0123-e89b-12d3-a456-426614174000",
  "new_position": 5,
  "reason": "학생 요청으로 인한 반 이동"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "김철수",
      "class_id": "789e0123-e89b-12d3-a456-426614174000",
      "position_in_class": 5,
      "updated_at": "2025-08-08T10:30:00Z"
    },
    "from_class": {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "current_students": 14,
      "updated_positions": [
        {"student_id": "...", "position": 1},
        {"student_id": "...", "position": 2}
      ]
    },
    "to_class": {
      "id": "789e0123-e89b-12d3-a456-426614174000", 
      "current_students": 16,
      "updated_positions": [
        {"student_id": "...", "position": 5},
        {"student_id": "...", "position": 6}
      ]
    }
  },
  "message": "학생이 성공적으로 이동되었습니다"
}
```

### 5.2 이동 가능성 검증
```http
POST /classflow/validate-move
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "to_class_id": "789e0123-e89b-12d3-a456-426614174000"
}
```

**응답 (200 OK - 이동 가능)**:
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "can_move": true,
    "validation_results": {
      "max_capacity_check": true,
      "permission_check": true,
      "schedule_conflict_check": true,
      "enrollment_status_check": true
    }
  }
}
```

**응답 (200 OK - 이동 불가)**:
```json
{
  "success": true,
  "data": {
    "is_valid": false,
    "can_move": false,
    "validation_results": {
      "max_capacity_check": false,
      "permission_check": true,
      "schedule_conflict_check": true,
      "enrollment_status_check": true
    },
    "errors": [
      {
        "code": "MAX_CAPACITY_EXCEEDED",
        "message": "대상 클래스가 정원을 초과했습니다 (현재: 20/20)",
        "field": "to_class_id"
      }
    ]
  }
}
```

### 5.3 반별 학생 현황 조회
```http
GET /classflow/class-overview?include_students=true
Authorization: Bearer <access_token>
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174000",
        "name": "중등 수학 A반",
        "current_students": 15,
        "max_students": 20,
        "occupancy_rate": 75.0,
        "color": "#3B82F6",
        "instructor_name": "이강사",
        "students": [
          {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "김철수",
            "position_in_class": 1,
            "display_color": "#3B82F6",
            "status": "active",
            "remaining_sessions": 7,
            "last_attendance": "2025-08-07"
          }
        ]
      }
    ],
    "summary": {
      "total_classes": 8,
      "total_students": 120,
      "average_occupancy": 78.5
    }
  }
}
```

### 5.4 학생 순서 변경 (반 내 위치 조정)
```http
PATCH /classflow/reorder-students
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "class_id": "456e7890-e89b-12d3-a456-426614174000",
  "student_positions": [
    {"student_id": "123e4567-e89b-12d3-a456-426614174000", "position": 1},
    {"student_id": "456e7890-e89b-12d3-a456-426614174001", "position": 2},
    {"student_id": "789e0123-e89b-12d3-a456-426614174002", "position": 3}
  ]
}
```

---

## 6. 강사 관리 API

### 6.1 강사 목록 조회
```http
GET /instructors?status=active&include_stats=true
Authorization: Bearer <access_token>
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "instructors": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174000",
        "user_id": "456e7890-e89b-12d3-a456-426614174000",
        "name": "이강사",
        "phone": "010-1111-2222",
        "email": "instructor@example.com",
        "specialization": "수학",
        "qualification": "수학교육학 석사, 수학 교원자격증",
        "bank_account": "1234-56-789012",
        "status": "active",
        "hire_date": "2024-01-01",
        "assigned_classes": [
          {
            "id": "456e7890-e89b-12d3-a456-426614174000",
            "name": "중등 수학 A반",
            "current_students": 15,
            "max_students": 20
          }
        ],
        "salary_policy": {
          "id": "abc12345-e89b-12d3-a456-426614174000",
          "name": "경력 강사 급여",
          "policy_type": "hybrid",
          "base_amount": 1800000,
          "commission_rate": 8.0
        },
        "stats": {
          "total_students": 25,
          "average_attendance_rate": 94.2,
          "monthly_revenue": 4500000,
          "last_salary": 2460000
        }
      }
    ]
  }
}
```

### 6.2 강사 등록
```http
POST /instructors
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "박강사",
  "phone": "010-2222-3333", 
  "email": "new.instructor@example.com",
  "specialization": "영어",
  "qualification": "영어교육학 학사, TESOL 자격증",
  "bank_account": "9876-54-321098",
  "hire_date": "2025-09-01",
  "user_account": {
    "create_account": true,
    "role": "instructor", 
    "password": "temp_password_123"
  }
}
```

### 6.3 강사 정보 수정
```http
PUT /instructors/{instructor_id}
Content-Type: application/json
Authorization: Bearer <access_token>
```

### 6.4 강사 급여 정책 설정
```http
POST /instructors/{instructor_id}/salary-policy
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "salary_policy_id": "abc12345-e89b-12d3-a456-426614174000",
  "effective_from": "2025-09-01",
  "notes": "경력 인정으로 인한 정책 변경"
}
```

---

## 7. 결제 시스템 API

### 7.1 수강권 패키지 관리

#### 수강권 패키지 조회
```http
GET /course-packages?class_id=<uuid>&billing_type=sessions&is_active=true
Authorization: Bearer <access_token>
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "def45678-e89b-12d3-a456-426614174000",
        "class_id": "456e7890-e89b-12d3-a456-426614174000",
        "class_name": "중등 수학 A반",
        "name": "10회 수업권",
        "billing_type": "sessions",
        "base_price": 200000,
        "sessions_count": 10,
        "hours_count": null,
        "duration_months": null,
        "duration_days": 90,
        "discount_rate": 0.0,
        "is_active": true,
        "auto_renewal": false,
        "sort_order": 1
      },
      {
        "id": "ghi78901-e89b-12d3-a456-426614174000",
        "class_id": "456e7890-e89b-12d3-a456-426614174000", 
        "class_name": "중등 수학 A반",
        "name": "월 정액권",
        "billing_type": "monthly",
        "base_price": 180000,
        "sessions_count": null,
        "hours_count": null,
        "duration_months": 1,
        "duration_days": null,
        "discount_rate": 5.0,
        "is_active": true,
        "auto_renewal": true,
        "sort_order": 2
      }
    ]
  }
}
```

#### 수강권 패키지 생성
```http
POST /course-packages
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "class_id": "456e7890-e89b-12d3-a456-426614174000",
  "name": "20회 특별권",
  "billing_type": "sessions",
  "base_price": 380000,
  "sessions_count": 20,
  "duration_days": 120,
  "discount_rate": 5.0,
  "auto_renewal": false
}
```

### 7.2 학생 수강권 등록

#### 수강권 등록
```http
POST /student-enrollments
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "course_package_id": "def45678-e89b-12d3-a456-426614174000",
  "start_date": "2025-08-15",
  "applied_discounts": [
    {
      "discount_policy_id": "jkl90123-e89b-12d3-a456-426614174000",
      "discount_type": "sibling",
      "discount_amount": 20000,
      "description": "형제할인 10%"
    }
  ],
  "final_price": 180000,
  "auto_renewal": false,
  "payment_info": {
    "payment_method": "card",
    "payment_date": "2025-08-15"
  }
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "enrollment": {
      "id": "mno23456-e89b-12d3-a456-426614174000",
      "student_id": "123e4567-e89b-12d3-a456-426614174000",
      "student_name": "김철수",
      "course_package_id": "def45678-e89b-12d3-a456-426614174000",
      "package_name": "10회 수업권",
      "billing_type": "sessions",
      "start_date": "2025-08-15",
      "end_date": "2025-11-13",
      "original_price": 200000,
      "final_price": 180000,
      "applied_discounts": [
        {
          "discount_type": "sibling",
          "discount_amount": 20000,
          "description": "형제할인 10%"
        }
      ],
      "total_sessions": 10,
      "used_sessions": 0,
      "remaining_sessions": 10,
      "status": "active",
      "auto_renewal": false
    }
  }
}
```

#### 수강권 사용 내역 조회
```http
GET /student-enrollments/{enrollment_id}/usage
Authorization: Bearer <access_token>
```

### 7.3 결제 관리

#### 결제 내역 조회
```http
GET /payments?student_id=<uuid>&status=pending&from_date=2025-01-01&to_date=2025-12-31
Authorization: Bearer <access_token>
```

#### 결제 처리
```http
POST /payments
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "student_id": "123e4567-e89b-12d3-a456-426614174000",
  "enrollment_id": "mno23456-e89b-12d3-a456-426614174000",
  "amount": 180000,
  "payment_method": "card",
  "payment_date": "2025-08-15",
  "due_date": "2025-08-31",
  "notes": "8월 수강료"
}
```

#### 미납 관리
```http
GET /payments/overdue?days_overdue=7&include_student_info=true
Authorization: Bearer <access_token>
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "overdue_payments": [
      {
        "id": "pqr34567-e89b-12d3-a456-426614174000",
        "student_id": "123e4567-e89b-12d3-a456-426614174000",
        "student_name": "김철수",
        "parent_phone": "010-9876-5432",
        "class_name": "중등 수학 A반",
        "amount": 180000,
        "due_date": "2025-07-31",
        "overdue_days": 8,
        "overdue_fee": 18000,
        "total_amount": 198000,
        "payment_method": "card",
        "status": "overdue"
      }
    ],
    "summary": {
      "total_overdue": 5,
      "total_amount": 990000,
      "total_overdue_fees": 99000,
      "average_overdue_days": 12.4
    }
  }
}
```

---

## 8. 급여 시스템 API

### 8.1 급여 정책 관리

#### 급여 정책 목록 조회
```http
GET /salary-policies?policy_type=hybrid&is_active=true
Authorization: Bearer <access_token>
```

#### 급여 정책 생성
```http
POST /salary-policies
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "신입 강사 기본급",
  "policy_type": "fixed_monthly",
  "base_amount": 2200000,
  "minimum_guaranteed": 2200000,
  "calculation_basis": "fixed",
  "description": "신입 강사 대상 고정 월급제"
}
```

### 8.2 급여 계산

#### 월별 급여 계산 실행
```http
POST /salary-calculations/calculate
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "instructor_id": "789e0123-e89b-12d3-a456-426614174000",
  "calculation_month": "2025-08-01",
  "force_recalculate": false
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "calculation": {
      "id": "stu45678-e89b-12d3-a456-426614174000",
      "instructor_id": "789e0123-e89b-12d3-a456-426614174000",
      "instructor_name": "이강사",
      "calculation_month": "2025-08-01",
      "salary_policy": {
        "name": "경력 강사 급여",
        "policy_type": "hybrid",
        "base_amount": 1800000,
        "commission_rate": 8.0
      },
      "calculation_data": {
        "total_revenue": 4500000,
        "total_students": 25,
        "total_hours": 96.0
      },
      "salary_breakdown": {
        "base_salary": 1800000,
        "commission_salary": 360000,
        "bonus_amount": 50000,
        "deduction_amount": 180000,
        "total_calculated": 2030000,
        "minimum_guaranteed": 2000000,
        "final_salary": 2030000
      },
      "calculation_details": {
        "commission_calculation": {
          "revenue": 4500000,
          "rate": 8.0,
          "amount": 360000
        },
        "deductions": [
          {"type": "tax", "amount": 150000},
          {"type": "insurance", "amount": 30000}
        ]
      },
      "calculated_at": "2025-08-08T10:30:00Z",
      "status": "calculated"
    }
  }
}
```

#### 급여 계산 내역 조회
```http
GET /salary-calculations?instructor_id=<uuid>&year=2025&month=8
Authorization: Bearer <access_token>
```

#### 급여 승인
```http
PATCH /salary-calculations/{calculation_id}/approve
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "approved_by": "admin_user_id",
  "notes": "8월 급여 승인 완료"
}
```

---

## 9. 통계 및 리포트 API

### 9.1 대시보드 통계
```http
GET /analytics/dashboard?period=monthly&year=2025&month=8
Authorization: Bearer <access_token>
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_students": 150,
      "active_students": 142,
      "total_classes": 12,
      "total_instructors": 8,
      "monthly_revenue": 25200000,
      "monthly_expenses": 18500000,
      "net_profit": 6700000
    },
    "trends": {
      "student_growth": [
        {"month": "2025-06", "count": 135},
        {"month": "2025-07", "count": 148}, 
        {"month": "2025-08", "count": 150}
      ],
      "revenue_trend": [
        {"month": "2025-06", "amount": 23800000},
        {"month": "2025-07", "amount": 24500000},
        {"month": "2025-08", "amount": 25200000}
      ]
    },
    "class_performance": [
      {
        "class_id": "456e7890-e89b-12d3-a456-426614174000",
        "class_name": "중등 수학 A반",
        "occupancy_rate": 75.0,
        "attendance_rate": 92.5,
        "revenue": 2700000,
        "profit_margin": 28.5
      }
    ]
  }
}
```

### 9.2 출결 통계
```http
GET /analytics/attendance?class_id=<uuid>&from_date=2025-08-01&to_date=2025-08-31
Authorization: Bearer <access_token>
```

### 9.3 매출 분석
```http
GET /analytics/revenue?period=monthly&year=2025&include_forecasting=true
Authorization: Bearer <access_token>
```

### 9.4 데이터 내보내기
```http
POST /exports/students
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "format": "excel",
  "filters": {
    "class_id": "456e7890-e89b-12d3-a456-426614174000",
    "status": "active",
    "include_enrollment_info": true
  },
  "columns": [
    "name", "phone", "parent_phone", "class_name", 
    "enrollment_date", "package_name", "remaining_sessions"
  ]
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "export_id": "vwx56789-e89b-12d3-a456-426614174000",
    "status": "processing",
    "estimated_completion": "2025-08-08T10:35:00Z",
    "download_url": null
  }
}
```

---

## 10. 실시간 API

### 10.1 WebSocket 연결
```javascript
// Supabase Realtime 기반 실시간 구독
const supabase = createClient(url, key);

// ClassFlow 실시간 업데이트 구독
const studentMovementSubscription = supabase
  .channel('classflow')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'students',
    filter: 'status=eq.active'
  }, (payload) => {
    console.log('학생 이동 감지:', payload);
    // UI 업데이트 로직
  })
  .subscribe();

// 출결 실시간 업데이트 구독
const attendanceSubscription = supabase
  .channel('attendance') 
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public', 
    table: 'attendances'
  }, (payload) => {
    console.log('출결 체크 감지:', payload);
    // 출결 현황 업데이트
  })
  .subscribe();
```

### 10.2 실시간 이벤트 타입
```yaml
지원 이벤트:
  student_moved:
    - 학생 반 이동 시 발생
    - 페이로드: {student_id, from_class_id, to_class_id, new_position}
    
  attendance_updated:
    - 출결 체크 시 발생
    - 페이로드: {student_id, class_id, status, date}
    
  enrollment_changed:
    - 수강권 등록/만료 시 발생
    - 페이로드: {student_id, enrollment_id, status}
    
  payment_received:
    - 결제 완료 시 발생
    - 페이로드: {student_id, payment_id, amount}
    
  class_updated:
    - 클래스 정보 변경 시 발생
    - 페이로드: {class_id, updated_fields}
```

---

## 11. 에러 처리

### 11.1 표준 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 올바르지 않습니다",
    "details": [
      {
        "field": "email",
        "message": "올바른 이메일 형식이 아닙니다",
        "code": "INVALID_EMAIL"
      },
      {
        "field": "phone", 
        "message": "전화번호는 필수 항목입니다",
        "code": "REQUIRED_FIELD"
      }
    ]
  },
  "timestamp": "2025-08-08T10:30:00Z",
  "request_id": "req_123456789"
}
```

### 11.2 HTTP 상태 코드 사용 기준
```yaml
2xx Success:
  200 OK: 일반적인 성공 응답
  201 Created: 리소스 생성 성공
  204 No Content: 성공하지만 반환할 데이터 없음

4xx Client Error:
  400 Bad Request: 잘못된 요청 데이터
  401 Unauthorized: 인증 실패
  403 Forbidden: 권한 부족  
  404 Not Found: 리소스를 찾을 수 없음
  409 Conflict: 리소스 충돌 (중복 등)
  422 Unprocessable Entity: 유효성 검증 실패
  429 Too Many Requests: 요청 한도 초과

5xx Server Error:
  500 Internal Server Error: 서버 내부 오류
  502 Bad Gateway: 게이트웨이 오류
  503 Service Unavailable: 서비스 일시 중단
```

### 11.3 주요 에러 코드
```yaml
인증/권한:
  AUTHENTICATION_FAILED: 인증 실패
  AUTHORIZATION_DENIED: 권한 부족
  TOKEN_EXPIRED: 토큰 만료
  INVALID_TOKEN: 유효하지 않은 토큰

데이터 유효성:
  VALIDATION_ERROR: 입력 데이터 검증 실패
  REQUIRED_FIELD: 필수 필드 누락
  INVALID_FORMAT: 잘못된 데이터 형식
  VALUE_OUT_OF_RANGE: 허용 범위 초과

비즈니스 로직:
  MAX_CAPACITY_EXCEEDED: 클래스 정원 초과
  INSUFFICIENT_SESSIONS: 수강권 잔여 횟수 부족
  SCHEDULE_CONFLICT: 일정 충돌
  PAYMENT_REQUIRED: 결제 필요
  ENROLLMENT_EXPIRED: 수강권 만료

시스템:
  DATABASE_ERROR: 데이터베이스 오류
  EXTERNAL_SERVICE_ERROR: 외부 서비스 오류
  RATE_LIMIT_EXCEEDED: 요청 한도 초과
  SERVICE_UNAVAILABLE: 서비스 일시 중단
```

---

## 12. API 사용 예시

### 12.1 학생 등록부터 수업 배정까지의 완전한 플로우
```javascript
// 1. 학생 등록
const newStudent = await fetch('/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + accessToken
  },
  body: JSON.stringify({
    name: '김철수',
    phone: '010-1234-5678',
    parent_name: '김아버지',
    parent_phone: '010-9876-5432',
    grade: '중2',
    status: 'waiting' // 처음엔 대기 상태
  })
});

const studentData = await newStudent.json();
const studentId = studentData.data.student.id;

// 2. 적절한 클래스 찾기
const availableClasses = await fetch(`/api/classes?grade_level=중2&has_space=true`, {
  headers: { 'Authorization': 'Bearer ' + accessToken }
});
const classesData = await availableClasses.json();
const targetClassId = classesData.data.classes[0].id;

// 3. 수강권 패키지 선택
const packages = await fetch(`/api/course-packages?class_id=${targetClassId}`, {
  headers: { 'Authorization': 'Bearer ' + accessToken }
});
const packagesData = await packages.json();
const selectedPackage = packagesData.data.packages.find(p => p.billing_type === 'monthly');

// 4. 수강권 등록 (결제와 함께)
const enrollment = await fetch('/api/student-enrollments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + accessToken
  },
  body: JSON.stringify({
    student_id: studentId,
    course_package_id: selectedPackage.id,
    start_date: '2025-08-15',
    final_price: selectedPackage.base_price,
    payment_info: {
      payment_method: 'card',
      payment_date: '2025-08-15'
    }
  })
});

// 5. ClassFlow를 통한 클래스 배정
const moveResult = await fetch('/api/classflow/move-student', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + accessToken
  },
  body: JSON.stringify({
    student_id: studentId,
    from_class_id: null, // 대기 상태에서 이동
    to_class_id: targetClassId,
    reason: '신규 등록 학생 클래스 배정'
  })
});

console.log('학생 등록 및 배정 완료:', await moveResult.json());
```

### 12.2 드래그앤드롭 이동 처리
```javascript
// 드래그 시작
const handleDragStart = (studentId) => {
  setDraggedStudent(studentId);
};

// 드롭 처리 (이동 실행)
const handleDrop = async (targetClassId) => {
  const draggedStudentId = getDraggedStudentId();
  const sourceClassId = getStudentCurrentClassId(draggedStudentId);
  
  try {
    // 1. 이동 가능성 사전 검증
    const validation = await fetch('/api/classflow/validate-move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      },
      body: JSON.stringify({
        student_id: draggedStudentId,
        to_class_id: targetClassId
      })
    });
    
    const validationResult = await validation.json();
    
    if (!validationResult.data.can_move) {
      // 이동 불가 시 에러 메시지 표시
      showErrorMessage(validationResult.data.errors[0].message);
      return;
    }
    
    // 2. 실제 이동 실행
    const moveResult = await fetch('/api/classflow/move-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      },
      body: JSON.stringify({
        student_id: draggedStudentId,
        from_class_id: sourceClassId,
        to_class_id: targetClassId,
        new_position: getTargetPosition(targetClassId)
      })
    });
    
    const moveData = await moveResult.json();
    
    if (moveData.success) {
      // UI 업데이트 (낙관적 업데이트)
      updateClassStudentCounts(moveData.data);
      showSuccessMessage('학생이 성공적으로 이동되었습니다');
    }
    
  } catch (error) {
    console.error('이동 처리 중 오류:', error);
    showErrorMessage('이동 중 오류가 발생했습니다');
    
    // 실패 시 롤백
    revertDragOperation();
  } finally {
    setDraggedStudent(null);
  }
};
```

### 12.3 실시간 업데이트 처리
```javascript
// ClassFlow 실시간 구독 설정
const setupClassFlowRealtime = () => {
  const supabase = createClient(url, key);
  
  // 학생 이동 실시간 감지
  const studentMovementChannel = supabase
    .channel('student_movements')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'students',
      filter: 'status=eq.active'
    }, (payload) => {
      const { old: oldData, new: newData } = payload;
      
      // 클래스 이동 감지
      if (oldData.class_id !== newData.class_id) {
        handleStudentMoved({
          studentId: newData.id,
          fromClassId: oldData.class_id,
          toClassId: newData.class_id,
          newPosition: newData.position_in_class
        });
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public', 
      table: 'classes'
    }, (payload) => {
      // 클래스 학생 수 업데이트
      const classData = payload.new;
      updateClassStats(classData.id, {
        currentStudents: classData.current_students
      });
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(studentMovementChannel);
  };
};

// 실시간 이벤트 핸들러
const handleStudentMoved = ({ studentId, fromClassId, toClassId, newPosition }) => {
  // 현재 사용자가 드래그 중인 학생이 아닌 경우만 업데이트
  if (getDraggedStudentId() !== studentId) {
    // UI에서 학생 위치 업데이트
    moveStudentInUI(studentId, fromClassId, toClassId, newPosition);
    
    // 클래스 통계 업데이트
    decrementClassStudentCount(fromClassId);
    incrementClassStudentCount(toClassId);
    
    // 사용자에게 알림
    showNotification(`${getStudentName(studentId)}님이 이동했습니다`);
  }
};
```

---

## 부록

### A. 개발 도구 및 SDK
```bash
# TypeScript 타입 자동 생성
supabase gen types typescript --project-id your-project > types/database.ts

# Postman Collection 내보내기
# API 테스트용 컬렉션 제공 예정

# OpenAPI 스펙 생성
# Swagger UI 문서 자동 생성 지원
```

### B. 성능 최적화 가이드
```yaml
쿼리 최적화:
  - 적절한 인덱스 활용
  - 페이지네이션 필수 적용
  - 불필요한 JOIN 최소화
  - 선택적 필드 조회 (select 절 최적화)

캐싱 전략:
  - 자주 조회되는 데이터 캐싱 (클래스 목록, 패키지 정보)
  - 실시간 업데이트가 필요한 데이터는 캐싱 제외
  - CDN 활용으로 정적 리소스 최적화

실시간 최적화:
  - 필요한 테이블/이벤트만 구독
  - 구독 채널 수 최소화
  - 클라이언트 사이드 디바운싱
```

### C. 보안 체크리스트
```yaml
인증/인가:
  ✅ JWT 토큰 만료 시간 적절히 설정
  ✅ Refresh Token 보안 저장
  ✅ RLS 정책 모든 테이블 적용
  ✅ API 엔드포인트별 권한 검증

데이터 보안:
  ✅ 개인정보 암호화 저장
  ✅ SQL Injection 방지
  ✅ XSS 공격 방지
  ✅ CSRF 토큰 적용

모니터링:
  ✅ 실패한 로그인 시도 추적
  ✅ 비정상적 API 요청 감지
  ✅ 데이터 접근 로그 기록
  ✅ 보안 이벤트 알림 설정
```

---

## 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| v2.0 | 2025-08-08 | 초기 API 명세서 작성 (database_schema_v2.sql 기반) |
| v2.1 | 예정 | 실시간 성능 최적화 추가 |
| v2.2 | 예정 | 외부 연동 API 추가 |

---

**다음 문서**: CLAUDE.md 프로젝트 현황 반영 업데이트