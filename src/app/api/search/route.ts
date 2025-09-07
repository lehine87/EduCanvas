import { NextRequest, NextResponse } from 'next/server'
import Fuse from 'fuse.js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SearchResult, SearchContext } from '@/lib/stores/searchStore'

// Mock data for testing (replace with actual database queries)
const mockData = {
  students: [
    {
      id: '1',
      name: '김민수',
      student_number: 'ST2024001',
      phone: '010-1234-5678',
      grade: '1학년',
      status: 'active',
      email: 'minsu.kim@example.com'
    },
    {
      id: '2',
      name: '이지은',
      student_number: 'ST2024002',
      phone: '010-2345-6789',
      grade: '2학년',
      status: 'active',
      email: 'jieun.lee@example.com'
    },
    {
      id: '3',
      name: '박서준',
      student_number: 'ST2024003',
      phone: '010-3456-7890',
      grade: '3학년',
      status: 'inactive',
      email: 'seojun.park@example.com'
    }
  ],
  classes: [
    {
      id: '1',
      name: '고등 수학 A반',
      instructor: '김선생',
      room: '101호',
      time: '월,수,금 14:00-16:00',
      students: 15
    },
    {
      id: '2',
      name: '중등 영어 B반',
      instructor: '이선생',
      room: '102호',
      time: '화,목 15:00-17:00',
      students: 12
    }
  ],
  staff: [
    {
      id: '1',
      name: '김선생',
      role: 'instructor',
      department: '수학과',
      phone: '010-9876-5432',
      email: 'teacher.kim@example.com'
    },
    {
      id: '2',
      name: '이선생',
      role: 'instructor',
      department: '영어과',
      phone: '010-8765-4321',
      email: 'teacher.lee@example.com'
    }
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, context = 'dashboard', filters = {}, limit = 20 } = body


    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // TODO: Replace with actual Supabase queries
    // const cookieStore = cookies()
    // const supabase = createServerClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    //   {
    //     cookies: {
    //       get(name: string) {
    //         return cookieStore.get(name)?.value
    //       },
    //     },
    //   }
    // )

    // Perform search based on context
    const results: SearchResult[] = []

    // Configure Fuse.js options
    const fuseOptions = {
      includeScore: true,
      threshold: 0.2, // 더 엄격한 임계값으로 정확도 향상 (0.0 = 완전일치, 1.0 = 모든것매치)
      ignoreLocation: false, // 문자열 위치 고려하여 정확도 향상
      findAllMatches: false, // 첫 번째 매치만 찾아서 성능 향상
      minMatchCharLength: 2, // 최소 2글자 이상 매치
      distance: 50, // 매치 거리 제한
      keys: [
        { name: 'name', weight: 0.7 }, // 이름에 가장 높은 가중치
        { name: 'student_number', weight: 0.6 },
        { name: 'phone', weight: 0.5 },
        { name: 'email', weight: 0.3 },
        { name: 'instructor', weight: 0.7 },
        { name: 'department', weight: 0.4 },
        { name: 'role', weight: 0.2 }
      ]
    }

    // Apply filters to data
    interface FilterableItem {
      status?: string
      grade?: string
      role?: string
      department?: string
      time?: string
      room?: string
      [key: string]: unknown
    }
    
    const applyFilters = (data: FilterableItem[], type: string) => {
      const filtered = data.filter(item => {
        // Status filter
        if (filters.status && filters.status.length > 0) {
          if (!filters.status.includes(item.status)) return false
        }
        
        // Grade filter (students only)
        if (type === 'students' && filters.grade && filters.grade.length > 0) {
          // "1학년", "2학년" 등에서 숫자 추출하여 비교
          const gradeNumber = item.grade?.match(/\d+/)?.[0]
          if (!gradeNumber || !filters.grade.includes(gradeNumber)) return false
        }
        
        // Role filter (staff only)
        if (type === 'staff' && filters.role && filters.role.length > 0) {
          if (!filters.role.includes(item.role)) return false
        }
        
        // Department filter (staff only) - 실제 부서명으로 직접 비교
        if (type === 'staff' && filters.department && filters.department.length > 0) {
          // 선택된 부서명이 실제 부서명에 포함되는지 확인 (부분 일치 허용)
          const hasMatchingDept = filters.department.some((dept: string) => 
            item.department && item.department.includes(dept)
          )
          if (!hasMatchingDept) return false
        }
        
        // Day of week filter (classes only)
        if (type === 'classes' && filters.dayOfWeek && filters.dayOfWeek.length > 0) {
          const dayMap: Record<string, string> = {
            'mon': '월',
            'tue': '화', 
            'wed': '수',
            'thu': '목',
            'fri': '금',
            'sat': '토',
            'sun': '일'
          }
          const selectedDays = filters.dayOfWeek.map((d: string) => dayMap[d] || d)
          const hasMatchingDay = selectedDays.some((day: string) => item.time && item.time.includes(day))
          if (!hasMatchingDay) return false
        }
        
        // Room filter (classes only) - 실제 강의실 이름으로 직접 비교
        if (type === 'classes' && filters.room && filters.room.length > 0) {
          // 선택된 강의실 중 하나라도 일치하면 통과
          if (!filters.room.includes(item.room)) return false
        }
        
        return true
      })
      return filtered
    }

    // Search students
    if (context === 'dashboard' || context === 'students') {
      const filteredStudents = applyFilters(mockData.students, 'students')
      const fuse = new Fuse(filteredStudents, fuseOptions)
      const studentResults = fuse.search(query).slice(0, limit)
      
      studentResults.forEach(({ item, score = 1 }) => {
        // 매치 스코어가 너무 낮으면 제외 (0.8 = 80% 이상 일치)
        const matchScore = 1 - score
        if (matchScore >= 0.5) {
          results.push({
            id: String(item.id),
            type: 'student',
            title: String(item.name),
            subtitle: `${String(item.student_number || '')} • ${String(item.grade || '')}`,
            description: `전화: ${String(item.phone || '')}`,
            metadata: {
              status: String(item.status || ''),
              phone: String(item.phone || ''),
              email: String(item.email || '')
            },
            matchScore: matchScore,
            actions: [
              { label: '보기', onClick: () => {} },
              { label: '편집', onClick: () => {} }
            ]
          })
        }
      })
    }

    // Search classes
    if (context === 'dashboard' || context === 'classes') {
      const filteredClasses = applyFilters(mockData.classes, 'classes')
      const fuse = new Fuse(filteredClasses, fuseOptions)
      const classResults = fuse.search(query).slice(0, limit)
      
      classResults.forEach(({ item, score = 1 }) => {
        const matchScore = 1 - score
        if (matchScore >= 0.5) {
          results.push({
            id: String(item.id),
            type: 'class',
            title: String(item.name),
            subtitle: `${String(item.instructor || '')} • ${String(item.room || '')}`,
            description: `${String(item.time || '')} • 학생 ${item.students || 0}명`,
            metadata: {
              location: String(item.room || ''),
              time: String(item.time || '')
            },
            matchScore: matchScore,
            actions: [
              { label: '보기', onClick: () => {} },
              { label: '편집', onClick: () => {} }
            ]
          })
        }
      })
    }

    // Search staff
    if (context === 'dashboard' || context === 'staff') {
      const filteredStaff = applyFilters(mockData.staff, 'staff')
      const fuse = new Fuse(filteredStaff, fuseOptions)
      const staffResults = fuse.search(query).slice(0, limit)
      
      staffResults.forEach(({ item, score = 1 }) => {
        const matchScore = 1 - score
        if (matchScore >= 0.5) {
          results.push({
            id: String(item.id),
            type: 'staff',
            title: String(item.name),
            subtitle: `${String(item.department || '')} • ${item.role === 'instructor' ? '강사' : '직원'}`,
            description: `전화: ${String(item.phone || '')}`,
            metadata: {
              phone: String(item.phone || ''),
              email: String(item.email || ''),
              status: 'active'
            },
            matchScore: matchScore,
            actions: [
              { label: '보기', onClick: () => {} },
              { label: '편집', onClick: () => {} }
            ]
          })
        }
      })
    }

    // Sort by match score
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
      query,
      context
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}