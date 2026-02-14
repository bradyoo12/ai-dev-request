import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Code, Sparkles, Package, Trash2, ExternalLink } from 'lucide-react';
import {
  getAgentTemplates,
  getBlueprints,
  createBlueprint,
  generateAgent,
  deleteBlueprint,
  convertToSkill,
  exportToMarketplace,
  type AgentTemplate,
  type AgentBlueprint,
} from '@/api/agent-builder';

const agentTypes = [
  { value: 'Slack', label: 'Slack Bot', icon: '💬' },
  { value: 'Telegram', label: 'Telegram Bot', icon: '✈️' },
  { value: 'CustomerService', label: 'Customer Service', icon: '🎧' },
  { value: 'Monitoring', label: 'Monitoring Agent', icon: '📊' },
  { value: 'DataPipeline', label: 'Data Pipeline', icon: '🔄' },
];

const AgentBuilderPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('builder');
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [blueprints, setBlueprints] = useState<AgentBlueprint[]>([]);
  const [loading, setLoading] = useState(false);

  // Builder form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentType, setAgentType] = useState('Slack');

  useEffect(() => {
    loadTemplates();
    loadBlueprints();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getAgentTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadBlueprints = async () => {
    try {
      const data = await getBlueprints();
      setBlueprints(data);
    } catch (error) {
      console.error('Failed to load blueprints:', error);
    }
  };

  const handleCreateBlueprint = async () => {
    if (!name || !description) return;

    setLoading(true);
    try {
      await createBlueprint({
        name,
        description,
        agentType,
      });
      setName('');
      setDescription('');
      await loadBlueprints();
      setActiveTab('blueprints');
    } catch (error) {
      console.error('Failed to create blueprint:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAgent = async (blueprintId: string) => {
    setLoading(true);
    try {
      await generateAgent(blueprintId);
      await loadBlueprints();
    } catch (error) {
      console.error('Failed to generate agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlueprint = async (id: string) => {
    try {
      await deleteBlueprint(id);
      await loadBlueprints();
    } catch (error) {
      console.error('Failed to delete blueprint:', error);
    }
  };

  const handleConvertToSkill = async (id: string) => {
    try {
      await convertToSkill(id);
      await loadBlueprints();
    } catch (error) {
      console.error('Failed to convert to skill:', error);
    }
  };

  const handleExportToMarketplace = async (id: string) => {
    try {
      await exportToMarketplace(id);
    } catch (error) {
      console.error('Failed to export to marketplace:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'bg-green-900/50 text-green-400';
      case 'Generating':
        return 'bg-blue-900/50 text-blue-400';
      case 'Failed':
        return 'bg-red-900/50 text-red-400';
      default:
        return 'bg-warm-700 text-warm-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-100">{t('agentBuilder.title')}</h1>
        <p className="text-warm-400 mt-1">{t('agentBuilder.description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-warm-800">
          <TabsTrigger value="builder" className="data-[state=active]:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            {t('agentBuilder.builder')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-blue-600">
            <Package className="w-4 h-4 mr-2" />
            {t('agentBuilder.templates')}
          </TabsTrigger>
          <TabsTrigger value="blueprints" className="data-[state=active]:bg-blue-600">
            <Code className="w-4 h-4 mr-2" />
            {t('agentBuilder.blueprints')}
          </TabsTrigger>
          <TabsTrigger value="generated" className="data-[state=active]:bg-blue-600">
            <Sparkles className="w-4 h-4 mr-2" />
            {t('agentBuilder.generated')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <Card className="bg-warm-900 border-warm-700">
            <CardHeader>
              <CardTitle>{t('agentBuilder.createNew')}</CardTitle>
              <CardDescription>{t('agentBuilder.createDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-300 mb-2">
                  {t('agentBuilder.agentName')}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('agentBuilder.namePlaceholder')}
                  className="bg-warm-800 border-warm-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-300 mb-2">
                  {t('agentBuilder.agentType')}
                </label>
                <Select value={agentType} onValueChange={setAgentType}>
                  <SelectTrigger className="bg-warm-800 border-warm-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-300 mb-2">
                  {t('agentBuilder.describeAgent')}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('agentBuilder.descriptionPlaceholder')}
                  rows={6}
                  className="bg-warm-800 border-warm-600"
                />
              </div>

              <Button
                onClick={handleCreateBlueprint}
                disabled={loading || !name || !description}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('agentBuilder.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('agentBuilder.createBlueprint')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-warm-900 border-warm-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-warm-500 mb-1">Capabilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.sampleCapabilities.map((cap, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    {t('agentBuilder.useTemplate')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="blueprints" className="space-y-4">
          {blueprints.filter((b) => b.status === 'Draft').length === 0 ? (
            <Card className="bg-warm-900 border-warm-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Code className="w-12 h-12 text-warm-600 mb-4" />
                <p className="text-warm-500">{t('agentBuilder.noBlueprintsYet')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {blueprints
                .filter((b) => b.status === 'Draft')
                .map((blueprint) => (
                  <Card key={blueprint.id} className="bg-warm-900 border-warm-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{blueprint.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {blueprint.description.substring(0, 100)}...
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(blueprint.status)}>
                          {blueprint.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button
                        onClick={() => handleGenerateAgent(blueprint.id)}
                        disabled={loading}
                        size="sm"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('agentBuilder.generate')}
                      </Button>
                      <Button
                        onClick={() => handleDeleteBlueprint(blueprint.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.delete')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          {blueprints.filter((b) => b.status === 'Ready').length === 0 ? (
            <Card className="bg-warm-900 border-warm-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-12 h-12 text-warm-600 mb-4" />
                <p className="text-warm-500">{t('agentBuilder.noGeneratedYet')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {blueprints
                .filter((b) => b.status === 'Ready')
                .map((blueprint) => (
                  <Card key={blueprint.id} className="bg-warm-900 border-warm-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{blueprint.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {blueprint.agentType} • Generated
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-900/50 text-green-400">Ready</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button
                        onClick={() => handleConvertToSkill(blueprint.id)}
                        disabled={!!blueprint.generatedSkillId}
                        size="sm"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        {blueprint.generatedSkillId ? t('agentBuilder.converted') : t('agentBuilder.convertToSkill')}
                      </Button>
                      {blueprint.generatedSkillId && (
                        <Button
                          onClick={() => handleExportToMarketplace(blueprint.id)}
                          variant="outline"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {t('agentBuilder.export')}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentBuilderPage;
