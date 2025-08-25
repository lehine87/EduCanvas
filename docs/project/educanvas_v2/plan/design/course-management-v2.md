# EduCanvas v2 과정 관리 설계 문서

## 📋 설계 개요

**설계 일자**: 2025-08-25  
**설계 버전**: v2.0 Course Management  
**설계 범위**: 통합 과정 및 패키지 관리 시스템  
**핵심 철학**: "패키지 빌더로 완성하는 맞춤형 교육과정"

## 🎯 설계 목표

### 핵심 목표
1. **패키지 빌더**: 드래그앤드롭으로 교육과정 구성
2. **가격 시뮬레이터**: 실시간 수익성 분석
3. **진도 관리**: 과목별 세부 커리큘럼 추적
4. **성과 분석**: 과정별 학습 효과 측정

## 🏗️ 레이아웃 구조

### 전체 구조 (Package Builder + Management)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 과정 관리 > [패키지] [과목] [커리큘럼] [+ 새 과정]       │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                     │
│ 사이드바     │ 메인 영역 (Package Builder)                        │
│ (카탈로그)   │                                                    │
│             │ [패키지 구성 뷰]                                    │
│ [과목 목록] │ ┌─────────────────────────────────────────────────┐│
│ 📚 수학     │ │           "종합 수학 패키지"                     ││
│  - 기초     │ │                                                 ││
│  - 심화     │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐           ││
│  - 특강     │ │ │  기초   │ │  심화   │ │  특강   │           ││
│             │ │ │  수학   │→│  수학   │→│  수학   │           ││
│ 📖 영어     │ │ │ 3개월   │ │ 6개월   │ │ 1개월   │           ││
│  - 문법     │ │ │ 30만원  │ │ 60만원  │ │ 15만원  │           ││
│  - 회화     │ │ └─────────┘ └─────────┘ └─────────┘           ││
│  - 독해     │ │                                                 ││
│             │ │ 총 10개월 과정 | 105만원 | 15% 할인 적용        ││
│ 💼 패키지   │ └─────────────────────────────────────────────────┘│
│  - 인기상품 │                                                     │
│  - 신규상품 │ [과목 상세 관리]                                    │
│  - 시즌특가 │ ┌─────────────────────────────────────────────────┐│
│             │ │ 📊 기초수학 | 👥 학생 15명 | 📈 만족도 4.2      ││
│ [가격정책]  │ │                                                 ││
│ ○ 기본     │ │ 진도: ████████░░ 80%  다음: 방정식 (3주차)      ││
│ ○ 할인     │ │                                                 ││
│ ○ 프로모션 │ │ 📚 교재: 개념원리 수학 1-1                      ││
│             │ │ 👨‍🏫 강사: 김선생님                             ││
│ [성과분석] │ │ 🎯 목표: 2학기 성적 20% 향상                   ││
│ ○ 수강현황 │ └─────────────────────────────────────────────────┘│
│ ○ 완주율   │                                                     │
│ ○ 만족도   │ [하단 패널 - 탭 구조]                               │
└─────────────┴───────────────────────────────────────────────────┘
```

## 🎴 핵심 컴포넌트 설계

### 1. 패키지 빌더 (Package Builder)

```tsx
interface PackageBuilder {
  // 빌딩 블록 (과목)
  buildingBlocks: {
    id: string
    name: string
    type: 'subject' | 'special' | 'exam-prep'
    
    // 기본 정보
    duration: {
      weeks: number
      sessionsPerWeek: number
      hoursPerSession: number
      totalHours: number
    }
    
    // 가격 정보
    pricing: {
      basePrice: number
      discountRules: DiscountRule[]
      seasonalPricing?: SeasonalPricing[]
    }
    
    // 선수 조건
    prerequisites: {
      required: string[]  // 필수 선수 과목
      recommended: string[]  // 권장 선수 과목
      
      // 레벨 체크
      minLevel: number
      entranceTest?: boolean
    }
    
    // 교육 내용
    curriculum: {
      chapters: Chapter[]
      objectives: LearningObjective[]
      materials: Material[]
      assessments: Assessment[]
    }
    
    // 운영 정보
    operations: {
      minStudents: number
      maxStudents: number
      instructorRequirements: InstructorRequirement[]
      roomRequirements: RoomRequirement[]
    }
  }[]
  
