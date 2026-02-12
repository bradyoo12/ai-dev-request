import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import FadeIn from './FadeIn'

// Mock IntersectionObserver for framer-motion viewport detection
beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      // Immediately trigger as intersecting so whileInView animations fire
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

describe('FadeIn', () => {
  it('renders children', () => {
    render(<FadeIn><p>Hello World</p></FadeIn>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    const { container } = render(
      <FadeIn className="custom-class"><span>Content</span></FadeIn>
    )
    expect(container.firstElementChild).toHaveClass('custom-class')
  })

  it('renders multiple children', () => {
    render(
      <FadeIn>
        <p>First</p>
        <p>Second</p>
      </FadeIn>
    )
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('accepts direction prop without crashing', () => {
    const directions = ['up', 'down', 'left', 'right', 'none'] as const
    for (const direction of directions) {
      const { unmount } = render(
        <FadeIn direction={direction}><span>{direction}</span></FadeIn>
      )
      expect(screen.getByText(direction)).toBeInTheDocument()
      unmount()
    }
  })

  it('accepts delay and duration props without crashing', () => {
    render(
      <FadeIn delay={0.5} duration={1.0}>
        <span>Delayed content</span>
      </FadeIn>
    )
    expect(screen.getByText('Delayed content')).toBeInTheDocument()
  })

  it('accepts distance prop without crashing', () => {
    render(
      <FadeIn distance={50}>
        <span>Far content</span>
      </FadeIn>
    )
    expect(screen.getByText('Far content')).toBeInTheDocument()
  })
})
