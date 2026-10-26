param([string]$SourceRoot = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = 'Stop'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$views = @(
    @{ Source = 'ae_interactive'; Method = 'way1' },
    @{ Source = 'ae_interactive_way3'; Method = 'way3' }
)

foreach ($view in $views) {
    foreach ($axis in @('time', 'depth')) {
        $source = Join-Path $SourceRoot ($view.Source + '\t0227_known_cases-' + $axis + '_interactive.html')
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing source: $source" }
        $destination = Join-Path $PSScriptRoot ('views\' + $view.Method + '\' + $axis + '.html')
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        $html = [System.IO.File]::ReadAllText($source)
        if (-not $html.Contains('<meta charset="utf-8">') -or -not $html.Contains('</body>')) { throw "Unsupported HTML structure: $source" }
        $html = $html.Replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">')
        $autoplay = "Plotly\.animate\('[0-9a-f-]+', null\);"
        if ([regex]::Matches($html, $autoplay).Count -ne 1) { throw "Missing generated autoplay hook: $source" }
        $html = [regex]::Replace($html, $autoplay, "window.AE_PLOT_READY = true; window.dispatchEvent(new Event('ae-plot-ready'));")
        $html = $html.Replace('</body>', '<script src="../../assets/viewer-bridge.js" defer></script></body>')
        [System.IO.File]::WriteAllText($destination, $html, $utf8)
        Write-Output "Prepared $($view.Method) / $axis"
    }
}