  // 패키지 구성
  packageComposition: {
    id: string
    name: string
    description: string
    category: string
    
    // 구성 요소
    components: {
      subject: BuildingBlock
      order: number
      required: boolean
      
      // 연결 관계
      dependencies: string[]  // 이전에 완료해야 할 과목들
      alternatives: string[]  // 대체 가능 과목들
    }[]
    
    // 패키지 속성
    properties: {
      totalDuration: number
      totalPrice: number
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      targetGrade: string[]
      
      // 할인 정책
      packageDiscount: {
        type: 'percentage' | 'fixed'
        value: number
        conditions: DiscountCondition[]
      }
    }
    
    // 유연성 옵션
    flexibility: {
      allowPartialEnrollment: boolean
      allowSkipping: boolean
      allowReordering: boolean
      
      // 커스터마이징
      customization: {
        selectiveSubjects: string[]  // 선택 과목
        optionalExtensions: string[] // 추가 선택 가능
      }
    }
  }
  
  // 시각적 편집
  visualEditor: {
    canvas: {
      width: number
      height: number
      zoom: number
      grid: boolean
    }
    
    // 드래그앤드롭
    dragAndDrop: {
      source: 'catalog' | 'canvas'
      target: DropZone
      
      validation: {
        canDrop: boolean
        conflicts: string[]
        suggestions: string[]
      }
    }
    
    // 연결선
    connections: {
      from: string
      to: string
      type: 'prerequisite' | 'sequence' | 'optional'
      style: ConnectionStyle
    }[]
  }
}
```

### 2. 커리큘럼 관리

```tsx
interface CurriculumManagement {
  // 과목별 커리큘럼
  subjectCurriculum: {
    subjectId: string
    name: string
    
    // 학습 목표
    objectives: {
      primary: LearningObjective[]
      secondary: LearningObjective[]
      
      // 역량 매핑
      competencies: {
        cognitive: CompetencyLevel[]
        skill: CompetencyLevel[]
        attitude: CompetencyLevel[]
      }
    }
    
    // 단원 구조
    units: {
      id: string
      title: string
      order: number
      estimatedHours: number
      
      // 세부 내용
      lessons: {
        id: string
        title: string
        type: 'lecture' | 'practice' | 'lab' | 'discussion'
        duration: number
        
        // 학습 자료
        materials: {
          type: 'video' | 'document' | 'exercise' | 'quiz'
          title: string
          url?: string
          required: boolean
        }[]
        
        // 평가
        assessment: {
          type: 'quiz' | 'assignment' | 'project' | 'exam'
          weight: number
          passingScore: number
        }
      }[]
      
      // 단원 평가
      unitAssessment: {
        midtermTest?: Assessment
        finalTest: Assessment
        practicalTest?: Assessment
      }
    }[]
    
    // 진도 추적
    progressTracking: {
      // 전체 진도
      overall: {
        completed: number
        total: number
        percentage: number
      }
      
      // 학생별 진도
      byStudent: {
        studentId: string
        progress: {
          unitId: string
          lessonId: string
          status: 'not-started' | 'in-progress' | 'completed' | 'mastered'
          completedDate?: Date
          score?: number
        }[]
        
        // 개별 분석
        analysis: {
          strengths: string[]
          weaknesses: string[]
          recommendations: string[]
        }
      }[]
    }
  }
  
  // 맞춤형 학습 경로
  personalizedPath: {
    studentId: string
    
    // 학습 스타일 분석
    learningStyle: {
      visual: number
      auditory: number
      kinesthetic: number
      
      // 선호도
      preferences: {
        pacePreference: 'slow' | 'normal' | 'fast'
        difficultyPreference: 'gradual' | 'challenging'
        interactionPreference: 'individual' | 'group'
      }
    }
    
    // 적응형 경로
    adaptivePath: {
      recommendedSequence: string[]
      alternativeSequences: string[][]
      
      // 동적 조정
      adjustments: {
        skipRecommendations: string[]
        additionalPractice: string[]
        reviewSuggestions: string[]
      }
    }
  }
}
```

### 3. 가격 시뮬레이터

```tsx
interface PricingSimulator {
  // 기본 가격 구조
  basePricing: {
    costStructure: {
      // 고정비용
      fixedCosts: {
        instructorSalary: number
        roomRental: number
        materials: number
        overhead: number
      }
      
      // 변동비용
      variableCosts: {
        perStudentMaterial: number
        perStudentFee: number
      }
    }
    
    // 수익 목표
    profitTargets: {
      marginPercentage: number
      breakEvenStudents: number
      targetRevenue: number
    }
  }
  
