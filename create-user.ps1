# PowerShell script to create sample user
Write-Host "Creating sample user in My Clinic Portal..." -ForegroundColor Green
Write-Host ""

try {
    npx tsx create-sample-user.ts
    Write-Host ""
    Write-Host "Script execution completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to continue"