'use client'

import { useState } from 'react'
import { Modal, Button, Input, Loading } from '@/components/ui'
import type { Tenant } from '@/types/app.types'

interface TenantSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (tenant: Tenant) => void
}

export function TenantSearchModal({ isOpen, onClose, onSelect }: TenantSearchModalProps) {
  const [searchType, setSearchType] = useState<'code' | 'name'>('code')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Tenant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요.')
      return
    }

    // 고객번호 검증
    if (searchType === 'code' && !/^\d{6}$/.test(searchQuery.trim())) {
      setError('고객번호는 6자리 숫자여야 합니다.')
      return
    }

    setIsSearching(true)
    setError(null)
    setSearchResults([])

    try {
      console.log('🔍 학원 검색 API 호출:', { type: searchType, query: searchQuery })

      const response = await fetch('/api/auth/search-tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchType: searchType,
          searchQuery: searchQuery.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('검색 API 오류:', result.error)
        setError(result.error || '검색 중 오류가 발생했습니다.')
        setIsSearching(false)
        return
      }

      console.log('✅ 검색 완료:', result.count, '개 결과')
      setSearchResults(result.results || [])
      setHasSearched(true)

      if (!result.results || result.results.length === 0) {
        if (searchType === 'code') {
          setError('해당 고객번호의 학원을 찾을 수 없습니다. 번호를 다시 확인해주세요.')
        } else {
          setError('해당 이름의 학원을 찾을 수 없습니다. 정확한 학원명을 입력해주세요.')
        }
      }

    } catch (error: any) {
      console.error('검색 예외:', error)
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (tenant: any) => {
    console.log('✅ 학원 선택:', tenant.name)
    onSelect(tenant)
    handleClose()
  }

  const handleClose = () => {
    setSearchQuery('')
    setSearchResults([])
    setError(null)
    setHasSearched(false)
    setSearchType('code')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="학원 찾기">
      <div className="space-y-6">
        {/* 검색 방법 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            검색 방법을 선택하세요
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="code"
                checked={searchType === 'code'}
                onChange={(e) => setSearchType(e.target.value as 'code')}
                className="mr-2"
              />
              <span className="text-sm">고객번호 (6자리)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="name"
                checked={searchType === 'name'}
                onChange={(e) => setSearchType(e.target.value as 'name')}
                className="mr-2"
              />
              <span className="text-sm">학원명</span>
            </label>
          </div>
        </div>

        {/* 검색 입력 */}
        <div>
          <Input
            label={searchType === 'code' ? '고객번호' : '학원명'}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              searchType === 'code' 
                ? '123456 (6자리 숫자)' 
                : 'ABC 영어학원'
            }
            error={error}
            disabled={isSearching}
            maxLength={searchType === 'code' ? 6 : 50}
          />
          
          <div className="mt-2">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              loading={isSearching}
              className="w-full"
            >
              {isSearching ? '검색 중...' : '🔍 검색'}
            </Button>
          </div>
        </div>

        {/* 검색 결과 */}
        {hasSearched && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              검색 결과 ({searchResults.length}개)
            </h3>
            
            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSelect(tenant)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {tenant.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          고객번호: {tenant.tenant_code}
                        </p>
                        {tenant.address && (
                          <p className="text-xs text-gray-500 mt-1">
                            {tenant.address}
                          </p>
                        )}
                        {tenant.contact_phone && (
                          <p className="text-xs text-gray-500">
                            📞 {tenant.contact_phone}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSelect(tenant)}
                      >
                        선택
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-2 text-4xl">🏫</div>
                <p className="text-sm">
                  {searchType === 'code' 
                    ? '해당 고객번호의 학원을 찾을 수 없습니다.'
                    : '해당 이름의 학원을 찾을 수 없습니다.'
                  }
                </p>
                <p className="text-xs mt-1 text-gray-400">
                  {searchType === 'code'
                    ? '고객번호를 정확히 입력했는지 확인해주세요.'
                    : '학원명을 정확히 입력했는지 확인해주세요.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* 도움말 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
          <p className="font-medium text-blue-800 mb-1">💡 검색 팁</p>
          <ul className="text-blue-700 space-y-1 text-xs">
            <li>• <strong>고객번호</strong>: 학원에서 제공받은 6자리 숫자를 정확히 입력</li>
            <li>• <strong>학원명</strong>: 정확한 학원 이름을 입력 (일부만 입력해도 검색 가능)</li>
            <li>• 찾는 학원이 없다면 학원 관리자에게 문의해주세요</li>
          </ul>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            취소
          </Button>
        </div>
      </div>
    </Modal>
  )
}