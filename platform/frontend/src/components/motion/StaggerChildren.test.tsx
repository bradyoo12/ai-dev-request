import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import StaggerChildren, { staggerItemVariants } from './StaggerChildren'

// Mock IntersectionObserver for framer-motion viewport detection
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [{ isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return [] }
  }
})

describe('StaggerChildren', () => {
  it('renders children', () => {
    render(
      <StaggerChildren>
        <p>Child 1</p>
        <p>Child 2</p>
      </StaggerChildren>
    )
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
  })

  it('applies className', () => {
    const { container } = render(
      <StaggerChildren className="grid gap-4">
        <div>Item</div>
      </StaggerChildren>
    )
    expect(container.firstElementChild).toHaveClass('grid')
    expect(container.firstElementChild).toHaveClass('gap-4')
  })

  it('accepts custom staggerDelay without crashing', () => {
    render(
      <StaggerChildren staggerDelay={0.2}>
        <p>Fast stagger</p>
      </StaggerChildren>
    )
    expect(screen.getByText('Fast stagger')).toBeInTheDocument()
  })

  it('renders with default staggerDelay', () => {
    render(
      <StaggerChildren>
        <p>Default stagger</p>
      </StaggerChildren>
    )
    expect(screen.getByText('Default stagger')).toBeInTheDocument()
  })

  it('exports staggerItemVariants with correct shape', () => {
    expect(staggerItemVariants).toHaveProperty('hidden')
    expect(staggerItemVariants).toHaveProperty('visible')
    expect(staggerItemVariants.hidden).toEqual({ opacity: 0, y: 20 })
    expect(staggerItemVariants.visible).toHaveProperty('opacity', 1)
    expect(staggerItemVariants.visible).toHaveProperty('y', 0)
  })
})
