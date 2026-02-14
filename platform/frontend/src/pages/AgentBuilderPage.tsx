import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  generateAgent,
  previewAgent,
  getAgentTemplates,
  deployAgent,
  getDeployments,
  undeployAgent,
  type AgentSkill,
  type AgentDeployment,
  type AgentTemplate,
  type AgentPreview,
} from '../api/agent-builder';
import { StatusBadge } from '../components/StatusBadge';

const AgentBuilderPage = () => {
  const { t } = useTranslation();
  const [specification, setSpecification] = useState('');
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [preview, setPreview] = useState<AgentPreview | null>(null);
  const [generatedAgent, setGeneratedAgent] = useState<AgentSkill | null>(null);
  const [deployments, setDeployments] = useState<AgentDeployment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('slack');

  useEffect(() => {
    loadTemplates();
    loadDeployments();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getAgentTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadDeployments = async () => {
    try {
      const data = await getDeployments();
      setDeployments(data);
    } catch (err) {
      console.error('Failed to load deployments:', err);
    }
  };

  const handlePreview = async () => {
    if (!specification.trim()) {
      setError('Please enter a specification');
      return;
    }

    setIsPreviewing(true);
    setError(null);
    try {
      const data = await previewAgent(specification);
      setPreview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!specification.trim()) {
      setError('Please enter a specification');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateAgent(specification);
      setGeneratedAgent(data);
      setPreview(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeploy = async () => {
    if (!generatedAgent) {
      setError('No agent to deploy');
      return;
    }

    setIsDeploying(true);
    setError(null);
    try {
      await deployAgent(generatedAgent.id, selectedPlatform);
      await loadDeployments();
      setGeneratedAgent(null);
      setSpecification('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleUndeploy = async (deploymentId: string) => {
    if (!confirm('Are you sure you want to undeploy this agent?')) return;

    try {
      await undeployAgent(deploymentId);
      await loadDeployments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSpecification(template.templateSpec);
    setSelectedPlatform(template.platform);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('agentBuilder.title', 'AI Agent Builder')}</h1>
      <p className="text-warm-400">
        {t(
          'agentBuilder.description',
          'Use AI to create specialized AI agents - Slack bots, Telegram bots, customer service agents, monitoring automations, and more.'
        )}
      </p>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">
            {t('agentBuilder.templates', 'Templates')}
          </h2>
          <div className="space-y-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="w-full text-left p-4 bg-warm-800 hover:bg-warm-700 rounded-lg border border-warm-600 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={template.iconUrl}
                    alt={template.name}
                    className="w-10 h-10 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-warm-100">{template.name}</h3>
                    <p className="text-sm text-warm-400 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 bg-warm-700 rounded">
                        {template.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-warm-700 rounded">
                        {template.platform}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Specification & Generation */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('agentBuilder.specification', 'Agent Specification')}
            </label>
            <textarea
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder={t(
                'agentBuilder.specPlaceholder',
                'Describe your agent in natural language. For example: "Create a Slack bot that monitors GitHub pull requests and sends notifications when code reviews are needed..."'
              )}
              className="w-full h-40 p-3 bg-warm-900 border border-warm-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 text-warm-100"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handlePreview}
              disabled={isPreviewing || !specification.trim()}
              className="px-4 py-2 bg-warm-700 hover:bg-warm-600 disabled:bg-warm-800 disabled:text-warm-500 rounded-lg transition-colors"
            >
              {isPreviewing ? t('agentBuilder.previewing', 'Previewing...') : t('agentBuilder.preview', 'Preview')}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !specification.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 rounded-lg transition-colors"
            >
              {isGenerating ? t('agentBuilder.generating', 'Generating...') : t('agentBuilder.generate', 'Generate Agent')}
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-warm-800 border border-warm-700 rounded-lg p-4">
              <h3 className="font-semibold mb-3">{t('agentBuilder.previewTitle', 'Preview')}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-warm-400">{t('agentBuilder.name', 'Name')}:</span>
                  <span className="ml-2 text-warm-100">{preview.name}</span>
                </div>
                {preview.description && (
                  <div>
                    <span className="text-warm-400">{t('agentBuilder.description', 'Description')}:</span>
                    <p className="mt-1 text-warm-100">{preview.description}</p>
                  </div>
                )}
                {preview.category && (
                  <div>
                    <span className="text-warm-400">{t('agentBuilder.category', 'Category')}:</span>
                    <span className="ml-2 text-warm-100">{preview.category}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generated Agent */}
          {generatedAgent && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-3">
                {t('agentBuilder.generated', 'Agent Generated Successfully')}
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-warm-400">{t('agentBuilder.name', 'Name')}:</span>
                  <span className="ml-2 text-warm-100">{generatedAgent.name}</span>
                </div>
                {generatedAgent.description && (
                  <div>
                    <span className="text-warm-400">{t('agentBuilder.description', 'Description')}:</span>
                    <p className="mt-1 text-warm-100">{generatedAgent.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center space-x-3">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="px-3 py-2 bg-warm-900 border border-warm-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500"
                >
                  <option value="slack">Slack</option>
                  <option value="telegram">Telegram</option>
                  <option value="webhook">Webhook</option>
                  <option value="scheduled">Scheduled</option>
                </select>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-800 rounded-lg transition-colors"
                >
                  {isDeploying ? t('agentBuilder.deploying', 'Deploying...') : t('agentBuilder.deploy', 'Deploy')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deployments */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">
          {t('agentBuilder.deployments', 'Deployed Agents')}
        </h2>
        {deployments.length === 0 ? (
          <div className="bg-warm-800 border border-warm-700 rounded-lg p-8 text-center text-warm-400">
            {t('agentBuilder.noDeployments', 'No deployed agents yet')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deployments.map((deployment) => (
              <div
                key={deployment.id}
                className="bg-warm-800 border border-warm-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-warm-100">{deployment.platform}</h3>
                    <p className="text-xs text-warm-400">
                      {new Date(deployment.deployedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={deployment.status} />
                </div>
                <button
                  onClick={() => handleUndeploy(deployment.id)}
                  className="w-full mt-3 px-3 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded-lg transition-colors text-sm"
                >
                  {t('agentBuilder.undeploy', 'Undeploy')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentBuilderPage;
