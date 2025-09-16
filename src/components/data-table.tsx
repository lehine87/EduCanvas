"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnResizeMode,
  Column,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchable?: boolean
  searchPlaceholder?: string
  selectable?: boolean
  onRowSelect?: (selectedRows: TData[]) => void
  actionColumn?: boolean
  onView?: (row: TData) => void
  onEdit?: (row: TData) => void
  onDelete?: (row: TData) => void
  pagination?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  enableColumnResizing?: boolean
  columnResizeMode?: ColumnResizeMode
  loading?: boolean
  noDataMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = "검색...",
  selectable = false,
  onRowSelect,
  actionColumn = false,
  onView,
  onEdit,
  onDelete,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  enableColumnResizing = false,
  columnResizeMode = "onChange",
  loading = false,
  noDataMessage = "결과가 없습니다.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnSizes, setColumnSizes] = React.useState<Record<string, number>>({})

  // 커스텀 리사이징 핸들러 - 인접한 두 컬럼만 크기 조절
  const createResizeHandler = (leftColumnId: string, rightColumnId: string) => {
    return (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault()
      
      const startX = mouseDownEvent.clientX
      const leftColumn = table.getColumn(leftColumnId)
      const rightColumn = table.getColumn(rightColumnId)
      
      if (!leftColumn || !rightColumn) return
      
      const startLeftSize = leftColumn.getSize()
      const startRightSize = rightColumn.getSize()
      const totalSize = startLeftSize + startRightSize
      const minSize = 50
      
      const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
        const deltaX = mouseMoveEvent.clientX - startX
        let newLeftSize = startLeftSize + deltaX
        let newRightSize = totalSize - newLeftSize
        
        // 최소/최대 크기 제한
        if (newLeftSize < minSize) {
          newLeftSize = minSize
          newRightSize = totalSize - minSize
        }
        if (newRightSize < minSize) {
          newRightSize = minSize
          newLeftSize = totalSize - minSize
        }
        
        // 직접 컬럼 크기 설정 (다른 컬럼에 영향 없음)
        setColumnSizes(prev => ({
          ...prev,
          [leftColumnId]: newLeftSize,
          [rightColumnId]: newRightSize
        }))
      }
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }

  // 선택 가능한 체크박스 컬럼 생성
  const selectColumn: ColumnDef<TData> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="모두 선택"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="행 선택"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
  }

  // 액션 컬럼 생성
  const actionsColumn: ColumnDef<TData> = {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                <span className="sr-only">메뉴 열기</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>액션</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onView && (
              <DropdownMenuItem onClick={() => onView(row.original)}>
                보기
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                편집
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(row.original)}
                className="text-red-600"
              >
                삭제
              </DropdownMenuItem>
            )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableSorting: false,
    enableResizing: false,
    size: 60,
    minSize: 60,
    maxSize: 60,
  }

  // 최종 컬럼 구성
  const finalColumns = React.useMemo(() => {
    let cols = [...columns]
    
    if (selectable) {
      cols = [selectColumn, ...cols]
    }
    
    if (actionColumn) {
      cols = [...cols, actionsColumn]
    }
    
    return cols
  }, [columns, selectable, actionColumn])

  const table = useReactTable({
    data,
    columns: finalColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableColumnResizing,
    columnResizeMode: "onEnd",
    columnResizeDirection: "ltr",
    defaultColumn: {
      size: 150,
      minSize: 50,
      maxSize: 400,
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing: columnSizes,
    },
  })

  // 선택된 행 변경 시 콜백 호출
  React.useEffect(() => {
    if (onRowSelect && selectable && Object.keys(rowSelection).length >= 0) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelect(selectedRows)
    }
  }, [rowSelection])

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {searchable && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              컬럼 <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border flex flex-col overflow-hidden">
        {/* 고정 헤더 */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-b">
          <Table className="min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const nextHeader = headerGroup.headers[index + 1]
                    const canResize = enableColumnResizing &&
                      nextHeader &&
                      header.column.getCanResize() &&
                      nextHeader.column.getCanResize()

                    const customSize = columnSizes[header.id]
                    const columnWidth = enableColumnResizing ?
                      (customSize ? `${customSize}px` : `${header.getSize()}px`) :
                      undefined

                    // 고정 크기 컬럼과 액션 컬럼 바로 앞 컬럼은 세로선 제거
                    const isSelectColumn = selectable && header.id === 'select'
                    const isActionColumn = actionColumn && header.id === 'actions'
                    const isFixedColumn = isSelectColumn || isActionColumn
                    const isLastColumn = index === headerGroup.headers.length - 1
                    const nextIsActionColumn = nextHeader && nextHeader.id === 'actions' && actionColumn

                    const shouldRemoveBorder = isFixedColumn || isLastColumn || nextIsActionColumn

                    const borderClass = shouldRemoveBorder ?
                      "relative overflow-hidden" :
                      "border-r border-gray-200 relative overflow-hidden"

                    return (
                      <TableHead
                        key={header.id}
                        className={borderClass}
                        style={{ width: columnWidth }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canResize && (
                          <div
                            onMouseDown={createResizeHandler(header.id, nextHeader.id)}
                            className="absolute top-0 right-0 h-full w-3 cursor-col-resize select-none touch-none flex items-center justify-center"
                            style={{ right: '-6px' }}
                          >
                            <div
                              className="w-[2px] h-full bg-gray-300 opacity-0 hover:opacity-100 hover:bg-blue-500 transition-all"
                            />
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
          </Table>
        </div>

        {/* 스크롤 가능한 테이블 본체 */}
        <div className="flex-1 overflow-y-auto min-h-0 max-h-96">
          <Table
            className="min-w-full"
            style={{
              width: '100%',
              tableLayout: 'fixed'
            }}
          >
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {finalColumns.map((column, colIndex) => (
                    <TableCell key={colIndex} className="!px-2">
                      <div className="h-6 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const customSize = columnSizes[cell.column.id]
                    const cellWidth = enableColumnResizing ? 
                      (customSize ? `${customSize}px` : `${cell.column.getSize()}px`) : 
                      undefined
                    
                    return (
                    <TableCell 
                      key={cell.id}
                      className="overflow-hidden !px-2"
                      style={{ width: cellWidth }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={finalColumns.length}
                  className="h-24 text-center !px-2"
                >
                  {noDataMessage || "결과가 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
      {pagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectable ? (
              <>
                {table.getFilteredSelectedRowModel().rows.length}개 중{" "}
                {table.getFilteredRowModel().rows.length}개 행 선택됨
              </>
            ) : (
              <>
                총 {table.getFilteredRowModel().rows.length}개 중{" "}
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                -{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}개 표시
              </>
            )}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">페이지당 행 수</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              페이지 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">첫 페이지</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">이전 페이지</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">다음 페이지</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">마지막 페이지</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 편의를 위한 정렬 가능한 컬럼 헤더 헬퍼 컴포넌트
export function SortableHeader<TData>({ column, children }: {
  column: Column<TData, unknown>
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto p-0 font-semibold -mx-2 justify-start"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}