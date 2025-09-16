import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 날짜 포맷팅 유틸리티
 * @param date - Date 객체, ISO 문자열 또는 timestamp
 * @param formatStr - date-fns 포맷 문자열 (기본값: 'yyyy-MM-dd')
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  formatStr: string = 'yyyy-MM-dd'
): string {
  if (!date) return ''

  try {
    const dateObj = typeof date === 'string'
      ? parseISO(date)
      : typeof date === 'number'
      ? new Date(date)
      : date

    return format(dateObj, formatStr, { locale: ko })
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

/**
 * 시간 포맷팅 유틸리티
 * @param time - Date 객체, ISO 문자열, timestamp 또는 시간 문자열
 * @param formatStr - date-fns 포맷 문자열 (기본값: 'HH:mm')
 * @returns 포맷된 시간 문자열
 */
export function formatTime(
  time: Date | string | number | null | undefined,
  formatStr: string = 'HH:mm'
): string {
  if (!time) return ''

  try {
    const timeObj = typeof time === 'string'
      ? time.includes(':') && !time.includes('T')
        ? new Date(`1970-01-01T${time}`)
        : parseISO(time)
      : typeof time === 'number'
      ? new Date(time)
      : time

    return format(timeObj, formatStr, { locale: ko })
  } catch (error) {
    console.error('Time formatting error:', error)
    return ''
  }
}