  // 가격 전략
  pricingStrategies: {
    // 기본 가격
    standard: {
      price: number
      rationale: string
    }
    
    // 차별 가격
    tiered: {
      basic: {
        features: string[]
        price: number
      }
      
      premium: {
        features: string[]
        price: number
        additionalValue: string[]
      }
      
      vip: {
        features: string[]
        price: number
        exclusiveBenefits: string[]
      }
    }
    
    // 동적 가격
    dynamic: {
      demandBased: {
        lowDemand: number
        normalDemand: number
        highDemand: number
      }
      
      timeBased: {
        earlyBird: number
        regular: number
        lastMinute: number
      }
      
      volumeBased: {
        single: number
        package: number
        familyPlan: number
      }
    }
  }
  
  // 시뮬레이션
  simulation: {
    scenarios: {
      name: string
      parameters: {
        studentCount: number
        price: number
        discountRate: number
        seasonality: number
      }
      
      results: {
        revenue: number
        costs: number
        profit: number
        margin: number
        
        // 민감도 분석
        sensitivity: {
          priceElasticity: number
          demandForecast: number
          riskAssessment: string
        }
      }
    }[]
    
    // 최적화 제안
    optimization: {
      recommendedPrice: number
      reasoning: string[]
      expectedOutcome: {
        revenue: number
        enrollments: number
        satisfaction: number
      }
    }
  }
  
  // 경쟁 분석
  competitiveAnalysis: {
    competitors: {
      name: string
      similarCourses: {
        course: string
        price: number
        features: string[]
        studentReviews: number
      }[]
    }[]
    
    // 포지셔닝
    positioning: {
      pricePosition: 'premium' | 'competitive' | 'value'
      valueProposition: string[]
      differentiators: string[]
    }
  }
}
```

### 4. 성과 분석 대시보드

```tsx
interface CoursePerformanceDashboard {
  // 과정별 성과
  coursePerformance: {
    courseId: string
    name: string
    
    // 핵심 지표
    metrics: {
      // 등록 지표
      enrollment: {
        total: number
        active: number
        completed: number
        dropped: number
        
        // 트렌드
        trend: {
          weekly: number[]
          monthly: number[]
          seasonal: SeasonalPattern
        }
      }
      
      // 완수율
      completion: {
        rate: number
        byUnit: { [unitId: string]: number }
        averageTime: number  // 완수까지 평균 시간
        
        // 예측
        predictedCompletion: {
          currentCohort: number
          confidence: number
        }
      }
      
      // 학습 성과
      learningOutcomes: {
        averageScore: number
        passRate: number
        masteryRate: number  // 80% 이상 점수 비율
        
        // 목표 달성률
        objectiveAchievement: {
          [objectiveId: string]: number
        }
      }
      
      // 만족도
      satisfaction: {
        overall: number
        byCategory: {
          content: number
          instruction: number
          materials: number
          support: number
        }
        
        // NPS
        npsScore: number
        testimonials: Testimonial[]
      }
    }
    
    // 분석 인사이트
    insights: {
      strengths: string[]
      improvements: string[]
      
      // 상관관계 분석
      correlations: {
        attendanceVsPerformance: number
        engagementVsSatisfaction: number
        priorKnowledgeVsSuccess: number
      }
      
      // 예측 분석
      predictions: {
        nextCohortSize: number
        expectedSatisfaction: number
        profitabilityForecast: number
      }
    }
  }[]
  
  // 비교 분석
  comparativeAnalysis: {
    // 과정 간 비교
    courseComparison: {
      metrics: string[]
      courses: {
        courseId: string
        values: number[]
        rank: number
      }[]
    }
    
    // 시기별 비교
    periodComparison: {
      current: Period
      previous: Period
      changes: ChangeAnalysis[]
    }
    
    // 강사별 비교
    instructorComparison: {
      instructorId: string
      courses: string[]
      averageMetrics: {
        satisfaction: number
        completion: number
        performance: number
      }
    }[]
  }
  
