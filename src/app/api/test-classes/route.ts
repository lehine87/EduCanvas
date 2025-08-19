import { NextRequest, NextResponse } from 'next/server'

// 매우 간단한 테스트 API
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 테스트 API 호출됨')
    
    // 간단한 응답 반환
    return NextResponse.json({
      success: true,
      message: "테스트 API가 정상 작동합니다",
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🚨 테스트 API 에러:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      }, 
      { status: 500 }
    )
  }
}