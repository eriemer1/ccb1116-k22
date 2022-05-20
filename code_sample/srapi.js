(function process( /*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
 
    var queryParams = request.queryParams;
    var number = queryParams.number; //get the value of the 'number' parameter from the request
 
    var payload = {};
    var grIncident = new GlideRecord('incident');
    if (grIncident.get('number', number.toString())) {
        payload = { //build the payload of details we will return
           'number': grIncident.getValue('number'),
           'state': grIncident.getDisplayValue('state'),
           'short_description': grIncident.getValue('short_description'),
           'assignment_group': grIncident.getDisplayValue('assignment_group'),
           'description': grIncident.getValue('description'),
           'assigned_to': grIncident.getDisplayValue('assigned_to'),
           'cmdb_ci_name': grIncident.getDisplayValue('cmdb_ci'),
           'caller_id_name': grIncident.getDisplayValue('caller_id'),
           'category': grIncident.getDisplayValue('category')
        };
        response.setBody(payload); //set the Body to return
        response.setStatus(200); //set the HTTP Status to return
    } else {//error handling, if we don't find an incident with a matching number send a 404 error with a message
        response.setBody("Invalid Record Number");
        response.setStatus(404);
    }
 
})(request, response);
