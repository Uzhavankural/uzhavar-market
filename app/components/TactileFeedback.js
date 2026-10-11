'use client'

import { useEffect } from 'react'

/**
 * TactileFeedback
 * Provides micro-haptic vibration feedback on touch devices
 * whenever the user taps buttons, cards, or interactive controls.
 */
export default function TactileFeedback() {
  useEffect(() => {
    function handlePointerDown(e) {
      // Find nearest interactive element
      const interactiveEl = e.target.closest(
        'button, a, input[type="submit"], input[type="button"], [role="button"], .cursor-pointer, tr.cursor-pointer, select, input[type="checkbox"], input[type="radio"]'
      )

      if (interactiveEl) {
        // Trigger micro-haptic pulse on supported mobile hardware (Android/Chrome/Samsung/etc.)
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(10)
          } catch (err) {
            // Ignore if vibration is restricted by device policy
          }
        }
      }
    }

    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  return null
}
