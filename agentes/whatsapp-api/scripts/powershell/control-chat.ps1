param(
    [Parameter(Mandatory=$true)][ValidateSet('pause','resume','status')][string]$Action,
    [Parameter(Mandatory=$true)][ValidatePattern('^(?:\+?[1-9]\d{7,14}|bsuid:[A-Z]{2}\.(?:ENT\.)?[A-Za-z0-9_-]{1,128})$')][string]$Customer
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$privateToken = Read-Host 'AGENT_ADMIN_TOKEN de Cloudflare (oculto)' -AsSecureString
$credential = [System.Net.NetworkCredential]::new('', $privateToken)
try {
    $body = @{ action = $Action; customer = $Customer } | ConvertTo-Json -Compress
    $response = Invoke-WebRequest -UseBasicParsing -Method Post -Uri 'https://raylio-whatsapp-agent.rivasbruce563.workers.dev/conversation-control' -Headers @{ Authorization = ('Bearer ' + $credential.Password) } -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    [System.Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray()) | Write-Output
} finally {
    $credential = $null
    $privateToken.Dispose()
}
