import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../api/refinement', () => ({
  getChatHistory: vi.fn(() => Promise.resolve([])),
  sendChatMessage: vi.fn(),
  sendChatMessageStream: vi.fn(),
  applyChanges: vi.fn(),
}))

vi.mock('../api/suggestions', () => ({
  createSuggestion: vi.fn(),
}))

import RefinementChat, { parseFollowUpActions, parseSuggestionFromContent } from './RefinementChat'

beforeEach(() => { vi.clearAllMocks() })

describe('RefinementChat', () => {
  it('renders chat header', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByText('refinement.title')).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByText('refinement.emptyTitle')).toBeInTheDocument()
    expect(screen.getByText('refinement.emptyDescription')).toBeInTheDocument()
  })

  it('renders suggestion buttons', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByText('refinement.suggestion1')).toBeInTheDocument()
    expect(screen.getByText('refinement.suggestion2')).toBeInTheDocument()
    expect(screen.getByText('refinement.suggestion3')).toBeInTheDocument()
  })

  it('renders send button', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByText('refinement.send')).toBeInTheDocument()
  })

  it('renders textarea placeholder', async () => {
    await act(async () => {
      render(<RefinementChat requestId="req-1" />)
    })
    expect(screen.getByPlaceholderText('refinement.placeholder')).toBeInTheDocument()
  })
})

describe('parseFollowUpActions', () => {
  it('parses valid follow_up_actions block', () => {
    const content = `Here is some explanation about the code.

\`\`\`follow_up_actions
[{"label":"Show me the tests","message":"Show me the test files for this component"},{"label":"Modify this","message":"I'd like to change this implementation"}]
\`\`\``
    const result = parseFollowUpActions(content)
    expect(result.actions).toHaveLength(2)
    expect(result.actions[0].label).toBe('Show me the tests')
    expect(result.actions[0].message).toBe('Show me the test files for this component')
    expect(result.actions[1].label).toBe('Modify this')
    expect(result.actions[1].message).toBe("I'd like to change this implementation")
    expect(result.cleanContent).toBe('Here is some explanation about the code.')
  })

  it('returns empty actions when no block present', () => {
    const content = 'Just a normal response without any follow-up actions.'
    const result = parseFollowUpActions(content)
    expect(result.actions).toHaveLength(0)
    expect(result.cleanContent).toBe(content)
  })

  it('returns empty actions for malformed JSON', () => {
    const content = `Some text

\`\`\`follow_up_actions
not valid json
\`\`\``
    const result = parseFollowUpActions(content)
    expect(result.actions).toHaveLength(0)
    expect(result.cleanContent).toBe(content)
  })

  it('returns empty actions when JSON is not an array', () => {
    const content = `Some text

\`\`\`follow_up_actions
{"label":"test","message":"test"}
\`\`\``
    const result = parseFollowUpActions(content)
    expect(result.actions).toHaveLength(0)
    expect(result.cleanContent).toBe(content)
  })

  it('returns empty actions when items miss required fields', () => {
    const content = `Some text

\`\`\`follow_up_actions
[{"label":"test"}]
\`\`\``
    const result = parseFollowUpActions(content)
    expect(result.actions).toHaveLength(0)
    expect(result.cleanContent).toBe(content)
  })

  it('strips trailing whitespace from clean content', () => {
    const content = `Response text

\`\`\`follow_up_actions
[{"label":"Next","message":"What's next?"}]
\`\`\``
    const result = parseFollowUpActions(content)
    expect(result.actions).toHaveLength(1)
    expect(result.cleanContent).toBe('Response text')
  })

  it('parses three follow-up actions', () => {
    const content = `I've made the changes.

\`\`\`follow_up_actions
[{"label":"Run tests","message":"Can you check if the tests still pass?"},{"label":"Another change","message":"I have another change to make"},{"label":"Explain","message":"Can you explain what you changed?"}]
\`\`\``
    const result = parseFollowUpActions(content)
    expect(result.actions).toHaveLength(3)
    expect(result.actions[2].label).toBe('Explain')
  })
})

describe('parseSuggestionFromContent', () => {
  it('parses valid suggestion_detected block', () => {
    const content = `Great idea!

\`\`\`suggestion_detected
{"type":"suggestion_detected","category":"feature_request","title":"Dark mode","summary":"Add dark mode support"}
\`\`\``
    const result = parseSuggestionFromContent(content)
    expect(result.suggestion).not.toBeNull()
    expect(result.suggestion?.title).toBe('Dark mode')
    expect(result.suggestion?.category).toBe('feature_request')
    expect(result.cleanContent).toBe('Great idea!')
  })

  it('returns null suggestion when no block present', () => {
    const content = 'Normal response'
    const result = parseSuggestionFromContent(content)
    expect(result.suggestion).toBeNull()
    expect(result.cleanContent).toBe(content)
  })

  it('returns null suggestion for wrong type field', () => {
    const content = `Text

\`\`\`suggestion_detected
{"type":"other","category":"feature_request","title":"Test","summary":"Test"}
\`\`\``
    const result = parseSuggestionFromContent(content)
    expect(result.suggestion).toBeNull()
  })
})
