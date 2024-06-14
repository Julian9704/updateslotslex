const mclient = require('./moodleclient.js');

// Starting AWS clients.
const AWS = require('aws-sdk');
const pStore = new AWS.SSM();
AWS.config.update({
    region: 'us-east-1'
});

exports.handler = async (event) => {
    var paramsParametersStore = {
        Path: '/secrets-chatia/fyco/',
        Recursive: false,
        WithDecryption: true
    };
    var responseParameterStore = await pStore.getParametersByPath(paramsParametersStore).promise(); 
    var infoParametersStore = responseParameterStore.Parameters;   
    var localParams = {
        'token': '',
        'url': '',
        'siteId': 1
    };
    for (let param in localParams) {
        let paramName = paramsParametersStore.Path + param;
        let findSecret = infoParametersStore.find(element => element.Name.includes(paramName));
        if (findSecret) {
            localParams[param] = findSecret.Value;
        }
    }
    var ctx = {
        "api": {
            "url": localParams.url,
            "token": localParams.token
        }
    };
    var response;
    /**
     * Request the server to get the courses avaibles.
     */
    var courses = await mclient.getCourses(ctx);


    
    // Determinate when a course is avaiable.


    // Manage the object to modify the courses with the value visible activated.
    if (!courses) {
        response = {
            body: JSON.stringify('Var courses empty')
        };
        return response;
    } else {
        var courseAvaialbe = courses;
    }
    /**
     * Update the slot in Amazon Lex
     */

    // Required params to Update Slot via API Fill It dynamically with the client.
    var botId;
    var botVersion;
    var intentId;
    var localeId;
    var slotId;
    var slotName = 'bbc_courses';
    var valueElicitationSetting;

    mclient.getCourses(ctx)




    return response;
};


(async () => {
    try {
        const result = await exports.handler({});
        const objectJSONString = JSON.stringify(result, null, 2);
        console.log(objectJSONString);
        console.log(result.messages[0].content);
    } catch (error) {
        console.error('Error durante la depuración:', error);
    }
})();
