/*
    Encrypt and set Configuration for Ivanti Service Manager Asset Integration.
    This script is intended to be used with a Quick Action on the xsc_assetintegration_config business object.
*/
console.debug('<BR> -- XSC Asset Integration Configuration Encryption script started -- <BR>');

// --- Configuration ---
// IMPORTANT: Update this URL to point to your running Asset Import Service.
const ASSET_SERVICE_URL = "http://localhost:8097/api/encrypt-config";
console.debug('<BR> -- Using Asset Import Service URL: ' + ASSET_SERVICE_URL);

try {
    // Get the current configuration record.
    const configRecord = Get('XSC_Assetintegration_Config#', '$(RecId)');
    console.debug('<BR> -- Loaded configuration record with RecId: ' + '$(RecId)');
    if (!configRecord) {
        console.error('<BR> -- Could not load the configuration record with RecId: ' + '$(RecId)');
    }

    const ivantiApiKey = configRecord.Fields['IvantiApiKey'];
    if (!ivantiApiKey) {
        console.error("<BR> -- IvantiApiKey field is missing or empty on the configuration record.");
    }

    // Build request Headers
    const requestHeaders = {
        Headers: {
            "Content-Type": "application/json",
            "X-Ivanti-API-Key": ivantiApiKey
        },
        SkipServerCertificateValidation: true,
        AllowAutoRedirect: false
    };

    // POST REST API call to get encrypted configuration
    console.debug('<BR> -- posting to encryption API at: ' + ASSET_SERVICE_URL);
    const payload = {
        "nonce": '$(RecId)', // Using the record's RecId as a unique nonce
        "configData": {
            IntegrationSourceType: configRecord.Fields['IntegrationSourceType'],
            EndpointUrl: configRecord.Fields['EndpointUrl'],
            ApiToken: configRecord.Fields['ApiToken'],
            Username: configRecord.Fields['Username'],
            Password: configRecord.Fields['Password'],
            TenantId: configRecord.Fields['TenantId'],
            IvantiApiKey: configRecord.Fields['IvantiApiKey'],
            ClientAuthenticationKey: configRecord.Fields['ClientAuthenticationKey'],
            PageSize: configRecord.Fields['PageSize'],
            LOG_LEVEL: configRecord.Fields['LOG_LEVEL']
        }
    };
    
    const response = ExecuteWebRequest("POST", ASSET_SERVICE_URL, JSON.stringify(payload), requestHeaders);

    if (response.StatusCode === 200 || response.StatusCode === 201) {
        const responseData = JSON.parse(response.Data);
        const encryptedConfig = responseData.encryptedConfig;
        console.debug('<BR> -- Configuration Encrypted: ' + encryptedConfig.substring(0, 15) + '... ');
        configRecord.Update({ 'EncryptedConfig': encryptedConfig });
        console.debug('<BR> -- EncryptedConfig field updated successfully.');
    } else {
        console.error('<BR> -- API call failed with status: ' + response.StatusCode + ' ' + response.Data);
    }
} catch (error) {
    console.error('<BR> -- Error during Configuration encryption process: ' + error);
}

console.debug('<BR> -- XSC Asset Integration Configuration Encryption script finished -- <BR>');