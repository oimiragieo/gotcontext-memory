# Build and run the Claude CLI + gotcontext-memory verification container.
# Intended for Windows PowerShell / Docker Desktop.
# Usage (from repo root):
#   pwsh -File scripts/docker-verify.ps1
#   pwsh -File scripts/docker-verify.ps1 -NoCache
param(
  [switch]$NoCache,
  [string]$ImageName = "gotcontext-memory-claude-dogfood",
  [string]$ClaudeCodeVersion = "latest"
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

Write-Host "==> Building $ImageName (Claude Code $ClaudeCodeVersion)"
$buildArgs = @(
  "build",
  "-f", "docker/Dockerfile",
  "-t", $ImageName,
  "--build-arg", "CLAUDE_CODE_VERSION=$ClaudeCodeVersion"
)
if ($NoCache) { $buildArgs += "--no-cache" }
$buildArgs += "."
& docker @buildArgs
if ($LASTEXITCODE -ne 0) { throw "docker build failed with exit $LASTEXITCODE" }

$outDir = Join-Path $RepoRoot "docker/out"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "==> Running verification container"
& docker run --rm `
  -e "GCM_REPORT=/home/dogfood/workspace/VERIFY_REPORT.md" `
  -v "${outDir}:/home/dogfood/workspace" `
  $ImageName
$rc = $LASTEXITCODE

$report = Join-Path $outDir "VERIFY_REPORT.md"
if (Test-Path $report) {
  Write-Host "==> Report written to $report"
  Get-Content $report -Tail 40
} else {
  Write-Host "==> WARNING: VERIFY_REPORT.md not found in $outDir"
}

exit $rc
