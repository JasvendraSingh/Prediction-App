# ==========================================
#  UEFA Predictor API Test Workflow
#  - Handles UEL and UCFL
#  - Fetches matches, generates random predictions
#  - Submits to API
#  - Downloads PDFs
# ==========================================

# API base URL
$baseUrl = "http://127.0.0.1:8000/api"

# Function to process a league
function Process-League {
    param (
        [string]$LeagueName
    )

    Write-Host "`nProcessing ${LeagueName} ..."

    # Step 1: Fetch matches
    $matchesResponse = Invoke-RestMethod -Uri "$baseUrl/matches/${LeagueName}" -Method GET
    $matches = $matchesResponse.matches
    Write-Host "Found $($matches.Count) matches for ${LeagueName}"

    # Step 2: Generate random predictions
    $predictions = @{}
    foreach ($match in $matches) {
        $hometeam = $match.hometeam
        $awayteam = $match.awayteam
        $homeScore = Get-Random -Minimum 0 -Maximum 4
        $awayScore = Get-Random -Minimum 0 -Maximum 4
        $key = "${hometeam}_vs_${awayteam}"
        $predictions[$key] = "$homeScore-$awayScore"
    }

    # Convert predictions to JSON
    $predictionsJson = $predictions | ConvertTo-Json -Depth 10

    # Step 3: Submit predictions
    Write-Host "Submitting predictions for ${LeagueName}..."
    $submitResponse = Invoke-RestMethod -Uri "$baseUrl/predict/${LeagueName}" `
        -Method POST `
        -Body $predictionsJson `
        -ContentType "application/json"

    Write-Host "League table for ${LeagueName}:"
    $submitResponse | Format-Table -AutoSize

    # Step 4: Download PDF
    $pdfFile = "${LeagueName}_table.pdf"
    Write-Host "Downloading PDF for ${LeagueName} to $pdfFile ..."
    Invoke-WebRequest -Uri "$baseUrl/download/${LeagueName}" -OutFile $pdfFile
    Write-Host "PDF downloaded for ${LeagueName} successfully!"
}

# Process both leagues
Process-League -LeagueName "UEL"
Process-League -LeagueName "UCFL"
