/**
 * Agent Inbox Feedback Widget
 *
 * Embeddable vanilla JS widget — no React dependency.
 * Injects a floating feedback button + modal form into the host page.
 *
 * Usage:
 *   <script src="https://your-domain.com/widget/feedback-widget.js"
 *     data-user-id="USER_ID"
 *     data-api-url="https://api.your-domain.com">
 *   </script>
 */
;(function () {
  const script = document.currentScript as HTMLScriptElement | null
  if (!script) return

  const userId = script.getAttribute('data-user-id') || ''
  const apiUrl = (script.getAttribute('data-api-url') || '').replace(/\/$/, '')
  const devRequestId = script.getAttribute('data-dev-request-id') || undefined

  if (!userId || !apiUrl) {
    console.warn('[FeedbackWidget] data-user-id and data-api-url are required.')
    return
  }

  // ----- Inline CSS -----
  const STYLE = `
    .aidr-fb-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 52px; height: 52px; border-radius: 50%;
      background: #2563eb; color: #fff; border: none; cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; transition: transform .2s, box-shadow .2s;
    }
    .aidr-fb-btn:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,.45); }

    .aidr-fb-overlay {
      position: fixed; inset: 0; z-index: 100000;
      background: rgba(0,0,0,.5); display: flex;
      align-items: center; justify-content: center;
    }
    .aidr-fb-modal {
      background: #1c1917; color: #e7e5e4; border-radius: 12px;
      width: 90%; max-width: 440px; padding: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .aidr-fb-modal h3 { margin: 0 0 4px; font-size: 18px; font-weight: 700; }
    .aidr-fb-modal p  { margin: 0 0 16px; font-size: 13px; color: #a8a29e; }
    .aidr-fb-modal label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #d6d3d1; }
    .aidr-fb-modal input, .aidr-fb-modal textarea, .aidr-fb-modal select {
      width: 100%; box-sizing: border-box; padding: 8px 10px;
      border: 1px solid #44403c; border-radius: 6px;
      background: #0c0a09; color: #e7e5e4; font-size: 14px;
      margin-bottom: 12px; outline: none;
    }
    .aidr-fb-modal input:focus, .aidr-fb-modal textarea:focus, .aidr-fb-modal select:focus {
      border-color: #2563eb;
    }
    .aidr-fb-modal textarea { resize: vertical; min-height: 80px; }
    .aidr-fb-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    .aidr-fb-actions button { padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
    .aidr-fb-cancel { background: #292524; color: #a8a29e; }
    .aidr-fb-cancel:hover { background: #44403c; }
    .aidr-fb-submit { background: #2563eb; color: #fff; }
    .aidr-fb-submit:hover { background: #1d4ed8; }
    .aidr-fb-submit:disabled { opacity: .5; cursor: not-allowed; }
    .aidr-fb-success { text-align: center; padding: 24px 0; }
    .aidr-fb-success svg { margin: 0 auto 8px; }
  `

  // ----- Inject style -----
  const styleEl = document.createElement('style')
  styleEl.textContent = STYLE
  document.head.appendChild(styleEl)

  // ----- Floating button -----
  const btn = document.createElement('button')
  btn.className = 'aidr-fb-btn'
  btn.setAttribute('aria-label', 'Send feedback')
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  document.body.appendChild(btn)

  let overlayEl: HTMLDivElement | null = null

  function openModal() {
    if (overlayEl) return
    overlayEl = document.createElement('div')
    overlayEl.className = 'aidr-fb-overlay'
    overlayEl.innerHTML = `
      <div class="aidr-fb-modal" id="aidr-fb-form-view">
        <h3>Send Feedback</h3>
        <p>Help us improve this application</p>
        <label for="aidr-type">Type</label>
        <select id="aidr-type">
          <option value="suggestion">Suggestion</option>
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="other">Other</option>
        </select>
        <label for="aidr-title">Title (optional)</label>
        <input id="aidr-title" type="text" placeholder="Brief summary" />
        <label for="aidr-content">Details *</label>
        <textarea id="aidr-content" placeholder="Describe your feedback..." rows="4"></textarea>
        <label for="aidr-name">Name (optional)</label>
        <input id="aidr-name" type="text" placeholder="Your name" />
        <label for="aidr-email">Email (optional)</label>
        <input id="aidr-email" type="email" placeholder="you@example.com" />
        <div class="aidr-fb-actions">
          <button class="aidr-fb-cancel" id="aidr-cancel">Cancel</button>
          <button class="aidr-fb-submit" id="aidr-submit">Submit</button>
        </div>
      </div>
    `
    document.body.appendChild(overlayEl)

    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) closeModal()
    })
    overlayEl.querySelector('#aidr-cancel')!.addEventListener('click', closeModal)
    overlayEl.querySelector('#aidr-submit')!.addEventListener('click', handleSubmit)
  }

  function closeModal() {
    if (overlayEl) {
      overlayEl.remove()
      overlayEl = null
    }
  }

  async function handleSubmit() {
    const content = (document.getElementById('aidr-content') as HTMLTextAreaElement).value.trim()
    if (!content) return

    const submitBtn = document.getElementById('aidr-submit') as HTMLButtonElement
    submitBtn.disabled = true
    submitBtn.textContent = 'Sending...'

    const body: Record<string, string | undefined> = {
      userId,
      content,
      type: (document.getElementById('aidr-type') as HTMLSelectElement).value,
      title: (document.getElementById('aidr-title') as HTMLInputElement).value.trim() || undefined,
      submitterName: (document.getElementById('aidr-name') as HTMLInputElement).value.trim() || undefined,
      submitterEmail: (document.getElementById('aidr-email') as HTMLInputElement).value.trim() || undefined,
      source: 'widget',
      devRequestId,
    }

    try {
      const res = await fetch(`${apiUrl}/api/agent-inbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed')

      const modal = overlayEl!.querySelector('.aidr-fb-modal')!
      modal.innerHTML = `
        <div class="aidr-fb-success">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <h3 style="margin-bottom:8px">Thank you!</h3>
          <p style="color:#a8a29e">Your feedback has been submitted.</p>
        </div>
      `
      setTimeout(closeModal, 2000)
    } catch {
      submitBtn.disabled = false
      submitBtn.textContent = 'Submit'
      alert('Failed to submit feedback. Please try again.')
    }
  }

  btn.addEventListener('click', openModal)
})()