  // 개선 제안
  recommendations: {
    // 즉시 개선
    immediate: {
      priority: 'high' | 'medium' | 'low'
      category: 'content' | 'delivery' | 'assessment' | 'support'
      description: string
      expectedImpact: string
      effort: 'low' | 'medium' | 'high'
    }[]
    
    // 장기 개선
    longTerm: {
      strategic: StrategicRecommendation[]
      investment: InvestmentRecommendation[]
      innovation: InnovationOpportunity[]
    }
  }
}
```

### 5. 과정 템플릿 시스템

```tsx
interface CourseTemplateSystem {
  // 템플릿 카테고리
  categories: {
    id: string
    name: string
    description: string
    
    // 템플릿 목록
    templates: {
      id: string
      name: string
      description: string
      tags: string[]
      
      // 템플릿 구조
      structure: {
        duration: number
        sessions: number
        difficulty: string
        targetAudience: string[]
      }
      
      // 사전 구성된 내용
      prebuiltContent: {
        curriculum: CurriculumTemplate
        assessments: AssessmentTemplate[]
        materials: MaterialTemplate[]
        schedule: ScheduleTemplate
      }
      
      // 커스터마이징 옵션
      customization: {
        modifiable: string[]  // 수정 가능한 부분
        optional: string[]    // 선택적 구성요소
        extensible: string[]  // 확장 가능한 부분
      }
      
      // 성공 사례
      successMetrics: {
        averageCompletion: number
        averageSatisfaction: number
        typicalEnrollment: number
        successStories: SuccessStory[]
      }
    }[]
  }[]
  
  // 템플릿 적용
  templateApplication: {
    selectedTemplate: CourseTemplate
    
    // 커스터마이징 단계
    customizationSteps: {
      // 1단계: 기본 정보
      basicInfo: {
        courseName: string
        instructor: string
        startDate: Date
        targetStudents: number
      }
      
      // 2단계: 내용 조정
      contentAdjustment: {
        includedUnits: string[]
        excludedUnits: string[]
        modifiedUnits: {
          unitId: string
          changes: UnitModification[]
        }[]
        additionalUnits: Unit[]
      }
      
      // 3단계: 일정 설정
      scheduleSetup: {
        frequency: number
        duration: number
        preferredTimes: TimeSlot[]
        holidays: Date[]
      }
      
      // 4단계: 가격 설정
      pricingSetup: {
        strategy: PricingStrategy
        basePrice: number
        discounts: DiscountRule[]
      }
    }
    
    // 미리보기
    preview: {
      generatedCourse: Course
      estimatedMetrics: EstimatedMetrics
      potentialIssues: Issue[]
    }
  }
  
