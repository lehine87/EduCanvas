'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'
import type { 
  BaseComponentProps, 
  AccessibilityProps, 
  ComponentAlignment
} from './types'

interface TableColumn<T = any> {
  key: keyof T | string
  header: string
  width?: number
  sortable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  cellClassName?: (value: any, row: T) => string
  headerClassName?: string
  align?: ComponentAlignment
}

interface TableProps<T = any> extends BaseComponentProps, AccessibilityProps {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  sortable?: boolean
  selectable?: boolean
  selectedRows?: Set<number>
  onSelectionChange?: (selectedRows: Set<number>) => void
  onRowClick?: (row: T, index: number) => void
  caption?: string
  stickyHeader?: boolean
  striped?: boolean
  hoverable?: boolean
  bordered?: boolean
  keyField?: string // 추가했지만 사용하지 않음 (호환성을 위해)
}

type SortDirection = 'asc' | 'desc' | null

interface SortConfig {
  key: string
  direction: SortDirection
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = '데이터가 없습니다',
  sortable = true,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  onRowClick,
  caption,
  stickyHeader = false,
  striped = false,
  hoverable = true,
  bordered = true,
  keyField, // DOM에 전달하지 않기 위해 destructuring
  className,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null })

  const sortedData = useMemo(() => {
    // 데이터가 배열이고 유효한 객체들만 필터링
    const validData = Array.isArray(data) ? data.filter(item => item && typeof item === 'object') : []
    
    if (!sortConfig.key || !sortConfig.direction) {
      return validData
    }

    return [...validData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue == null) return 1
      if (bValue == null) return -1

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const handleSort = (columnKey: string) => {
    if (!sortable) return
    
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    let direction: SortDirection = 'asc'
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === columnKey && sortConfig.direction === 'desc') {
      direction = null
    }

    setSortConfig({ key: columnKey, direction })
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return
    
    if (selectedRows.size === sortedData.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(Array.from({ length: sortedData.length }, (_, i) => i)))
    }
  }

  const handleSelectRow = (index: number, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!onSelectionChange) return
    
    const newSelection = new Set(selectedRows)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    onSelectionChange(newSelection)
  }

  const getCellValue = (row: T, column: TableColumn<T>) => {
    if (typeof column.key === 'string' && column.key.includes('.')) {
      return column.key.split('.').reduce((obj: any, key) => obj?.[key], row)
    }
    return row[column.key as keyof T]
  }

  const renderCell = (row: T, column: TableColumn<T>, index: number): React.ReactNode => {
    // row가 null이나 undefined인 경우 안전하게 처리
    if (!row || typeof row !== 'object') {
      return '—'
    }
    
    const value = getCellValue(row, column)
    
    if (column.render) {
      try {
        return column.render(value, row, index)
      } catch (error) {
        console.error('Table cell render error:', error, { row, column: column.key, index })
        return '오류'
      }
    }
    
    if (value === null || value === undefined) return '—'
    return String(value)
  }

  // Indeterminate checkbox component
  const IndeterminateCheckbox = ({ 
    checked, 
    onChange, 
    indeterminate,
    'aria-label': ariaLabel
  }: { 
    checked: boolean
    onChange: () => void
    indeterminate: boolean
    'aria-label'?: string
  }) => {
    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    return (
      <input
        ref={ref}
        type="checkbox"
        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
      />
    )
  }

  if (loading) {
    return (
      <div 
        className={cn('border rounded-lg p-8', className)}
        data-testid={testId}
      >
        <div className="flex items-center justify-center space-x-2">
          <svg 
            className="animate-spin h-5 w-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-500">데이터를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (sortedData.length === 0) {
    return (
      <div 
        className={cn('border rounded-lg p-8', className)}
        data-testid={testId}
      >
        <div className="text-center">
          <svg 
            className="mx-auto h-12 w-12 text-gray-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)} data-testid={testId}>
      <table 
        className={cn(
          'min-w-full',
          bordered && 'border border-gray-200',
          'bg-white'
        )}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        
        <thead className={cn(
          'bg-gray-50',
          stickyHeader && 'sticky top-0 z-10'
        )}>
          <tr>
            {selectable && (
              <th 
                className="w-12 px-4 py-3 text-left"
                scope="col"
              >
                <IndeterminateCheckbox
                  checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                  onChange={handleSelectAll}
                  indeterminate={selectedRows.size > 0 && selectedRows.size < sortedData.length}
                  aria-label={`모든 행 선택 ${selectedRows.size > 0 ? `(${selectedRows.size}개 선택됨)` : ''}`}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={cn(
                  'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.align !== 'center' && column.align !== 'right' && 'text-left',
                  column.sortable && sortable && 'cursor-pointer hover:bg-gray-100 select-none transition-colors duration-150',
                  column.headerClassName
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(String(column.key))}
                {...(column.sortable && sortable && {
                  tabIndex: 0,
                  role: 'button',
                  'aria-label': `${column.header} 열 정렬`,
                  onKeyDown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSort(String(column.key))
                    }
                  }
                })}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable && sortable && (
                    <span className="ml-1" aria-hidden="true">
                      {sortConfig.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : (
                        <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 8l5-5 5 5H5z" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className={cn(
          'divide-y divide-gray-200',
          striped && '[&>tr:nth-child(odd)]:bg-gray-50'
        )}>
          {sortedData.map((row, index) => {
            const isSelected = selectedRows.has(index)
            return (
              <tr
                key={index}
                className={cn(
                  'transition-colors duration-150',
                  hoverable && 'hover:bg-gray-50',
                  isSelected && 'bg-blue-50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                {...(onRowClick && {
                  tabIndex: 0,
                  role: 'button',
                  onKeyDown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row, index)
                    }
                  }
                })}
              >
                {selectable && (
                  <td className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(index, e)}
                      aria-label={`행 ${index + 1} 선택`}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn(
                      'px-4 py-3 text-sm text-gray-900',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.cellClassName?.(getCellValue(row, column), row)
                    )}
                    style={{ width: column.width }}
                  >
                    {renderCell(row, column, index)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Table sub-components for semantic structure
export function TableHeader({ className, children, ...props }: BaseComponentProps) {
  return (
    <thead className={cn('bg-gray-50', className)} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className, children, ...props }: BaseComponentProps) {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ 
  className, 
  children, 
  hoverable = true,
  ...props 
}: BaseComponentProps & { hoverable?: boolean }) {
  return (
    <tr 
      className={cn(
        hoverable && 'hover:bg-gray-50 transition-colors duration-150',
        className
      )} 
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ className, children, ...props }: BaseComponentProps) {
  return (
    <th 
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        className
      )}
      scope="col"
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }: BaseComponentProps) {
  return (
    <td 
      className={cn(
        'px-4 py-3 text-sm text-gray-900',
        className
      )} 
      {...props}
    >
      {children}
    </td>
  )
}