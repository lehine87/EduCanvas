'use client'

import { memo } from 'react'
import { 
  User, 
  School, 
  Users, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { SearchResult } from '@/lib/stores/searchStore'
import { useSearchStore } from '@/lib/stores/searchStore'

interface SearchResultCardProps {
  result: SearchResult
  isSelected?: boolean
}

function SearchResultCard({ result, isSelected = false }: SearchResultCardProps) {
  const { closeSidebar } = useSearchStore()

  // Get avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get type-specific icon
  const getIcon = () => {
    switch (result.type) {
      case 'student':
        return <User className="h-4 w-4 text-blue-500" />
      case 'class':
        return <School className="h-4 w-4 text-green-500" />
      case 'staff':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'schedule':
        return <Calendar className="h-4 w-4 text-orange-500" />
      default:
        return <User className="h-4 w-4 text-neutral-500" />
    }
  }

  // Handle card click
  const handleClick = () => {
    // Close sidebar
    closeSidebar()
    
    // Navigate to detail page (implement based on type)
    switch (result.type) {
      case 'student':
        window.location.href = `/main/students/${result.id}`
        break
      case 'class':
        window.location.href = `/main/classes/${result.id}`
        break
      case 'staff':
        window.location.href = `/main/staff/${result.id}`
        break
      case 'schedule':
        window.location.href = `/main/schedule/${result.id}`
        break
    }
  }

  return (
    <div
      className={`
        group relative flex items-center gap-3 p-3 rounded-lg
        transition-colors duration-200 cursor-pointer
        ${isSelected 
          ? 'bg-educanvas-100 dark:bg-educanvas-900/20 border border-educanvas-300 dark:border-educanvas-700' 
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Avatar or Icon */}
      <div className="flex-shrink-0">
        {result.metadata?.avatar ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={result.metadata.avatar} alt={result.title} />
            <AvatarFallback>{getInitials(result.title)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {getIcon()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title and badges */}
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {result.title}
          </h4>
          {result.metadata?.status && (
            <Badge
              variant={result.metadata.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {result.metadata.status === 'active' ? '활성' : '비활성'}
            </Badge>
          )}
        </div>

        {/* Subtitle */}
        {result.subtitle && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
            {result.subtitle}
          </p>
        )}

        {/* Enhanced Metadata for Students */}
        {result.metadata && (
          <div className="space-y-1 mt-1">
            {/* Primary contact info */}
            <div className="flex items-center gap-3">
              {result.metadata.phone && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <Phone className="h-3 w-3" />
                  {result.metadata.phone}
                </span>
              )}
              {result.metadata.email && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <Mail className="h-3 w-3" />
                  {result.metadata.email}
                </span>
              )}
            </div>
            
            {/* Student specific info */}
            {result.type === 'student' && (
              <div className="flex items-center gap-3 flex-wrap">
                {result.metadata.grade_level && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                    {result.metadata.grade_level}
                  </span>
                )}
                {result.metadata.school_name && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <MapPin className="h-3 w-3" />
                    {result.metadata.school_name}
                  </span>
                )}
                {result.metadata.parent_phone_1 && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <Phone className="h-3 w-3" />
                    <span className="text-neutral-400">학부모</span>
                    {result.metadata.parent_phone_1}
                  </span>
                )}
              </div>
            )}
            
            {/* Other types metadata */}
            {result.type !== 'student' && (
              <div className="flex items-center gap-3">
                {result.metadata.location && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <MapPin className="h-3 w-3" />
                    {result.metadata.location}
                  </span>
                )}
                {result.metadata.time && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <Clock className="h-3 w-3" />
                    {result.metadata.time}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {result.description && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
            {result.description}
          </p>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-1">
          {/* Student specific quick actions */}
          {result.type === 'student' && result.metadata && (
            <>
              {result.metadata.phone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`tel:${result.metadata?.phone}`)
                  }}
                  aria-label="전화걸기"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              {result.metadata.parent_phone_1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(`tel:${result.metadata?.parent_phone_1}`)
                  }}
                  aria-label="학부모 전화걸기"
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Open consultation modal
                  console.log('Open consultation for', result.title)
                }}
                aria-label="상담 예약"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Custom actions from result */}
          {result.actions?.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
              }}
              aria-label={action.label}
            >
              {action.label === '보기' && <Eye className="h-4 w-4" />}
              {action.label === '편집' && <Edit className="h-4 w-4" />}
              {action.label === '삭제' && <Trash2 className="h-4 w-4" />}
              {!['보기', '편집', '삭제'].includes(action.label) && (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ))}
          
          {/* Default navigation arrow */}
          {(!result.actions || result.actions.length === 0) && result.type !== 'student' && (
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          )}
        </div>
      </div>

      {/* Match score indicator */}
      {result.matchScore && result.matchScore > 0.8 && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs bg-educanvas-100 dark:bg-educanvas-900">
            높은 일치
          </Badge>
        </div>
      )}
    </div>
  )
}

export default memo(SearchResultCard)