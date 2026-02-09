namespace AiDevRequest.API.Services;

public interface ICiCdService
{
    Task<CiCdResult> GeneratePipelineAsync(string projectPath, string projectType);
}

public class CiCdService : ICiCdService
{
    private readonly ILogger<CiCdService> _logger;

    public CiCdService(ILogger<CiCdService> logger)
    {
        _logger = logger;
    }

    public async Task<CiCdResult> GeneratePipelineAsync(string projectPath, string projectType)
    {
        _logger.LogInformation("Generating CI/CD pipeline for {ProjectPath} ({ProjectType})", projectPath, projectType);

        var workflows = new List<CiCdWorkflow>();
        var workflowsDir = Path.Combine(projectPath, ".github", "workflows");
        Directory.CreateDirectory(workflowsDir);

        var ciYaml = GenerateCiWorkflow(projectType);
        var ciPath = Path.Combine(workflowsDir, "ci.yml");
        await File.WriteAllTextAsync(ciPath, ciYaml);
        workflows.Add(new CiCdWorkflow { Name = "CI", FileName = "ci.yml", Type = "continuous_integration" });

        var cdYaml = GenerateCdWorkflow(projectType);
        var cdPath = Path.Combine(workflowsDir, "deploy.yml");
        await File.WriteAllTextAsync(cdPath, cdYaml);
        workflows.Add(new CiCdWorkflow { Name = "Deploy", FileName = "deploy.yml", Type = "continuous_deployment" });

        var envVars = GetRequiredSecrets(projectType);

        _logger.LogInformation("Generated {Count} CI/CD workflows for {ProjectType}", workflows.Count, projectType);

        return new CiCdResult
        {
            Workflows = workflows,
            PipelineProvider = "GitHub Actions",
            RequiredSecrets = envVars,
            Summary = $"Generated CI (build+test) and CD (deploy) pipelines for {projectType} project"
        };
    }

    private static string GenerateCiWorkflow(string projectType)
    {
        var (installCmd, buildCmd, testCmd, nodeVersion) = GetBuildCommands(projectType);

        if (projectType.Contains("dotnet", StringComparison.OrdinalIgnoreCase))
        {
            return $@"name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Test
        run: dotnet test --no-build --configuration Release --verbosity normal
";
        }

        if (projectType.Contains("python", StringComparison.OrdinalIgnoreCase))
        {
            return @"name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Lint
        run: |
          pip install flake8
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: Test
        run: pytest --tb=short -q
";
        }

        // Default: Node.js (React, Next.js, React Native, Expo)
        return $@"name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{nodeVersion}'
          cache: 'npm'

      - name: Install dependencies
        run: {installCmd}

      - name: Lint
        run: npm run lint --if-present

      - name: Build
        run: {buildCmd}

      - name: Test
        run: {testCmd}
";
    }

    private static string GenerateCdWorkflow(string projectType)
    {
        if (projectType.Contains("dotnet", StringComparison.OrdinalIgnoreCase))
        {
            return @"name: Deploy

on:
  push:
    branches: [main]

env:
  AZURE_CONTAINER_REGISTRY: ${{ secrets.AZURE_CONTAINER_REGISTRY }}
  CONTAINER_APP_NAME: ${{ secrets.CONTAINER_APP_NAME }}
  RESOURCE_GROUP: ${{ secrets.RESOURCE_GROUP }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and push container image
        run: |
          az acr build --registry ${{ env.AZURE_CONTAINER_REGISTRY }} \
            --image ${{ env.CONTAINER_APP_NAME }}:${{ github.sha }} .

      - name: Deploy to Azure Container Apps
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_NAME }} \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/${{ env.CONTAINER_APP_NAME }}:${{ github.sha }}
";
        }

        // Default: Node.js / static site deploy
        return @"name: Deploy

on:
  push:
    branches: [main]

env:
  AZURE_CONTAINER_REGISTRY: ${{ secrets.AZURE_CONTAINER_REGISTRY }}
  CONTAINER_APP_NAME: ${{ secrets.CONTAINER_APP_NAME }}
  RESOURCE_GROUP: ${{ secrets.RESOURCE_GROUP }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build and push container image
        run: |
          az acr build --registry ${{ env.AZURE_CONTAINER_REGISTRY }} \
            --image ${{ env.CONTAINER_APP_NAME }}:${{ github.sha }} .

      - name: Deploy to Azure Container Apps
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_NAME }} \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/${{ env.CONTAINER_APP_NAME }}:${{ github.sha }}
";
    }

    private static (string install, string build, string test, string nodeVersion) GetBuildCommands(string projectType)
    {
        return projectType.ToLowerInvariant() switch
        {
            "react" or "nextjs" => ("npm ci", "npm run build", "npm test -- --passWithNoTests", "20"),
            "react-native" or "expo" => ("npm ci", "npx expo export --platform web", "npm test -- --passWithNoTests", "20"),
            _ => ("npm ci", "npm run build", "npm test -- --passWithNoTests", "20"),
        };
    }

    private static List<string> GetRequiredSecrets(string projectType)
    {
        var secrets = new List<string>
        {
            "AZURE_CREDENTIALS",
            "AZURE_CONTAINER_REGISTRY",
            "CONTAINER_APP_NAME",
            "RESOURCE_GROUP"
        };

        if (projectType.Contains("dotnet", StringComparison.OrdinalIgnoreCase))
        {
            secrets.Add("ASPNETCORE_ENVIRONMENT");
        }

        return secrets;
    }
}

public class CiCdResult
{
    public List<CiCdWorkflow> Workflows { get; set; } = new();
    public string PipelineProvider { get; set; } = "";
    public List<string> RequiredSecrets { get; set; } = new();
    public string Summary { get; set; } = "";
}

public class CiCdWorkflow
{
    public string Name { get; set; } = "";
    public string FileName { get; set; } = "";
    public string Type { get; set; } = "";
}
