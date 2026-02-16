import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AutonomousTestExecution {
  id: string;
  devRequestId: string;
  previewDeploymentId: string;
  status: string;
  maxIterations: number;
  currentIteration: number;
  testsPassed: boolean;
  finalTestResult: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const AutonomousTestingPage = () => {
  const { t } = useTranslation();
  const [devRequestId, setDevRequestId] = useState('');
  const [previewId, setPreviewId] = useState('');
  const [maxIterations, setMaxIterations] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<AutonomousTestExecution | null>(null);
  const [history, setHistory] = useState<AutonomousTestExecution[]>([]);

  const startTesting = async () => {
    if (!devRequestId || !previewId) {
      alert('Please enter both Dev Request ID and Preview ID');
      return;
    }

    setIsRunning(true);
    try {
      const res = await fetch(`${API_URL}/api/autonomous-testing/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devRequestId,
          previewDeploymentId: previewId,
          maxIterations,
        }),
      });

      if (!res.ok) throw new Error('Failed to start testing');

      const execution = await res.json();
      setCurrentExecution(execution);

      // Poll for updates
      const interval = setInterval(async () => {
        const latestRes = await fetch(
          `${API_URL}/api/autonomous-testing/latest/${devRequestId}`
        );
        if (latestRes.ok) {
          const latest = await latestRes.json();
          setCurrentExecution(latest);
          if (latest.status !== 'running') {
            clearInterval(interval);
            setIsRunning(false);
            loadHistory();
          }
        }
      }, 5000);
    } catch (error) {
      console.error(error);
      alert('Failed to start autonomous testing');
      setIsRunning(false);
    }
  };

  const loadHistory = async () => {
    if (!devRequestId) return;

    try {
      const res = await fetch(
        `${API_URL}/api/autonomous-testing/history/${devRequestId}`
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (devRequestId) {
      loadHistory();
    }
  }, [devRequestId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-900/50';
      case 'running':
        return 'text-blue-400 bg-blue-900/50';
      case 'failed':
      case 'error':
        return 'text-red-400 bg-red-900/50';
      default:
        return 'text-gray-400 bg-gray-900/50';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {t('autonomousTesting.title', 'Autonomous Testing')}
        </h1>
        <p className="text-warm-400">
          {t(
            'autonomousTesting.description',
            'AI-powered self-healing test loop that automatically fixes bugs and re-runs tests'
          )}
        </p>
      </div>

      {/* Start Testing Form */}
      <div className="bg-warm-800/30 border border-warm-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Start Testing</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Dev Request ID
            </label>
            <input
              type="text"
              value={devRequestId}
              onChange={(e) => setDevRequestId(e.target.value)}
              className="w-full px-4 py-2 bg-warm-900 border border-warm-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter Dev Request ID (GUID)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Preview Deployment ID
            </label>
            <input
              type="text"
              value={previewId}
              onChange={(e) => setPreviewId(e.target.value)}
              className="w-full px-4 py-2 bg-warm-900 border border-warm-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter Preview Deployment ID (GUID)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Iterations
            </label>
            <input
              type="number"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              min="1"
              max="10"
              className="w-full px-4 py-2 bg-warm-900 border border-warm-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={startTesting}
            disabled={isRunning || !devRequestId || !previewId}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-warm-700 disabled:cursor-not-allowed rounded-lg font-semibold transition"
          >
            {isRunning ? 'Testing in Progress...' : 'Start Autonomous Testing'}
          </button>
        </div>
      </div>

      {/* Current Execution Status */}
      {currentExecution && (
        <div className="bg-warm-800/30 border border-warm-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Execution</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-warm-400">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  currentExecution.status
                )}`}
              >
                {currentExecution.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-warm-400">Iteration:</span>
              <span className="font-mono">
                {currentExecution.currentIteration} / {currentExecution.maxIterations}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-warm-400">Tests Passed:</span>
              <span className={currentExecution.testsPassed ? 'text-green-400' : 'text-red-400'}>
                {currentExecution.testsPassed ? 'Yes' : 'No'}
              </span>
            </div>

            {currentExecution.finalTestResult && (
              <div>
                <span className="text-warm-400">Result:</span>
                <p className="mt-1 p-3 bg-warm-900/50 rounded border border-warm-700 text-sm font-mono">
                  {currentExecution.finalTestResult}
                </p>
              </div>
            )}

            <div className="text-sm text-warm-500">
              Started: {new Date(currentExecution.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Execution History */}
      {history.length > 0 && (
        <div className="bg-warm-800/30 border border-warm-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Execution History</h2>
          <div className="space-y-3">
            {history.map((exec) => (
              <div
                key={exec.id}
                className="p-4 bg-warm-900/50 border border-warm-700 rounded-lg hover:border-purple-500/50 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      exec.status
                    )}`}
                  >
                    {exec.status}
                  </span>
                  <span className="text-sm text-warm-500">
                    {new Date(exec.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-warm-400">Iterations:</span>
                    <span className="ml-2 font-mono">
                      {exec.currentIteration} / {exec.maxIterations}
                    </span>
                  </div>
                  <div>
                    <span className="text-warm-400">Tests Passed:</span>
                    <span
                      className={`ml-2 ${exec.testsPassed ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {exec.testsPassed ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {exec.finalTestResult && (
                  <div className="mt-2 text-sm text-warm-400">{exec.finalTestResult}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutonomousTestingPage;
