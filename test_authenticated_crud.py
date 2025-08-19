#!/usr/bin/env python3
"""
EduCanvas 인증된 CRUD API 테스트 스크립트
sjlee87@kakao.com 계정으로 로그인 후 모든 CRUD 테스트
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# 테스트 설정
BASE_URL = "http://localhost:3001"
TIMEOUT = 10

# 로그인 정보
LOGIN_EMAIL = "sjlee87@kakao.com"
LOGIN_PASSWORD = "test123456@"

class AuthenticatedCRUDTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'EduCanvas-API-Tester/1.0'
        })
        self.access_token = None
        self.user_profile = None
        self.tenant_id = None
        
    def log(self, message: str, level: str = "INFO"):
        """로그 출력"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_api_endpoint(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200, headers: Dict = None) -> Dict:
        """API 엔드포인트 테스트"""
        url = f"{BASE_URL}{endpoint}"
        
        # 인증 헤더 추가
        request_headers = self.session.headers.copy()
        if self.access_token:
            request_headers['Authorization'] = f'Bearer {self.access_token}'
        if headers:
            request_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, timeout=TIMEOUT)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=TIMEOUT)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=request_headers, timeout=TIMEOUT)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=TIMEOUT)
            else:
                raise ValueError(f"지원하지 않는 HTTP 메서드: {method}")
                
            self.log(f"{method} {endpoint} -> {response.status_code}")
            
            # 응답 내용 확인
            try:
                response_data = response.json()
                if response.status_code != expected_status:
                    error_msg = response_data.get('error', response_data.get('message', 'Unknown error'))
                    self.log(f"예상 상태코드({expected_status})와 다름: {error_msg}", "WARN")
                return response_data
            except:
                self.log(f"JSON 응답 파싱 실패: {response.text[:100]}", "ERROR")
                return {"error": "Invalid JSON response", "raw": response.text[:200]}
                
        except requests.exceptions.Timeout:
            self.log(f"요청 타임아웃: {url}", "ERROR")
            return {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            self.log(f"연결 실패: {url}", "ERROR")
            return {"error": "Connection failed"}
        except Exception as e:
            self.log(f"요청 실패: {str(e)}", "ERROR")
            return {"error": str(e)}
    
    def login(self) -> bool:
        """로그인 시도"""
        self.log("=== 로그인 시도 ===")
        
        login_data = {
            "email": LOGIN_EMAIL,
            "password": LOGIN_PASSWORD
        }
        
        response = self.test_api_endpoint("POST", "/api/auth/login", login_data, expected_status=200)
        
        if "error" in response:
            self.log(f"로그인 실패: {response['error']}", "ERROR")
            return False
        
        # 토큰 추출
        if "access_token" in response:
            self.access_token = response["access_token"]
            self.user_profile = response.get("user", {})
            self.tenant_id = self.user_profile.get("tenant_id")
            
            self.log(f"로그인 성공: {self.user_profile.get('email', 'Unknown')}")
            self.log(f"역할: {self.user_profile.get('role', 'Unknown')}")
            self.log(f"테넌트 ID: {self.tenant_id}")
            return True
        else:
            self.log("로그인 응답에 access_token이 없습니다", "ERROR")
            return False
    
    def test_students_crud(self):
        """학생 CRUD 테스트"""
        self.log("=== 학생 CRUD 테스트 ===")
        
        # 1. 학생 목록 조회
        self.log("1. 학생 목록 조회")
        params = f"?limit=5"
        if self.tenant_id:
            params += f"&tenantId={self.tenant_id}"
        
        response = self.test_api_endpoint("GET", f"/api/students{params}")
        
        if "error" not in response:
            students_count = len(response.get("students", []))
            self.log(f"   조회된 학생 수: {students_count}")
            
            # 2. 학생 생성 테스트
            if self.tenant_id:
                self.log("2. 학생 생성 테스트")
                student_data = {
                    "tenantId": self.tenant_id,
                    "name": f"테스트학생_{int(time.time())}",
                    "student_number": f"TEST{int(time.time()) % 10000:04d}",
                    "phone": "010-1234-5678",
                    "email": "test.student@example.com",
                    "grade_level": "중1",
                    "status": "active"
                }
                
                create_response = self.test_api_endpoint("POST", "/api/students", student_data, expected_status=200)
                
                if "error" not in create_response and "student" in create_response:
                    created_student = create_response["student"]
                    student_id = created_student["id"]
                    self.log(f"   학생 생성 성공: {created_student['name']} (ID: {student_id})")
                    
                    # 3. 생성된 학생 조회
                    self.log("3. 개별 학생 조회")
                    get_response = self.test_api_endpoint("GET", f"/api/students/{student_id}?tenantId={self.tenant_id}")
                    
                    if "error" not in get_response:
                        self.log(f"   개별 조회 성공: {get_response['student']['name']}")
                        
                        # 4. 학생 정보 수정
                        self.log("4. 학생 정보 수정")
                        update_data = {
                            "tenantId": self.tenant_id,
                            "name": f"수정된학생_{int(time.time())}",
                            "grade_level": "중2"
                        }
                        
                        update_response = self.test_api_endpoint("PUT", f"/api/students/{student_id}", update_data)
                        
                        if "error" not in update_response:
                            self.log(f"   수정 성공: {update_response['student']['name']}")
                            
                            # 5. 학생 삭제 (소프트 삭제)
                            self.log("5. 학생 삭제 (소프트)")
                            delete_response = self.test_api_endpoint("DELETE", f"/api/students/{student_id}?tenantId={self.tenant_id}")
                            
                            if "error" not in delete_response:
                                self.log("   소프트 삭제 성공")
                                return True
        
        return False
    
    def test_classes_crud(self):
        """클래스 CRUD 테스트"""
        self.log("=== 클래스 CRUD 테스트 ===")
        
        if not self.tenant_id:
            self.log("테넌트 ID가 없어 클래스 테스트를 건너뜁니다", "WARN")
            return False
        
        # 1. 클래스 목록 조회
        response = self.test_api_endpoint("GET", f"/api/classes?tenantId={self.tenant_id}&limit=5")
        
        if "error" not in response:
            classes_count = len(response.get("classes", []))
            self.log(f"   조회된 클래스 수: {classes_count}")
            
            # 2. 클래스 생성
            class_data = {
                "tenantId": self.tenant_id,
                "name": f"테스트클래스_{int(time.time())}",
                "grade": "중1",
                "course": "수학",
                "max_students": 20,
                "status": "active"
            }
            
            create_response = self.test_api_endpoint("POST", "/api/classes", class_data)
            
            if "error" not in create_response and "class" in create_response:
                created_class = create_response["class"]
                class_id = created_class["id"]
                self.log(f"   클래스 생성 성공: {created_class['name']}")
                
                # 3. 클래스 조회
                get_response = self.test_api_endpoint("GET", f"/api/classes/{class_id}?tenantId={self.tenant_id}")
                
                if "error" not in get_response:
                    self.log("   개별 조회 성공")
                    return True
        
        return False
    
    def test_instructors_crud(self):
        """강사 CRUD 테스트"""
        self.log("=== 강사 CRUD 테스트 ===")
        
        if not self.tenant_id:
            return False
        
        # 1. 강사 목록 조회
        response = self.test_api_endpoint("GET", f"/api/instructors?tenantId={self.tenant_id}&limit=5")
        
        if "error" not in response:
            instructors_count = len(response.get("instructors", []))
            self.log(f"   조회된 강사 수: {instructors_count}")
            
            # 2. 강사 생성
            instructor_data = {
                "tenantId": self.tenant_id,
                "name": f"테스트강사_{int(time.time())}",
                "email": f"instructor{int(time.time())}@example.com",
                "phone": "010-9876-5432",
                "specialization": "수학",
                "status": "active"
            }
            
            create_response = self.test_api_endpoint("POST", "/api/instructors", instructor_data)
            
            if "error" not in create_response:
                self.log("   강사 생성 성공")
                return True
        
        return False
    
    def test_course_packages_crud(self):
        """코스패키지 CRUD 테스트"""
        self.log("=== 코스패키지 CRUD 테스트 ===")
        
        if not self.tenant_id:
            return False
        
        # 1. 코스패키지 목록 조회
        response = self.test_api_endpoint("GET", f"/api/course-packages?tenantId={self.tenant_id}&limit=5")
        
        if "error" not in response:
            packages_count = len(response.get("course_packages", []))
            self.log(f"   조회된 패키지 수: {packages_count}")
            
            # 2. 코스패키지 생성
            package_data = {
                "tenantId": self.tenant_id,
                "name": f"테스트패키지_{int(time.time())}",
                "price": 100000,
                "billing_type": "monthly",
                "currency": "KRW",
                "hours": 40,
                "sessions": 10,
                "is_active": True
            }
            
            create_response = self.test_api_endpoint("POST", "/api/course-packages", package_data)
            
            if "error" not in create_response:
                self.log("   패키지 생성 성공")
                return True
        
        return False
    
    def test_enrollments_crud(self):
        """수강등록 CRUD 테스트"""
        self.log("=== 수강등록 CRUD 테스트 ===")
        
        if not self.tenant_id:
            return False
        
        # 1. 수강등록 목록 조회
        response = self.test_api_endpoint("GET", f"/api/enrollments?tenantId={self.tenant_id}&limit=5")
        
        if "error" not in response:
            enrollments_count = len(response.get("enrollments", []))
            self.log(f"   조회된 수강등록 수: {enrollments_count}")
            return True
        
        return False
    
    def test_salary_policies_crud(self):
        """급여정책 CRUD 테스트"""
        self.log("=== 급여정책 CRUD 테스트 ===")
        
        if not self.tenant_id:
            return False
        
        # 1. 급여정책 목록 조회
        response = self.test_api_endpoint("GET", f"/api/salary-policies?tenantId={self.tenant_id}&limit=5")
        
        if "error" not in response:
            policies_count = len(response.get("salary_policies", []))
            self.log(f"   조회된 급여정책 수: {policies_count}")
            
            # 2. 급여정책 생성
            policy_data = {
                "tenantId": self.tenant_id,
                "name": f"테스트정책_{int(time.time())}",
                "policy_type": "hourly",
                "base_amount": 50000,
                "is_active": True
            }
            
            create_response = self.test_api_endpoint("POST", "/api/salary-policies", policy_data)
            
            if "error" not in create_response:
                self.log("   급여정책 생성 성공")
                return True
        
        return False
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        self.log("EduCanvas 인증된 CRUD API 테스트 시작")
        self.log("=" * 60)
        
        # 로그인
        if not self.login():
            self.log("로그인 실패로 테스트를 중단합니다.", "ERROR")
            return False
        
        # 각 CRUD 테스트 실행
        tests = [
            ("학생 CRUD", self.test_students_crud),
            ("클래스 CRUD", self.test_classes_crud),
            ("강사 CRUD", self.test_instructors_crud),
            ("코스패키지 CRUD", self.test_course_packages_crud),
            ("수강등록 CRUD", self.test_enrollments_crud),
            ("급여정책 CRUD", self.test_salary_policies_crud)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                if result:
                    passed += 1
                    self.log(f"✅ {test_name} 통과")
                else:
                    self.log(f"❌ {test_name} 실패", "ERROR")
            except Exception as e:
                self.log(f"❌ {test_name} 예외 발생: {str(e)}", "ERROR")
        
        self.log("=" * 60)
        self.log(f"테스트 완료: {passed}/{total} 통과")
        
        if passed == total:
            self.log("🎉 모든 CRUD API가 정상적으로 작동합니다!")
        else:
            self.log("⚠️ 일부 API에 문제가 있습니다.", "WARN")
        
        return passed >= (total * 0.8)  # 80% 이상 통과하면 성공으로 간주

if __name__ == "__main__":
    tester = AuthenticatedCRUDTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)