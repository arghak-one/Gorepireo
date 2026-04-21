# GoRepireo Backend Linking Script
# This script automates the retrieval of InsForge credentials and populates the .env file.

$ProjectId = "b5aa28b1-50c0-4d52-954d-2641a4a24c87"
$EnvFile = ".env"

Write-Host "--- GoRepireo Backend Linker ---" -ForegroundColor Yellow
Write-Host "Linking to Project ID: $ProjectId"

# Execute the InsForge WHOAMI to check login
Try {
    Write-Host "Checking InsForge login status..."
    npx @insforge/cli whoami
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "You are not logged in to InsForge CLI."
        Write-Host "Please run: npx @insforge/cli login" -ForegroundColor Cyan
        return
    }
} Catch {
    # Ignore errors here
}

# Execute the InsForge Link command
Try {
    Write-Host "Retrieving credentials from InsForge CLI..."
    npx @insforge/cli link --project-id $ProjectId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Link successful!" -ForegroundColor Green
    } else {
        Write-Error "Failed to link project. The Project ID may be incorrect or you may need to 'npx @insforge/cli login' first."
    }
} Catch {
    Write-Error "An error occurred during linking: $_"
}

Write-Host "`nReady for Stabilization." -ForegroundColor Cyan
