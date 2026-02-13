import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as multiAgentTestAPI from '../api/multi-agent-test';

const MultiAgentTestPage: React.FC = () => {
  const { t } = useTranslation();
  const [devRequestId, setDevRequestId] = useState('');
  const [scenarioType, setScenarioType] = useState('concurrent_crud');
  const [concurrencyLevel, setConcurrencyLevel] = useState(3);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['admin', 'customer']);
  const [sessions, setSessions] = useState<multiAgentTestAPI.MultiAgentTestSession[]>([]);
  const [currentSession, setCurrentSession] = useState<multiAgentTestAPI.MultiAgentTestSession | null>(null);
  const [report, setReport] = useState<multiAgentTestAPI.SessionReport | null>(null);
  const [refinement, setRefinement] = useState<multiAgentTestAPI.RefineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personaTypes = ['admin', 'customer', 'moderator'];
  const scenarioTypes = [
    { value: 'concurrent_crud', label: 'Concurrent CRUD Operations' },
    { value: 'permission_boundaries', label: 'Permission Boundaries' },
    { value: 'race_conditions', label: 'Race Conditions' },
    { value: 'data_consistency', label: 'Data Consistency' },
  ];

  const loadSessions = async () => {
    try {
      const data = await multiAgentTestAPI.getSessions(devRequestId || undefined);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handlePersonaToggle = (persona: string) => {
    setSelectedPersonas(prev =>
      prev.includes(persona)
        ? prev.filter(p => p !== persona)
        : [...prev, persona]
    );
  };

  const handleCreateSession = async () => {
    if (!devRequestId) {
      setError('Please enter a Dev Request ID');
      return;
    }

    if (selectedPersonas.length === 0) {
      setError('Please select at least one persona');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await multiAgentTestAPI.createSession({
        devRequestId,
        scenarioType,
        concurrencyLevel,
        personaTypes: selectedPersonas,
      });

      setCurrentSession(session);
      await loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!currentSession) return;

    setLoading(true);
    setError(null);

    try {
      const updatedSession = await multiAgentTestAPI.startSession(currentSession.id);
      setCurrentSession(updatedSession);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await multiAgentTestAPI.getSessionStatus(currentSession.id);
          setCurrentSession(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            const sessionReport = await multiAgentTestAPI.getSessionReport(currentSession.id);
            setReport(sessionReport);
          }
        } catch (err) {
          clearInterval(pollInterval);
        }
      }, 2000);

      // Auto-clear after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRefinement = async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      const result = await multiAgentTestAPI.generateRefinement(currentSession.id);
      setRefinement(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate refinement');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const status = await multiAgentTestAPI.getSessionStatus(sessionId);
      setCurrentSession(status);

      if (status.status === 'completed' || status.status === 'failed') {
        const sessionReport = await multiAgentTestAPI.getSessionReport(sessionId);
        setReport(sessionReport);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('multiAgentTest.title', 'Multi-Agent Test Simulation')}</h1>
        <p className="mt-2 text-gray-600">{t('multiAgentTest.subtitle', 'Test your generated app with multiple AI agents roleplaying different personas')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Session Configuration */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Create Test Session</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dev Request ID</label>
          <input
            type="text"
            value={devRequestId}
            onChange={(e) => setDevRequestId(e.target.value)}
            placeholder="Enter Dev Request ID (GUID)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Test Scenario</label>
          <select
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {scenarioTypes.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Concurrency Level: {concurrencyLevel}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={concurrencyLevel}
            onChange={(e) => setConcurrencyLevel(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Personas</label>
          <div className="flex gap-4">
            {personaTypes.map(persona => (
              <label key={persona} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPersonas.includes(persona)}
                  onChange={() => handlePersonaToggle(persona)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{persona}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Create Session
          </button>
          {currentSession && currentSession.status === 'pending' && (
            <button
              onClick={handleStartSession}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Start Simulation
            </button>
          )}
        </div>
      </div>

      {/* Current Session Status */}
      {currentSession && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Current Session</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(currentSession.status)}`}>
              {currentSession.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Personas</div>
              <div className="text-2xl font-bold text-gray-900">{currentSession.personaCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Actions</div>
              <div className="text-2xl font-bold text-gray-900">{currentSession.totalActions}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Issues Detected</div>
              <div className="text-2xl font-bold text-red-600">{currentSession.issuesDetected}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Overall Score</div>
              <div className="text-2xl font-bold text-green-600">{currentSession.overallScore.toFixed(1)}/100</div>
            </div>
          </div>

          {currentSession.status === 'completed' && (
            <button
              onClick={handleGenerateRefinement}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Generate AI Refinement
            </button>
          )}
        </div>
      )}

      {/* Test Report */}
      {report && (
        <div className="space-y-4">
          {/* Personas */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personas</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {report.personas.map(persona => (
                <div key={persona.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900 capitalize">{persona.personaType}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(persona.status)}`}>
                      {persona.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Actions: {persona.actionsPerformed}</div>
                    <div className="text-green-600">Succeeded: {persona.actionsSucceeded}</div>
                    <div className="text-red-600">Failed: {persona.actionsFailed}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {report.issues.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Concurrency Issues</h2>
              <div className="space-y-3">
                {report.issues.map(issue => (
                  <div key={issue.id} className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold capitalize">{issue.issueType.replace(/_/g, ' ')}</h3>
                      <span className="text-xs font-medium uppercase">{issue.severity}</span>
                    </div>
                    <p className="text-sm mb-2">{issue.description}</p>
                    {issue.resourcePath && (
                      <div className="text-xs">
                        <span className="font-medium">Resource:</span> {issue.resourcePath}
                      </div>
                    )}
                    {issue.conflictingOperations && (
                      <div className="text-xs">
                        <span className="font-medium">Operations:</span> {issue.conflictingOperations}
                      </div>
                    )}
                    <div className="text-xs mt-2">
                      <span className="font-medium">Confidence:</span> {issue.confidenceScore}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Refinement */}
      {refinement && refinement.hasFixes && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Refinements</h2>
          <p className="text-gray-600 mb-4">{refinement.message}</p>
          <div className="space-y-4">
            {refinement.fixes.map((fix, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{fix.description}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(fix.severity)}`}>
                    {fix.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{fix.explanation}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Original Code</div>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">{fix.originalCode}</pre>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Fixed Code</div>
                    <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto">{fix.fixedCode}</pre>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">Confidence: {fix.confidence}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Session History</h2>
        {sessions.length === 0 ? (
          <p className="text-gray-500">No sessions yet</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => handleLoadSession(session.id)}
                className="flex justify-between items-center p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <div className="font-medium text-gray-900">{session.scenarioType.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-gray-500">{new Date(session.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">{session.personaCount} personas</div>
                  <div className="text-sm text-gray-600">{session.issuesDetected} issues</div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiAgentTestPage;
