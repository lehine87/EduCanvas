// EduCanvas 유틸리티 타입 시스템 (완전 체계화)
// 고급 타입 조작, 헬퍼 타입, 조건부 타입, 메타프로그래밍 타입들
// @version v4.1
// @since 2025-08-12

// ================================================================
// 1. 기본 유틸리티 타입들 (TypeScript 내장 확장)
// ================================================================

/**
 * 딥 파셜 - 모든 중첩 속성을 선택적으로 만듦
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object 
    ? T[P] extends (...args: unknown[]) => unknown
      ? T[P]
      : DeepPartial<T[P]>
    : T[P]
}

/**
 * 딥 리드온리 - 모든 중첩 속성을 읽기 전용으로 만듦
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends (...args: unknown[]) => unknown
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P]
}

/**
 * 딥 Required - 모든 중첩 속성을 필수로 만듦
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object
    ? T[P] extends (...args: unknown[]) => unknown
      ? T[P]
      : DeepRequired<T[P]>
    : T[P]
}

/**
 * 딥 Nullable - 모든 속성을 null 허용으로 만듦
 */
export type DeepNullable<T> = {
  [P in keyof T]: T[P] extends object
    ? T[P] extends (...args: unknown[]) => unknown
      ? T[P]
      : DeepNullable<T[P]> | null
    : T[P] | null
}

/**
 * 딥 NonNullable - 모든 null/undefined를 제거
 */
export type DeepNonNullable<T> = {
  [P in keyof T]: T[P] extends object
    ? T[P] extends (...args: unknown[]) => unknown
      ? T[P]
      : DeepNonNullable<NonNullable<T[P]>>
    : NonNullable<T[P]>
}

// ================================================================
// 2. 키 기반 유틸리티 타입들
// ================================================================

/**
 * 특정 키들만 선택적으로 만들기
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * 특정 키들만 필수로 만들기
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * 특정 키들만 읽기 전용으로 만들기
 */
export type ReadonlyBy<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>

/**
 * 특정 키들만 변경 가능하게 만들기
 */
export type WritableBy<T, K extends keyof T> = Omit<T, K> & {
  -readonly [P in K]: T[P]
}

/**
 * 특정 키들만 null 허용으로 만들기
 */
export type NullableBy<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null
}

/**
 * 특정 키들의 null을 제거
 */
export type NonNullableBy<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: NonNullable<T[P]>
}

/**
 * 키 이름 변경
 */
export type RenameKeys<T, R extends Record<keyof T, PropertyKey>> = {
  [K in keyof T as K extends keyof R ? R[K] : K]: T[K]
}

/**
 * 키 접두사 추가
 */
export type PrefixKeys<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : K]: T[K]
}

/**
 * 키 접미사 추가
 */
export type SuffixKeys<T, S extends string> = {
  [K in keyof T as K extends string ? `${K}${S}` : K]: T[K]
}

// ================================================================
// 3. 값 기반 유틸리티 타입들
// ================================================================

/**
 * 특정 타입의 값만 가진 키들 추출
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

/**
 * 특정 타입의 값만 가진 속성들만 선택
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>

/**
 * 특정 타입의 값을 가진 속성들 제외
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>

/**
 * 함수 타입 속성들만 선택
 */
export type PickFunctions<T> = PickByType<T, (...args: unknown[]) => unknown>

/**
 * 함수가 아닌 속성들만 선택
 */
export type OmitFunctions<T> = OmitByType<T, (...args: unknown[]) => unknown>

/**
 * 선택적 속성들만 선택
 */
export type PickOptional<T> = Pick<T, {
  [K in keyof T]: T[K] extends Required<T>[K] ? never : K
}[keyof T]>

/**
 * 필수 속성들만 선택
 */
export type PickRequired<T> = Pick<T, {
  [K in keyof T]: T[K] extends Required<T>[K] ? K : never
}[keyof T]>

// ================================================================
// 4. 배열 및 튜플 유틸리티 타입들
// ================================================================

/**
 * 배열의 첫 번째 요소 타입
 */
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never

/**
 * 배열의 마지막 요소 타입
 */
export type Tail<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never

/**
 * 배열의 길이
 */
export type Length<T extends readonly unknown[]> = T['length']

/**
 * 배열을 튜플로 변환
 */
export type ArrayToTuple<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? [H, ...ArrayToTuple<R>]
  : []

/**
 * 튜플의 역순
 */
export type Reverse<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? [...Reverse<R>, H]
  : []

/**
 * 두 튜플 연결
 */
export type Concat<A extends readonly unknown[], B extends readonly unknown[]> = [...A, ...B]

/**
 * 튜플에서 특정 인덱스 요소 제거
 */
