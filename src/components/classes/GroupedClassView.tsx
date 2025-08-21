'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { ClassWithRelations } from '@/store/classesStore'
import { ClassCard } from './ClassCard'
import { ClassListItem } from './ClassListItem'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  UserIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

type Class = Database['public']['Tables']['classes']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

interface GroupedClassViewProps {
  classes: ClassWithRelations[]
  groupBy: 'instructor' | 'subject' | 'grade'
  subGroupBy: 'none' | 'instructor' | 'subject' | 'grade'
  viewMode: 'list' | 'cards'
  selectionMode: boolean
  onClassClick: (classData: ClassWithRelations) => void
  onClassSelect?: (classId: string) => void
  selectedClasses?: string[]
  loading?: boolean
  onCreateClass?: () => void
}

interface GroupData {
  id: string
  label: string
  count: number
  studentCount: number
  classes: ClassWithRelations[]
  subGroups?: Record<string, SubGroupData>
  metadata?: {
    avatar?: string
    color?: string
    description?: string
    email?: string
  }
}

interface SubGroupData {
  id: string
  label: string
  count: number
  studentCount: number
  classes: ClassWithRelations[]
  metadata?: {
    avatar?: string
    color?: string
    description?: string
  }
}

export function GroupedClassView({
  classes,
  groupBy,
  subGroupBy,
  viewMode,
  selectionMode,
  onClassClick,
  onClassSelect,
  selectedClasses = [],
  loading = false,
  onCreateClass
}: GroupedClassViewProps) {
  // 그룹별 접기/펼치기 상태
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // 그룹 키와 메타데이터를 가져오는 헬퍼 함수
  const getGroupInfo = (cls: ClassWithRelations, criterion: 'instructor' | 'subject' | 'grade') => {
    switch (criterion) {
      case 'instructor':
        if (cls.instructor) {
          return {
            key: cls.instructor.id,
            label: cls.instructor.name || '이름 없음',
            metadata: {
              email: cls.instructor.email || undefined,
              avatar: cls.instructor.name?.charAt(0) || '?',
              color: 'brand'
            }
          }
        } else {
          return {
            key: 'unassigned',
            label: '미배정',
            metadata: {
              avatar: '?',
              color: 'gray'
            }
          }
        }
      case 'subject':
        return {
          key: cls.subject || 'none',
          label: cls.subject || '과목 없음',
          metadata: {
            avatar: '📚',
            color: 'blue'
          }
        }
      case 'grade':
        return {
          key: cls.grade || 'none',
          label: cls.grade || '학년 없음',
          metadata: {
            avatar: '🎓',
            color: 'green'
          }
        }
    }
  }

  // 그룹핑 로직
  const groupedData = useMemo(() => {
    const groups: Record<string, GroupData> = {}

    classes.forEach(cls => {
      const groupInfo = getGroupInfo(cls, groupBy)
      
      if (!groups[groupInfo.key]) {
        groups[groupInfo.key] = {
          id: groupInfo.key,
          label: groupInfo.label,
          count: 0,
          studentCount: 0,
          classes: [],
          subGroups: {},
          metadata: groupInfo.metadata
        }
      }

      const group = groups[groupInfo.key]
      if (group) {
        // 서브그룹이 설정된 경우
        if (subGroupBy !== 'none' && subGroupBy !== groupBy) {
          const subGroupInfo = getGroupInfo(cls, subGroupBy)
          
          if (!group.subGroups![subGroupInfo.key]) {
            group.subGroups![subGroupInfo.key] = {
              id: subGroupInfo.key,
              label: subGroupInfo.label,
              count: 0,
              studentCount: 0,
              classes: [],
              metadata: subGroupInfo.metadata
            }
          }
          
          const subGroup = group.subGroups![subGroupInfo.key]
          if (subGroup) {
            subGroup.classes.push(cls)
            subGroup.count++
            subGroup.studentCount += cls.student_count || 0
          }
        } else {
          // 서브그룹이 없는 경우 메인 그룹에 직접 추가
          group.classes.push(cls)
        }
        
        group.count++
        group.studentCount += cls.student_count || 0
      }
    })

    // 그룹 정렬 (이름순)
    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.id === 'unassigned' || a.id === 'none') return 1
      if (b.id === 'unassigned' || b.id === 'none') return -1
      return a.label.localeCompare(b.label, 'ko')
    })
    
    // 각 그룹 내 클래스와 서브그룹 정렬
    sortedGroups.forEach(group => {
      // 메인 그룹 클래스 정렬
      group.classes.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      
      // 서브그룹 정렬
      if (group.subGroups) {
        const sortedSubGroups: Record<string, SubGroupData> = {}
        Object.values(group.subGroups)
          .sort((a, b) => {
            if (a.id === 'unassigned' || a.id === 'none') return 1
            if (b.id === 'unassigned' || b.id === 'none') return -1
            return a.label.localeCompare(b.label, 'ko')
          })
          .forEach(subGroup => {
            // 서브그룹 내 클래스 정렬
            subGroup.classes.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
            sortedSubGroups[subGroup.id] = subGroup
          })
        group.subGroups = sortedSubGroups
      }
    })
    
    return sortedGroups
  }, [classes, groupBy, subGroupBy])

  // 그룹 토글
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  // 그룹별 아이콘 렌더링
  const renderGroupIcon = (group: GroupData) => {
    switch (groupBy) {
      case 'instructor':
        return (
          <div 
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              group.metadata?.color === 'brand' ? "bg-brand-100" : "bg-gray-100"
            )}
          >
            {group.metadata?.avatar && group.metadata.avatar.length === 1 ? (
              <span className={cn(
                "text-sm font-semibold",
                group.metadata?.color === 'brand' ? "text-brand-600" : "text-gray-600"
              )}>
                {group.metadata?.avatar || '?'}
              </span>
            ) : (
              <UserIcon className={cn(
                "w-5 h-5",
                group.metadata?.color === 'brand' ? "text-brand-600" : "text-gray-600"
              )} />
            )}
          </div>
        )
      
      case 'subject':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpenIcon className="w-5 h-5 text-blue-600" />
          </div>
        )
      
      case 'grade':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <AcademicCapIcon className="w-5 h-5 text-green-600" />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {groupedData.map((group) => {
        const isCollapsed = collapsedGroups.has(group.id)

        return (
          <div key={group.id} className="group-section">
            {/* 그룹 헤더 */}
            <div className="mb-4">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {isCollapsed ? (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                {renderGroupIcon(group)}
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{group.label}</h3>
                    {groupBy === 'instructor' && group.metadata?.email && (
                      <span className="text-sm text-gray-500">({group.metadata.email})</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {group.count}개 클래스 • {group.studentCount}명 학생
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">{group.count}</Badge>
                </div>
              </button>
            </div>

            {/* Separator */}
            {!isCollapsed && <Separator className="mb-4" />}

            {/* 클래스 목록 또는 서브그룹 */}
            {!isCollapsed && (
              <div className="pl-14">
                {/* 서브그룹이 있는 경우 */}
                {subGroupBy !== 'none' && group.subGroups && Object.keys(group.subGroups).length > 0 ? (
                  <div className="space-y-8">
                    {Object.values(group.subGroups).map((subGroup) => (
                      <div key={subGroup.id} className="space-y-4">
                        {/* 서브그룹 헤더 */}
                        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                          {subGroupBy === 'instructor' ? (
                            <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-brand-600">
                                {subGroup.metadata?.avatar || '?'}
                              </span>
                            </div>
                          ) : subGroupBy === 'subject' ? (
                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpenIcon className="w-3 h-3 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                              <AcademicCapIcon className="w-3 h-3 text-green-600" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-800">{subGroup.label}</h4>
                            <p className="text-xs text-gray-500">
                              {subGroup.count}개 클래스 • {subGroup.studentCount}명 학생
                            </p>
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                            {subGroup.count}
                          </Badge>
                        </div>
                        
                        {/* 서브그룹 클래스 목록 */}
                        {viewMode === 'list' ? (
                          <div className="space-y-2 pl-6">
                            {subGroup.classes.map((cls) => (
                              <ClassListItem
                                key={cls.id}
                                classData={cls}
                                onClick={selectionMode ? () => onClassSelect?.(cls.id) : () => onClassClick(cls)}
                                onSelect={selectionMode ? onClassSelect : undefined}
                                isSelected={selectedClasses.includes(cls.id)}
                                showSelection={selectionMode}
                                showActions={false}
                              />
                            ))}
                          </div>
                        ) : (
                          <ScrollArea className="w-full whitespace-nowrap pl-6">
                            <div className="flex gap-4 pt-2 pb-4">
                              {subGroup.classes.map((cls) => (
                                <div key={cls.id} className="w-[280px] flex-shrink-0">
                                  <ClassCard
                                    classData={cls}
                                    showActions={false}
                                    showSelection={selectionMode}
                                    isSelected={selectedClasses.includes(cls.id)}
                                    onSelect={selectionMode ? onClassSelect : undefined}
                                    onClick={selectionMode ? () => onClassSelect?.(cls.id) : () => onClassClick(cls)}
                                  />
                                </div>
                              ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 서브그룹이 없는 경우 기존 로직 */
                  viewMode === 'list' ? (
                    // 리스트 뷰
                    <div className="space-y-2">
                      {group.classes.map((cls) => (
                        <ClassListItem
                          key={cls.id}
                          classData={cls}
                          onClick={selectionMode ? () => onClassSelect?.(cls.id) : () => onClassClick(cls)}
                          onSelect={selectionMode ? onClassSelect : undefined}
                          isSelected={selectedClasses.includes(cls.id)}
                          showSelection={selectionMode}
                          showActions={false}
                        />
                      ))}
                    </div>
                  ) : (
                    // 카드 뷰 - 가로 스크롤
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-4 pt-2 pb-4">
                        {group.classes.map((cls) => (
                          <div key={cls.id} className="w-[280px] flex-shrink-0">
                            <ClassCard
                              classData={cls}
                              showActions={false}
                              showSelection={selectionMode}
                              isSelected={selectedClasses.includes(cls.id)}
                              onSelect={selectionMode ? onClassSelect : undefined}
                              onClick={selectionMode ? () => onClassSelect?.(cls.id) : () => onClassClick(cls)}
                            />
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* 로딩 상태 */}
      {loading && (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, groupIndex) => (
            <div key={groupIndex} className="space-y-4">
              {/* 그룹 헤더 스켈레톤 */}
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="w-8 h-6 bg-gray-200 rounded"></div>
              </div>
              
              <div className="h-px bg-gray-200"></div>
              
              {/* 클래스 카드 스켈레톤 */}
              <div className="pl-14">
                {viewMode === 'cards' ? (
                  <div className="flex gap-4">
                    {Array.from({ length: 3 }).map((_, cardIndex) => (
                      <div key={cardIndex} className="w-[280px] bg-white border rounded-xl p-4 animate-pulse">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-3 p-3 bg-white border rounded-lg animate-pulse">
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        <div className="w-1 h-12 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2 w-48"></div>
                          <div className="h-3 bg-gray-200 rounded w-64"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && groupedData.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            등록된 클래스가 없습니다
          </h3>
          <p className="text-gray-500 mb-6">
            첫 번째 클래스를 만들어 학생들을 관리해보세요
          </p>
          {onCreateClass && (
            <Button onClick={onCreateClass}>
              <PlusIcon className="w-4 h-4 mr-2" />
              새 클래스 만들기
            </Button>
          )}
        </div>
      )}
    </div>
  )
}