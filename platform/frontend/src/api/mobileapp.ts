import { authFetch } from './auth'

export interface MobileAppConfig {
  id: string
  devRequestId: string
  appName: string
  bundleId: string
  platform: string
  framework: string
  status: string
  appDescription: string | null
  appVersion: string
  buildNumber: number
  iconUrl: string | null
  expoEnabled: boolean
  expoQrCodeUrl: string | null
  previewUrl: string | null
  iosEnabled: boolean
  androidEnabled: boolean
  iosBuildStatus: string | null
  androidBuildStatus: string | null
  iosPublishStatus: string | null
  androidPublishStatus: string | null
  totalScreens: number
  totalComponents: number
  lastBuildAt: string | null
  lastPublishAt: string | null
  createdAt: string
}

export interface BuildResult {
  buildNumber: number
  iosBuildStatus: string | null
  androidBuildStatus: string | null
  expoQrCodeUrl: string | null
  previewUrl: string | null
}

export interface BuildRecord {
  buildNumber: number
  platform: string
  status: string
  startedAt: string
  completedAt: string | null
}

export interface ScreenRecord {
  name: string
  route: string
  type: string
  componentCount: number
}

export async function getMobileAppConfig(projectId: string): Promise<MobileAppConfig> {
  const res = await authFetch(`/api/mobile-app/config/${projectId}`)
  if (!res.ok) throw new Error('Failed to fetch mobile app config')
  return res.json()
}

export async function updateMobileAppConfig(
  projectId: string,
  data: { appName?: string; bundleId?: string; platform?: string; appDescription?: string; appVersion?: string; iosEnabled?: boolean; androidEnabled?: boolean; expoEnabled?: boolean }
): Promise<void> {
  const res = await authFetch(`/api/mobile-app/config/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update mobile app config')
}

export async function triggerBuild(projectId: string, platform = 'both'): Promise<BuildResult> {
  const res = await authFetch('/api/mobile-app/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, platform }),
  })
  if (!res.ok) throw new Error('Failed to trigger build')
  return res.json()
}

export async function publishApp(projectId: string, store = 'both'): Promise<void> {
  const res = await authFetch('/api/mobile-app/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, store }),
  })
  if (!res.ok) throw new Error('Failed to publish app')
}

export async function getScreens(projectId: string): Promise<{ screens: ScreenRecord[]; totalScreens: number; totalComponents: number }> {
  const res = await authFetch(`/api/mobile-app/screens/${projectId}`)
  if (!res.ok) throw new Error('Failed to fetch screens')
  return res.json()
}

export async function getBuilds(projectId: string): Promise<{ builds: BuildRecord[] }> {
  const res = await authFetch(`/api/mobile-app/builds/${projectId}`)
  if (!res.ok) throw new Error('Failed to fetch builds')
  return res.json()
}

// --- TestFlight Deployment Pipeline ---

export interface MobileDeployment {
  id: string
  devRequestId: string
  deploymentType: string
  status: string
  appDescription: string | null
  generatedCodeJson: string | null
  expoQrCodeUrl: string | null
  testFlightUrl: string | null
  appleBundleId: string | null
  appleTeamId: string | null
  appVersion: string | null
  buildNumber: number | null
  buildLogsJson: string | null
  errorMessage: string | null
  submittedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface ExpoPreviewResult {
  previewUrl: string
  snackUrl: string
  success: boolean
  error: string | null
}

export async function generateNativeCode(devRequestId: string, appDescription: string): Promise<MobileDeployment> {
  const res = await authFetch('/api/mobile-app/generate-native', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devRequestId, appDescription }),
  })
  if (!res.ok) throw new Error('Failed to generate native code')
  return res.json()
}

export async function deployToTestFlight(deploymentId: string): Promise<MobileDeployment> {
  const res = await authFetch('/api/mobile-app/deploy-testflight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deploymentId }),
  })
  if (!res.ok) throw new Error('Failed to deploy to TestFlight')
  return res.json()
}

export async function generateExpoPreview(devRequestId: string, appDescription?: string): Promise<ExpoPreviewResult> {
  const res = await authFetch('/api/mobile-app/expo-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devRequestId, appDescription }),
  })
  if (!res.ok) throw new Error('Failed to generate Expo preview')
  return res.json()
}

export async function getDeployStatus(deploymentId: string): Promise<MobileDeployment> {
  const res = await authFetch(`/api/mobile-app/deploy-status/${deploymentId}`)
  if (!res.ok) throw new Error('Failed to get deployment status')
  return res.json()
}

export async function getDeployments(projectId: string): Promise<{ deployments: MobileDeployment[] }> {
  const res = await authFetch(`/api/mobile-app/deployments/${projectId}`)
  if (!res.ok) throw new Error('Failed to get deployments')
  return res.json()
}
