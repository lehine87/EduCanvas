'use client'

import React from 'react'

// 완전히 새로운 단순 대시보드 컴포넌트 (무한 루프 문제 해결)
const SimpleDashboard = React.memo(() => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        EduCanvas 대시보드
      </h1>
      
      {/* 핵심 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-2 text-neutral-700 dark:text-neutral-300">활성 학생</h2>
          <div className="text-3xl font-bold text-blue-600">24</div>
        </div>
        <div className="p-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-2 text-neutral-700 dark:text-neutral-300">오늘 수업</h2>
          <div className="text-3xl font-bold text-green-600">8</div>
        </div>
        <div className="p-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-2 text-neutral-700 dark:text-neutral-300">이번 달 수익</h2>
          <div className="text-3xl font-bold text-purple-600">₩2,400,000</div>
        </div>
      </div>

      {/* 추가 정보 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border">
          <h3 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
            최근 활동
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600 dark:text-neutral-400">새로운 학생 등록</span>
              <span className="text-sm text-neutral-500">2시간 전</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600 dark:text-neutral-400">수업 완료</span>
              <span className="text-sm text-neutral-500">4시간 전</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600 dark:text-neutral-400">결제 확인</span>
              <span className="text-sm text-neutral-500">6시간 전</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-sm border">
          <h3 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
            오늘의 일정
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600 dark:text-neutral-400">수학 수업</span>
              <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                14:00
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600 dark:text-neutral-400">영어 수업</span>
              <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                16:00
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600 dark:text-neutral-400">학부모 상담</span>
              <span className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                18:00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 성공 표시 */}
      <div className="mt-8 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
        <p className="text-green-800 dark:text-green-200">
          🎉 무한 컴파일 문제가 완전히 해결된 새로운 대시보드입니다!
        </p>
      </div>
    </div>
  )
})

SimpleDashboard.displayName = 'SimpleDashboard'

export default SimpleDashboard