import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';

/**
 * Column definition interface
 */
export interface Column<T> {
  /** Unique key for the column */
  key: keyof T | string;
  /** Column header text */
  header: string;
  /** Width of the column (for virtualization) */
  width?: number;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom render function */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  /** Custom cell className function */
  cellClassName?: (value: any, row: T) => string;
  /** Header className */
  headerClassName?: string;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Table component props interface
 */
export interface TableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Table height (for virtualization) */
  height?: number;
  /** Row height (for virtualization) */
  rowHeight?: number;
  /** Enable virtualization for large datasets */
  virtualized?: boolean;
  /** Enable sorting */
  sortable?: boolean;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected rows */
  selectedRows?: Set<number>;
  /** Selection change handler */
  onSelectionChange?: (selectedRows: Set<number>) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Table caption */
  caption?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Custom loading component */
  LoadingComponent?: React.ComponentType;
  /** Custom empty component */
  EmptyComponent?: React.ComponentType;
}

/**
 * Sort direction type
 */
type SortDirection = 'asc' | 'desc' | null;

/**
 * Sort configuration
 */
interface SortConfig {
  key: string;
  direction: SortDirection;
}

/**
 * Reusable Table component with sorting, virtualization, and selection
 * 
 * @example
 * ```tsx
 * <Table
 *   data={students}
 *   columns={[
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'email', header: 'Email' },
 *     { key: 'status', header: 'Status', render: (status) => <StatusBadge status={status} /> }
 *   ]}
 *   virtualized
 *   height={400}
 * />
 * ```
 */
export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  height = 400,
  rowHeight = 56,
  virtualized = false,
  sortable = true,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  onRowClick,
  className,
  caption,
  stickyHeader = true,
  LoadingComponent,
  EmptyComponent,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    let direction: SortDirection = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === columnKey && sortConfig.direction === 'desc') {
      direction = null;
    }

    setSortConfig({ key: columnKey, direction });
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedRows.size === sortedData.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(Array.from({ length: sortedData.length }, (_, i) => i)));
    }
  };

  const handleSelectRow = (index: number) => {
    if (!onSelectionChange) return;
    
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    onSelectionChange(newSelection);
  };

  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.key === 'string' && column.key.includes('.')) {
      // Handle nested properties
      return column.key.split('.').reduce((obj, key) => obj?.[key], row);
    }
    return row[column.key as keyof T];
  };

  // Select All Checkbox component with indeterminate support
  const SelectAllCheckbox: React.FC<{
    checked: boolean;
    onChange: () => void;
    indeterminate: boolean;
  }> = ({ checked, onChange, indeterminate }) => {
    const checkboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <input
        ref={checkboxRef}
        type="checkbox"
        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        checked={checked}
        onChange={onChange}
      />
    );
  };

  const renderCell = (row: T, column: Column<T>, index: number): React.ReactNode => {
    if (!row) return null;
    
    const value = getCellValue(row, column);
    
    if (column.render) {
      return column.render(value, row, index);
    }
    
    // Safely render primitive values
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    return '';
  };

  const TableHeader = () => (
    <thead className={cn('bg-gray-50', stickyHeader && 'sticky top-0 z-10')}>
      <tr>
        {selectable && (
          <th className="w-12 px-4 py-3 text-left">
            <SelectAllCheckbox
              checked={selectedRows.size === sortedData.length && sortedData.length > 0}
              onChange={handleSelectAll}
              indeterminate={selectedRows.size > 0 && selectedRows.size < sortedData.length}
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={String(column.key)}
            className={cn(
              'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
              column.sortable && sortable && 'cursor-pointer hover:bg-gray-100 select-none',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.headerClassName
            )}
            style={{ width: column.width }}
            onClick={() => column.sortable && handleSort(String(column.key))}
          >
            <div className="flex items-center space-x-1">
              <span>{column.header}</span>
              {column.sortable && sortable && (
                <span className="ml-1">
                  {sortConfig.key === column.key ? (
                    sortConfig.direction === 'asc' ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 12l5-5 5 5H5z" />
                    </svg>
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  const TableRow = ({ index, style }: { index: number; style?: React.CSSProperties }) => {
    const row = sortedData[index];
    if (!row) return null;
    
    const isSelected = selectedRows.has(index);

    return (
      <tr
        style={style}
        className={cn(
          'border-b border-gray-200 hover:bg-gray-50 transition-colors',
          isSelected && 'bg-brand-50',
          onRowClick && 'cursor-pointer'
        )}
        onClick={() => onRowClick?.(row, index)}
      >
        {selectable && (
          <td className="w-12 px-4 py-3">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectRow(index);
              }}
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
              column.cellClassName ? column.cellClassName(getCellValue(row, column), row) : undefined
            )}
            style={{ width: column.width }}
          >
            {renderCell(row, column, index)}
          </td>
        ))}
      </tr>
    );
  };

  const LoadingState = () => (
    <div className="flex items-center justify-center h-32">
      {LoadingComponent ? (
        <LoadingComponent />
      ) : (
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  );

  const EmptyState = () => (
    <div className="flex items-center justify-center h-32">
      {EmptyComponent ? (
        <EmptyComponent />
      ) : (
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={cn('bg-white shadow rounded-lg', className)}>
        <LoadingState />
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className={cn('bg-white shadow rounded-lg', className)}>
        <EmptyState />
      </div>
    );
  }

  if (virtualized && sortedData.length > 100) {
    return (
      <div className={cn('bg-white shadow rounded-lg overflow-hidden', className)}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <table className="min-w-full">
          <TableHeader />
        </table>
        <List
          height={height || 400}
          width="100%"
          itemCount={sortedData.length}
          itemSize={rowHeight || 50}
          className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300"
        >
          {({ index, style }) => (
            <div style={style}>
              <table className="min-w-full">
                <tbody>
                  <TableRow index={index} />
                </tbody>
              </table>
            </div>
          )}
        </List>
      </div>
    );
  }

  return (
    <div className={cn('bg-white shadow rounded-lg overflow-hidden', className)}>
      <table className="min-w-full">
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader />
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((_, index) => (
            <TableRow key={index} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Simple table for basic use cases
 */
export const SimpleTable = Table;