export type RemoveAt<T extends readonly unknown[], I extends number> = T extends readonly [
  ...infer Before,
  unknown,
  ...infer After
]
  ? Before['length'] extends I
    ? [...Before, ...After]
    : RemoveAt<T, I>
  : T

// ================================================================
// 5. 함수 유틸리티 타입들
// ================================================================

/**
 * 함수의 매개변수 타입들
 */
export type Args<F extends (...args: unknown[]) => unknown> = F extends (...args: infer A) => unknown ? A : never

/**
 * 함수의 반환 타입
 */
export type Return<F extends (...args: unknown[]) => unknown> = F extends (...args: unknown[]) => infer R ? R : never

/**
 * 첫 번째 매개변수 타입
 */
export type FirstArg<F extends (...args: unknown[]) => unknown> = F extends (first: infer A, ...rest: unknown[]) => unknown ? A : never

/**
 * 마지막 매개변수 타입
 */
export type LastArg<F extends (...args: unknown[]) => unknown> = F extends (...args: [...unknown[], infer L]) => unknown ? L : never

/**
 * 첫 번째 매개변수 제거
 */
export type DropFirstArg<F extends (...args: unknown[]) => unknown> = F extends (first: unknown, ...rest: infer R) => infer Ret
  ? (...args: R) => Ret
  : never

/**
 * 마지막 매개변수 제거
 */
export type DropLastArg<F extends (...args: unknown[]) => unknown> = F extends (...args: [...infer R, unknown]) => infer Ret
  ? (...args: R) => Ret
  : never

/**
 * 매개변수에 새로운 인수 추가
 */
export type PrependArg<F extends (...args: unknown[]) => unknown, A> = F extends (...args: infer Args) => infer Ret
  ? (first: A, ...args: Args) => Ret
  : never

/**
 * 비동기 함수로 변환
 */
export type Promisify<F extends (...args: unknown[]) => unknown> = F extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : never

/**
 * 동기 함수로 변환
 */
export type Unpromisify<F extends (...args: unknown[]) => Promise<unknown>> = F extends (...args: infer A) => Promise<infer R>
  ? (...args: A) => R
  : never

// ================================================================
// 6. 조건부 타입들
// ================================================================

/**
 * 두 타입이 같은지 확인
 */
export type IsEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false

/**
 * 타입이 never인지 확인
 */
export type IsNever<T> = [T] extends [never] ? true : false

/**
 * 타입이 unknown인지 확인
 */
export type IsUnknown<T> = IsEqual<T, unknown>

/**
 * 타입이 any인지 확인
 */
export type IsAny<T> = 0 extends (1 & T) ? true : false

/**
 * 타입이 배열인지 확인
 */
export type IsArray<T> = T extends readonly unknown[] ? true : false

/**
 * 타입이 튜플인지 확인
 */
export type IsTuple<T> = T extends readonly unknown[]
  ? number extends T['length']
    ? false
    : true
  : false

/**
 * 타입이 함수인지 확인
 */
export type IsFunction<T> = T extends (...args: unknown[]) => unknown ? true : false

/**
 * 타입이 객체인지 확인
 */
export type IsObject<T> = T extends object
  ? T extends unknown[]
    ? false
    : T extends (...args: unknown[]) => unknown
    ? false
    : true
  : false

/**
 * 타입이 문자열 리터럴인지 확인
 */
export type IsStringLiteral<T> = T extends string
  ? string extends T
    ? false
    : true
  : false

/**
 * 타입이 숫자 리터럴인지 확인
 */
export type IsNumberLiteral<T> = T extends number
  ? number extends T
    ? false
    : true
  : false

// ================================================================
// 7. 문자열 조작 타입들
// ================================================================

/**
 * 문자열 첫 글자 대문자로
 */
export type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S

/**
 * 문자열 첫 글자 소문자로
 */
export type Uncapitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S

/**
 * 케밥 케이스를 카멜 케이스로
 */
export type KebabToCamel<S extends string> = S extends `${infer P}-${infer Q}${infer R}`
  ? `${P}${Capitalize<Q>}${KebabToCamel<R>}`
  : S

/**
 * 카멜 케이스를 케밥 케이스로
 */
export type CamelToKebab<S extends string> = S extends `${infer P}${infer Q}`
  ? Q extends Uncapitalize<Q>
    ? `${P}${CamelToKebab<Q>}`
    : `${P}-${Uncapitalize<Q>}${CamelToKebab<Q>}`
  : S

/**
 * 스네이크 케이스를 카멜 케이스로
 */
export type SnakeToCamel<S extends string> = S extends `${infer P}_${infer Q}${infer R}`
  ? `${P}${Capitalize<Q>}${SnakeToCamel<R>}`
  : S

/**
 * 카멜 케이스를 스네이크 케이스로
 */
