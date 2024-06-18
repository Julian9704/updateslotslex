const mclient = require('./moodleclient.js');
const AWS = require('aws-sdk');

// Starting AWS clients.

const pStore = new AWS.SSM();
const lex = new AWS.LexModelsV2();

AWS.config.update({
    region: process.env.region
});
/**
 * Updates the required slot in amazon Lex.
 * 
 */
exports.handler = async () => {
    var secretsParams = {
        Path: process.env.ssmpspath,
        Recursive: false,
        WithDecryption: true
    };

    // Get the client data from Parameter Store.

    var responseParameterStore = await pStore.getParametersByPath(secretsParams).promise();

    var infoParametersStore = responseParameterStore.Parameters;
    var ctx = {
        "api": {
            "url": '',
            "token": ''
        }
    };

    for (let param in ctx.api) {
        let paramName = secretsParams.Path + param;
        let findSecret = infoParametersStore.find(element => element.Name.includes(paramName));

        if (findSecret) {
            ctx.api[param] = findSecret.Value;
        }
    }

    // Request the server to get the courses avaibles.
    var courses = await mclient.getCourses(ctx);

    // Get the name of the courses in Moodle.
    var courseAvailable = [];

    // Fill courseAvailable array with the courses availables.
    courses.forEach(element => {

        if (!courseAvailable.some(course => course.fullname === element.fullname) && element.showactivitydates) {
            courseAvailable.push(element);
        }
    });

    // This list is to arrange the courses in the lex API format.
    var slotValues = [];
    courseAvailable.forEach(element => {
        let slotName = {
            sampleValue: {
                value: element.fullname
            },
        };
        if (element.displayname && element.displayname !== element.fullname) {
            slotName['synonyms'] = [];
            slotName.synonyms.push({ value: element.displayname });

        }
        if (element.shortname && element.shortname !== element.fullname) {
            if (slotName.synonyms && element.shortname !== element.displayname) {
                slotName.synonyms.push({ value: element.shortname });
            } else {
                slotName['synonyms'] = [];
                slotName.synonyms.push({ value: element.shortname });
            }
        }

        slotValues.push(slotName);
    });

    // Required params to Update Slot via API. Fill It dynamically with the client.
    var updateParams =  {
        botId: '',
        botVersion: '',
        localeId: '',
        slotTypeId: '',
        slotTypeName: 'bbc_courses',
        slotTypeValues: slotValues,
        valueSelectionSetting: {
            resolutionStrategy: 'TopResolution',
        }
    };

    for (let param in updateParams) {
        let paramName = secretsParams.Path + param;
        let findSecret = infoParametersStore.find(element => element.Name.includes(paramName));
        if (findSecret) {
            updateParams[param] = findSecret.Value;
        }
    }

    /**
     * Update the slot in Amazon Lex
     */
    await lex.updateSlotType(updateParams).promise();

    // Required params to build the bot API. Fill It dynamically with the client.
    var buildParams = {
        botId: '',
        botVersion: '',
        localeId: ''
    };

    for (let param in buildParams) {
        let paramName = secretsParams.Path + param;
        let findSecret = infoParametersStore.find(element => element.Name.includes(paramName));
        if (findSecret) {
            buildParams[param] = findSecret.Value;
        }
    }

    /**
     * Build the bot after update the slot.
     */

    lex.buildBotLocale(buildParams).promise();
};
