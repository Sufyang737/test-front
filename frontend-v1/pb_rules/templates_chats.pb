/// List rule
@request.auth.id != "" && (@request.auth.client_id = client_id)

/// View rule
@request.auth.id != "" && (@request.auth.client_id = client_id)

/// Create rule
@request.auth.id != "" && @request.auth.client_id != ""

/// Update rule
@request.auth.id != "" && (@request.auth.client_id = client_id)

/// Delete rule
@request.auth.id != "" && (@request.auth.client_id = client_id) 