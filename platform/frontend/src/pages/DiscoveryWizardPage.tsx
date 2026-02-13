import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitQuestionnaire, type DiscoveryRecommendation, type QuestionnaireAnswers } from '../api/discovery';

const DiscoveryWizardPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<DiscoveryRecommendation[]>([]);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    hobbies: '',
    painPoints: '',
    learningGoals: '',
    location: '',
    foodCulture: '',
  });

  const questions = [
    { key: 'hobbies' as keyof QuestionnaireAnswers, label: 'What do you enjoy doing in your free time?' },
    { key: 'painPoints' as keyof QuestionnaireAnswers, label: "What's something you wish was easier in your daily life?" },
    { key: 'learningGoals' as keyof QuestionnaireAnswers, label: 'What topics do you love learning about?' },
    { key: 'location' as keyof QuestionnaireAnswers, label: 'Where do you live or want to explore?' },
    { key: 'foodCulture' as keyof QuestionnaireAnswers, label: "What's your favorite cuisine or food activity?" },
  ];

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit questionnaire
      setIsLoading(true);
      try {
        const recs = await submitQuestionnaire(answers);
        setRecommendations(recs);
        setCurrentStep(questions.length); // Move to results page
      } catch (error) {
        console.error('Failed to generate recommendations:', error);
        alert('Failed to generate recommendations. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartBuilding = (rec: DiscoveryRecommendation) => {
    // Navigate to new request page with pre-filled description
    navigate(`/requests/new?recommendation=${encodeURIComponent(rec.title)}&description=${encodeURIComponent(rec.description)}`);
  };

  // Results page
  if (currentStep === questions.length) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">🎉 We Found {recommendations.length} Perfect Projects for You!</h1>
        <p className="text-warm-400 mb-8">Based on your interests, here are personalized project ideas:</p>

        <div className="space-y-6">
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-warm-800 rounded-lg p-6 border border-warm-700 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{rec.title}</h3>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    rec.difficultyLevel === 'beginner' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                  }`}>
                    {rec.difficultyLevel.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-warm-400">
                  ⏱️ {rec.estimatedHours}h
                </div>
              </div>

              <p className="text-warm-300 mb-4">{rec.description}</p>

              <div className="bg-warm-900/50 rounded p-3 mb-3">
                <p className="text-sm font-medium text-blue-400 mb-1">Why this matches:</p>
                <p className="text-sm text-warm-400">{rec.matchReason}</p>
              </div>

              <div className="bg-warm-900/50 rounded p-3 mb-4">
                <p className="text-sm font-medium text-green-400 mb-1">Example use case:</p>
                <p className="text-sm text-warm-400">{rec.exampleUseCase}</p>
              </div>

              <button
                onClick={() => handleStartBuilding(rec)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Start Building →
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setCurrentStep(0); setRecommendations([]); }}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Questionnaire page
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-warm-800 rounded-lg p-8 border border-warm-700">
        <h1 className="text-3xl font-bold mb-2">✨ Discover Your Perfect First Project</h1>
        <p className="text-warm-400 mb-6">Answer a few questions to get personalized project ideas</p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-warm-400 mb-2">
            <span>Step {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-warm-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-3">{currentQuestion.label}</label>
          <textarea
            value={answers[currentQuestion.key]}
            onChange={(e) => setAnswers({ ...answers, [currentQuestion.key]: e.target.value })}
            className="w-full bg-warm-900 border border-warm-700 rounded px-4 py-3 text-warm-100 focus:outline-none focus:border-blue-500 min-h-[120px]"
            placeholder="Share your thoughts..."
            autoFocus
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2 border border-warm-700 rounded hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={isLoading || !answers[currentQuestion.key].trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Generating...' : currentStep === questions.length - 1 ? 'Show Recommendations' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryWizardPage;
