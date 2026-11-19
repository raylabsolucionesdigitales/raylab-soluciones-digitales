$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Write-Host 'Suscribe la app asociada al token a la cuenta de prueba de Raylab. No elimina otras suscripciones.'
Write-Host 'Copia el token desde Raylab Agente WSP (app 970093816170921), Paso 1 Probar.'
$privateToken = Read-Host 'Identificador de acceso de META (oculto)' -AsSecureString
$credential = [System.Net.NetworkCredential]::new('', $privateToken)
try {
    $headers = @{ Authorization = ('Bearer ' + $credential.Password) }
    $uri = 'https://graph.facebook.com/v26.0/1201660269199867/subscribed_apps'
    $before = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
    $found = @($before.data | Where-Object { [string]$_.whatsapp_business_api_data.id -eq '970093816170921' -or [string]$_.id -eq '970093816170921' }).Count -gt 0
    if (-not $found) {
        $subscribed = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType 'application/json' -Body '{}'
        Write-Output ('META_SUCCESS=' + $subscribed.success)
    }
    $after = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
    $verified = @($after.data | Where-Object { [string]$_.whatsapp_business_api_data.id -eq '970093816170921' -or [string]$_.id -eq '970093816170921' }).Count -gt 0
    Write-Output ('RAYLAB_SUSCRITA=' + $verified)
    if (-not $verified) { Write-Host 'No se confirmo Raylab. No repitas ni elimines apps: revisaremos la app asociada al token.' }
} catch {
    Write-Host 'La operacion fallo; no se confirma la suscripcion.'
    try {
        $metaError = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Output ('META_ERROR_CODE=' + $metaError.error.code)
        Write-Output ('META_ERROR_SUBCODE=' + $metaError.error.error_subcode)
    } catch { Write-Output 'ERROR_DE_CONEXION_O_RESPUESTA_NO_JSON' }
} finally {
    $headers = $null
    $credential = $null
    $privateToken.Dispose()
}
