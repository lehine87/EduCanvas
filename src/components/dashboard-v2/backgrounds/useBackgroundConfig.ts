'use client'

import { useState, useCallback, useEffect } from 'react'
import { BackgroundConfig, backgroundPresets } from './BackgroundSystem'

// 로컬 스토리지 키
const STORAGE_KEY = 'educanvas_dashboard_background'

// 배경 설정 Hook
export function useBackgroundConfig() {
  const [config, setConfig] = useState<BackgroundConfig>(() => {
    // 초기값: none (배경 없음)으로 시작
    return { type: 'none' }
  })

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as BackgroundConfig
        setConfig(parsed)
      }
    } catch (error) {
      console.warn('배경 설정 로드 실패:', error)
    }
  }, [])

  // localStorage 변경 감지 (다른 컴포넌트에서 변경된 경우)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newConfig = JSON.parse(e.newValue) as BackgroundConfig
          setConfig(newConfig)
        } catch (error) {
          console.warn('localStorage 변경 처리 실패:', error)
        }
      }
    }

    // 같은 탭 내에서는 storage 이벤트가 발생하지 않으므로 
    // 커스텀 이벤트로 대체
    const handleCustomStorageChange = (e: CustomEvent) => {
      try {
        const newConfig = e.detail as BackgroundConfig
        setConfig(newConfig)
      } catch (error) {
        console.warn('커스텀 이벤트 처리 실패:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('background-config-changed' as any, handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('background-config-changed' as any, handleCustomStorageChange)
    }
  }, [])

  // 설정 변경 및 저장
  const updateConfig = useCallback((newConfig: BackgroundConfig) => {
    setConfig(newConfig)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
      
      // 다른 컴포넌트에 변경 사항 알리기 (커스텀 이벤트)
      const event = new CustomEvent('background-config-changed', {
        detail: newConfig
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.warn('배경 설정 저장 실패:', error)
    }
  }, [])

  // 프리셋 적용
  const applyPreset = useCallback((presetName: keyof typeof backgroundPresets) => {
    const preset = backgroundPresets[presetName]
    if (preset) {
      updateConfig(preset)
    }
  }, [updateConfig])

  // 이미지 업로드 처리
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기는 5MB를 초과할 수 없습니다')
      }

      // 이미지 파일 형식 체크
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다')
      }

      // 임시로 base64로 변환 (실제 운영에서는 서버 업로드)
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('파일 읽기 실패'))
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      return null
    }
  }, [])

  // 이미지 배경 설정
  const setImageBackground = useCallback(async (file: File, opacity: number = 30) => {
    const imageUrl = await uploadImage(file)
    if (imageUrl) {
      updateConfig({
        type: 'image',
        imageUrl,
        opacity
      })
      return true
    }
    return false
  }, [uploadImage, updateConfig])

  // 설정 초기화
  const resetConfig = useCallback(() => {
    const defaultConfig = backgroundPresets.glassmorphism
    updateConfig(defaultConfig)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('배경 설정 초기화 실패:', error)
    }
  }, [updateConfig])

  return {
    config,
    updateConfig,
    applyPreset,
    setImageBackground,
    uploadImage,
    resetConfig,
    presets: backgroundPresets
  }
}

export default useBackgroundConfig