'use strict';

let express     = require('express'), // app server
    bodyParser  = require('body-parser'), // parser for post requests
    AssistantV1 = require('watson-developer-cloud/assistant/v1'), // watson sdk
    dashbot     = require('dashbot')(process.env.DASHBOT_API_KEY).generic,
    app         = express(),

    // Create the service wrapper
    assistant = new AssistantV1({
        version: '2018-07-10'
    }),

    // Fallback user id
    userId    = '1';


// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// CORS Access testing
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Endpoint to be call from the client side
app.post('/api/message', function (req, res) {
    let workspace = process.env.WORKSPACE_ID || '<workspace-id>',
        payload;
    if (!workspace || workspace === '<workspace-id>') {
        return res.json({
            'output': {
                'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
            }
        });
    }

    payload = {
        workspace_id: workspace,
        context     : req.body.context || {},
        input       : req.body.input || {}
    };

    // Send the input to the assistant service
    assistant.message(payload, function (err, data) {
        let humanMessageForDashbot;

        if (err) {
            return res.status(err.code || 500).json(err);
        }

        // if (payload.context.metadata && payload.context.metadata.user_id) {
        //     userId = payload.context.metadata.user_id;
        // }

        humanMessageForDashbot = {
            text  : payload.input.text || '',
            userId: userId
        };
        dashbot.logIncoming(humanMessageForDashbot);
        return res.json(updateMessage(payload, data));
    });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
    let responseText = null,
        intent,
        entities     = [];

    if (!response.output) {
        response.output = {};
    } else {
        // if (response.context.metadata && response.context.metadata.user_id) {
        //     userId = response.context.metadata.user_id;
        // }

        // intent = (response.intents && response.intents.length) ? response.intents[0] : {};
        //
        // if (response.entities && response.entities.length) {
        //     entities = response.entities.map(function (entity) {
        //         return {
        //             name : entity.entity,
        //             value: entity.value
        //         };
        //     });
        // }

        let watsonMessageForDashbot = {
            text       : response.output.text[0] || {},
            userId     : userId
            // intent     : {
            //     name  : intent.intent || '',
            //     inputs: entities
            // },
            // payloadJson: response
        };
        dashbot.logOutgoing(watsonMessageForDashbot);
        return response;
    }
    if (response.intents && response.intents[0]) {
        intent = response.intents[0];
        if (intent.confidence >= 0.75) {
            responseText = 'I understood your intent was ' + intent.intent;
        } else if (intent.confidence >= 0.5) {
            responseText = 'I think your intent was ' + intent.intent;
        } else {
            responseText = 'I did not understand your intent';
        }
    }
    response.output.text = responseText;
    return response;
}

module.exports = app;
