import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SearchResult } from '@/lib/stores/searchStore'
import type { Database } from '@/types/database'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, context = 'dashboard', filters = {}, limit = 20 } = body

    console.log('Search API called with:', { query, context, filters, limit })

    if (!query || query.length < 2) {
      console.log('Query too short:', query)
      return NextResponse.json({ results: [] })
    }

    // Supabase 클라이언트 생성
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 사용자 프로필 조회
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile?.tenant_id) {
      return NextResponse.json(
        { error: '테넌트 정보를 찾을 수 없습니다' },
        { status: 403 }
      )
    }

    const tenantId = userProfile.tenant_id
    const results: SearchResult[] = []

    // 병렬 쿼리 실행으로 성능 최적화
    const searchPromises: Promise<any>[] = []

    // Search students
    if (context === 'dashboard' || context === 'students') {
      const studentsPromise = (async () => {
        let studentsQuery = supabase
          .from('students')
          .select(`
            id, name, student_number, grade_level, phone, email, status,
            birth_date, gender, address, school_name, notes,
            parent_name_1, parent_phone_1, parent_name_2, parent_phone_2,
            emergency_contact, custom_fields, tags,
            created_at, updated_at
          `)
          .eq('tenant_id', tenantId)
          .or(`name.ilike.%${query}%,student_number.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        
        if (filters.status && filters.status.length > 0) {
          studentsQuery = studentsQuery.in('status', filters.status)
        }
        
        studentsQuery = studentsQuery.limit(Math.min(limit, 50))
        
        const { data: students, error: studentsError } = await studentsQuery
        
        if (!studentsError && students) {
          console.log('Found students:', students.length)
          return students.map((student) => ({
            id: student.id,
            type: 'student' as const,
            title: student.name,
            subtitle: `${student.student_number || ''} • ${student.grade_level || ''}학년`,
            description: `전화: ${student.phone || ''}`,
            metadata: {
              status: student.status || 'active',
              phone: student.phone || '',
              email: student.email || '',
              avatar: undefined,
              // 전체 학생 데이터 포함 (프리캐시용)
              fullStudent: student
            },
            actions: [
              { label: '보기', onClick: () => {} },
              { label: '편집', onClick: () => {} }
            ]
          }))
        }
        return []
      })()
      searchPromises.push(studentsPromise)
    }

    // Search classes
    if (context === 'dashboard' || context === 'classes') {
      const classesPromise = (async () => {
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select(`
            id, 
            name, 
            description, 
            classroom_id, 
            start_date, 
            end_date,
            instructor_id,
            tenant_memberships!classes_instructor_id_fkey(
              user_profiles!tenant_memberships_user_id_fkey(name)
            )
          `)
          .eq('tenant_id', tenantId)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(Math.min(limit, 50))
        
        if (!classesError && classes) {
          console.log('Found classes:', classes.length)
          return classes.map((classItem) => {
            const instructor = (classItem.tenant_memberships as any)?.user_profiles?.name || '강사 미정'
            
            return {
              id: classItem.id,
              type: 'class' as const,
              title: classItem.name,
              subtitle: `${instructor} • ${classItem.classroom_id || '강의실 미정'}`,
              description: `${classItem.start_date || ''} ~ ${classItem.end_date || ''}`,
              metadata: {
                location: classItem.classroom_id || '',
                time: `${classItem.start_date || ''} ~ ${classItem.end_date || ''}`,
                status: 'active'
              },
              actions: [
                { label: '보기', onClick: () => {} },
                { label: '편집', onClick: () => {} }
              ]
            }
          })
        }
        return []
      })()
      searchPromises.push(classesPromise)
    }

    // Search staff
    if (context === 'dashboard' || context === 'staff') {
      const staffPromise = (async () => {
        const { data: staffMembers, error: staffError } = await supabase
          .from('tenant_memberships')
          .select(`
            id,
            status,
            staff_info,
            user_profiles!tenant_memberships_user_id_fkey(name, email)
          `)
          .eq('tenant_id', tenantId)
          .limit(Math.min(limit, 50))
        
        if (!staffError && staffMembers) {
          console.log('Found staff members:', staffMembers.length)
          
          // 검색어가 포함된 직원만 필터링 (DB에서 직접 필터링이 어려우므로 최소한의 클라이언트 필터링)
          const filteredStaff = staffMembers.filter((member) => {
            const profile = member.user_profiles as any
            if (!profile?.name) return false
            
            const searchTerm = query.toLowerCase()
            return profile.name.toLowerCase().includes(searchTerm) || 
                   profile.email?.toLowerCase().includes(searchTerm)
          })
          
          return filteredStaff.map((member) => {
            const profile = member.user_profiles as any
            const staffInfo = member.staff_info as any || {}
            
            return {
              id: member.id,
              type: 'staff' as const,
              title: profile.name || '이름 없음',
              subtitle: `${staffInfo.department || '부서 미정'} • ${staffInfo.role || '직원'}`,
              description: `전화: ${staffInfo.phone || ''}`,
              metadata: {
                phone: staffInfo.phone || '',
                email: profile.email || '',
                status: member.status || 'active',
                avatar: undefined
              },
              actions: [
                { label: '보기', onClick: () => {} },
                { label: '편집', onClick: () => {} }
              ]
            }
          })
        }
        return []
      })()
      searchPromises.push(staffPromise)
    }

    // 모든 검색 쿼리를 병렬로 실행
    const searchResults = await Promise.all(searchPromises)
    
    // 결과 병합
    searchResults.forEach(resultArray => {
      results.push(...resultArray)
    })

    console.log('Final results:', results)

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