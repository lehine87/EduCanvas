# T-V2-029: 통합 검색 사이드바 시스템 구축

**태스크 ID**: T-V2-029  
**제목**: 통합 검색 사이드바 시스템 구축  
**상태**: TODO  
**우선순위**: P0 (최우선)  
**담당**: Frontend  
**예상 시간**: 2.0일 (16시간)  
**기한**: 2025-10-16  
**스프린트**: S-V2-08  

---

## 📋 태스크 개요

EduCanvas v2의 핵심 철학인 "검색하면서도 전체를 놓치지 않는다"를 구현하는 통합 검색 사이드바를 구축합니다. 모든 학생 관리 페이지에서 일관된 검색 경험을 제공하며, 실시간 검색과 필터링을 지원합니다.

### 목표
- 즉시 반응하는 실시간 검색 시스템
- 다차원 필터링 및 정렬 기능
- 검색 컨텍스트 유지 및 히스토리
- 접근성과 사용성 최적화

---

## 🎯 상세 요구사항

### 1. 검색 사이드바 아키텍처
```typescript
interface SearchSidebarProps {
  // 검색 대상 데이터
  searchConfig: {
    dataSource: 'students' | 'classes' | 'staff' | 'courses'
    searchableFields: Array<{
      key: string
      label: string
      type: 'text' | 'number' | 'date' | 'select' | 'multi-select'
      searchable: boolean
      filterable: boolean
      sortable: boolean
    }>
    defaultSort: { field: string; direction: 'asc' | 'desc' }
  }
  
  // 검색 상태
  searchState: {
    query: string                     // 텍스트 검색어
    filters: Record<string, any>      // 필터 조건들
    sort: { field: string; direction: 'asc' | 'desc' }
    page: number                      // 페이지네이션
    limit: number                     // 페이지 당 항목 수
  }
  
  // 검색 결과
  searchResults: {
    items: any[]                      // 검색된 항목들
    totalCount: number                // 전체 항목 수
    filteredCount: number             // 필터링된 항목 수
    isLoading: boolean                // 로딩 상태
    error?: string                    // 에러 메시지
  }
  
  // 이벤트 핸들러
  onSearchChange: (query: string) => void
  onFilterChange: (filters: Record<string, any>) => void
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' }) => void
  onItemSelect: (item: any) => void
  onBulkSelect: (items: any[]) => void
}
```

### 2. 메인 사이드바 컴포넌트
```tsx
export function UnifiedSearchSidebar({
  searchConfig,
  searchState,
  searchResults,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onItemSelect,
  onBulkSelect
}: SearchSidebarProps) {
  return (
    <aside className="w-80 h-full border-r bg-background flex flex-col">
      {/* 검색 헤더 */}
      <SearchHeader 
        query={searchState.query}
        onQueryChange={onSearchChange}
        resultCount={searchResults.filteredCount}
        totalCount={searchResults.totalCount}
      />
      
      {/* 필터 섹션 */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <QuickFilters 
            config={searchConfig}
            filters={searchState.filters}
            onFilterChange={onFilterChange}
          />
          
          <Separator />
          
          <AdvancedFilters
            config={searchConfig} 
            filters={searchState.filters}
            onFilterChange={onFilterChange}
          />
          
          <Separator />
          
          <SortOptions
            config={searchConfig}
            sort={searchState.sort}
            onSortChange={onSortChange}
          />
        </div>
      </ScrollArea>
      
      {/* 검색 결과 목록 */}
      <SearchResultsList
        results={searchResults}
        onItemSelect={onItemSelect}
        onBulkSelect={onBulkSelect}
      />
      
      {/* 하단 액션 영역 */}
      <SearchFooter
        selectedCount={getSelectedCount()}
        onClearAll={() => onFilterChange({})}
        onExport={() => exportResults()}
      />
    </aside>
  )
}
```

