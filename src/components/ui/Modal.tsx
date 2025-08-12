'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import type { BaseComponentProps, AccessibilityProps, ComponentSize } from './types'

interface ModalProps extends BaseComponentProps, AccessibilityProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: ComponentSize | 'full'
  closable?: boolean
  footer?: React.ReactNode
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md',
  closable = true,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className, 
  children,
  'data-testid': testId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      // Focus trap - focus first focusable element
      setTimeout(() => {
        const focusableElement = modalRef.current?.querySelector(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        ) as HTMLElement
        
        focusableElement?.focus()
      }, 100)
      
      return () => {
        document.body.style.overflow = ''
        // Restore focus
        if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
          previousFocusRef.current.focus()
        }
      }
    }
  }, [isOpen])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && closeOnEscape && closable) {
        event.preventDefault()
        onClose()
      }
    }

    function handleFocusTrap(event: KeyboardEvent) {
      if (!isOpen || event.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      ) as NodeListOf<HTMLElement>

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleFocusTrap)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('keydown', handleFocusTrap)
      }
    }
  }, [isOpen, closable, closeOnEscape, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-full h-full m-0'
  }

  function handleOverlayClick(event: React.MouseEvent) {
    if (event.target === overlayRef.current && closeOnOverlayClick && closable) {
      onClose()
    }
  }

  const modalContent = (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      data-testid={testId}
    >
      <div 
        ref={modalRef}
        className={cn(
          'bg-white rounded-lg shadow-xl w-full relative',
          sizeClasses[size],
          size === 'full' ? 'h-full' : 'max-h-[90vh] overflow-y-auto',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {(title || closable) && (
          <div className="flex items-center justify-between p-6 border-b">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {closable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="모달 닫기"
                className="p-2 h-auto"
                data-testid={`${testId}-close-button`}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// Confirmation Modal
interface ConfirmModalProps extends Omit<ModalProps, 'children'> {
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmModal({
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'info',
  loading = false,
  onConfirm,
  onClose,
  ...props
}: ConfirmModalProps) {
  const variantStyles = {
    danger: 'error',
    warning: 'warning', 
    info: 'primary'
  } as const

  const icons = {
    danger: (
      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <Modal
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variantStyles[variant]}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </>
      }
      {...props}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 mt-1">
          {icons[variant]}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  )
}

// Alert Modal (non-blocking notification)
interface AlertModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  message: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  confirmText?: string
}

export function AlertModal({
  message,
  variant = 'info',
  confirmText = '확인',
  onClose,
  ...props
}: AlertModalProps) {
  const variantStyles = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'primary'
  } as const

  const icons = {
    success: (
      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  return (
    <Modal
      onClose={onClose}
      size="sm"
      footer={
        <Button
          variant={variantStyles[variant]}
          onClick={onClose}
          fullWidth
        >
          {confirmText}
        </Button>
      }
      {...props}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 mt-1">
          {icons[variant]}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  )
}