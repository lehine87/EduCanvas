'use client'

import { useState, useRef, forwardRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  PhotoIcon, 
  SwatchIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  CheckIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

import { useBackgroundConfig } from './useBackgroundConfig'
import { BackgroundSystem, BackgroundConfig, backgroundPresets, BackgroundPattern } from './BackgroundSystem'

export interface BackgroundSettingsProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger?: React.ReactNode
  onClose?: () => void
}

/**
 * 대시보드 배경 설정 UI 컴포넌트
 * EduCanvas v2 디자인 시스템 준수
 */
export const BackgroundSettings = forwardRef<HTMLDivElement, BackgroundSettingsProps>(
  ({ trigger, onClose, className, ...props }, ref) => {
    const { config, updateConfig, applyPreset, setImageBackground, resetConfig, presets } = useBackgroundConfig()
    const [isOpen, setIsOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    

    // 프리셋 정보
    const presetInfos = {
      none: { name: '배경 없음', icon: NoSymbolIcon, description: '깔끔한 단색 배경' },
      glassmorphism: { name: '글래스모피즘', icon: SwatchIcon, description: '미묘한 투명 패턴' },
      subtle_dots: { name: '도트 패턴', icon: SwatchIcon, description: '은은한 점 무늬' },
      minimal_grid: { name: '그리드', icon: SwatchIcon, description: '최소한의 격자' },
      ocean_waves: { name: '웨이브', icon: SwatchIcon, description: '물결 무늬' },
      morphing_art: { name: '모핑 아트', icon: SwatchIcon, description: '역동적 변화무쌍' },
      custom_gradient: { name: '그라디언트', icon: SwatchIcon, description: '부드러운 색상 변화' }
    }

    // 파일 업로드 핸들러
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const success = await setImageBackground(file, config.opacity || 30)
        if (success) {
          // 성공 피드백 (toast 등)
          console.log('배경 이미지 설정 완료')
        } else {
          console.error('배경 이미지 설정 실패')
        }
      } catch (error) {
        console.error('파일 업로드 에러:', error)
      } finally {
        setUploading(false)
        // input 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    // 투명도 조절
    const handleOpacityChange = (value: number[]) => {
      updateConfig({
        ...config,
        opacity: value[0]
      })
    }

    // 트리거 버튼 클릭 핸들러
    const handleTriggerClick = () => {
      setIsOpen(true)
    }

    // 트리거 요소 렌더링
    const renderTrigger = () => {
      if (trigger) {
        // 전달받은 trigger가 있으면 onClick 이벤트 주입
        return (
          <div onClick={handleTriggerClick} className="inline-block cursor-pointer">
            {trigger}
          </div>
        )
      }
      // 기본 트리거 버튼
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handleTriggerClick}
        >
          <SwatchIcon className="w-4 h-4" />
          배경 설정
        </Button>
      )
    }

    return (
      <>
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 트리거 버튼 */}
        {renderTrigger()}

        {/* Sheet 모달 */}
        <Sheet 
          open={isOpen} 
          onOpenChange={(open) => {
            console.log('📋 Sheet 상태 변경 요청:', open)
            setIsOpen(open)
            if (!open && onClose) {
              onClose()
            }
          }}
        >
          <SheetContent side="right" className="w-[400px] sm:w-[500px] bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <SwatchIcon className="w-5 h-5" />
                대시보드 배경 설정
              </SheetTitle>
              <SheetDescription>
                대시보드의 배경 스타일을 선택하세요
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              
              {/* 현재 설정 미리보기 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">미리보기</Label>
                <div className="relative h-32 rounded-lg border overflow-hidden">
                  <BackgroundSystem
                    config={config}
                    className="h-full"
                  >
                    <div className="h-full flex items-center justify-center">
                      <div className="backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-white/20 rounded-lg px-4 py-2">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">위젯 미리보기</span>
                      </div>
                    </div>
                  </BackgroundSystem>
                </div>
              </div>

              {/* 프리셋 선택 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">배경 프리셋</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(presetInfos).map(([key, info]) => {
                    const Icon = info.icon
                    const isActive = JSON.stringify(config) === JSON.stringify(presets[key as keyof typeof presets])
                    
                    return (
                      <motion.div
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md relative bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
                            isActive && "ring-2 ring-educanvas-500"
                          )}
                          onClick={() => applyPreset(key as keyof typeof presets)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-neutral-800 dark:text-neutral-200">{info.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{info.description}</p>
                              </div>
                              {isActive && (
                                <CheckIcon className="w-4 h-4 text-educanvas-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* 사용자 정의 이미지 업로드 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">사용자 정의 배경</Label>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudArrowUpIcon className="w-4 h-4" />
                  )}
                  {uploading ? '업로드 중...' : '이미지 업로드'}
                </Button>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  5MB 이하의 이미지 파일을 업로드하세요
                </p>
              </div>

              {/* 투명도 조절 */}
              {config.type !== 'none' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">투명도</Label>
                    <Badge variant="secondary" className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                      {config.opacity || 40}%
                    </Badge>
                  </div>
                  <Slider
                    value={[config.opacity || 40]}
                    onValueChange={handleOpacityChange}
                    max={60}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}

              {/* 현재 설정 정보 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">현재 설정</Label>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">타입:</span>
                      <span className="font-mono">{config.type}</span>
                    </div>
                    {config.pattern && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">패턴:</span>
                        <span className="font-mono">{config.pattern}</span>
                      </div>
                    )}
                    {config.opacity && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">투명도:</span>
                        <span className="font-mono">{config.opacity}%</span>
                      </div>
                    )}
                    {config.imageUrl && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">이미지:</span>
                        <span className="font-mono text-xs">사용자 업로드</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 리셋 버튼 */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={resetConfig}
                  className="w-full gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  기본값으로 초기화
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }
)

BackgroundSettings.displayName = 'BackgroundSettings'

export default BackgroundSettings