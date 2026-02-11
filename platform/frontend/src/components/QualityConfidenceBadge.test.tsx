import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
  }),
}))

import QualityConfidenceBadge from './QualityConfidenceBadge'

const sampleDimensions = {
  architecture: 90,
  security: 75,
  performance: 50,
  accessibility: 85,
  maintainability: 40,
}

describe('QualityConfidenceBadge', () => {
  it('renders score text', () => {
    render(<QualityConfidenceBadge score={85} />)
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('renders Quality Score title', () => {
    render(<QualityConfidenceBadge score={70} />)
    expect(screen.getByText('Quality Score')).toBeInTheDocument()
  })

  // Score color classes
  it('applies green color for high score (>=80)', () => {
    const { container } = render(<QualityConfidenceBadge score={92} />)
    const scoreEl = screen.getByText('92')
    expect(scoreEl.className).toContain('text-green-400')
    // Border on the circle container
    const circle = container.querySelector('.border-green-500')
    expect(circle).toBeInTheDocument()
  })

  it('applies yellow color for medium score (60-79)', () => {
    const { container } = render(<QualityConfidenceBadge score={65} />)
    const scoreEl = screen.getByText('65')
    expect(scoreEl.className).toContain('text-yellow-400')
    const circle = container.querySelector('.border-yellow-500')
    expect(circle).toBeInTheDocument()
  })

  it('applies red color for low score (<60)', () => {
    const { container } = render(<QualityConfidenceBadge score={35} />)
    const scoreEl = screen.getByText('35')
    expect(scoreEl.className).toContain('text-red-400')
    const circle = container.querySelector('.border-red-500')
    expect(circle).toBeInTheDocument()
  })

  // Labels
  it('shows Excellent label for score >= 80', () => {
    render(<QualityConfidenceBadge score={80} />)
    expect(screen.getByText('Excellent')).toBeInTheDocument()
  })

  it('shows Good label for score >= 60 and < 80', () => {
    render(<QualityConfidenceBadge score={60} />)
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('shows Needs Improvement label for score < 60', () => {
    render(<QualityConfidenceBadge score={30} />)
    expect(screen.getByText('Needs Improvement')).toBeInTheDocument()
  })

  // Dimension bars
  it('renders dimension bars when dimensions prop is provided', () => {
    render(<QualityConfidenceBadge score={75} dimensions={sampleDimensions} />)
    expect(screen.getByText('Architecture')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('Accessibility')).toBeInTheDocument()
    expect(screen.getByText('Maintainability')).toBeInTheDocument()
  })

  it('renders dimension score values', () => {
    render(<QualityConfidenceBadge score={75} dimensions={sampleDimensions} />)
    expect(screen.getByText('90')).toBeInTheDocument()
    // '75' appears twice: once as main score and once as security dimension
    expect(screen.getAllByText('75')).toHaveLength(2)
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
  })

  it('does not render dimension bars when dimensions prop is omitted', () => {
    render(<QualityConfidenceBadge score={80} />)
    expect(screen.queryByText('Architecture')).not.toBeInTheDocument()
    expect(screen.queryByText('Security')).not.toBeInTheDocument()
    expect(screen.queryByText('Performance')).not.toBeInTheDocument()
    expect(screen.queryByText('Accessibility')).not.toBeInTheDocument()
    expect(screen.queryByText('Maintainability')).not.toBeInTheDocument()
  })

  it('applies correct colors per dimension score', () => {
    const { container } = render(
      <QualityConfidenceBadge score={75} dimensions={sampleDimensions} />
    )
    // architecture=90 -> green, performance=50 -> red, security=75 -> yellow
    const greenBars = container.querySelectorAll('.bg-green-500')
    const yellowBars = container.querySelectorAll('.bg-yellow-500')
    const redBars = container.querySelectorAll('.bg-red-500')
    // architecture(90)=green, accessibility(85)=green => 2 green bars
    expect(greenBars.length).toBe(2)
    // security(75)=yellow => 1 yellow bar
    expect(yellowBars.length).toBe(1)
    // performance(50)=red, maintainability(40)=red => 2 red bars
    expect(redBars.length).toBe(2)
  })

  // Size variants
  it('uses md size config by default', () => {
    const { container } = render(<QualityConfidenceBadge score={80} />)
    const circle = container.querySelector('.w-24')
    expect(circle).toBeInTheDocument()
  })

  it('uses sm size config when size=sm', () => {
    const { container } = render(<QualityConfidenceBadge score={80} size="sm" />)
    const circle = container.querySelector('.w-16')
    expect(circle).toBeInTheDocument()
  })

  it('uses lg size config when size=lg', () => {
    const { container } = render(<QualityConfidenceBadge score={80} size="lg" />)
    const circle = container.querySelector('.w-32')
    expect(circle).toBeInTheDocument()
  })

  // Boundary values
  it('treats score of exactly 80 as green/excellent', () => {
    render(<QualityConfidenceBadge score={80} />)
    const scoreEl = screen.getByText('80')
    expect(scoreEl.className).toContain('text-green-400')
    expect(screen.getByText('Excellent')).toBeInTheDocument()
  })

  it('treats score of exactly 60 as yellow/good', () => {
    render(<QualityConfidenceBadge score={60} />)
    const scoreEl = screen.getByText('60')
    expect(scoreEl.className).toContain('text-yellow-400')
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('treats score of 59 as red/needs improvement', () => {
    render(<QualityConfidenceBadge score={59} />)
    const scoreEl = screen.getByText('59')
    expect(scoreEl.className).toContain('text-red-400')
    expect(screen.getByText('Needs Improvement')).toBeInTheDocument()
  })

  it('sets dimension bar width based on value', () => {
    const { container } = render(
      <QualityConfidenceBadge score={75} dimensions={sampleDimensions} />
    )
    const bars = container.querySelectorAll('.rounded-full.transition-all')
    const widths = Array.from(bars).map((bar) => (bar as HTMLElement).style.width)
    expect(widths).toContain('90%')
    expect(widths).toContain('75%')
    expect(widths).toContain('50%')
    expect(widths).toContain('85%')
    expect(widths).toContain('40%')
  })
})