export type CamelToSnake<S extends string> = S extends `${infer P}${infer Q}`
  ? Q extends Uncapitalize<Q>
    ? `${P}${CamelToSnake<Q>}`
    : `${P}_${Lowercase<Q>}${CamelToSnake<Q>}`
  : S

/**
 * 문자열 길이
 */
export type StringLength<S extends string, Counter extends unknown[] = []> = S extends `${string}${infer Rest}`
  ? StringLength<Rest, [...Counter, unknown]>
  : Counter['length']

/**
 * 문자열 뒤집기
 */
export type ReverseString<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${ReverseString<Rest>}${First}`
  : S

/**
 * 문자열에서 특정 문자 제거
 */
export type RemoveChar<S extends string, C extends string> = S extends `${infer L}${C}${infer R}`
  ? RemoveChar<`${L}${R}`, C>
  : S

// ================================================================
// 8. 숫자 연산 타입들
// ================================================================

/**
 * 숫자 더하기 (작은 숫자만 지원)
 */
export type Add<A extends number, B extends number, Counter extends unknown[] = []> = 
  Counter['length'] extends A
    ? B extends 0
      ? A
      : Add<A, B, [...Counter, unknown]>
    : never

/**
 * 숫자 빼기
 */
export type Subtract<A extends number, B extends number> = 
  A extends number
    ? B extends number
      ? A extends 0
        ? B extends 0
          ? 0
          : never
        : B extends 0
        ? A
        : never
      : never
    : never

/**
 * 두 숫자 비교
 */
export type GreaterThan<A extends number, B extends number, Counter extends unknown[] = []> =
  Counter['length'] extends A
    ? false
    : Counter['length'] extends B
    ? true
    : GreaterThan<A, B, [...Counter, unknown]>

/**
 * 작거나 같음
 */
export type LessOrEqual<A extends number, B extends number> = IsEqual<A, B> extends true
  ? true
  : GreaterThan<A, B> extends true
  ? false
  : true

// ================================================================
// 9. 데이터베이스 특화 유틸리티 타입들
// ================================================================

/**
 * 테넌트 정보 포함
 */
export type WithTenant<T> = T & { tenant_id: string }

/**
 * 타임스탬프 포함
 */
export type WithTimestamps<T> = T & {
  created_at: string
  updated_at: string
}

/**
 * 생성자 정보 포함
 */
export type WithCreator<T> = T & {
  created_by: string
}

/**
 * 수정자 정보 포함  
 */
export type WithUpdater<T> = T & {
  updated_by: string
}

/**
 * 감사 로그 정보 포함
 */
export type WithAudit<T> = T & {
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * 소프트 삭제 지원
 */
export type WithSoftDelete<T> = T & {
  deleted_at?: string | null
  deleted_by?: string | null
}

/**
 * 버전 정보 포함
 */
export type WithVersion<T> = T & {
  version: number
  version_hash?: string
}

/**
 * 정렬 순서 포함
 */
export type WithOrder<T> = T & {
  order: number
}

/**
 * 상태 정보 포함
 */
export type WithStatus<T, S extends string = 'active' | 'inactive'> = T & {
  status: S
}

/**
 * 메타데이터 포함
 */
export type WithMetadata<T, M = Record<string, unknown>> = T & {
  metadata?: M
}

// ================================================================
// 10. API 특화 유틸리티 타입들
// ================================================================

/**
 * API 응답 래퍼
 */
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

/**
 * 페이지네이션된 응답
 */
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * 필터링 가능한 타입
 */
export type Filterable<T> = {
  [K in keyof T]?: T[K] extends string
    ? string | string[]
    : T[K] extends number
    ? number | { min?: number; max?: number }
    : T[K] extends boolean
    ? boolean
    : T[K] extends Date
    ? Date | { from?: Date; to?: Date }
    : unknown
}

/**
 * 정렬 가능한 필드
 */
export type SortableFields<T> = {
  [K in keyof T]: T[K] extends string | number | Date ? K : never
}[keyof T]

/**
 * 검색 가능한 필드
 */
export type SearchableFields<T> = KeysOfType<T, string>

// ================================================================
// 11. React/UI 특화 유틸리티 타입들
// ================================================================

/**
 * 컴포넌트 Props에서 특정 속성 제외
 */
export type OmitProps<T, K extends keyof T> = Omit<T, K>

/**
 * HTML 속성과 커스텀 Props 병합
 */
export type MergeProps<T, U> = Omit<T, keyof U> & U

/**
 * 이벤트 핸들러 타입 추출
 */
export type EventHandlers<T> = PickByType<T, (...args: unknown[]) => unknown>

/**
 * Ref 타입
 */
export type RefType<T> = T extends React.RefObject<infer R> ? R : never

/**
 * 상태 관리용 액션 타입
 */
export type ActionType<T extends Record<string, (...args: unknown[]) => unknown>> = {
  [K in keyof T]: {
    type: K
    payload: Parameters<T[K]>
  }
}[keyof T]

// ================================================================
// 12. 고급 메타프로그래밍 타입들
// ================================================================

/**
 * 객체의 모든 경로를 추출
 */
export type Paths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${Prefix}${K}` | Paths<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never
    }[keyof T]
  : never

