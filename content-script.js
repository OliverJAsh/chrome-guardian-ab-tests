var getTests = function () {
    return new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = chrome.extension.getURL('post-active-tests.js');
        s.onload = function() {
            this.parentNode.removeChild(this);
        };
        document.body.appendChild(s);

        window.addEventListener('message', function (event) {
            var eventData = JSON.parse(event.data);
            if (eventData.type === 'tests') {
                resolve(eventData.tests);
            }
        });
    });
};

var localStorageKey = 'gu.ab.participations';

var getParticipations = function () {
    var data = JSON.parse(window.localStorage.getItem(localStorageKey));
    return Object.keys(data.value).reduce(function (accumulator, testId) {
        accumulator[testId] = data.value[testId].variant;
        return accumulator;
    }, {});
};

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
            var participations = getParticipations();
            getTests()
                .then(function (tests) {
                    return {
                        participations: participations,
                        tests: tests
                    };
                })
                .then(sendResponse);
            break;
        case 'setParticipations':
            var participations = request.data.participations;
            setParticipations(participations);
            break;
    }

    // Allow async
    return true;
});
