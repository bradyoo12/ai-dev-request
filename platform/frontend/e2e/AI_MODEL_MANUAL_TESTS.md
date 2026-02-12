# AI Model Settings - Manual Testing Checklist

## Test Environment Setup
- [ ] Frontend dev server running at http://localhost:5173
- [ ] Backend API server running at http://localhost:5000
- [ ] User authenticated and logged in
- [ ] Navigate to Settings → AI Model page

---

## 1. Provider Selection

### Provider Dropdown Display
- [ ] Provider dropdown is visible at the top of the page
- [ ] Dropdown contains "Claude" option
- [ ] Dropdown contains "Gemini" option
- [ ] Provider descriptions display correctly
- [ ] "Coming Soon" badge shows for unavailable providers

### Provider Switching
- [ ] Selecting "Claude" updates the UI appropriately
- [ ] Selecting "Gemini" updates the UI appropriately
- [ ] Provider selection persists when switching between tabs
- [ ] Provider selection persists after page refresh

---

## 2. Models Tab

### Model Display
- [ ] Model cards display for the selected provider
- [ ] Each model card shows:
  - [ ] Model name (e.g., "Claude Sonnet 4.5")
  - [ ] Description
  - [ ] Badge (Fast, Balanced, Advanced, etc.)
  - [ ] Input/Output pricing per 1K tokens
  - [ ] Latency estimate
  - [ ] Max output tokens
  - [ ] Capabilities list
- [ ] Currently selected model has visual indicator (checkmark, border, etc.)
- [ ] Clicking a model card selects that model

### Model Selection
- [ ] Selected model is highlighted visually
- [ ] Model selection saves automatically
- [ ] Model selection persists after page refresh
- [ ] Switching providers shows models for new provider

---

## 3. Configure Tab

### Claude-Specific Settings
When Claude provider is selected:
- [ ] "Extended Thinking" toggle is visible
- [ ] "Thinking Budget" slider is visible
- [ ] "Stream Thinking Indicator" toggle is visible
- [ ] Thinking budget slider shows current value
- [ ] Thinking budget range is 1K - 50K tokens
- [ ] Settings save when toggled/changed
- [ ] Settings persist after page refresh

### Gemini-Specific Settings
When Gemini provider is selected:
- [ ] "Gemini Settings" panel is visible
- [ ] "Safety Settings" dropdown is visible
- [ ] Safety dropdown has options:
  - [ ] "No Blocking"
  - [ ] "Block Low & Above"
  - [ ] "Block Medium & Above"
  - [ ] "Block Only High Risk"
- [ ] "Temperature" slider is visible
- [ ] Temperature slider shows current value (e.g., "1.0")
- [ ] Temperature range is 0.0 - 2.0
- [ ] Temperature slider labels: "Deterministic", "Balanced", "Creative"
- [ ] Safety settings save when changed
- [ ] Temperature saves when changed
- [ ] Settings persist after page refresh

### General Settings
- [ ] "Auto Model Selection" toggle works
- [ ] "Cost Preview" section displays correct estimates
- [ ] All settings save without page reload
- [ ] Error messages display if save fails

---

## 4. Stats Tab

### Overall Statistics
- [ ] "Total Requests" displays correctly
- [ ] "Opus 4.6 Requests" displays correctly
- [ ] "Sonnet 4.5 Requests" displays correctly
- [ ] "Thinking Tokens" displays correctly
- [ ] "Output Tokens" displays correctly
- [ ] "Estimated Cost" displays correctly

### Model Distribution
- [ ] Model distribution chart is visible
- [ ] Opus 4.6 percentage bar displays
- [ ] Sonnet 4.5 percentage bar displays
- [ ] Percentages add up to 100%

### Per-Provider Stats (New Feature)
- [ ] "Provider Breakdown" section is visible
- [ ] Claude provider stats display:
  - [ ] Provider name ("Claude")
  - [ ] Total requests count
  - [ ] Total tokens count
  - [ ] Estimated cost
- [ ] Gemini provider stats display (if used):
  - [ ] Provider name ("Gemini")
  - [ ] Total requests count
  - [ ] Total tokens count
  - [ ] Estimated cost
