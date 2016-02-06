/*eslint-env browser*/
/*eslint-disable no-var*/
/*global chrome*/
var getData = function () {
    return new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = chrome.extension.getURL('post-data.js');
        s.onload = function() {
            this.parentNode.removeChild(this);
        };
        document.body.appendChild(s);

        window.addEventListener('message', function (event) {
            var eventData = JSON.parse(event.data);
            if (eventData.type === 'tests') {
                resolve({ tests: eventData.tests, participations: eventData.participations });
            }
        });
    });
};

var localStorageKey = 'gu.ab.participations';

var setParticipations = function (participations) {
    var data = {
        value: Object.keys(participations).reduce(function (accumulator, testId) {
            accumulator[testId] = { variant: participations[testId] };
            return accumulator;
        }, {})
    };
    console.log('A/B tests extension: set participations', data);
    window.localStorage.setItem(localStorageKey, JSON.stringify(data));
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case 'getData':
            getData().then(sendResponse);
            break;
        case 'setParticipations':
            var participations = request.data.participations;
            setParticipations(participations);
            break;
    }

    // Allow async
    return true;
});
