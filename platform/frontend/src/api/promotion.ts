export interface PromotionResult {
  deploymentId: string;
  status: string;
  productionUrl: string | null;
  message: string;
}

export interface PromotionValidation {
  canPromote: boolean;
  reason: string | null;
}

export async function promoteToProduction(
  projectId: string,
  previewId: string
): Promise<PromotionResult> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const response = await fetch(
    `${apiUrl}/api/projects/${projectId}/preview/${previewId}/promote`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to promote to production');
  }

  return response.json();
}

export async function canPromotePreview(
  projectId: string,
  previewId: string
): Promise<PromotionValidation> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const response = await fetch(
    `${apiUrl}/api/projects/${projectId}/preview/${previewId}/can-promote`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to check promotion eligibility');
  }

  return response.json();
}
