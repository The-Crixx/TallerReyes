# Download jsPDF UMD bundle into ./vendor
$destDir = Join-Path -Path $PSScriptRoot -ChildPath 'vendor'
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
$uri = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
$target = Join-Path $destDir 'jspdf.umd.min.js'
Write-Host "Downloading $uri to $target"
try {
    Invoke-WebRequest -Uri $uri -OutFile $target -UseBasicParsing -ErrorAction Stop
    Write-Host "Download completed. File saved to: $target"
} catch {
    Write-Error "Download failed: $_"
}
