$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Write-Host 'Diagnostico privado. No envia mensajes a WhatsApp ni guarda archivos.'
Write-Host 'Primero muestra la configuracion. La prueba opcional consume una llamada de texto y UNA generacion de imagen en tu cuenta de Cloudflare.'
$creativePrivateToken = Read-Host 'AGENT_ADMIN_TOKEN de Cloudflare (NO AI_TEST_TOKEN), oculto' -AsSecureString
$creativeCredential = [System.Net.NetworkCredential]::new('', $creativePrivateToken)
try {
    $creativeHeaders = @{ Authorization = ('Bearer ' + $creativeCredential.Password) }
    $creativeEndpoint = 'https://raylio-whatsapp-agent.rivasbruce563.workers.dev/creative-diagnostic'
    $creativeConfig = Invoke-WebRequest -UseBasicParsing -Method Post -Uri $creativeEndpoint -Headers $creativeHeaders -ContentType 'application/json; charset=utf-8' -Body '{}'
    [System.Text.Encoding]::UTF8.GetString($creativeConfig.RawContentStream.ToArray()) | Write-Output
    $creativeConfirmation = Read-Host 'Probar los modelos reales ahora? Escribe SI para consumir una prueba, o Enter para salir'
    if ($creativeConfirmation -ine 'SI') { return }
    $creativeResponse = Invoke-WebRequest -UseBasicParsing -Method Post -Uri $creativeEndpoint -Headers $creativeHeaders -ContentType 'application/json; charset=utf-8' -Body '{"confirm":"ONE_GENERATION_TEST"}'
    [System.Text.Encoding]::UTF8.GetString($creativeResponse.RawContentStream.ToArray()) | Write-Output
} finally {
    $creativeCredential = $null
    $creativePrivateToken = $null
    $creativeHeaders = $null
}
