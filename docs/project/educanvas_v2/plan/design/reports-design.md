# EduCanvas v2 통계 및 리포트 설계 문서

## 📋 설계 개요

**설계 일자**: 2025-08-25  
**설계 버전**: v2.0 Analytics & Reports  
**설계 범위**: 통합 분석 및 보고서 시스템  
**핵심 철학**: "데이터로 말하는 스마트한 학원 운영"

## 🎯 설계 목표

### 핵심 목표
1. **실시간 인사이트**: 핵심 지표 실시간 모니터링
2. **커스터마이징 대시보드**: 사용자 맞춤 위젯 구성
3. **예측 분석**: AI 기반 트렌드 예측 및 경고
4. **자동 보고서**: 정기 보고서 자동 생성 및 배포

## 🏗️ 레이아웃 구조

### 전체 구조 (Dashboard + Builder)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: 통계 및 리포트 > [대시보드] [보고서] [설정] [내보내기]    │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                     │
│ 사이드바     │ 메인 영역 (Widget Dashboard)                       │
│ (위젯/필터)  │                                                    │
│             │ [Executive Dashboard]                               │
│ [위젯 팔레트]│ ┌─────────────┬─────────────┬─────────────────────┐│
│ 📊 차트류   │ │  📈 수익    │  👥 학생수  │  📚 출석률          ││
│  - 라인     │ │  월 500만원 │  1,247명   │     92.5%           ││
│  - 바       │ │  +12.5% ↗  │  +23 ↗    │  97% ⬆ 95% ⬇      ││
│  - 파이     │ └─────────────┴─────────────┴─────────────────────┘│
│  - 도넛     │ ┌─────────────────────────────────────────────────┐│
│             │ │           월별 수익 트렌드                       ││
│ 📋 데이터   │ │  500만 ┌─┐                                     ││
│  - 테이블   │ │        │ │    ┌─┐                               ││
│  - 리스트   │ │  400만 │ │    │ │  ┌─┐                         ││
│  - 카드     │ │        └─┘    │ │  │ │                         ││
│             │ │          1월   2월  3월  4월  5월  6월  7월     ││
│ 🎯 KPI      │ └─────────────────────────────────────────────────┘│
│  - 게이지   │ ┌─────────────┬─────────────┬─────────────────────┐│
│  - 스코어   │ │  상위 과목  │  활성 클래스│  신규 등록 (이번달)  ││
│  - 진도     │ │  1. 수학    │    35개     │     김철수 (수학)    ││
│             │ │  2. 영어    │    28개     │     이영희 (영어)    ││
│ 📅 기간설정 │ │  3. 과학    │    22개     │     박민수 (과학)    ││
│ ○ 오늘     │ └─────────────┴─────────────┴─────────────────────┘│
│ ○ 이번 주  │                                                     │
│ ○ 이번 달  │ [Report Builder] - 보고서 작성 모드                 │
│ ○ 분기     │ ┌─────────────────────────────────────────────────┐│
│ ○ 커스텀   │ │ 1. 데이터 선택  2. 시각화  3. 레이아웃  4. 생성 ││
└─────────────┴───────────────────────────────────────────────────┘
```

## 🎴 핵심 컴포넌트 설계

### 1. 위젯 시스템

```tsx
interface WidgetSystem {
  // 위젯 타입
  widgetTypes: {
    // 차트 위젯
    chart: {
      type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter'
      
      config: {
        dataSource: string
        dimensions: string[]
        measures: string[]
        filters: Filter[]
        
        // 차트 설정
        colors: string[]
        showLegend: boolean
        showAxis: boolean
        showDataLabels: boolean
        
        // 애니메이션
        animated: boolean
        duration: number
      }
    }
    
    // KPI 위젯
    kpi: {
      type: 'metric' | 'gauge' | 'progress' | 'comparison'
      
      config: {
        value: number
        target?: number
        previousValue?: number
        
        // 포맷팅
        format: 'number' | 'currency' | 'percentage'
        precision: number
        prefix?: string
        suffix?: string
        
        // 시각적 표시
        color: string
        trend: 'up' | 'down' | 'neutral'
        severity: 'success' | 'warning' | 'danger'
      }
    }
    
    // 테이블 위젯
    table: {
      config: {
        columns: TableColumn[]
        pagination: boolean
        sorting: boolean
        filtering: boolean
        
        // 스타일
        compact: boolean
        striped: boolean
        bordered: boolean
      }
    }
    
    // 지도 위젯
    map: {
      type: 'heatmap' | 'markers' | 'choropleth'
      
      config: {
        center: Coordinates
        zoom: number
        markers: MapMarker[]
        heatmapData: HeatmapPoint[]
      }
    }
  }
  