  // 템플릿 관리
  templateManagement: {
    // 생성
    creation: {
      fromExisting: (courseId: string) => CourseTemplate
      fromScratch: (config: TemplateConfig) => CourseTemplate
    }
    
    // 공유
    sharing: {
      internal: boolean
      external: boolean
      marketplace: boolean
      
      // 권한 관리
      permissions: {
        view: string[]
        use: string[]
        modify: string[]
      }
    }
    
    // 버전 관리
    versioning: {
      versions: TemplateVersion[]
      changelog: ChangelogEntry[]
      
      // 업그레이드
      upgrade: {
        available: boolean
        changes: string[]
        compatibility: CompatibilityInfo
      }
    }
  }
}
```

## 🎨 주요 UI 컴포넌트

### PackageBuilderCanvas 컴포넌트

```tsx
const PackageBuilderCanvas = memo(({ 
  package: packageData,
  onUpdate,
  onValidate
}: PackageBuilderCanvasProps) => {
  const [draggedItem, setDraggedItem] = useState<BuildingBlock | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  
  const handleDrop = (event: DragEvent, position: Position) => {
    if (!draggedItem) return
    
    // 유효성 검사
    const validation = validatePlacement(draggedItem, position, packageData)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }
    
    // 패키지에 추가
    const newComponent = {
      ...draggedItem,
      position,
      id: generateId()
    }
    
    onUpdate({
      ...packageData,
      components: [...packageData.components, newComponent]
    })
    
    setDraggedItem(null)
  }
  
  const handleConnect = (fromId: string, toId: string, type: ConnectionType) => {
    const newConnection = {
      id: generateId(),
      from: fromId,
      to: toId,
      type
    }
    
    setConnections([...connections, newConnection])
    onUpdate({
      ...packageData,
      dependencies: [...packageData.dependencies, newConnection]
    })
  }
  
  return (
    <div 
      className="package-builder-canvas"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* 배경 그리드 */}
      <div className="canvas-grid" />
      
      {/* 구성 요소들 */}
      {packageData.components.map(component => (
        <DraggableComponent
          key={component.id}
          component={component}
          onMove={(newPosition) => updateComponentPosition(component.id, newPosition)}
          onConnect={(targetId, type) => handleConnect(component.id, targetId, type)}
          onRemove={() => removeComponent(component.id)}
        />
      ))}
      
      {/* 연결선들 */}
      <svg className="connections-overlay">
        {connections.map(connection => (
          <ConnectionLine
            key={connection.id}
            from={getComponentPosition(connection.from)}
            to={getComponentPosition(connection.to)}
            type={connection.type}
            onRemove={() => removeConnection(connection.id)}
          />
        ))}
      </svg>
      
      {/* 패키지 요약 */}
      <div className="package-summary">
        <div className="summary-item">
          <span>총 기간</span>
          <span>{calculateTotalDuration(packageData)} 주</span>
        </div>
        <div className="summary-item">
          <span>총 가격</span>
          <span>{formatCurrency(calculateTotalPrice(packageData))}</span>
        </div>
        <div className="summary-item">
          <span>할인가</span>
          <span className="text-green-600">
            {formatCurrency(calculateDiscountedPrice(packageData))}
          </span>
        </div>
      </div>
    </div>
  )
})
```

### PricingSimulator 컴포넌트

```tsx
const PricingSimulator = ({ course, onPriceUpdate }) => {
  const [scenario, setScenario] = useState<PricingScenario>('standard')
  const [parameters, setParameters] = useState({
    studentCount: 20,
    discountRate: 0,
    seasonalityFactor: 1
  })
  
  const simulation = useMemo(() => {
    return calculateProfitability({
      course,
      scenario,
      ...parameters
    })
  }, [course, scenario, parameters])
  
  return (
    <div className="pricing-simulator grid grid-cols-2 gap-6">
      {/* 시뮬레이션 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>시뮬레이션 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 시나리오 선택 */}
          <div>
            <Label>가격 전략</Label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">표준 가격</SelectItem>
                <SelectItem value="premium">프리미엄 가격</SelectItem>
                <SelectItem value="discount">할인 가격</SelectItem>
                <SelectItem value="competitive">경쟁 가격</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 파라미터 조정 */}
          <div>
            <Label>예상 학생 수: {parameters.studentCount}명</Label>
            <Slider
              value={[parameters.studentCount]}
              onValueChange={([value]) => 
                setParameters(prev => ({ ...prev, studentCount: value }))
              }
              min={5}
              max={50}
              step={1}
            />
          </div>
          
          <div>
            <Label>할인율: {parameters.discountRate * 100}%</Label>
            <Slider
              value={[parameters.discountRate]}
              onValueChange={([value]) => 
                setParameters(prev => ({ ...prev, discountRate: value }))
              }
              min={0}
              max={0.5}
              step={0.05}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 시뮬레이션 결과 */}
      <Card>
        <CardHeader>
          <CardTitle>수익성 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 핵심 지표 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="metric-card">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(simulation.revenue)}
                </div>
                <div className="text-sm text-gray-600">예상 수익</div>
              </div>
              
              <div className="metric-card">
                <div className="text-2xl font-bold">
                  {simulation.margin.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">수익률</div>
              </div>
            </div>
            
            {/* 손익분기점 */}
            <div className="break-even-analysis">
              <div className="flex justify-between text-sm">
                <span>손익분기점</span>
                <span>{simulation.breakEvenPoint}명</span>
              </div>
              <Progress 
                value={(parameters.studentCount / simulation.breakEvenPoint) * 100} 
                className="mt-1"
              />
            </div>
            
            {/* 위험도 평가 */}
            <Alert variant={simulation.risk.level === 'high' ? 'destructive' : 'default'}>
              <AlertDescription>
                위험도: {simulation.risk.level} - {simulation.risk.description}
              </AlertDescription>
            </Alert>
            
            {/* 추천 사항 */}
            <div className="recommendations">
              <h4 className="font-medium mb-2">추천 사항</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {simulation.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🔄 상태 관리

### Course Store

```typescript
interface CourseState {
  // 과정 데이터
  courses: {
    all: Course[]
    packages: Package[]
    templates: CourseTemplate[]
  }
  
  // 빌더 상태
  builder: {
    currentPackage: Package | null
    selectedComponents: string[]
    draggedItem: BuildingBlock | null
  }
  
  // 분석 데이터
  analytics: {
    performance: CoursePerformance[]
    pricing: PricingAnalysis
    trends: TrendData
  }
  
  // 액션
  actions: {
    // 과정 관리
    createCourse: (data: CreateCourseData) => Promise<void>
    updateCourse: (id: string, data: UpdateCourseData) => Promise<void>
    deleteCourse: (id: string) => Promise<void>
    
    // 패키지 빌더
    createPackage: () => Package
    addToPackage: (packageId: string, component: BuildingBlock) => void
    removeFromPackage: (packageId: string, componentId: string) => void
    connectComponents: (from: string, to: string, type: ConnectionType) => void
    
    // 가격 시뮬레이션
    simulatePrice: (course: Course, scenario: PricingScenario) => PricingResult
    updatePricing: (courseId: string, pricing: PricingConfig) => Promise<void>
    
    // 템플릿
    createTemplate: (course: Course, config: TemplateConfig) => CourseTemplate
    applyTemplate: (templateId: string, customization: TemplateCustomization) => Course
    
    // 분석
    analyzePerformance: (courseId: string, period: DateRange) => Promise<CoursePerformance>
    generateReport: (courses: string[], format: ReportFormat) => Promise<void>
  }
}
```

## 📊 성공 지표

1. **패키지 구성 효율성**: 기존 대비 70% 시간 단축
2. **수익성 예측 정확도**: 90% 이상
3. **과정 완주율**: 85% 이상 달성
4. **고객 만족도**: 4.6/5.0
5. **템플릿 재사용률**: 60% 이상

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\ub300\uc2dc\ubcf4\ub4dc \uc124\uacc4 \ubb38\uc11c \uc791\uc131", "activeForm": "\ub300\uc2dc\ubcf4\ub4dc \uc124\uacc4 \ubb38\uc11c\ub97c \uc791\uc131\ud558\ub294 \uc911", "status": "completed"}, {"content": "\uc218\uac15 \ub4f1\ub85d \uc124\uacc4 \ubb38\uc11c \uc791\uc131", "activeForm": "\uc218\uac15 \ub4f1\ub85d \uc124\uacc4 \ubb38\uc11c\ub97c \uc791\uc131\ud558\ub294 \uc911", "status": "completed"}, {"content": "\ud074\ub798\uc2a4 \uad00\ub9ac v2 \uc124\uacc4 \ubb38\uc11c \uc791\uc131", "activeForm": "\ud074\ub798\uc2a4 \uad00\ub9ac v2 \uc124\uacc4 \ubb38\uc11c\ub97c \uc791\uc131\ud558\ub294 \uc911", "status": "completed"}, {"content": "\uc9c1\uc6d0 \uad00\ub9ac v2 \uc124\uacc4 \ubb38\uc11c \uc791\uc131", "activeForm": "\uc9c1\uc6d0 \uad00\ub9ac v2 \uc124\uacc4 \ubb38\uc11c\ub97c \uc791\uc131\ud558\ub294 \uc911", "status": "completed"}, {"content": "\uc2dc\uac04\ud45c \uc124\uacc4 \ubb38\uc11c \uc791\uc131", "activeForm": "\uc2dc\uac04\ud45c \uc124\uacc4 \ubb38\uc11c\ub97c \uc791\uc131\ud558\ub294 \uc911", "status": "completed"}, {"content": "\ud1b5\uacc4 \ubc0f \ub9ac\ud3ec\ud2b8 \uc124\uacc4 \ubb38\uc11c \uc791\uc131", "activeForm": "\ud1b5\uacc4 \ubc0f \ub9ac\ud3ec\ud2b8 \uc124\uacc4 \ubb38\uc11c\ub97c \uc791\uc131\ud558\ub294 \uc911", "status": "completed"}, {"content": "\uacfc\uc815 \uad00\ub9ac v2 \uc124\uacc4 \ubb38\uc11c \uc791\uc131", "activeForm": "\uacfc\uc815 \uad00\ub9ac v2 \uc124\uacc4 \ubb38\uc11c\ub97c \uc791\uc131\ud558\ub294 \uc911", "status": "completed"}]