import { NextRequest } from 'next/server'
import { withApiHandler, createSuccessResponse, createErrorResponse, validateRequestBody, logApiStart, logApiSuccess, logApiError } from '@/lib/api/utils'

const API_NAME = 'attendance-check-in'

/**
 * POST /api/attendance/check-in
 * 출근 체크인
 */
export async function POST(request: NextRequest) {
  return withApiHandler(
    request,
    async ({ request, supabase, userProfile }) => {
      logApiStart(API_NAME, { userId: userProfile?.id })

      try {
        const body = await request.json()
        const validatedBody = validateRequestBody<{
          qr_code?: string
          location?: {
            latitude: number
            longitude: number
          }
          notes?: string
        }>(
          body,
          (data: unknown) => {
            const checkIn = data as any
            // QR 코드나 위치 정보 중 하나는 있어야 함
            if (!checkIn.qr_code && !checkIn.location) {
              throw new Error('QR 코드 또는 위치 정보가 필요합니다.')
            }
            return checkIn
          }
        )

        if (validatedBody instanceof Response) {
          return validatedBody
        }

        const { qr_code, location, notes } = validatedBody

        // userProfile.tenant_id null 체크
        if (!userProfile?.tenant_id) {
          return createErrorResponse('테넌트 정보가 없습니다.', 400)
        }

        // 현재 사용자의 멤버십 조회
        const { data: membership, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select('id')
          .eq('user_id', userProfile!.id)
          .eq('tenant_id', userProfile.tenant_id)
          .single()

        if (membershipError || !membership) {
          return createErrorResponse('직원 정보를 찾을 수 없습니다.', 404)
        }

        const today = new Date().toISOString().split('T')[0]
        const currentTime = new Date().toTimeString().split(' ')[0].slice(0, 5) // HH:MM

        // QR 코드 검증 (선택적)
        if (qr_code) {
          const isValidQR = await validateQRCode(qr_code, userProfile.tenant_id)
          if (!isValidQR) {
            return createErrorResponse('유효하지 않은 QR 코드입니다.', 400)
          }
        }

        // 위치 검증 (선택적)
        if (location) {
          const isValidLocation = await validateLocation(location, userProfile.tenant_id)
          if (!isValidLocation) {
            return createErrorResponse('유효하지 않은 위치입니다.', 400)
          }
        }

        // 이미 오늘 체크인했는지 확인
        const { data: existingRecord } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('membership_id', membership.id)
          .eq('date', today)
          .single()

        if (existingRecord && existingRecord.check_in) {
          return createErrorResponse('이미 출근 체크인을 완료했습니다.', 400)
        }

        // 출근 시간 체크 (지각 여부 판단)
        const workStartTime = '09:00' // 기본 출근 시간
        const isLate = currentTime > workStartTime

        // 근태 기록 생성/수정
        const attendanceData = {
          tenant_id: userProfile.tenant_id,
          membership_id: membership.id,
          date: today,
          check_in: currentTime,
          check_out: existingRecord?.check_out || null,
          status: isLate ? '지각' : '정상',
          notes: notes || (isLate ? `지각 (${currentTime} 출근)` : null),
          updated_at: new Date().toISOString()
        }

        const { data: record, error } = await supabase
          .from('attendance_records')
          .upsert(attendanceData, { 
            onConflict: 'membership_id,date',
            ignoreDuplicates: false 
          })
          .select()
          .single()

        if (error) {
          logApiError(API_NAME, `출근 체크인 실패: ${error.message}`)
          return createErrorResponse('출근 체크인에 실패했습니다.', 500)
        }

        logApiSuccess(API_NAME, { 
          membershipId: membership.id, 
          checkInTime: currentTime,
          status: record.status
        })

        return createSuccessResponse({
          record,
          check_in_time: currentTime,
          status: record.status,
          is_late: isLate
        }, `출근 체크인이 완료되었습니다. (${currentTime})`)

      } catch (error) {
        logApiError(API_NAME, error)
        return createErrorResponse(
          error instanceof Error ? error.message : '출근 체크인 중 오류가 발생했습니다.',
          500
        )
      }
    },
    { requireAuth: true }
  )
}

/**
 * QR 코드 유효성 검증
 */
async function validateQRCode(qrCode: string, tenantId: string): Promise<boolean> {
  try {
    // QR 코드 형식: tenant_id:check_in:timestamp
    const decoded = Buffer.from(qrCode, 'base64').toString('utf-8')
    const [qrTenantId, action, timestamp] = decoded.split(':')
    
    // 테넌트 ID 확인
    if (qrTenantId !== tenantId) {
      return false
    }
    
    // 액션 확인
    if (action !== 'check_in') {
      return false
    }
    
    // 시간 확인 (QR 코드는 1시간 유효)
    const qrTime = parseInt(timestamp)
    const currentTime = Date.now()
    const oneHour = 60 * 60 * 1000
    
    if (currentTime - qrTime > oneHour) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('QR 코드 검증 실패:', error)
    return false
  }
}

/**
 * 위치 유효성 검증
 */
async function validateLocation(
  location: { latitude: number, longitude: number }, 
  tenantId: string
): Promise<boolean> {
  try {
    // 기본 사무실 위치 (실제로는 DB에서 조회)
    const officeLocation = {
      latitude: 37.5665, // 서울시청 좌표 (예시)
      longitude: 126.9780
    }
    
    // 허용 반경 (미터)
    const allowedRadius = 100
    
    // 두 지점 간 거리 계산 (Haversine formula)
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      officeLocation.latitude,
      officeLocation.longitude
    )
    
    return distance <= allowedRadius
  } catch (error) {
    console.error('위치 검증 실패:', error)
    return false
  }
}

/**
 * 두 지점 간 거리 계산 (미터)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}