  // 위젯 레이아웃
  layout: {
    grid: {
      columns: number
      rows: number
      gap: number
    }
    
    widgets: {
      id: string
      type: WidgetType
      position: {
        x: number
        y: number
        width: number
        height: number
      }
      
      // 반응형
      responsive: {
        [breakpoint: string]: WidgetPosition
      }
    }[]
  }
  
  // 실시간 업데이트
  realtime: {
    enabled: boolean
    interval: number  // seconds
    lastUpdate: Date
    
    // 자동 새로고침
    autoRefresh: boolean
    refreshStrategy: 'incremental' | 'full'
  }
}
```

### 2. 보고서 빌더

```tsx
interface ReportBuilder {
  // 빌드 단계
  steps: {
    // 1단계: 데이터 선택
    dataSelection: {
      // 데이터 소스
      sources: {
        students: StudentDataSource
        classes: ClassDataSource
        attendance: AttendanceDataSource
        payments: PaymentDataSource
        staff: StaffDataSource
        custom: CustomDataSource[]
      }
      
      // 조인 설정
      joins: {
        type: 'inner' | 'left' | 'right' | 'full'
        on: JoinCondition[]
      }[]
      
      // 필터
      filters: {
        field: string
        operator: 'equals' | 'contains' | 'greater' | 'less' | 'between'
        value: any
        logic: 'and' | 'or'
      }[]
      
      // 집계
      aggregations: {
        field: string
        function: 'sum' | 'avg' | 'count' | 'min' | 'max'
        alias: string
      }[]
    }
    
    // 2단계: 시각화 선택
    visualization: {
      primaryChart: ChartConfig
      secondaryCharts?: ChartConfig[]
      
      // 레이아웃
      layout: 'single' | 'grid' | 'dashboard' | 'story'
      
      // 스타일
      theme: 'light' | 'dark' | 'corporate' | 'colorful'
      palette: string[]
    }
    
    // 3단계: 레이아웃 구성
    layout: {
      template: ReportTemplate
      
      // 섹션 구성
      sections: {
        id: string
        type: 'header' | 'summary' | 'chart' | 'table' | 'text'
        content: SectionContent
        position: number
        
        // 페이지 나누기
        pageBreak: boolean
      }[]
      
      // 페이지 설정
      page: {
        size: 'A4' | 'A3' | 'Letter'
        orientation: 'portrait' | 'landscape'
        margins: Margins
      }
    }
    
    // 4단계: 생성 및 배포
    generation: {
      format: 'pdf' | 'excel' | 'powerpoint' | 'html'
      
      // 자동화 설정
      schedule: {
        enabled: boolean
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
        time: string
        recipients: string[]
      }
      
      // 배포 옵션
      distribution: {
        email: boolean
        fileShare: boolean
        dashboard: boolean
      }
    }
  }
}
```

### 3. 분석 대시보드

```tsx
interface AnalyticsDashboard {
  // 핵심 지표
  keyMetrics: {
    // 재정 지표
    financial: {
      totalRevenue: {
        current: number
        target: number
        previousPeriod: number
        trend: 'up' | 'down' | 'stable'
      }
      
      averageRevenuePerStudent: number
      collectionRate: number
      outstanding: number
      
      // 예측
      forecast: {
        nextMonth: number
        confidence: number
      }
    }
    
    // 학생 지표
    students: {
      totalCount: number
      activeCount: number
      newEnrollments: number
      withdrawals: number
      
      // 분포
      byGrade: { [grade: string]: number }
      bySubject: { [subject: string]: number }
      
      // 만족도
      satisfactionScore: number
      npsScore: number
    }
    
    // 운영 지표
    operations: {
      classUtilization: number
      instructorUtilization: number
      roomUtilization: number
      
      // 효율성
      avgClassSize: number
      teacherToStudentRatio: number
      
      // 품질 지표
      attendanceRate: number
      retentionRate: number
      completionRate: number
    }
    
    // 직원 지표
    staff: {
      totalStaff: number
      activeStaff: number
      
      // 성과
      avgPerformanceScore: number
      trainingHours: number
      
      // 만족도
      employeeSatisfaction: number
      turnoverRate: number
    }
  }
  
