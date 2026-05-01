param(
    [string]$SummaryPath = (Join-Path (Split-Path -Parent $PSScriptRoot) "photoshop-action-summary.tsv"),
    [string]$ActionsDir = (Join-Path $env:APPDATA "Adobe\Adobe Photoshop 2026\Presets\Actions"),
    [string]$QuarantineDir = (Join-Path $env:APPDATA "Adobe\Adobe Photoshop 2026\Presets\Actions\_disabled_by_codex_failed")
)

if (-not (Test-Path -LiteralPath $SummaryPath)) {
    exit 0
}

$rows = Import-Csv -LiteralPath $SummaryPath -Delimiter "`t"
$deleted = @()

foreach ($row in $rows) {
    $fail = 0
    [void][int]::TryParse([string]$row.fail, [ref]$fail)

    $shouldDisable = $fail -gt 0 -or [string]$row.load_status -ne "OK"
    if (-not $shouldDisable -or [string]::IsNullOrWhiteSpace($row.file)) {
        continue
    }

    $source = Join-Path $ActionsDir $row.file
    $quarantined = Join-Path $QuarantineDir $row.file

    if (Test-Path -LiteralPath $source) {
        Remove-Item -LiteralPath $source -Force
        $deleted += $row.file
    }

    if (Test-Path -LiteralPath $quarantined) {
        Remove-Item -LiteralPath $quarantined -Force
        $deleted += $row.file
    }
}

$deleted | Sort-Object -Unique