/**
 * 경로를 통해 값 타입 추출
 */
export type PathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? PathValue<T[K], R>
    : never
  : never

/**
 * 객체 스키마 검증 타입
 */
export type Schema<T> = {
  [K in keyof T]: {
    type: T[K] extends string
      ? 'string'
      : T[K] extends number
      ? 'number'
      : T[K] extends boolean
      ? 'boolean'
      : T[K] extends Date
      ? 'date'
      : T[K] extends unknown[]
      ? 'array'
      : 'object'
    required?: boolean
    default?: T[K]
    validation?: (value: T[K]) => boolean
  }
}

/**
 * 타입에서 스키마 생성
 */
export type InferSchema<T> = {
  [K in keyof T]: T[K] extends { type: 'string'; required: true }
    ? string
    : T[K] extends { type: 'string'; required?: false }
    ? string | undefined
    : T[K] extends { type: 'number'; required: true }
    ? number
    : T[K] extends { type: 'number'; required?: false }
    ? number | undefined
    : T[K] extends { type: 'boolean'; required: true }
    ? boolean
    : T[K] extends { type: 'boolean'; required?: false }
    ? boolean | undefined
    : unknown
}

// ================================================================
// 13. 타입 가드 및 검증 유틸리티
// ================================================================

/**
 * 기본 타입 가드
 */
export type TypeGuard<T> = (value: unknown) => value is T

/**
 * 런타임 타입 체커
 */
export type TypeChecker<T> = {
  [K in keyof T]: (value: unknown) => value is T[K]
}

/**
 * 객체 검증 결과
 */
export type ValidationResult<T> = {
  valid: boolean
  errors: Array<{
    path: Paths<T>
    message: string
    value: unknown
  }>
  data?: T
}

// ================================================================
// 14. 성능 최적화 타입들
// ================================================================

/**
 * 메모화를 위한 키 추출
 */
export type MemoKey<T> = T extends (...args: infer A) => unknown
  ? (...args: A) => string
  : never

/**
 * 캐시 가능한 함수
 */
export type Cacheable<T extends (...args: unknown[]) => unknown> = T & {
  cache: Map<string, ReturnType<T>>
  clearCache: () => void
}

/**
 * 지연 로딩 타입
 */
export type Lazy<T> = () => Promise<T>

/**
 * 성능 메트릭스
 */
export type PerformanceMetrics = {
  executionTime: number
  memoryUsage: number
  cacheHitRate: number
  operationCount: number
}

// ================================================================
// 15. 내보내기 유틸리티
// ================================================================

/**
 * 유틸리티 타입 컬렉션 (ES2015 모듈 스타일)
 */
export type UtilityTypeCollection = {
  // 기본 유틸리티
  DeepPartial: typeof DeepPartial,
  DeepReadonly: typeof DeepReadonly,
  DeepRequired: typeof DeepRequired,
  DeepNullable: typeof DeepNullable,
  DeepNonNullable: typeof DeepNonNullable,
  
  // 키 기반
  PartialBy: typeof PartialBy,
  RequiredBy: typeof RequiredBy,
  ReadonlyBy: typeof ReadonlyBy,
  WritableBy: typeof WritableBy,
  NullableBy: typeof NullableBy,
  NonNullableBy: typeof NonNullableBy,
  
  // 값 기반
  KeysOfType: typeof KeysOfType,
  PickByType: typeof PickByType,
  OmitByType: typeof OmitByType,
  PickFunctions: typeof PickFunctions,
  OmitFunctions: typeof OmitFunctions,
  
  // 배열/튜플
  Head: typeof Head,
  Tail: typeof Tail,
  Length: typeof Length,
  
  // 함수
  Args: typeof Args,
  Return: typeof Return,
  
  // 조건부
  IsEqual: typeof IsEqual,
  IsNever: typeof IsNever,
  IsUnknown: typeof IsUnknown,
  IsAny: typeof IsAny,
  
  // 문자열
  KebabToCamel: typeof KebabToCamel,
  CamelToKebab: typeof CamelToKebab,
  
  // 데이터베이스
  WithTenant: typeof WithTenant,
  WithTimestamps: typeof WithTimestamps,
  
  // API
  ApiResponse: typeof ApiResponse,
  PaginatedResponse: typeof PaginatedResponse
}