  // 트렌드 분석
  trends: {
    // 시계열 데이터
    timeSeries: {
      revenue: TimeSeriesData
      enrollment: TimeSeriesData
      attendance: TimeSeriesData
      satisfaction: TimeSeriesData
    }
    
    // 계절성 분석
    seasonality: {
      patterns: SeasonalPattern[]
      predictions: SeasonalPrediction[]
    }
    
    // 이상 탐지
    anomalies: {
      detected: Anomaly[]
      threshold: number
      sensitivity: number
    }
  }
  
  // 비교 분석
  comparisons: {
    // 기간 비교
    periodComparison: {
      current: Period
      previous: Period
      changes: ChangeAnalysis[]
    }
    
    // 벤치마킹
    benchmarking: {
      internal: InternalBenchmark[]  // 부서간, 강사간
      external?: ExternalBenchmark[] // 업계 평균
    }
    
    // A/B 테스트
    experiments: {
      active: Experiment[]
      results: ExperimentResult[]
    }
  }
}
```

### 4. 예측 분석 시스템

```tsx
interface PredictiveAnalytics {
  // 예측 모델
  models: {
    // 등록 예측
    enrollment: {
      type: 'regression' | 'time-series' | 'ml'
      
      predictions: {
        nextMonth: number
        nextQuarter: number
        nextYear: number
        
        confidence: {
          lower: number
          upper: number
          probability: number
        }
      }
      
      factors: {
        seasonal: number
        marketing: number
        economic: number
        competitive: number
      }
    }
    
    // 이탈 예측
    churn: {
      studentsAtRisk: {
        student: Student
        riskScore: number
        factors: ChurnFactor[]
        recommendations: RetentionAction[]
      }[]
      
      // 예방 전략
      preventionStrategies: {
        intervention: string
        timing: string
        expectedImpact: number
      }[]
    }
    
    // 수익 예측
    revenue: {
      forecast: {
        monthly: number[]
        confidence: number
      }
      
      scenarios: {
        optimistic: number
        realistic: number
        pessimistic: number
      }
      
      // 영향 요인
      drivers: {
        enrollment: number
        pricing: number
        retention: number
        expansion: number
      }
    }
    
    // 리소스 최적화
    optimization: {
      // 클래스 배치 최적화
      classPlacement: {
        current: number  // 현재 효율성 점수
        optimized: number // 최적화 후 예상 점수
        
        recommendations: {
          action: string
          impact: number
          effort: 'low' | 'medium' | 'high'
        }[]
      }
      
      // 강사 배치 최적화
      instructorAllocation: {
        workloadBalance: number
        satisfactionImpact: number
        suggestions: AllocationSuggestion[]
      }
    }
  }
  
