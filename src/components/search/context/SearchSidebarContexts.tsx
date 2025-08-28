'use client'

import { ReactNode } from 'react'
import SearchSidebar from '../SearchSidebar'

// 각 기능별로 SearchSidebar를 사용하는 예시 컴포넌트들

// 1. 학생 관리용 - 인적사항 표시 중심
export function StudentSearchSidebar() {
  return (
    <SearchSidebar context="students">
      {/* 향후 학생 상세 정보 컴포넌트가 들어갈 자리 */}
      <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
        <p className="text-sm">학생을 검색하면</p>
        <p className="text-sm">여기에 상세 정보가 표시됩니다</p>
        <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <h4 className="font-medium mb-2">향후 구현될 내용:</h4>
          <ul className="text-xs space-y-1 text-left">
            <li>• 학생 기본정보 (이름, 학번, 연락처)</li>
            <li>• 학업 현황 (출석률, 성적)</li>
            <li>• 수강 중인 수업 목록</li>
            <li>• 빠른 액션 (편집, 연락, 상담 기록)</li>
          </ul>
        </div>
      </div>
    </SearchSidebar>
  )
}

// 2. 직원 관리용 - 인적사항 표시 중심
export function StaffSearchSidebar() {
  return (
    <SearchSidebar context="staff">
      {/* 향후 직원 상세 정보 컴포넌트가 들어갈 자리 */}
      <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
        <p className="text-sm">직원을 검색하면</p>
        <p className="text-sm">여기에 상세 정보가 표시됩니다</p>
        <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <h4 className="font-medium mb-2">향후 구현될 내용:</h4>
          <ul className="text-xs space-y-1 text-left">
            <li>• 직원 기본정보 (이름, 부서, 역할)</li>
            <li>• 담당 업무 및 수업</li>
            <li>• 근무 일정 및 현황</li>
            <li>• 빠른 액션 (정보 수정, 스케줄 확인)</li>
          </ul>
        </div>
      </div>
    </SearchSidebar>
  )
}

// 3. 클래스 관리용 - 필터링 중심 (기본 필터 사용)
export function ClassSearchSidebar() {
  return (
    <SearchSidebar context="classes">
      {/* 클래스 관리에서는 children을 전달하지 않아 기본 필터 + 검색결과가 표시됨 */}
    </SearchSidebar>
  )
}

// 4. 일정 관리용 - 날짜/시간 필터 중심
export function ScheduleSearchSidebar() {
  return (
    <SearchSidebar context="schedule">
      {/* 향후 일정 관련 네비게이션 컴포넌트가 들어갈 자리 */}
      <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
        <p className="text-sm">일정 관리 사이드바</p>
        <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <h4 className="font-medium mb-2">향후 구현될 내용:</h4>
          <ul className="text-xs space-y-1 text-left">
            <li>• 미니 캘린더 위젯</li>
            <li>• 빠른 기간 선택 (오늘, 이번주, 이번달)</li>
            <li>• 선택된 날짜 일정 미리보기</li>
            <li>• 일정 유형별 필터</li>
          </ul>
        </div>
      </div>
    </SearchSidebar>
  )
}

// 5. 기본 대시보드용 - 통합 검색
export function DashboardSearchSidebar() {
  return (
    <SearchSidebar context="dashboard">
      {/* 대시보드에서는 children을 전달하지 않아 기본 검색 기능이 표시됨 */}
    </SearchSidebar>
  )
}

// 컨텍스트별 사이드바를 쉽게 가져올 수 있는 헬퍼
export const searchSidebarContexts = {
  students: StudentSearchSidebar,
  staff: StaffSearchSidebar,
  classes: ClassSearchSidebar,
  schedule: ScheduleSearchSidebar,
  dashboard: DashboardSearchSidebar,
} as const

// 사용법 가이드 컴포넌트
export function SearchSidebarUsageGuide() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">SearchSidebar 사용 가이드</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          각 기능별로 사이드바의 용도가 다릅니다. 아래 예시를 참고하여 구현하세요.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 학생/직원 관리 패턴 */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-blue-600">인적사항 표시 패턴</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">학생/직원 관리</p>
          <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded text-xs font-mono">
            <div>{`<SearchSidebar context="students">`}</div>
            <div className="ml-2">{`<PersonDetailPanel />`}</div>
            <div>{`</SearchSidebar>`}</div>
          </div>
          <ul className="text-xs mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
            <li>• 필터 숨김 (showFilters: false)</li>
            <li>• 검색 후 선택 시 상세 정보 표시</li>
            <li>• 인적사항 + 빠른 액션 버튼</li>
          </ul>
        </div>

        {/* 클래스 관리 패턴 */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-green-600">필터링 패턴</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">클래스/일정 관리</p>
          <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded text-xs font-mono">
            <div>{`<SearchSidebar context="classes">`}</div>
            <div className="ml-2 text-neutral-500">{`{/* children 없음 = 기본 필터 */}`}</div>
            <div>{`</SearchSidebar>`}</div>
          </div>
          <ul className="text-xs mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
            <li>• 필터 표시 (showFilters: true)</li>
            <li>• 메인 영역에 필터 결과 반영</li>
            <li>• 조건별 데이터 필터링</li>
          </ul>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">💡 구현 팁</h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• context prop으로 자동으로 제목, 플레이스홀더, 필터 표시 여부가 결정됩니다</li>
          <li>• children을 전달하면 커스텀 콘텐츠, 없으면 기본 검색/필터가 표시됩니다</li>
          <li>• 각 기능 구현 시 실제 요구사항에 맞춰 children 컴포넌트를 개발하세요</li>
        </ul>
      </div>
    </div>
  )
}