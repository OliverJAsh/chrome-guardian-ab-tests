/*eslint-env browser*/
/*global require*/
require(['common/modules/experiments/ab'], function (abTests) {
    var participations = abTests.getParticipations();
    window.postMessage(JSON.stringify({
        type: 'tests',
        tests: abTests.getActiveTests(),
        // Normalize
        participations: Object.keys(participations).reduce(function (accumulator, testId) {
            accumulator[testId] = participations[testId].variant;
            return accumulator;
        }, {})
    }), '*');
});