  // 알림 시스템
  alerts: {
    // 실시간 알림
    realtime: {
      type: 'threshold' | 'anomaly' | 'prediction'
      severity: 'info' | 'warning' | 'critical'
      message: string
      timestamp: Date
      
      // 액션
      suggestedActions: AlertAction[]
      autoActions?: AutoAction[]
    }[]
    
    // 정기 리포트
    scheduled: {
      frequency: 'daily' | 'weekly' | 'monthly'
      recipients: string[]
      template: ReportTemplate
      
      // 조건부 발송
      conditions: AlertCondition[]
    }[]
  }
}
```

### 5. 인터랙티브 차트 컴포넌트

```tsx
const InteractiveChart = memo(({ 
  data,
  type,
  config,
  onInteraction
}: InteractiveChartProps) => {
  const [selectedData, setSelectedData] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  
  // 차트별 렌더링
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {config.measures.map((measure, index) => (
              <Line
                key={measure}
                type="monotone"
                dataKey={measure}
                stroke={config.colors[index]}
                strokeWidth={2}
                dot={{ fill: config.colors[index], r: 4 }}
                activeDot={{ r: 6, onClick: handleDataPointClick }}
              />
            ))}
          </LineChart>
        )
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.measures.map((measure, index) => (
              <Bar
                key={measure}
                dataKey={measure}
                fill={config.colors[index]}
                onClick={handleBarClick}
              />
            ))}
          </BarChart>
        )
      
      // ... 다른 차트 타입들
    }
  }
  
  const handleDataPointClick = (data, index) => {
    setSelectedData({ data, index })
    onInteraction?.('click', { data, index })
  }
  
  const handleZoom = (direction) => {
    const newZoom = direction === 'in' 
      ? Math.min(zoomLevel * 1.2, 3) 
      : Math.max(zoomLevel / 1.2, 0.5)
    setZoomLevel(newZoom)
  }
  
  return (
    <div className="interactive-chart">
      {/* 차트 도구 모음 */}
      <div className="chart-toolbar flex justify-between items-center p-2">
        <div className="chart-title font-semibold">
          {config.title}
        </div>
        
        <div className="chart-controls flex gap-2">
          <Button size="sm" onClick={() => handleZoom('in')}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => handleZoom('out')}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => onInteraction?.('fullscreen')}>
            <Maximize className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => onInteraction?.('export')}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 차트 영역 */}
      <div className="chart-container" style={{ zoom: zoomLevel }}>
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {/* 선택된 데이터 정보 */}
      {selectedData && (
        <div className="selected-data-info p-2 bg-gray-50 rounded mt-2">
          <h4 className="font-medium">선택된 데이터</h4>
          <div className="text-sm text-gray-600">
            {JSON.stringify(selectedData.data, null, 2)}
          </div>
        </div>
      )}
    </div>
  )
})
```

## 🔄 상태 관리

### Analytics Store

```typescript
interface AnalyticsState {
  // 대시보드 상태
  dashboard: {
    layout: WidgetLayout
    widgets: Widget[]
    filters: GlobalFilter[]
    dateRange: DateRange
  }
  
  // 데이터 상태
  data: {
    metrics: KeyMetrics
    trends: TrendData
    predictions: PredictionData
    
    // 캐시
    cache: {
      [key: string]: {
        data: any
        timestamp: Date
        ttl: number
      }
    }
  }
  
  // 보고서 상태
  reports: {
    templates: ReportTemplate[]
    scheduled: ScheduledReport[]
    history: ReportHistory[]
  }
  
  // 액션
  actions: {
    // 대시보드
    addWidget: (widget: Widget) => void
    removeWidget: (widgetId: string) => void
    updateWidget: (widgetId: string, config: WidgetConfig) => void
    saveLayout: (layout: WidgetLayout) => Promise<void>
    
    // 데이터
    fetchMetrics: (dateRange: DateRange) => Promise<void>
    refreshData: (force?: boolean) => Promise<void>
    
    // 보고서
    createReport: (config: ReportConfig) => Promise<Report>
    scheduleReport: (schedule: ReportSchedule) => Promise<void>
    generateReport: (templateId: string) => Promise<void>
    
    // 예측
    runPrediction: (model: string, params: any) => Promise<Prediction>
    
    // 내보내기
    exportDashboard: (format: string) => Promise<void>
    exportData: (format: string, filters?: Filter[]) => Promise<void>
  }
}
```

## 📊 성공 지표

1. **인사이트 활용도**: 80% 이상의 결정에서 데이터 참조
2. **보고서 자동화**: 90% 이상 자동 생성
3. **예측 정확도**: 85% 이상 (월간 예측 기준)
4. **사용자 만족도**: 4.5/5.0
5. **의사결정 속도**: 기존 대비 50% 단축

---

**다음 단계**: 과정 관리 v2 설계 문서 작성