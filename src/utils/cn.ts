/**
 * Class name utility for TailwindCSS
 * 
 * Combines and merges TailwindCSS classes with conflict resolution.
 * Based on clsx for conditional class names and tailwind-merge for 
 * intelligent class conflict resolution.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names and resolves TailwindCSS conflicts
 * 
 * @param inputs - Class values (strings, objects, arrays, conditionals)
 * @returns Merged and optimized class string
 * 
 * @example
 * ```typescript
 * cn('px-2 py-1', 'px-3') // "py-1 px-3" (px-2 is overridden)
 * cn('bg-red-500', condition && 'bg-blue-500') // conditional classes
 * cn(['text-sm', { 'font-bold': isBold }]) // mixed arrays and objects
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Conditional class name utility with explicit conditional logic
 * 
 * @param baseClasses - Base classes that are always applied
 * @param conditionalClasses - Object with condition-class pairs
 * @returns Merged class string
 * 
 * @example
 * ```typescript
 * conditionalCn('btn', {
 *   'btn-primary': variant === 'primary',
 *   'btn-disabled': disabled,
 *   'btn-loading': loading
 * })
 * ```
 */
export function conditionalCn(
  baseClasses: string,
  conditionalClasses: Record<string, boolean>
): string {
  return cn(baseClasses, conditionalClasses);
}

/**
 * Variant-based class name utility for component variants
 * 
 * @param baseClasses - Base classes
 * @param variants - Variant configuration object
 * @param selectedVariants - Selected variant values
 * @returns Merged class string
 * 
 * @example
 * ```typescript
 * const buttonVariants = {
 *   variant: {
 *     primary: 'bg-blue-500 text-white',
 *     secondary: 'bg-gray-500 text-white'
 *   },
 *   size: {
 *     sm: 'px-2 py-1 text-sm',
 *     md: 'px-4 py-2 text-base'
 *   }
 * }
 * 
 * variantCn('btn', buttonVariants, { variant: 'primary', size: 'md' })
 * ```
 */
export function variantCn<T extends Record<string, Record<string, string>>>(
  baseClasses: string,
  variants: T,
  selectedVariants: Partial<{
    [K in keyof T]: keyof T[K];
  }>,
  conditionalClasses?: Record<string, boolean>
): string {
  const variantClasses = Object.entries(selectedVariants).map(([key, value]) => {
    const variantGroup = variants[key];
    return variantGroup?.[value as string] || '';
  });

  return cn(baseClasses, ...variantClasses, conditionalClasses);
}

/**
 * Focus-visible utility for accessible focus states
 * Only shows focus ring when navigating with keyboard
 * 
 * @param focusClasses - Focus ring classes (default: focus-visible:ring-2 focus-visible:ring-primary-500)
 * @returns Focus-visible classes
 */
export function focusVisibleCn(
  focusClasses: string = 'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-75'
): string {
  return `focus:outline-none ${focusClasses}`;
}

/**
 * Animation class utility for consistent animations
 * 
 * @param animationType - Type of animation
 * @param duration - Animation duration (default: 200ms)
 * @returns Animation classes
 */
export function animationCn(
  animationType: 'fade' | 'slide' | 'scale' | 'bounce',
  duration: number = 200
): string {
  const baseTransition = `transition-all duration-${duration} ease-in-out`;
  
  const animations = {
    fade: 'animate-fadeIn',
    slide: 'animate-slideUp',
    scale: 'animate-scaleIn',
    bounce: 'animate-bounce'
  };
  
  return cn(baseTransition, animations[animationType]);
}

/**
 * Responsive utility for mobile-first responsive classes
 * 
 * @param classes - Object with breakpoint-class pairs
 * @returns Responsive classes
 * 
 * @example
 * ```typescript
 * responsiveCn({
 *   base: 'text-sm',
 *   sm: 'text-base',
 *   md: 'text-lg',
 *   lg: 'text-xl'
 * })
 * // Returns: "text-sm sm:text-base md:text-lg lg:text-xl"
 * ```
 */
export function responsiveCn(classes: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}): string {
  const { base = '', sm, md, lg, xl, '2xl': xl2 } = classes;
  
  return cn(
    base,
    sm && `sm:${sm}`,
    md && `md:${md}`,
    lg && `lg:${lg}`,
    xl && `xl:${xl}`,
    xl2 && `2xl:${xl2}`
  );
}

/**
 * Dark mode utility for consistent dark mode classes
 * 
 * @param lightClasses - Classes for light mode
 * @param darkClasses - Classes for dark mode
 * @returns Combined light/dark classes
 */
export function darkModeCn(lightClasses: string, darkClasses: string): string {
  return cn(lightClasses, `dark:${darkClasses}`);
}