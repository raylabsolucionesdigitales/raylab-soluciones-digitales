$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$privateToken = Read-Host 'AI_TEST_TOKEN de Cloudflare (oculto)' -AsSecureString
$message = Read-Host 'Consulta de prueba para Raylab'
$credential = [System.Net.NetworkCredential]::new('', $privateToken)
try {
    $body = @{ message = $message; diagnostic = $true } | ConvertTo-Json -Compress
    $httpResponse = Invoke-WebRequest -UseBasicParsing -Method Post -Uri 'https://raylio-whatsapp-agent.rivasbruce563.workers.dev/ai-test' -Headers @{ Authorization = ('Bearer ' + $credential.Password) } -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    # Windows PowerShell 5.1 can assume Latin-1 when JSON has no charset.
    $response = [System.Text.Encoding]::UTF8.GetString($httpResponse.RawContentStream.ToArray()) | ConvertFrom-Json
    Write-Output $response.reply
    Write-Output 'Prueba privada: no se envio ningun mensaje a WhatsApp.'
} finally {
    $credential = $null
    $privateToken.Dispose()
}
