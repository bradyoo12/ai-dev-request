using AiDevRequest.API.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class CodeValidationServiceTests
{
    private readonly CodeValidationService _service;

    public CodeValidationServiceTests()
    {
        var logger = new Mock<ILogger<CodeValidationService>>();
        _service = new CodeValidationService(logger.Object);
    }

    [Fact]
    public async Task ValidateAsync_ValidReactProject_ReturnsValid()
    {
        var files = new Dictionary<string, string>
        {
            ["package.json"] = """{"name": "test-app", "version": "1.0.0", "dependencies": {"react": "^18.0.0"}}""",
            ["App.tsx"] = """
                import React from 'react';
                export default function App() {
                    return <div>Hello World</div>;
                }
                """,
            ["src/components/Header.tsx"] = """
                import React from 'react';
                export function Header() {
                    return <header><h1>My App</h1></header>;
                }
                """
        };

        var result = await _service.ValidateAsync(files, "react");

        Assert.True(result.IsValid);
        Assert.True(result.Score > 50);
    }

    [Fact]
    public async Task ValidateAsync_MissingEntryPoint_ReturnsInvalid()
    {
        var files = new Dictionary<string, string>
        {
            ["package.json"] = """{"name": "test-app", "version": "1.0.0"}""",
            ["src/utils.ts"] = "export function add(a: number, b: number) { return a + b; }"
        };

        var result = await _service.ValidateAsync(files, "react");

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, i => i.Description.Contains("App entry point"));
    }

    [Fact]
    public async Task ValidateAsync_InvalidJson_ReturnsError()
    {
        var files = new Dictionary<string, string>
        {
            ["package.json"] = "{ invalid json content",
            ["App.tsx"] = "export default function App() { return <div>Hello</div>; }"
        };

        var result = await _service.ValidateAsync(files, "react");

        Assert.Contains(result.Issues, i => i.FilePath == "package.json" && i.Severity == "error");
    }

    [Fact]
    public async Task ValidateAsync_EmptyFile_ReturnsError()
    {
        var files = new Dictionary<string, string>
        {
            ["package.json"] = """{"name": "test-app"}""",
            ["App.tsx"] = "export default function App() { return <div>Hello</div>; }",
            ["src/empty.ts"] = ""
        };

        var result = await _service.ValidateAsync(files, "react");

        Assert.Contains(result.Issues, i => i.FilePath == "src/empty.ts" && i.Severity == "error");
    }

    [Fact]
    public async Task ValidateAsync_FlutterMissingMainDart_ReturnsError()
    {
        var files = new Dictionary<string, string>
        {
            ["pubspec.yaml"] = "name: test_app\ndependencies:\n  flutter:\n    sdk: flutter",
            ["lib/screens/home.dart"] = "import 'package:flutter/material.dart';\nclass Home extends StatelessWidget { Widget build(BuildContext c) => Container(); }"
        };

        var result = await _service.ValidateAsync(files, "flutter");

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, i => i.Description.Contains("main.dart"));
    }

    [Fact]
    public async Task ValidateAsync_DotnetMissingProgramCs_ReturnsError()
    {
        var files = new Dictionary<string, string>
        {
            ["MyApp.csproj"] = "<Project Sdk=\"Microsoft.NET.Sdk.Web\"><PropertyGroup><TargetFramework>net9.0</TargetFramework></PropertyGroup></Project>",
            ["Controllers/HomeController.cs"] = "namespace MyApp.Controllers { public class HomeController {} }"
        };

        var result = await _service.ValidateAsync(files, "dotnet");

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, i => i.Description.Contains("Program.cs"));
    }

    [Fact]
    public async Task ValidateAsync_TodoPlaceholders_ReturnsWarning()
    {
        var files = new Dictionary<string, string>
        {
            ["package.json"] = """{"name": "test-app"}""",
            ["App.tsx"] = "export default function App() { return <div>Hello</div>; }",
            ["src/service.ts"] = "export class MyService { doWork() { // TODO: implement this method } }"
        };

        var result = await _service.ValidateAsync(files, "react");

        Assert.Contains(result.Issues, i => i.FilePath == "src/service.ts" && i.Severity == "warning");
    }

    [Fact]
    public async Task ValidateAsync_ScoreDecreasesWithErrors()
    {
        var validFiles = new Dictionary<string, string>
        {
            ["package.json"] = """{"name": "test-app"}""",
            ["App.tsx"] = "export default function App() { return <div>Hello</div>; }"
        };

        var invalidFiles = new Dictionary<string, string>
        {
            ["package.json"] = "{ broken json",
            ["src/empty.ts"] = "",
            ["src/another-empty.ts"] = ""
        };

        var validResult = await _service.ValidateAsync(validFiles, "react");
        var invalidResult = await _service.ValidateAsync(invalidFiles, "react");

        Assert.True(validResult.Score > invalidResult.Score);
    }

    [Fact]
    public async Task ValidateAsync_ValidFlutterProject_ReturnsValid()
    {
        var files = new Dictionary<string, string>
        {
            ["pubspec.yaml"] = "name: test_app\ndependencies:\n  flutter:\n    sdk: flutter",
            ["lib/main.dart"] = "import 'package:flutter/material.dart';\nvoid main() => runApp(MyApp());",
            ["lib/screens/home.dart"] = "import 'package:flutter/material.dart';\nclass Home extends StatelessWidget { Widget build(BuildContext c) => Scaffold(); }"
        };

        var result = await _service.ValidateAsync(files, "flutter");

        Assert.True(result.IsValid);
        Assert.True(result.Score > 50);
    }

    [Fact]
    public async Task ValidateAsync_StubFile_ReturnsWarning()
    {
        var files = new Dictionary<string, string>
        {
            ["package.json"] = """{"name": "test-app"}""",
            ["App.tsx"] = "export default function App() { return <div>Hello</div>; }",
            ["src/stub.ts"] = "// stub file"
        };

        var result = await _service.ValidateAsync(files, "react");

        Assert.Contains(result.Issues, i => i.FilePath == "src/stub.ts" && i.Severity == "warning");
    }
}