### 3. 핵심 서브 컴포넌트들
```tsx
// 검색 헤더
function SearchHeader({ 
  query, 
  onQueryChange, 
  resultCount, 
  totalCount 
}: SearchHeaderProps) {
  const [localQuery, setLocalQuery] = useState(query)
  const debouncedQuery = useDebounce(localQuery, 300)
  
  useEffect(() => {
    if (debouncedQuery !== query) {
      onQueryChange(debouncedQuery)
    }
  }, [debouncedQuery, query, onQueryChange])
  
  return (
    <div className="p-4 border-b">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="학생 이름, 학교, 연락처로 검색..."
          className="pl-9 pr-9"
        />
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => {
              setLocalQuery('')
              onQueryChange('')
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {resultCount.toLocaleString()}개 중 {totalCount.toLocaleString()}개
        </span>
        <SavedSearches />
      </div>
    </div>
  )
}

// 빠른 필터
function QuickFilters({ 
  config, 
  filters, 
  onFilterChange 
}: QuickFiltersProps) {
  const quickFilterConfigs = [
    { key: 'status', label: '상태', options: ['active', 'inactive', 'waiting'] },
    { key: 'grade', label: '학년', options: ['초1', '초2', '초3', '중1', '중2', '중3', '고1', '고2', '고3'] },
    { key: 'payment_status', label: '결제', options: ['paid', 'pending', 'overdue'] }
  ]
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">빠른 필터</h4>
      
      {quickFilterConfigs.map((filterConfig) => (
        <div key={filterConfig.key} className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {filterConfig.label}
          </Label>
          <div className="flex flex-wrap gap-1">
            {filterConfig.options.map((option) => (
              <Badge
                key={option}
                variant={filters[filterConfig.key] === option ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => {
                  const newFilters = { ...filters }
                  if (newFilters[filterConfig.key] === option) {
                    delete newFilters[filterConfig.key]
                  } else {
                    newFilters[filterConfig.key] = option
                  }
                  onFilterChange(newFilters)
                }}
              >
                {option}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 고급 필터
function AdvancedFilters({ 
  config, 
  filters, 
  onFilterChange 
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between p-0 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-medium">고급 필터</span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </Button>
      
      <Collapsible open={isExpanded}>
        <CollapsibleContent className="space-y-3">
          {/* 날짜 범위 필터 */}
          <DateRangeFilter
            label="등록일"
            value={filters.registrationDate}
            onChange={(value) => onFilterChange({ 
              ...filters, 
              registrationDate: value 
            })}
          />
          
          {/* 숫자 범위 필터 */}
          <NumberRangeFilter
            label="나이"
            min={6}
            max={20}
            value={filters.age}
            onChange={(value) => onFilterChange({ 
              ...filters, 
              age: value 
            })}
          />
          
          {/* 다중 선택 필터 */}
          <MultiSelectFilter
            label="수강 과목"
            options={['수학', '영어', '국어', '과학', '사회']}
            value={filters.subjects}
            onChange={(value) => onFilterChange({ 
              ...filters, 
              subjects: value 
            })}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// 검색 결과 목록
function SearchResultsList({ 
  results, 
  onItemSelect, 
  onBulkSelect 
}: SearchResultsListProps) {
  return (
    <div className="border-t bg-muted/30">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">검색 결과</h4>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <ScrollArea className="h-64">
        <div className="p-4 pt-0 space-y-2">
          {results.isLoading ? (
            <SearchResultSkeleton />
          ) : results.items.length === 0 ? (
            <EmptySearchResults />
          ) : (
            results.items.map((item) => (
              <SearchResultItem
                key={item.id}
                item={item}
                onSelect={onItemSelect}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
```

---

## 🔧 구현 단계

### Step 1: 기본 검색 인프라 (6시간)
- [ ] 통합 검색 훅 (`useUnifiedSearch`) 구현
- [ ] 디바운스 검색 로직 구현  
- [ ] 검색 상태 관리 (Zustand 스토어)
- [ ] 검색 API 인터페이스 설계

### Step 2: UI 컴포넌트 개발 (8시간)
- [ ] SearchHeader 컴포넌트 구현
- [ ] QuickFilters 배지 시스템 구현
- [ ] AdvancedFilters 아코디언 구현
- [ ] SearchResultsList 가상화 적용
- [ ] SearchFooter 액션 영역 구현

### Step 3: 필터링 시스템 (2시간)
- [ ] 다차원 필터 로직 구현
- [ ] 필터 조합 및 제거 처리
- [ ] 저장된 검색 조건 관리
- [ ] URL 상태 동기화

---

## 🎨 사용자 경험 설계

