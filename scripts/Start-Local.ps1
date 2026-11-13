param([switch]$Restart, [switch]$NoBrowser, [switch]$InstallAutoStart, [switch]$RemoveAutoStart)
$ErrorActionPreference = 'Stop'
$repoPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$frontendPath = Join-Path $repoPath 'travel-ui'
$logPath = Join-Path $env:LOCALAPPDATA 'VietnamTravelRisk\logs'
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'Vietnam Travel Risk.lnk'
if ($RemoveAutoStart) {
    if (Test-Path -LiteralPath $shortcutPath) { Remove-Item -LiteralPath $shortcutPath }
    Write-Host 'Automatic start at Windows sign-in removed.'
    exit 0
}
if ($InstallAutoStart) {
    $shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    $shortcut.Arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -NoBrowser'
    $shortcut.WorkingDirectory = $repoPath
    $shortcut.WindowStyle = 7
    $shortcut.Save()
    Write-Host 'Automatic start enabled for this Windows user, at sign-in.'
}
$mutex = New-Object Threading.Mutex($false, 'Local\VietnamTravelRiskStartup')
if (-not $mutex.WaitOne(0)) { Write-Host 'Another startup is in progress.'; exit 0 }
try {
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
    $pythonCandidates = @((Join-Path $repoPath '.venv\Scripts\python.exe'), (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\python.exe'))
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonCommand) { $pythonCandidates += $pythonCommand.Source }
    $pythonPath = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $pythonPath -or -not $nodeCommand) { throw 'Python and Node.js are required. See RUNNING.md.' }
    if (-not (Test-Path -LiteralPath (Join-Path $frontendPath 'node_modules\vite\bin\vite.js'))) { throw 'Install frontend dependencies first: cd travel-ui; npm ci' }
    function Start-AppService($port, $expectedCommand, $binary, $arguments, $workingDirectory, $logName) {
        $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($listener) {
            $existingProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
            if ($existingProcess.CommandLine -notmatch $expectedCommand) { throw "Port $port belongs to another application; no process was stopped." }
            if (-not $Restart) { Write-Host "Port $port already running."; return }
            Stop-Process -Id $listener.OwningProcess
            Wait-Process -Id $listener.OwningProcess -Timeout 10 -ErrorAction SilentlyContinue
        }
        $started = Start-Process -FilePath $binary -ArgumentList $arguments -WorkingDirectory $workingDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath "$logName.out.log") -RedirectStandardError (Join-Path $logPath "$logName.err.log") -PassThru
        Write-Host "Started $logName (PID $($started.Id))."
    }
    Start-AppService 8000 'uvicorn\s+src\.api\.app:app' $pythonPath '-m uvicorn src.api.app:app --host 127.0.0.1 --port 8000' $repoPath 'backend'
    Start-AppService 5180 'vite[/\\]bin[/\\]vite\.js.*--port\s+5180' $nodeCommand.Source 'node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5180 --strictPort' $frontendPath 'frontend'
    $deadline = [DateTime]::UtcNow.AddSeconds(90)
    $ready = $false
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            $backendHealth = Invoke-RestMethod 'http://127.0.0.1:8000/health' -TimeoutSec 2
            $proxyHealth = Invoke-RestMethod 'http://127.0.0.1:5180/health' -TimeoutSec 2
            if ($backendHealth.ok -eq $true -and $proxyHealth.ok -eq $true) { $ready = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw "Startup health check failed. Read logs: $logPath" }
    Write-Host 'Ready: http://localhost:5180 (backend and frontend proxy healthy).'
    Write-Host "Logs: $logPath"
    if (-not $NoBrowser) { Start-Process 'http://localhost:5180' }
} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
