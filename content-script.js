var getTests = function () {
    return new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = chrome.extension.getURL('script.js');
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

var getParticipations = function () {
    return JSON.parse(window.localStorage.getItem('gu.ab.participations'));
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request && request.action === 'getData') {
        var participations = getParticipations();
        getTests()
            .then(function (tests) {
                return {
                    participations: participations,
                    tests: tests
                };
            })
            .then(sendResponse);
    }

    // Allow async
    return true;
});
