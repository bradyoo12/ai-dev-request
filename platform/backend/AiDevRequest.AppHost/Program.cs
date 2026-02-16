var builder = DistributedApplication.CreateBuilder(args);

// PostgreSQL database
var postgres = builder.AddPostgres("postgres")
    .WithDataVolume("ai-dev-request-pgdata");

var database = postgres.AddDatabase("ai_dev_request");

// .NET Backend API — references the PostgreSQL database
var api = builder.AddProject<Projects.AiDevRequest_API>("api")
    .WithReference(database)
    .WaitFor(database)
    .WithExternalHttpEndpoints();

// React Frontend — runs via npm dev server
var frontend = builder.AddNpmApp("frontend", "../../frontend", "dev")
    .WithReference(api)
    .WaitFor(api)
    .WithHttpEndpoint(port: 5173, env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
