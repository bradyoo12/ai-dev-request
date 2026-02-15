/**
 * Credit & Refund Claims Policy
 *
 * This file defines the refundable and non-refundable scenarios for credits.
 * Update this file to modify the claims rules displayed to users before payment.
 *
 * Each scenario has:
 *   - id: unique identifier
 *   - i18nKey: translation key under "billing.disclaimer.scenarios"
 *   - category: groups for display purposes
 */

export interface ClaimScenario {
  id: string
  i18nKey: string
  category: 'service' | 'delivery' | 'scope'
}

/** Scenarios where a refund or credit claim IS eligible */
export const refundableScenarios: ClaimScenario[] = [
  {
    id: 'target_goals_not_met',
    i18nKey: 'billing.disclaimer.scenarios.refundable.targetGoalsNotMet',
    category: 'delivery',
  },
  {
    id: 'service_error',
    i18nKey: 'billing.disclaimer.scenarios.refundable.serviceError',
    category: 'service',
  },
  {
    id: 'partial_delivery',
    i18nKey: 'billing.disclaimer.scenarios.refundable.partialDelivery',
    category: 'delivery',
  },
  {
    id: 'scope_mismatch',
    i18nKey: 'billing.disclaimer.scenarios.refundable.scopeMismatch',
    category: 'scope',
  },
]

/** Scenarios where a refund or credit claim is NOT eligible */
export const nonRefundableScenarios: ClaimScenario[] = [
  {
    id: 'completed_target_goals',
    i18nKey: 'billing.disclaimer.scenarios.nonRefundable.completedTargetGoals',
    category: 'delivery',
  },
  {
    id: 'change_of_mind',
    i18nKey: 'billing.disclaimer.scenarios.nonRefundable.changeOfMind',
    category: 'scope',
  },
  {
    id: 'cosmetic_preference',
    i18nKey: 'billing.disclaimer.scenarios.nonRefundable.cosmeticPreference',
    category: 'scope',
  },
  {
    id: 'third_party_issue',
    i18nKey: 'billing.disclaimer.scenarios.nonRefundable.thirdPartyIssue',
    category: 'service',
  },
]
