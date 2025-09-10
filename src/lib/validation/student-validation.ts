/**
 * 학생 데이터 검증 유틸리티
 * 업계 표준 검증 규칙 적용
 */

// 한국 전화번호 패턴 (01X-XXXX-XXXX, 01X-XXX-XXXX)
export const PHONE_REGEX = /^01([0-9])-?([0-9]{3,4})-?([0-9]{4})$/

// 이메일 패턴 (RFC 5322 준수)
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// 학번 패턴 (영문자 3자리 + 숫자 6-10자리)
export const STUDENT_NUMBER_REGEX = /^[A-Z]{3}[0-9]{6,10}$/

// 한국 이름 패턴 (한글 2-5자)
export const KOREAN_NAME_REGEX = /^[가-힣]{2,5}$/

// 영문 이름 패턴 (영문자와 공백, 2-50자)
export const ENGLISH_NAME_REGEX = /^[a-zA-Z\s]{2,50}$/

/**
 * 전화번호 검증 및 정규화
 */
export function validateAndNormalizePhone(phone: string): {
  isValid: boolean
  normalized: string | null
  error?: string
} {
  if (!phone || phone.trim() === '') {
    return { isValid: true, normalized: null } // 선택적 필드
  }

  const cleanPhone = phone.replace(/\s|-/g, '') // 공백과 하이픈 제거
  
  // 기본 길이 체크 (11자리)
  if (cleanPhone.length !== 11) {
    return {
      isValid: false,
      normalized: null,
      error: '전화번호는 11자리여야 합니다 (예: 010-1234-5678)'
    }
  }

  // 패턴 체크
  const match = cleanPhone.match(/^(01[0-9])([0-9]{3,4})([0-9]{4})$/)
  if (!match) {
    return {
      isValid: false,
      normalized: null,
      error: '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    }
  }

  const [, prefix, middle, suffix] = match
  const normalized = `${prefix}-${middle}-${suffix}`

  return { isValid: true, normalized }
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): {
  isValid: boolean
  error?: string
} {
  if (!email || email.trim() === '') {
    return { isValid: true } // 선택적 필드
  }

  const trimmedEmail = email.trim().toLowerCase()

  // 길이 체크
  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      error: '이메일이 너무 깁니다 (최대 254자)'
    }
  }

  // 패턴 체크
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      isValid: false,
      error: '올바른 이메일 형식이 아닙니다'
    }
  }

  // 도메인 체크 (기본적인 것만)
  const [localPart, domain] = trimmedEmail.split('@')
  if (localPart.length > 64) {
    return {
      isValid: false,
      error: '이메일 로컬 부분이 너무 깁니다'
    }
  }

  return { isValid: true }
}

/**
 * 학생 이름 검증
 */
export function validateStudentName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      error: '학생 이름은 필수입니다'
    }
  }

  const trimmedName = name.trim()

  // 길이 체크
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return {
      isValid: false,
      error: '이름은 2자 이상 50자 이하여야 합니다'
    }
  }

  // 한글 이름 체크
  if (KOREAN_NAME_REGEX.test(trimmedName)) {
    return { isValid: true }
  }

  // 영문 이름 체크
  if (ENGLISH_NAME_REGEX.test(trimmedName)) {
    return { isValid: true }
  }

  return {
    isValid: false,
    error: '이름은 한글(2-5자) 또는 영문(2-50자)이어야 합니다'
  }
}

/**
 * 학번 검증
 */
export function validateStudentNumber(studentNumber: string): {
  isValid: boolean
  error?: string
} {
  if (!studentNumber || studentNumber.trim() === '') {
    return { isValid: true } // 선택적 필드 (자동 생성)
  }

  const trimmedNumber = studentNumber.trim().toUpperCase()

  // 패턴 체크
  if (!STUDENT_NUMBER_REGEX.test(trimmedNumber)) {
    return {
      isValid: false,
      error: '학번은 영문자 3자리 + 숫자 6-10자리 형식이어야 합니다 (예: STU202400001)'
    }
  }

  return { isValid: true }
}

/**
 * 생년월일 검증
 */
export function validateBirthDate(birthDate: string): {
  isValid: boolean
  error?: string
} {
  if (!birthDate || birthDate.trim() === '') {
    return { isValid: true } // 선택적 필드
  }

  const date = new Date(birthDate)
  const now = new Date()

  // 유효한 날짜인지 체크
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: '올바른 날짜 형식이 아닙니다'
    }
  }

  // 미래 날짜 체크
  if (date > now) {
    return {
      isValid: false,
      error: '생년월일은 미래일 수 없습니다'
    }
  }

  // 너무 과거 날짜 체크 (120년 전)
  const minDate = new Date()
  minDate.setFullYear(now.getFullYear() - 120)
  if (date < minDate) {
    return {
      isValid: false,
      error: '생년월일이 너무 과거입니다'
    }
  }

  return { isValid: true }
}

/**
 * 종합 학생 데이터 검증
 */
export function validateStudentData(data: {
  name: string
  student_number?: string
  email?: string
  phone?: string
  parent_phone_1?: string
  parent_phone_2?: string
  birth_date?: string
}): {
  isValid: boolean
  errors: Record<string, string>
  normalizedData: Partial<typeof data>
} {
  const errors: Record<string, string> = {}
  const normalizedData: Partial<typeof data> = { ...data }

  // 이름 검증
  const nameValidation = validateStudentName(data.name)
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!
  }

  // 학번 검증
  if (data.student_number) {
    const studentNumberValidation = validateStudentNumber(data.student_number)
    if (!studentNumberValidation.isValid) {
      errors.student_number = studentNumberValidation.error!
    }
  }

  // 이메일 검증
  if (data.email) {
    const emailValidation = validateEmail(data.email)
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!
    }
  }

  // 학생 전화번호 검증 및 정규화
  if (data.phone) {
    const phoneValidation = validateAndNormalizePhone(data.phone)
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error!
    } else {
      normalizedData.phone = phoneValidation.normalized || undefined
    }
  }

  // 학부모 1 전화번호 검증 및 정규화
  if (data.parent_phone_1) {
    const parentPhone1Validation = validateAndNormalizePhone(data.parent_phone_1)
    if (!parentPhone1Validation.isValid) {
      errors.parent_phone_1 = parentPhone1Validation.error!
    } else {
      normalizedData.parent_phone_1 = parentPhone1Validation.normalized || undefined
    }
  }

  // 학부모 2 전화번호 검증 및 정규화
  if (data.parent_phone_2) {
    const parentPhone2Validation = validateAndNormalizePhone(data.parent_phone_2)
    if (!parentPhone2Validation.isValid) {
      errors.parent_phone_2 = parentPhone2Validation.error!
    } else {
      normalizedData.parent_phone_2 = parentPhone2Validation.normalized || undefined
    }
  }

  // 생년월일 검증
  if (data.birth_date) {
    const birthDateValidation = validateBirthDate(data.birth_date)
    if (!birthDateValidation.isValid) {
      errors.birth_date = birthDateValidation.error!
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedData
  }
}