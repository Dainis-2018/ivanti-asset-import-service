console.debug('== XSC_Assetintegration_CIFields: Script Started ==');

var bo_fields_array = [];

try {
    // 1. Securely get session context and parameters
    var sessionContext = Get('Employee#', '$(CurrentUserRecId())').SessionContext;
    if (!sessionContext) {
        throw new Error("Could not retrieve session context.");
    }
    var serverURL = sessionContext.ServerURL();
    var csrfToken = sessionContext.GetSessionInfo().GetStaticHash().replace(/=/g, "").replace(/\+/g, '-').replace(/\//g, '_');
    var sessionKey = sessionContext.SessionKey();

    console.debug("<br>-- Retrieved session parameters.");

    // 2. Define API endpoint and request parameters
    var url = serverURL + "/AdminUI/services/AdminAPI.asmx/GetObjectEx";
    var parameters = {
        Headers: { 'Content-Type': 'application/json' },
        Cookies: { 'SID': sessionKey }
    };

    // 3. Get the selected CI Type from the pick list context
    var ciType = (HeatContext.PickList.Constraint.Conditions[0] || {}).Value;
    console.debug("<br>-- CI Type from context: " + ciType);

    if (ciType) {
        var objectReference = 'CI#' + ciType;
        var payload = { strRef: objectReference, _csrfToken: csrfToken };

        console.debug('<br>-- Executing request to: ' + url + ' with payload: ' + JSON.stringify(payload));
        var response = ExecuteWebRequest('POST', url, JSON.stringify(payload), parameters);

        if (response.StatusCode === 200) {
            var data = JSON.parse(response.Data);
            // The response contains a JSON string within a JSON object, which needs to be parsed.
            // The replace() call handles non-standard "new Date(...)" strings in the response.
            var tableDef = JSON.parse(data.d.TableDef.replace(/new Date\([0-9]{10,20}\)/g, 'null'));

            // 4. Iterate over fields and build the result array
            for (var fieldName in tableDef.Fields) {
                if (tableDef.Fields.hasOwnProperty(fieldName)) {
                    var fieldDef = tableDef.Fields[fieldName];
                    var linkInfo = fieldDef.Link || {};
                    var validationInfo = tableDef.ValidatedFields[fieldName] || {};

                    bo_fields_array.push({
                        ExtRef: objectReference + "." + fieldDef.FieldName,
                        FieldName: fieldDef.FieldName,
                        CIType: ciType,
                        FieldType: fieldDef.FieldType,
                        DataType: fieldDef.DataType,
                        LinkTableRef: linkInfo.LinkTableRef || "",
                        ValidatorRef: validationInfo.ValidatorRef || null
                    });
                }
            }
            console.debug("<br>-- Found " + bo_fields_array.length + " fields for CI Type: " + ciType);
        } else {
            console.error("<br>-- API Error: Failed to get object definition for '" + objectReference + "'. Status: " + response.StatusCode + " " + response.StatusDescription);
        }
    }

    // 5. Return the data to the pick list
    if (HeatContext.PickList) {
        console.debug("<br>-- Returning data to pick list.");
        SetReturnData(bo_fields_array);
    } else {
        // Fallback for testing outside of a pick list context
        console.debug("<br>-- No pick list context. Logging results to console:");
        console.debug(bo_fields_array);
    }
} catch (error) {
    console.error("<br>-- SCRIPT ERROR: An unexpected error occurred. " + error.toString());
}

console.debug('== XSC_Assetintegration_CIFields: Script Finished ==');