- [ ] Stats format correctly (e.g., "1.5K", "2.3M" for large numbers)
- [ ] Cost displays with proper decimal precision (e.g., "$0.0045")

---

## 5. Internationalization (i18n)

### English Translations
- [ ] All labels render in English
- [ ] "AI Provider" label displays
- [ ] "Gemini Settings" label displays
- [ ] "Safety Settings" label displays
- [ ] "Temperature" label displays
- [ ] No "[missing translation]" placeholders

### Korean Translations
Switch language to Korean:
- [ ] All labels render in Korean
- [ ] "AI 제공자" (AI Provider) displays
- [ ] "Gemini 설정" (Gemini Settings) displays
- [ ] "안전 설정" (Safety Settings) displays
- [ ] "온도" (Temperature) displays
- [ ] No missing translation keys

---

## 6. Error Handling & Edge Cases

### API Failures
- [ ] Page loads gracefully when providers API fails
- [ ] Error message displays when config save fails
- [ ] Page doesn't crash on API timeout
- [ ] Retry mechanism works (if implemented)

### Empty States
- [ ] Page handles no providers available (shows message or hides selector)
- [ ] Page handles no models available
- [ ] Page handles no stats (shows "0" or placeholder)
- [ ] Provider selector hidden when providers array is empty

### Network Issues
- [ ] Page loads with slow/poor network connection
- [ ] Loading indicators show during API calls
- [ ] Error messages display for network failures
- [ ] Offline behavior is acceptable (cached data or error state)

---

## 7. Responsive Design

### Desktop (1920x1080)
- [ ] Layout looks correct
- [ ] All elements are visible
- [ ] No horizontal scrolling
- [ ] Spacing and alignment are proper

### Tablet (768x1024)
- [ ] Layout adapts appropriately
- [ ] Model cards stack or resize correctly
- [ ] All controls remain accessible

### Mobile (375x667)
- [ ] Page is usable on mobile
- [ ] Dropdowns and sliders work on touch
- [ ] Text is readable
- [ ] No content overflow

---

## 8. Accessibility

### Keyboard Navigation
- [ ] Tab key navigates through all interactive elements
- [ ] Provider dropdown is keyboard-accessible
- [ ] Settings toggles can be activated with Enter/Space
- [ ] Model cards can be selected with keyboard
- [ ] Tab order is logical

### Screen Reader
- [ ] Labels are read correctly
- [ ] Form controls have proper ARIA labels
- [ ] Changes are announced (if applicable)

---

## 9. Cross-Browser Testing

### Chrome
- [ ] All features work correctly
- [ ] No console errors
- [ ] UI renders properly

### Firefox
- [ ] All features work correctly
- [ ] No console errors
- [ ] UI renders properly

### Safari (if available)
- [ ] All features work correctly
- [ ] No console errors
- [ ] UI renders properly

### Edge
- [ ] All features work correctly
- [ ] No console errors
- [ ] UI renders properly

---

## 10. Integration with Backend

### API Contract Verification
- [ ] `GET /api/ai-model/providers` returns expected format
- [ ] `GET /api/ai-model/models?provider={provider}` works correctly
- [ ] `GET /api/ai-model/config` includes Gemini fields
- [ ] `PUT /api/ai-model/config` accepts Gemini fields
- [ ] Response field names match TypeScript interfaces
- [ ] Data types match (strings, numbers, booleans)

### Real Data Testing
- [ ] Create a dev request and verify provider is used
- [ ] Check that stats update after request completion
- [ ] Verify per-provider stats accumulate correctly
- [ ] Confirm cost calculations are accurate

---

## Test Results Summary

**Tester Name**: _________________
**Date**: _________________
**Environment**: _________________

**Total Tests**: _____ / _____
**Passed**: _____
**Failed**: _____

### Critical Issues Found:
1.
2.
3.

### Minor Issues Found:
1.
2.
3.

### Notes:


---

## Sign-Off

**Frontend Developer**: _________________ Date: _______
**QA Engineer**: _________________ Date: _______
**Product Owner**: _________________ Date: _______
