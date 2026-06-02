$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$binPath = Join-Path $PSScriptRoot "bin"
$zipPath = Join-Path $binPath "ffmpeg.zip"
$tempPath = Join-Path $binPath "temp"

# Ensure the bin directory exists
if (-not (Test-Path $binPath)) {
    New-Item -ItemType Directory -Path $binPath -Force | Out-Null
}

Write-Host "[INFO] Descargando FFmpeg desde Gyan.dev..."
Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile $zipPath

if (Test-Path $zipPath) {
    Write-Host "[INFO] Descomprimiendo FFmpeg..."
    Expand-Archive -Path $zipPath -DestinationPath $tempPath -Force
    
    Write-Host "[INFO] Copiando ejecutables..."
    Get-ChildItem -Path $tempPath -Filter "*.exe" -Recurse | Copy-Item -Destination $binPath -Force
    
    Write-Host "[INFO] Limpiando archivos temporales..."
    Remove-Item -Recurse -Force $tempPath, $zipPath -ErrorAction SilentlyContinue
    
    if (Test-Path (Join-Path $binPath "ffmpeg.exe")) {
        Write-Host "[INFO] FFmpeg instalado correctamente."
    } else {
        Write-Warning "[ERROR] No se pudo encontrar ffmpeg.exe despues de extraer."
    }
} else {
    Write-Error "[ERROR] No se pudo descargar ffmpeg.zip."
}
