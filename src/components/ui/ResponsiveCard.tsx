'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ResponsiveCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  icon?: LucideIcon
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    color?: string
  }
  className?: string
  headerActions?: React.ReactNode
  footerActions?: React.ReactNode
  size?: 'compact' | 'normal' | 'expanded'
  variant?: 'default' | 'glass' | 'elevated' | 'bordered'
  animate?: boolean
}

const sizeStyles = {
  compact: {
    card: 'min-h-[160px]',
    header: 'pb-2',
    content: 'pt-0',
    title: 'text-sm font-medium',
    subtitle: 'text-xs'
  },
  normal: {
    card: 'min-h-[200px]',
    header: 'pb-3',
    content: 'pt-0',
    title: 'text-base font-semibold',
    subtitle: 'text-sm'
  },
  expanded: {
    card: 'min-h-[280px]',
    header: 'pb-4',
    content: 'pt-0',
    title: 'text-lg font-semibold',
    subtitle: 'text-base'
  }
}

const variantStyles = {
  default: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
  glass: 'bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/20 dark:border-neutral-800/20 shadow-xl',
  elevated: 'bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl border-0',
  bordered: 'bg-transparent border-2 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
}

export function ResponsiveCard({
  title,
  subtitle,
  children,
  icon: Icon,
  badge,
  className,
  headerActions,
  footerActions,
  size = 'normal',
  variant = 'default',
  animate = true
}: ResponsiveCardProps) {
  const styles = sizeStyles[size]
  
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  }

  const content = (
    <Card className={cn(
      styles.card,
      variantStyles[variant],
      'transition-all duration-200',
      className
    )}>
      <CardHeader className={cn(styles.header, 'flex flex-row items-start justify-between')}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {Icon && (
            <div className="flex-shrink-0 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Icon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className={cn(styles.title, 'truncate')}>
                {title}
              </CardTitle>
              
              {badge && (
                <Badge 
                  variant={badge.variant || 'default'}
                  className={cn(
                    'text-xs px-2 py-0.5',
                    badge.color
                  )}
                >
                  {badge.text}
                </Badge>
              )}
            </div>
            
            {subtitle && (
              <p className={cn(
                styles.subtitle,
                'text-neutral-600 dark:text-neutral-400 truncate'
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {headerActions && (
          <div className="flex-shrink-0 ml-2">
            {headerActions}
          </div>
        )}
      </CardHeader>
      
      <CardContent className={styles.content}>
        {children}
        
        {footerActions && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            {footerActions}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (animate) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        layout
      >
        {content}
      </motion.div>
    )
  }

  return content
}

// 특화된 ResponsiveCard 변형들
export function StudentInfoCard({
  children,
  className,
  ...props
}: Omit<ResponsiveCardProps, 'variant' | 'size'> & {
  className?: string
}) {
  return (
    <ResponsiveCard
      variant="glass"
      size="normal"
      className={cn('hover:shadow-lg transition-shadow', className)}
      {...props}
    >
      {children}
    </ResponsiveCard>
  )
}

export function QuickStatsCard({
  value,
  label,
  change,
  trend,
  className,
  ...props
}: Omit<ResponsiveCardProps, 'variant' | 'size' | 'children'> & {
  value: string | number
  label: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}) {
  return (
    <ResponsiveCard
      variant="elevated"
      size="compact"
      className={cn('text-center', className)}
      {...props}
    >
      <div className="space-y-2">
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {value}
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {label}
        </div>
        {change && (
          <div className={cn(
            'text-xs font-medium',
            trend === 'up' && 'text-green-600 dark:text-green-400',
            trend === 'down' && 'text-red-600 dark:text-red-400',
            trend === 'neutral' && 'text-neutral-600 dark:text-neutral-400'
          )}>
            {change}
          </div>
        )}
      </div>
    </ResponsiveCard>
  )
}

export function ActionCard({
  children,
  onClick,
  className,
  ...props
}: Omit<ResponsiveCardProps, 'variant' | 'size'> & {
  onClick?: () => void
  className?: string
}) {
  return (
    <ResponsiveCard
      variant="bordered"
      size="compact"
      className={cn(
        'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
        'transition-colors',
        className
      )}
      {...props}
    >
      <div onClick={onClick}>
        {children}
      </div>
    </ResponsiveCard>
  )
}