### 검색 플로우
```
1. 사용자가 검색어 입력
   ↓ (300ms 디바운스)
2. 실시간 검색 실행
   ↓
3. 결과 즉시 표시
   ↓
4. 필터 적용 시 추가 정제
   ↓
5. 선택된 항목 메인 영역에 표시
```

### 키보드 네비게이션
```typescript
const keyboardShortcuts = {
  '/': 'focus search input',
  'Escape': 'clear search or close sidebar',
  'ArrowUp/Down': 'navigate results',
  'Enter': 'select highlighted result',
  'Tab': 'move between filter sections',
  'Ctrl+F': 'focus search (alternative)',
  'Ctrl+K': 'command palette (future)'
}
```

### 반응형 동작
```scss
// 데스크톱: 고정 사이드바
@media (min-width: 1024px) {
  .search-sidebar {
    @apply w-80 relative;
  }
}

// 태블릿: 오버레이 사이드바  
@media (max-width: 1023px) {
  .search-sidebar {
    @apply fixed inset-y-0 left-0 w-80 z-50 transform -translate-x-full transition-transform;
  }
  
  .search-sidebar.open {
    @apply translate-x-0;
  }
}

// 모바일: 전체화면 검색
@media (max-width: 767px) {
  .search-sidebar {
    @apply inset-0 w-full;
  }
}
```

---

## 🧪 테스트 케이스

### 검색 기능 테스트
```typescript
describe('통합 검색 사이드바', () => {
  test('실시간 검색 동작', async () => {
    render(<UnifiedSearchSidebar {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText(/검색/i)
    
    // 검색어 입력
    await user.type(searchInput, '김학생')
    
    // 디바운스 대기
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('김학생')
    }, { timeout: 500 })
  })
  
  test('필터 적용 및 해제', async () => {
    render(<UnifiedSearchSidebar {...mockProps} />)
    
    // 상태 필터 클릭
    const activeFilter = screen.getByText('active')
    await user.click(activeFilter)
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      status: 'active'
    })
    
    // 같은 필터 다시 클릭하여 해제
    await user.click(activeFilter)
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({})
  })
  
  test('정렬 기능', async () => {
    render(<UnifiedSearchSidebar {...mockProps} />)
    
    const sortButton = screen.getByText('이름순')
    await user.click(sortButton)
    
    expect(mockOnSortChange).toHaveBeenCalledWith({
      field: 'name',
      direction: 'asc'
    })
  })
})
```

### 성능 테스트
```typescript
describe('검색 성능', () => {
  test('대용량 데이터 검색 응답시간', async () => {
    const largeDataset = generateMockStudents(10000)
    
    const start = performance.now()
    
    render(<UnifiedSearchSidebar 
      {...mockProps}
      searchResults={{ items: largeDataset, ... }}
    />)
    
    const end = performance.now()
    expect(end - start).toBeLessThan(300) // 300ms 이내
  })
  
  test('검색 디바운스 효율성', async () => {
    const mockSearch = jest.fn()
    
    render(<UnifiedSearchSidebar 
      {...mockProps}
      onSearchChange={mockSearch}
    />)
    
    const input = screen.getByPlaceholderText(/검색/i)
    
    // 빠른 연속 입력
    await user.type(input, 'test')
    
    // 300ms 후에만 한 번 호출되어야 함
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledTimes(1)
    }, { timeout: 500 })
  })
})
```

### 접근성 테스트
```typescript
describe('검색 사이드바 접근성', () => {
  test('키보드 네비게이션', async () => {
    render(<UnifiedSearchSidebar {...mockProps} />)
    
    // 검색 입력으로 포커스 이동
    await user.keyboard('/')
    expect(screen.getByPlaceholderText(/검색/i)).toHaveFocus()
    
    // ESC로 검색어 지우기
    await user.keyboard('{Escape}')
    expect(screen.getByPlaceholderText(/검색/i)).toHaveValue('')
  })
  
  test('스크린 리더 지원', () => {
    render(<UnifiedSearchSidebar {...mockProps} />)
    
    const searchInput = screen.getByPlaceholderText(/검색/i)
    expect(searchInput).toHaveAttribute('aria-label', '학생 검색')
    
    const resultCount = screen.getByText(/개 중/)
    expect(resultCount).toHaveAttribute('aria-live', 'polite')
  })
})
```

