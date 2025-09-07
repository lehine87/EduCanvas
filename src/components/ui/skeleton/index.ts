// 스켈레톤 컴포넌트 통합 export
export { 
  StudentInfoSkeleton, 
  StudentListItemSkeleton, 
  SearchEmptyState 
} from './StudentInfoSkeleton'

// 로딩 상태 타입 정의
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// 스켈레톤 관련 유틸리티
export const skeletonUtils = {
  // 스켈레톤 표시 지연 (너무 빠른 깜빡임 방지)
  minLoadingTime: 300,
  
  // 스켈레톤 개수 생성
  generateSkeletons: (count: number) => 
    Array.from({ length: count }, (_, i) => ({ id: `skeleton-${i}` }))
}