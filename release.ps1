param(
    [Parameter(Mandatory)][string]$Version,
    [string]$Notas = "Nueva version de Zumi"
)

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Version invalida. Usa formato: 1.2.3"
    exit 1
}

$tag = "v$Version"

# Verificar que no exista el tag
if (git tag --list $tag) {
    Write-Error "El tag $tag ya existe."
    exit 1
}

Write-Host "Publicando Zumi $tag..." -ForegroundColor Cyan

# Actualizar version en tauri.conf.json
$conf = Get-Content "src-tauri\tauri.conf.json" -Raw
$conf = $conf -replace '"version": "\d+\.\d+\.\d+"', "`"version`": `"$Version`""
Set-Content "src-tauri\tauri.conf.json" $conf -NoNewline

# Actualizar version en Cargo.toml
$cargo = Get-Content "src-tauri\Cargo.toml" -Raw
$cargo = $cargo -replace '^version = "\d+\.\d+\.\d+"', "version = `"$Version`""
Set-Content "src-tauri\Cargo.toml" $cargo -NoNewline

# Commit y tag
git add src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "release: $tag"
git tag $tag
git push origin master
git push origin $tag

Write-Host ""
Write-Host "Release $tag publicado." -ForegroundColor Green
Write-Host "GitHub Actions compilara el instalador en ~15 minutos."
Write-Host "https://github.com/arkonblack/Zumi-Desktop/actions"
