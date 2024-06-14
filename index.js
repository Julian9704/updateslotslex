const mclient = require('./moodleclient.mjs');

// Starting AWS clients.
const pStore = new AWS.SSM();

export const handler = async (event) => {
    var paramsParametersStore = {
        Path: '/secrets-chatia/' + currentClient + '/',
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
        'api': {
            "url": localParams.url,
            "token": localParams.token
        }
    };
    var response;
    /**
     * Request the server to get the courses avaibles.
     */
    var courses;

    async () => {

        try {
            courses = await mclient.getCourses();
        } catch (error) {
            console.error(error);
        }
    };
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
