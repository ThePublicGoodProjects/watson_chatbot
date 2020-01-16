// The Api module is designed to handle all interactions with the server

var Api = (function () {
    var requestPayload,
        responsePayload,
        messageEndpoint = '/api/message';

    // Publicly accessible methods defined
    return {
        sendRequest: sendRequest,

        // The request/response getters/setters are defined here to prevent internal methods
        // from calling the methods without any of the callbacks that are added elsewhere.
        getRequestPayload : function () {
            return requestPayload;
        },
        setRequestPayload : function (newPayloadStr) {
            requestPayload = JSON.parse(newPayloadStr);
        },
        getResponsePayload: function () {
            return responsePayload;
        },
        setResponsePayload: function (newPayloadStr) {
            responsePayload = JSON.parse(newPayloadStr);
        }
    };

    // Send a message request to the server
    function sendRequest(text, context) {
        // Build request payload
        var payloadToWatson = {};
        if (text) {
            payloadToWatson.input = {
                text: text
            };
        }
        if (context) {
            payloadToWatson.context = context;
        }

        // Built http request
        var http = new XMLHttpRequest();
        http.open('POST', messageEndpoint, true);
        http.setRequestHeader('Content-type', 'application/json');
        http.onreadystatechange = function () {
            if (http.readyState === 4 && http.status === 200 && http.responseText) {
                Api.setResponsePayload(http.responseText);
            }
        };

        var params = JSON.stringify(payloadToWatson);
        // Stored in variable (publicly visible through Api.getRequestPayload)
        // to be used throughout the application
        if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
            Api.setRequestPayload(params);
        }

        // Send request
        http.send(params);
    }
}());

// The Common module is designed as an auxiliary module
// to hold functions that are used in multiple other modules
/* eslint no-unused-vars: "off" */

var Common = (function () {
    // Publicly accessible methods defined
    return {
        buildDomElement: buildDomElementFromJson,
        fireEvent: fireEvent,
        listForEach: listForEach
    };

    // Take in JSON object and build a DOM element out of it
    // (Limited in scope, cannot necessarily create arbitrary DOM elements)
    // JSON Example:
    //  {
    //    "tagName": "div",
    //    "text": "Hello World!",
    //    "className": ["aClass", "bClass"],
    //    "attributes": [{
    //      "name": "onclick",
    //      "value": "alert("Hi there!")"
    //    }],
    //    "children: [{other similarly structured JSON objects...}, {...}]
    //  }
    function buildDomElementFromJson(domJson) {
    // Create a DOM element with the given tag name
        var element = document.createElement(domJson.tagName);

        // Fill the "content" of the element
        if (domJson.text) {
            element.innerHTML = domJson.text;
        } else if (domJson.html) {
            element.insertAdjacentHTML('beforeend', domJson.html);
        }

        // Add classes to the element
        if (domJson.classNames) {
            for (var i = 0; i < domJson.classNames.length; i++) {
                element.classList.add(domJson.classNames[i]);
            }
        }
        // Add attributes to the element
        if (domJson.attributes) {
            for (var j = 0; j < domJson.attributes.length; j++) {
                var currentAttribute = domJson.attributes[j];
                element.setAttribute(currentAttribute.name, currentAttribute.value);
            }
        }
        // Add children elements to the element
        if (domJson.children) {
            for (var k = 0; k < domJson.children.length; k++) {
                var currentChild = domJson.children[k];
                element.appendChild(buildDomElementFromJson(currentChild));
            }
        }
        return element;
    }

    // Trigger an event to fire
    function fireEvent(element, event) {
        var evt;
        if (document.createEventObject) {
            // dispatch for IE
            evt = document.createEventObject();
            return element.fireEvent('on' + event, evt);
        }
        // otherwise, dispatch for Firefox, Chrome + others
        evt = document.createEvent('HTMLEvents');
        evt.initEvent(event, true, true); // event type,bubbling,cancelable
        return !element.dispatchEvent(evt);
    }

    // A function that runs a for each loop on a List, running the callback function for each one
    function listForEach(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback.call(null, list[i]);
        }
    }

}());

// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/

var ConversationPanel = (function () {
    var settings = {
        selectors  : {
            chatBox   : '#scrollingChat',
            fromUser  : '.from-user',
            fromWatson: '.from-watson',
            latest    : '.latest'
        },
        authorTypes: {
            user  : 'user',
            watson: 'watson'
        }
    };

    // Publicly accessible methods defined
    return {
        init        : init,
        inputKeyDown: inputKeyDown,
        sendMessage : sendMessage
    };

    // Initialize the module
    function init() {
        chatUpdateSetup();
        Api.sendRequest('', {bot_type: 'layla'});
        setupInputBox();
    }

    // Set up callbacks on payload setters in Api module
    // This causes the displayMessage function to be called when messages are sent / received
    function chatUpdateSetup() {
        var currentRequestPayloadSetter = Api.setRequestPayload;
        Api.setRequestPayload           = function (newPayloadStr) {
            currentRequestPayloadSetter.call(Api, newPayloadStr);
            displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);
        };

        var currentResponsePayloadSetter = Api.setResponsePayload;
        Api.setResponsePayload           = function (newPayloadStr) {
            currentResponsePayloadSetter.call(Api, newPayloadStr);
            displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.watson);
        };
    }

    // Set up the input box to underline text as it is typed
    // This is done by creating a hidden dummy version of the input box that
    // is used to determine what the width of the input text should be.
    // This value is then used to set the new width of the visible input box.
    function setupInputBox() {
        var input       = document.getElementById('textInput');
        var dummy       = document.getElementById('textInputDummy');
        var minFontSize = 14;
        var maxFontSize = 16;
        var minPadding  = 10;
        var maxPadding  = 20;

        // If no dummy input box exists, create one
        if (dummy === null) {
            var dummyJson = {
                'tagName'   : 'div',
                'attributes': [{
                    'name' : 'id',
                    'value': 'textInputDummy'
                }]
            };

            dummy = Common.buildDomElement(dummyJson);
            document.body.appendChild(dummy);
        }

        function adjustInput() {
            if (input.value === '') {
                // If the input box is empty, remove the underline
                input.classList.remove('underline');
                input.setAttribute('style', 'width:' + '100%');
                input.style.width = '100%';
            } else {
                // otherwise, adjust the dummy text to match, and then set the width of
                // the visible input box to match it (thus extending the underline)
                input.classList.add('underline');
                var txtNode = document.createTextNode(input.value);
                ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height',
                    'text-transform', 'letter-spacing'
                ].forEach(function (index) {
                    dummy.style[index] = window.getComputedStyle(input, null).getPropertyValue(index);
                });
                dummy.textContent = txtNode.textContent;

                var padding         = 0;
                var htmlElem        = document.getElementsByTagName('html')[0];
                var currentFontSize = parseInt(window.getComputedStyle(htmlElem, null).getPropertyValue('font-size'), 10);
                if (currentFontSize) {
                    padding = Math.floor((currentFontSize - minFontSize) / (maxFontSize - minFontSize) *
                        (maxPadding - minPadding) + minPadding);
                } else {
                    padding = maxPadding;
                }

                var widthValue = (dummy.offsetWidth + padding) + 'px';
                input.setAttribute('style', 'width:' + widthValue);
                input.style.width = widthValue;
            }
        }

        // Any time the input changes, or the window resizes, adjust the size of the input box
        input.addEventListener('input', adjustInput);
        window.addEventListener('resize', adjustInput);

        // Trigger the input event once to set up the input box and dummy element
        Common.fireEvent(input, 'input');
    }

    // Display a user or Watson message that has just been sent/received
    function displayMessage(newPayload, typeValue) {
        var isUser     = isUserMessage(typeValue);
        var textExists = (newPayload.input && newPayload.input.text) ||
            (newPayload.output && newPayload.output.text);
        if (isUser !== null && textExists) {
            // Create new message generic elements
            var responses      = buildMessageDomElements(newPayload, isUser);
            var chatBoxElement = document.querySelector(settings.selectors.chatBox);
            var previousLatest = chatBoxElement.querySelectorAll((isUser ? settings.selectors.fromUser : settings.selectors.fromWatson) +
                settings.selectors.latest);
            // Previous "latest" message is no longer the most recent
            if (previousLatest) {
                Common.listForEach(previousLatest, function (element) {
                    element.classList.remove('latest');
                });
            }
            setResponse(responses, isUser, chatBoxElement, 0, true);
        }
    }

    // Recursive function to add responses to the chat area
    function setResponse(responses, isUser, chatBoxElement, index, isTop) {
        if (index < responses.length) {
            var res = responses[index];
            if (res.type !== 'pause') {
                var currentDiv = getDivObject(res, isUser, isTop);
                chatBoxElement.appendChild(currentDiv);
                // Class to start fade in animation
                currentDiv.classList.add('load');
                // Move chat to the most recent messages when new messages are added
                scrollToChatBottom();
                setResponse(responses, isUser, chatBoxElement, index + 1, false);
            } else {
                var userTypringField = document.getElementById('user-typing-field');
                if (res.typing) {
                    userTypringField.innerHTML = 'Watson Assistant Typing...';
                }
                setTimeout(function () {
                    userTypringField.innerHTML = '';
                    setResponse(responses, isUser, chatBoxElement, index + 1, isTop);
                }, res.time);
            }
        }
    }

    // Constructs new DOM element from a message
    function getDivObject(res, isUser, isTop) {
        var classes     = [(isUser ? 'from-user' : 'from-watson'), 'latest', (isTop ? 'top' : 'sub')];
        var messageJson = {
            // <div class='segments'>
            'tagName'   : 'div',
            'classNames': ['segments'],
            'children'  : [{
                // <div class='from-user/from-watson latest'>
                'tagName'   : 'div',
                'classNames': classes,
                'children'  : [{
                    'tagName'   : 'div',
                    'classNames': ['message-icon']
                }, {
                    // <div class='message-inner'>
                    'tagName'   : 'div',
                    'classNames': ['message-inner'],
                    'children'  : [{
                        // <p>{messageText}</p>
                        'tagName': 'p',
                        'text'   : res.innerhtml
                    }]
                }]
            }]
        };
        return Common.buildDomElement(messageJson);
    }

    // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
    // Returns true if user, false if Watson, and null if neither
    // Used to keep track of whether a message was from the user or Watson
    function isUserMessage(typeValue) {
        if (typeValue === settings.authorTypes.user) {
            return true;
        } else if (typeValue === settings.authorTypes.watson) {
            return false;
        }
        return null;
    }

    function getOptions(optionsList, preference) {
        var list = '';
        var i    = 0;
        if (optionsList !== null) {
            if (preference === 'text') {
                list = '<ul>';
                for (i = 0; i < optionsList.length; i++) {
                    if (optionsList[i].value) {
                        list += '<li><div class="options-list" onclick="ConversationPanel.sendMessage(\'' +
                            optionsList[i].value.input.text + '\');" >' + optionsList[i].label + '</div></li>';
                    }
                }
                list += '</ul>';
            } else if (preference === 'button') {
                list = '<br>';
                for (i = 0; i < optionsList.length; i++) {
                    if (optionsList[i].value) {
                        var item = '<div class="options-button" onclick="ConversationPanel.sendMessage(\'' +
                            optionsList[i].value.input.text + '\');" >' + optionsList[i].label + '</div>';
                        list += item;
                    }
                }
            }
        }
        return list;
    }

    function getResponse(responses, gen) {
        var title = gen.title || '',
            description = gen.description || '';

        if (gen.response_type === 'image') {
            var img = '<div><img src="' + gen.source + '"></div>';
            responses.push({
                type     : gen.response_type,
                innerhtml: title + img + description
            });
        } else if (gen.response_type === 'text') {
            responses.push({
                type     : gen.response_type,
                innerhtml: gen.text
            });
        } else if (gen.response_type === 'pause') {
            responses.push({
                type  : gen.response_type,
                time  : gen.time,
                typing: gen.typing
            });
        } else if (gen.response_type === 'option') {
            var preference = 'text';
            if ('preference' in gen) {
                preference = gen.preference;
            }

            var list = getOptions(gen.options, preference);
            responses.push({
                type     : gen.response_type,
                innerhtml: title + list
            });
        }
    }

    // Constructs new generic elements from a message payload
    function buildMessageDomElements(newPayload, isUser) {
        var textArray = isUser ? newPayload.input.text : newPayload.output.text;
        if (Object.prototype.toString.call(textArray) !== '[object Array]') {
            textArray = [textArray];
        }

        var responses = [];

        if ('output' in newPayload) {
            if ('generic' in newPayload.output) {

                var generic = newPayload.output.generic;

                generic.forEach(function (gen) {
                    getResponse(responses, gen);
                });
            }
        } else if ('input' in newPayload) {
            var input = '';
            textArray.forEach(function (msg) {
                input += msg + ' ';
            });
            input.trim().replace(' ', '<br>');
            if (input.length !== 0) {
                responses.push({
                    type     : 'text',
                    innerhtml: input
                });
            }
        }
        return responses;
    }

    // Scroll to the bottom of the chat window
    function scrollToChatBottom() {
        var scrollingChat       = document.querySelector('#scrollingChat');
        scrollingChat.scrollTop = scrollingChat.scrollHeight;
    }

    function sendMessage(text) {
        // Retrieve the context from the previous server response
        var context;
        var latestResponse = Api.getResponsePayload();
        if (latestResponse) {
            context = latestResponse.context;
        }

        // Send the user message
        Api.sendRequest(text, context);
    }

    // Handles the submission of input
    function inputKeyDown(event, inputBox) {
        // Submit on enter key, dis-allowing blank messages
        if (event.keyCode === 13 && inputBox.value) {
            sendMessage(inputBox.value);
            // Clear input box for further messages
            inputBox.value = '';
            Common.fireEvent(inputBox, 'input');
        }
    }
}());

