'use client';

import React from 'react';
import { Button } from '@/components/ui';

export default function DesignSystemTestPage() {
  return (
    <div className="min-h-screen bg-secondary-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">
            EduCanvas Design System Test
          </h1>
          <p className="text-lg text-secondary-600">
            Testing TailwindCSS 4 custom design system components
          </p>
        </div>

        {/* Color Palette Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Color Palette Test</h2>
          
          {/* Basic Colors Test First */}
          <div>
            <h3 className="text-lg font-medium mb-3">Basic Colors (should work)</h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-red-500 border border-gray-200" />
                <p className="text-xs text-gray-600">Red</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-blue-500 border border-gray-200" />
                <p className="text-xs text-gray-600">Blue</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-green-500 border border-gray-200" />
                <p className="text-xs text-gray-600">Green</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-yellow-500 border border-gray-200" />
                <p className="text-xs text-gray-600">Yellow</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-purple-500 border border-gray-200" />
                <p className="text-xs text-gray-600">Purple</p>
              </div>
            </div>
          </div>

          {/* CSS Variable Test */}
          <div>
            <h3 className="text-lg font-medium mb-3">CSS Variables Test</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div 
                  className="h-12 w-12 rounded-lg border border-gray-300" 
                  style={{ backgroundColor: 'var(--color-primary-500)' }}
                />
                <p className="text-xs text-gray-600">CSS Var Primary</p>
              </div>
              <div className="text-center">
                <div 
                  className="h-12 w-12 rounded-lg border border-gray-300" 
                  style={{ backgroundColor: 'var(--color-success-500)' }}
                />
                <p className="text-xs text-gray-600">CSS Var Success</p>
              </div>
              <div className="text-center">
                <div 
                  className="h-12 w-12 rounded-lg border border-gray-300" 
                  style={{ backgroundColor: 'var(--color-warning-500)' }}
                />
                <p className="text-xs text-gray-600">CSS Var Warning</p>
              </div>
              <div className="text-center">
                <div 
                  className="h-12 w-12 rounded-lg border border-gray-300" 
                  style={{ backgroundColor: 'var(--color-error-500)' }}
                />
                <p className="text-xs text-gray-600">CSS Var Error</p>
              </div>
            </div>
          </div>

          {/* Custom Primary Colors */}
          <div>
            <h3 className="text-lg font-medium mb-3">Custom Primary Colors</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-50 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">50</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-100 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">100</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-200 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">200</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-300 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">300</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-400 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">400</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-500 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">500</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-600 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">600</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-700 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">700</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-800 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">800</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-lg bg-primary-900 border border-gray-300" />
                <p className="text-xs text-center text-gray-600">900</p>
              </div>
            </div>
          </div>

          {/* Status Colors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-16 w-full bg-success-500 rounded-lg mb-2" />
              <p className="font-medium text-gray-700">Success</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-full bg-warning-500 rounded-lg mb-2" />
              <p className="font-medium text-gray-700">Warning</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-full bg-error-500 rounded-lg mb-2" />
              <p className="font-medium text-gray-700">Error</p>
            </div>
          </div>
        </section>

        {/* Typography Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">Typography</h2>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-secondary-900">Heading 1 (5xl)</h1>
            <h2 className="text-4xl font-bold text-secondary-800">Heading 2 (4xl)</h2>
            <h3 className="text-3xl font-semibold text-secondary-700">Heading 3 (3xl)</h3>
            <h4 className="text-2xl font-semibold text-secondary-700">Heading 4 (2xl)</h4>
            <h5 className="text-xl font-medium text-secondary-600">Heading 5 (xl)</h5>
            <h6 className="text-lg font-medium text-secondary-600">Heading 6 (lg)</h6>
            <p className="text-base text-secondary-600 leading-relaxed">
              Body text example with Inter font. This demonstrates the default paragraph styling
              with proper line height and color contrast for optimal readability.
            </p>
            <p className="text-sm text-secondary-500">Small text (sm)</p>
            <p className="text-xs text-secondary-400">Extra small text (xs)</p>
          </div>
        </section>

        {/* Button Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="success">Success Button</Button>
            <Button variant="warning">Warning Button</Button>
            <Button variant="error">Error Button</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">CSS Primary</button>
            <button className="btn-secondary">CSS Secondary</button>
            <button className="btn-ghost">CSS Ghost</button>
          </div>
        </section>

        {/* Form Controls Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">Form Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Default Input
              </label>
              <input
                type="text"
                placeholder="Enter text..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-success-700 mb-1">
                Success Input
              </label>
              <input
                type="text"
                placeholder="Success state..."
                className="input-success"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-error-700 mb-1">
                Error Input
              </label>
              <input
                type="text"
                placeholder="Error state..."
                className="input-error"
              />
            </div>
          </div>
        </section>

        {/* Card Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Card Title</h3>
              </div>
              <div className="card-body">
                <p className="text-secondary-600">
                  This is a basic card component with header, body, and footer sections.
                </p>
              </div>
              <div className="card-footer">
                <button className="btn-primary">Action</button>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Simple Card</h3>
                <p className="text-secondary-600">
                  Card with only body content and no header or footer.
                </p>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Hover Card</h3>
                <p className="text-secondary-600">
                  This card has hover effects applied for better interactivity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Badge Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <span className="badge-primary">Primary</span>
            <span className="badge-secondary">Secondary</span>
            <span className="badge-success">Success</span>
            <span className="badge-warning">Warning</span>
            <span className="badge-error">Error</span>
          </div>
        </section>

        {/* Alert Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">Alerts</h2>
          <div className="space-y-4 max-w-3xl">
            <div className="alert-info">
              <strong>Info:</strong> This is an informational message.
            </div>
            <div className="alert-success">
              <strong>Success:</strong> Operation completed successfully!
            </div>
            <div className="alert-warning">
              <strong>Warning:</strong> Please review your settings.
            </div>
            <div className="alert-error">
              <strong>Error:</strong> Something went wrong. Please try again.
            </div>
          </div>
        </section>

        {/* ClassFlow Components Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">ClassFlow Components</h2>
          
          {/* Student Cards */}
          <div>
            <h3 className="text-lg font-medium mb-3">Student Cards</h3>
            <div className="student-grid max-w-4xl">
              <div className="student-card">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                    김
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">김학생</p>
                    <p className="text-sm text-secondary-500">중등 수학 A반</p>
                  </div>
                </div>
              </div>

              <div className="student-card dragging">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center text-white font-semibold">
                    이
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">이학생</p>
                    <p className="text-sm text-secondary-500">고등 영어 B반</p>
                  </div>
                </div>
              </div>

              <div className="student-card">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-warning-500 rounded-full flex items-center justify-center text-white font-semibold">
                    박
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">박학생</p>
                    <p className="text-sm text-secondary-500">중등 과학 C반</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drop Zones */}
          <div>
            <h3 className="text-lg font-medium mb-3">Drop Zones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="drop-zone p-6 text-center">
                <p className="text-secondary-600">Default Drop Zone</p>
              </div>
              <div className="drop-zone drop-zone-active p-6 text-center">
                <p className="text-primary-600 font-medium">Active Drop Zone</p>
              </div>
              <div className="drop-zone drop-zone-invalid p-6 text-center">
                <p className="text-error-600 font-medium">Invalid Drop Zone</p>
              </div>
            </div>
          </div>

          {/* Class Boxes */}
          <div>
            <h3 className="text-lg font-medium mb-3">Class Boxes</h3>
            <div className="class-grid max-w-4xl">
              <div className="class-box">
                <h4 className="text-lg font-semibold text-secondary-900 mb-2">중등 수학 A반</h4>
                <p className="text-secondary-600 mb-4">강사: 김선생님</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500">학생 수:</span>
                    <span className="text-secondary-700">15명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500">시간:</span>
                    <span className="text-secondary-700">14:00 - 16:00</span>
                  </div>
                </div>
              </div>

              <div className="class-box">
                <h4 className="text-lg font-semibold text-secondary-900 mb-2">고등 영어 B반</h4>
                <p className="text-secondary-600 mb-4">강사: 이선생님</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500">학생 수:</span>
                    <span className="text-secondary-700">12명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-500">시간:</span>
                    <span className="text-secondary-700">16:00 - 18:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Animation Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">Animations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card fade-in">
              <div className="card-body text-center">
                <p className="text-secondary-600">Fade In Animation</p>
              </div>
            </div>
            <div className="card slide-up">
              <div className="card-body text-center">
                <p className="text-secondary-600">Slide Up Animation</p>
              </div>
            </div>
            <div className="card scale-in">
              <div className="card-body text-center">
                <p className="text-secondary-600">Scale In Animation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Loading and Utility Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary-900">Utilities</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="loading-spinner"></span>
              <span className="text-secondary-600">Loading Spinner</span>
            </div>
            
            <div className="max-w-md">
              <p className="text-ellipsis-2 text-secondary-600">
                This is a very long text that will be truncated to exactly two lines using the 
                text-ellipsis-2 utility class that we defined in our design system.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="glass p-4 rounded-lg">
                <p className="text-secondary-800">Glass effect background</p>
              </div>
              <div className="gradient-primary text-white p-4 rounded-lg">
                <p>Primary gradient background</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}