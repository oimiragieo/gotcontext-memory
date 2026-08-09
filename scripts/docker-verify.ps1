# Build/run gotcontext-memory dogfood images for one or all harness CLIs.
# Windows PowerShell + Docker Desktop.
#
#   pwsh -File scripts/docker-verify.ps1
#   pwsh -File scripts/docker-verify.ps1 -Harness codex
#   pwsh -File scripts/docker-verify.ps1 -Harness all -NoCache
param(
  [ValidateSet("all", "claude", "codex", "cursor", "agy", "opencode")]
  [string]$Harness = "all",
  [switch]$NoCache,
  [string]$BaseImage = "gotcontext-memory-base"
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

$all = @("claude", "codex", "cursor", "agy", "opencode")
$targets = if ($Harness -eq "all") { $all } else { @($Harness) }

$outRoot = Join-Path $RepoRoot "docker/out"
New-Item -ItemType Directory -Force -Path $outRoot | Out-Null

function Invoke-DockerBuild([string[]]$Args) {
  if ($NoCache) { $Args = @("build", "--no-cache") + $Args[1..($Args.Length - 1)] }
  Write-Host "==> docker $($Args -join ' ')"
  & docker @Args
  if ($LASTEXITCODE -ne 0) { throw "docker build failed ($LASTEXITCODE)" }
}

Write-Host "==> Building base image $BaseImage"
$baseArgs = @("build", "-f", "docker/Dockerfile.base", "-t", $BaseImage, ".")
Invoke-DockerBuild $baseArgs

$results = @()
foreach ($h in $targets) {
  $img = "gotcontext-memory-$h"
  $df = "docker/Dockerfile.$h"
  Write-Host "`n========== HARNESS $h =========="
  Invoke-DockerBuild @(
    "build", "-f", $df, "-t", $img,
    "--build-arg", "BASE_IMAGE=$BaseImage",
    "."
  )

  $hOut = Join-Path $outRoot $h
  New-Item -ItemType Directory -Force -Path $hOut | Out-Null
  # Wipe prior leftovers for hermetic run
  Get-ChildItem -Force $hOut -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

  Write-Host "==> Running $img"
  & docker run --rm `
    -e "GCM_HARNESS=$h" `
    -e "GCM_REPORT=/home/dogfood/workspace/VERIFY_REPORT.md" `
    -v "${hOut}:/home/dogfood/workspace" `
    $img
  $rc = $LASTEXITCODE
  $report = Join-Path $hOut "VERIFY_REPORT.md"
  if (Test-Path $report) {
    Write-Host "==> Report: $report"
    Get-Content $report -Tail 25
  }
  $results += [pscustomobject]@{ Harness = $h; ExitCode = $rc; Report = $report }
  if ($rc -ne 0) {
    Write-Host "HARNESS $h FAILED (exit $rc)" -ForegroundColor Red
  } else {
    Write-Host "HARNESS $h PASSED" -ForegroundColor Green
  }
}

Write-Host "`n========== MATRIX SUMMARY =========="
$results | Format-Table -AutoSize | Out-String | Write-Host
$summaryPath = Join-Path $outRoot "MATRIX_SUMMARY.md"
@(
  "# Docker harness matrix",
  "",
  "| Harness | Exit | Report |",
  "|---|---|---|"
) + ($results | ForEach-Object {
  $verdict = if ($_.ExitCode -eq 0) { "PASS" } else { "FAIL ($($_.ExitCode))" }
  "| $($_.Harness) | $verdict | ``$($_.Report)`` |"
}) | Set-Content -Path $summaryPath -Encoding utf8
Write-Host "Wrote $summaryPath"

$failed = @($results | Where-Object { $_.ExitCode -ne 0 })
if ($failed.Count -gt 0) {
  exit 1
}
exit 0