/* global ConversationPanel: true, PayloadPanel: true*/
/* eslint no-unused-vars: "off" */

// Other JS files required to be loaded first: apis.js, conversation.js, payload.js
(function () {
    // Initialize all modules
    ConversationPanel.init();
    // PayloadPanel.init();
})();

// The PayloadPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true, PayloadPanel: true*/

var PayloadPanel = (function () {
    var settings = {
        selectors   : {
            payloadColumn  : '#payload-column',
            payloadInitial : '#payload-initial-message',
            payloadRequest : '#payload-request',
            payloadResponse: '#payload-response'
        },
        payloadTypes: {
            request : 'request',
            response: 'response'
        }
    };

    // Publicly accessible methods defined
    return {
        init       : init,
        togglePanel: togglePanel
    };

    // Initialize the module
    function init() {
        payloadUpdateSetup();
    }

    // Toggle panel between being:
    // reduced width (default for large resolution apps)
    // hidden (default for small/mobile resolution apps)
    // full width (regardless of screen size)
    function togglePanel(event, element) {
        var payloadColumn = document.querySelector(settings.selectors.payloadColumn);
        if (element.classList.contains('full')) {
            element.classList.remove('full');
            payloadColumn.classList.remove('full');
        } else {
            element.classList.add('full');
            payloadColumn.classList.add('full');
        }
    }

    // Set up callbacks on payload setters in Api module
    // This causes the displayPayload function to be called when messages are sent / received
    function payloadUpdateSetup() {
        var currentRequestPayloadSetter = Api.setRequestPayload;
        Api.setRequestPayload           = function (newPayloadStr) {
            currentRequestPayloadSetter.call(Api, newPayloadStr);
            displayPayload(settings.payloadTypes.request);
        };

        var currentResponsePayloadSetter = Api.setResponsePayload;
        Api.setResponsePayload           = function (newPayload) {
            currentResponsePayloadSetter.call(Api, newPayload);
            displayPayload(settings.payloadTypes.response);
        };
    }

    // Display a request or response payload that has just been sent/received
    function displayPayload(typeValue) {
        var isRequest = checkRequestType(typeValue);
        if (isRequest !== null) {
            // Create new payload DOM element
            var payloadDiv     = buildPayloadDomElement(isRequest);
            var payloadElement = document.querySelector(isRequest
                ? settings.selectors.payloadRequest : settings.selectors.payloadResponse);
            // Clear out payload holder element
            while (payloadElement.lastChild) {
                payloadElement.removeChild(payloadElement.lastChild);
            }
            // Add new payload element
            payloadElement.appendChild(payloadDiv);
            // Set the horizontal rule to show (if request and response payloads both exist)
            // or to hide (otherwise)
            var payloadInitial = document.querySelector(settings.selectors.payloadInitial);
            if (Api.getRequestPayload() || Api.getResponsePayload()) {
                payloadInitial.classList.add('hide');
            }
        }
    }

    // Checks if the given typeValue matches with the request "name", the response "name", or neither
    // Returns true if request, false if response, and null if neither
    // Used to keep track of what type of payload we're currently working with
    function checkRequestType(typeValue) {
        if (typeValue === settings.payloadTypes.request) {
            return true;
        } else if (typeValue === settings.payloadTypes.response) {
            return false;
        }
        return null;
    }

    // Constructs new DOM element to use in displaying the payload
    function buildPayloadDomElement(isRequest) {
        var payloadPrettyString = jsonPrettyPrint(isRequest
            ? Api.getRequestPayload() : Api.getResponsePayload());

        var payloadJson = {
            'tagName' : 'div',
            'children': [{
                // <div class='header-text'>
                'tagName'   : 'div',
                'text'      : isRequest ? 'User input' : 'Watson understands',
                'classNames': ['header-text']
            }, {
                // <div class='code-line responsive-columns-wrapper'>
                'tagName'   : 'div',
                'classNames': ['code-line', 'responsive-columns-wrapper'],
                'children'  : [{
                    // <div class='line-numbers'>
                    'tagName'   : 'pre',
                    'text'      : createLineNumberString((payloadPrettyString.match(/\n/g) || []).length + 1),
                    'classNames': ['line-numbers']
                }, {
                    // <div class='payload-text responsive-column'>
                    'tagName'   : 'pre',
                    'classNames': ['payload-text', 'responsive-column'],
                    'html'      : payloadPrettyString
                }]
            }]
        };

        return Common.buildDomElement(payloadJson);
    }

    // Format (payload) JSON to make it more readable
    function jsonPrettyPrint(json) {
        if (json === null) {
            return '';
        }
        var convert = JSON.stringify(json, null, 2);

        convert = convert.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(
            />/g, '&gt;');
        convert = convert
            .replace(
                /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
                function (match) {
                    var cls = 'number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'key';
                        } else {
                            cls = 'string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean';
                    } else if (/null/.test(match)) {
                        cls = 'null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                });
        return convert;
    }

    // Used to generate a string of consecutive numbers separated by new lines
    // - used as line numbers for displayed JSON
    function createLineNumberString(numberOfLines) {
        var lineString = '';
        var prefix     = '';
        for (var i = 1; i <= numberOfLines; i++) {
            lineString += prefix;
            lineString += i;
            prefix = '\n';
        }
        return lineString;
    }
}());
