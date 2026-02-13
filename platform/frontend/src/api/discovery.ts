const API_URL = import.meta.env.VITE_API_URL;

export interface QuestionnaireAnswers {
  hobbies: string;
  painPoints: string;
  learningGoals: string;
  location: string;
  foodCulture: string;
}

export interface DiscoveryRecommendation {
  id: string;
  title: string;
  description: string;
  matchReason: string;
  exampleUseCase: string;
  difficultyLevel: 'beginner' | 'intermediate';
  estimatedHours: number;
  projectTypeTag: string;
}

export async function submitQuestionnaire(answers: QuestionnaireAnswers): Promise<DiscoveryRecommendation[]> {
  const res = await fetch(`${API_URL}/api/discovery/questionnaire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });

  if (!res.ok) throw new Error('Failed to submit questionnaire');

  const response = await res.json();
  // Handle Server Actions pattern response format
  return response.data || response;
}

export async function getRecommendations(): Promise<DiscoveryRecommendation[]> {
  const res = await fetch(`${API_URL}/api/discovery/recommendations`);

  if (!res.ok) throw new Error('Failed to fetch recommendations');

  return res.json();
}
