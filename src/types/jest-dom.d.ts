/**
 * Jest DOM matchers type declarations
 * Provides TypeScript support for @testing-library/jest-dom matchers
 */

import '@testing-library/jest-dom'

declare global {
  namespace Vi {
    interface JestAssertion<T = unknown> extends jest.Matchers<void, T> {
      toBeInTheDocument(): void
      toHaveTextContent(text: string | RegExp): void
      toHaveAttribute(attr: string, value?: string): void
      toHaveClass(className: string): void
      toBeVisible(): void
      toBeEnabled(): void
      toBeDisabled(): void
      toHaveValue(value: string | number): void
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): void
      toBeChecked(): void
      toHaveFocus(): void
      toHaveStyle(css: Record<string, unknown> | string): void
      toContainElement(element: HTMLElement | null): void
      toContainHTML(htmlText: string): void
      toHaveErrorMessage(text: string | RegExp): void
      toHaveDescription(text: string | RegExp): void
      toHaveAccessibleName(name: string | RegExp): void
      toHaveAccessibleDescription(description: string | RegExp): void
    }
  }
}

// Export empty object to make this a module
export {}