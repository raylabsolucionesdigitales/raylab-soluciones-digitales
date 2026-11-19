$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Write-Host 'Prueba: enviara UNA respuesta de IA al destinatario configurado en Cloudflare.'
Write-Host 'Primero escribe desde ese WhatsApp al numero de prueba de Meta para abrir la ventana de atencion.'
$confirmation = Read-Host 'Ya enviaste ese mensaje hace menos de 24 horas? Escribe SI para continuar'
if ($confirmation -ne 'SI') { throw 'Prueba cancelada. No se envio nada.' }
$privateToken = Read-Host 'AI_TEST_TOKEN (oculto)' -AsSecureString
$credential = [System.Net.NetworkCredential]::new('', $privateToken)
try {
    $message = Read-Host 'Consulta para Raylab'
    $body = @{ message = $message; send_to_whatsapp = $true; request_id = [guid]::NewGuid().ToString() } | ConvertTo-Json -Compress
    $httpResponse = Invoke-WebRequest -UseBasicParsing -Method Post -Uri 'https://raylio-whatsapp-agent.rivasbruce563.workers.dev/ai-test' -Headers @{ Authorization = ('Bearer ' + $credential.Password) } -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    [System.Text.Encoding]::UTF8.GetString($httpResponse.RawContentStream.ToArray()) | Write-Output
    Write-Host 'accepted_by_meta confirma aceptacion, no entrega. Revisa tu WhatsApp.'
} finally {
    $credential = $null
    $privateToken.Dispose()
}
