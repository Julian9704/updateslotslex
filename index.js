const mclient = require('./moodleclient.js');
const AWS = require('aws-sdk');

// Starting AWS clients.

const pStore = new AWS.SSM();
const lex = new AWS.LexModelsV2();

AWS.config.update({
    region: 'us-east-1'
});
/**
 * Updates the required slot in amazon Lex.
 * 
 */
exports.handler = async () => {
    var paramsParametersStore = {
        Path: process.env.ssmpspath,
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
    
    // Request the server to get the courses avaibles.
     
    var courses = await mclient.getCourses(ctx);
    // Determinate when a course is avaiable.

    // Manage the object to modify the courses with the value visible activated.
    var courseAvaialbe = courses;

    // ToDo: Determine when a course in the list "courses" is available.
    // This list is for trying out courses while they are available to read .
    courseAvaialbe = [
        "maths",
        "electronics",
        "science"
    ];

    // This list is to arrange the courses in the lex API format.
    var slotValues = [];
    courseAvaialbe.forEach(element => {
        let slotName = {
            sampleValue: {
                value: element
            }
        };
        slotValues.push(slotName);
    });

    // Required params to Update Slot via API. Fill It dynamically with the client.
    const params = {
        botId: '',
        botVersion: '',
        localeId: '',
        slotTypeId: '',
        slotTypeName: process.env.slotname,
        slotTypeValues: slotValues,
        valueSelectionSetting: {
            resolutionStrategy: 'OriginalValue',
        }

    };
    for (let param in params) {
        let paramName = paramsParametersStore.Path + param;
        let findSecret = infoParametersStore.find(element => element.Name.includes(paramName));
        if (findSecret) {
            params[param] = findSecret.Value;
        }
    }
    /**
     * Update the slot in Amazon Lex
     */
    const command = await lex.updateSlotType(params).promise();
    console.log(command);
};
