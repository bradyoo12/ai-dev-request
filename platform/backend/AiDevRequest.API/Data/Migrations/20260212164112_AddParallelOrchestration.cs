using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddParallelOrchestration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_parallel_orchestrations_dev_requests_DevRequestId",
                table: "parallel_orchestrations");

            migrationBuilder.DropForeignKey(
                name: "FK_subagent_tasks_dev_requests_DevRequestId",
                table: "subagent_tasks");

            migrationBuilder.CreateIndex(
                name: "IX_team_projects_DevRequestId",
                table: "team_projects",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_suggestions_DevRequestId",
                table: "suggestions",
                column: "DevRequestId");

            migrationBuilder.AddForeignKey(
                name: "FK_build_verifications_dev_requests_DevRequestId",
                table: "build_verifications",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_compilation_results_dev_requests_DevRequestId",
                table: "compilation_results",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_deployments_dev_requests_DevRequestId",
                table: "deployments",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_generation_manifests_dev_requests_DevRequestId",
                table: "generation_manifests",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_infrastructure_configs_dev_requests_DevRequestId",
                table: "infrastructure_configs",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_oauth_compliance_reports_dev_requests_DevRequestId",
                table: "oauth_compliance_reports",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_observability_traces_dev_requests_DevRequestId",
                table: "observability_traces",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_preview_deployments_dev_requests_DevRequestId",
                table: "preview_deployments",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_project_versions_dev_requests_DevRequestId",
                table: "project_versions",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_refinement_messages_dev_requests_DevRequestId",
                table: "refinement_messages",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sbom_reports_dev_requests_DevRequestId",
                table: "sbom_reports",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_secret_scan_results_dev_requests_DevRequestId",
                table: "secret_scan_results",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_service_blueprints_dev_requests_DevRequestId",
                table: "service_blueprints",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_suggestions_dev_requests_DevRequestId",
                table: "suggestions",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_team_projects_dev_requests_DevRequestId",
                table: "team_projects",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_workflow_executions_dev_requests_DevRequestId",
                table: "workflow_executions",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_build_verifications_dev_requests_DevRequestId",
                table: "build_verifications");

            migrationBuilder.DropForeignKey(
                name: "FK_compilation_results_dev_requests_DevRequestId",
                table: "compilation_results");

            migrationBuilder.DropForeignKey(
                name: "FK_deployments_dev_requests_DevRequestId",
                table: "deployments");

            migrationBuilder.DropForeignKey(
                name: "FK_generation_manifests_dev_requests_DevRequestId",
                table: "generation_manifests");

            migrationBuilder.DropForeignKey(
                name: "FK_infrastructure_configs_dev_requests_DevRequestId",
                table: "infrastructure_configs");

            migrationBuilder.DropForeignKey(
                name: "FK_oauth_compliance_reports_dev_requests_DevRequestId",
                table: "oauth_compliance_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_observability_traces_dev_requests_DevRequestId",
                table: "observability_traces");

            migrationBuilder.DropForeignKey(
                name: "FK_preview_deployments_dev_requests_DevRequestId",
                table: "preview_deployments");

            migrationBuilder.DropForeignKey(
                name: "FK_project_versions_dev_requests_DevRequestId",
                table: "project_versions");

            migrationBuilder.DropForeignKey(
                name: "FK_refinement_messages_dev_requests_DevRequestId",
                table: "refinement_messages");

            migrationBuilder.DropForeignKey(
                name: "FK_sbom_reports_dev_requests_DevRequestId",
                table: "sbom_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_secret_scan_results_dev_requests_DevRequestId",
                table: "secret_scan_results");

            migrationBuilder.DropForeignKey(
                name: "FK_service_blueprints_dev_requests_DevRequestId",
                table: "service_blueprints");

            migrationBuilder.DropForeignKey(
                name: "FK_suggestions_dev_requests_DevRequestId",
                table: "suggestions");

            migrationBuilder.DropForeignKey(
                name: "FK_team_projects_dev_requests_DevRequestId",
                table: "team_projects");

            migrationBuilder.DropForeignKey(
                name: "FK_workflow_executions_dev_requests_DevRequestId",
                table: "workflow_executions");

            migrationBuilder.DropIndex(
                name: "IX_team_projects_DevRequestId",
                table: "team_projects");

            migrationBuilder.DropIndex(
                name: "IX_suggestions_DevRequestId",
                table: "suggestions");

            migrationBuilder.AddForeignKey(
                name: "FK_parallel_orchestrations_dev_requests_DevRequestId",
                table: "parallel_orchestrations",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_subagent_tasks_dev_requests_DevRequestId",
                table: "subagent_tasks",
                column: "DevRequestId",
                principalTable: "dev_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
