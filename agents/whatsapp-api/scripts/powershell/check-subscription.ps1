$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Write-Host 'Solo lectura: comprueba las apps suscritas a tu cuenta de WhatsApp. No envia mensajes ni modifica nada.'
$wabaId = (Read-Host 'WhatsApp Business Account ID (WABA), de Meta Paso 1 Probar').Trim()
if ($wabaId -notmatch '^\d{6,25}$') { throw 'Introduce el ID numerico de la cuenta de WhatsApp, no el Phone Number ID ni el del portafolio.' }
$privateToken = Read-Host 'Identificador de acceso de META (NO AI_TEST_TOKEN), oculto' -AsSecureString
$credential = [System.Net.NetworkCredential]::new('', $privateToken)
try {
    $response = Invoke-RestMethod -Method Get -Uri ('https://graph.facebook.com/v26.0/' + $wabaId + '/subscribed_apps') -Headers @{ Authorization = ('Bearer ' + $credential.Password) }
    $apps = @($response.data | Where-Object { $null -ne $_ })
    if ($apps.Count -eq 0) { Write-Output 'SIN_APPS_SUSCRITAS' }
    $found = $false
    foreach ($item in $apps) {
        $app = $item.whatsapp_business_api_data
        if ($null -eq $app) { $app = $item }
        Write-Output ('APP_ID=' + $app.id)
        if ([string]$app.id -eq '970093816170921') { $found = $true }
    }
    Write-Output ('RAYLAB_SUSCRITA=' + $found)
    if ($response.paging.next) { Write-Output 'HAY_MAS_PAGINAS: la lista puede estar incompleta.' }
} catch {
    Write-Host 'La consulta fallo. Un fallo de permisos NO demuestra que falte la suscripcion.'
    $detail = $_.ErrorDetails.Message
    try {
        $metaError = $detail | ConvertFrom-Json
        Write-Output ('META_ERROR_CODE=' + $metaError.error.code)
        Write-Output ('META_ERROR_SUBCODE=' + $metaError.error.error_subcode)
    } catch { Write-Output 'ERROR_DE_CONEXION_O_RESPUESTA_NO_JSON' }
} finally {
    $credential = $null
    $privateToken.Dispose()
}