---

## 📊 완료 기준

### 기능 요구사항
- [ ] 실시간 텍스트 검색 (300ms 디바운스)
- [ ] 다차원 필터링 시스템 동작
- [ ] 정렬 및 페이지네이션 지원
- [ ] 검색 결과 가상화 적용
- [ ] 검색 상태 URL 동기화

### 성능 요구사항
- [ ] 검색 응답시간 < 300ms
- [ ] 10,000개 항목 필터링 < 500ms
- [ ] 사이드바 렌더링 < 200ms
- [ ] 메모리 사용량 < 30MB

### 사용성 요구사항
- [ ] 키보드만으로 완전한 조작 가능
- [ ] 모바일/태블릿 터치 최적화
- [ ] 검색 히스토리 및 자동완성
- [ ] 직관적인 필터 UI/UX

### 접근성 요구사항
- [ ] WCAG 2.1 AA 수준 준수
- [ ] 스크린 리더 완벽 지원
- [ ] 충분한 색상 대비비
- [ ] 포커스 인디케이터 명확

---

## 🚨 위험 요소 및 대응

### 높은 위험
**대용량 데이터 검색 성능**
- 위험도: 높음 | 영향: 사용자 경험 저하
- 대응: 서버사이드 검색, 인덱싱, 캐싱 적용

**복잡한 필터 조합**
- 위험도: 중간 | 영향: 예상치 못한 결과
- 대응: 필터 로직 단위 테스트, 사용자 피드백 수집

### 기술적 이슈
**메모리 누수**
- 위험도: 중간 | 영향: 브라우저 성능 저하
- 대응: 컴포넌트 언마운트 시 정리, 메모리 모니터링

**검색 상태 복잡성**
- 위험도: 낮음 | 영향: 상태 관리 복잡화
- 대응: 명확한 상태 구조, 적절한 캡슐화

---

## 🔗 관련 태스크

### 선행 태스크
- **T-V2-004**: 검색 사이드바 핵심 컴포넌트 개발
- **T-V2-028**: ClassFlow v2 통합 테스트 및 성능 검증

### 후속 태스크
- **T-V2-030**: 7개 탭 네비게이션 구조 구현
- **T-V2-031**: 실시간 검색 및 필터링 시스템
- **T-V2-032**: 학생 상태 시각화 개선

### 의존성 태스크
- **학생 관리 API**: 검색 및 필터링 백엔드 지원
- **Zustand 상태관리**: 검색 상태 글로벌 관리

---

## 📝 추가 고려사항

### 검색 analytics
```typescript
// 검색 패턴 분석을 위한 이벤트 로깅
const searchAnalytics = {
  trackSearch: (query: string, resultCount: number) => {
    analytics.track('search_performed', {
      query: query.length, // 개인정보 보호
      result_count: resultCount,
      timestamp: new Date()
    })
  },
  
  trackFilterUsage: (filterType: string, filterValue: any) => {
    analytics.track('filter_applied', {
      filter_type: filterType,
      has_value: !!filterValue
    })
  }
}
```

### 저장된 검색 조건
```typescript
interface SavedSearch {
  id: string
  name: string
  query: string
  filters: Record<string, any>
  sort: { field: string; direction: 'asc' | 'desc' }
  createdAt: Date
  lastUsed?: Date
}

const useSavedSearches = () => {
  // 로컬스토리지 기반 저장된 검색 관리
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  
  const saveCurrentSearch = (name: string, searchState: SearchState) => {
    // 현재 검색 상태를 저장
  }
  
  const loadSavedSearch = (searchId: string) => {
    // 저장된 검색 조건 적용
  }
  
  return { savedSearches, saveCurrentSearch, loadSavedSearch }
}
```

### 미래 확장성
- 전역 검색 (학생, 클래스, 직원 통합)
- AI 기반 스마트 검색 제안
- 검색 결과 내보내기 (CSV, PDF)
- 실시간 협업 검색 (다중 사용자)

---

**작성자**: Frontend Developer  
**작성일**: 2025-08-25  
**최종 수정**: 2025-08-25  
**다음 리뷰**: T-V2-030 태스크 시작 전