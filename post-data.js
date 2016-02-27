/*eslint-env browser*/
/*global require*/
require(['common/modules/experiments/ab'], function (abTests) {
    var clientParticipations = abTests.getParticipations();
    window.postMessage(JSON.stringify({
        type: 'tests',
        client: {
            tests: abTests.getActiveTests(),
            // Normalize
            participations: Object.keys(clientParticipations).reduce(function (accumulator, testId) {
                accumulator[testId] = clientParticipations[testId].variant;
                return accumulator;
            }, {})
        },
        server: {
            tests: window.guardian.config.tests.definitions,
            selectedTestVariant: (() => {
                // List[testID: String]
                const serverParticipations = Object.keys(window.guardian.config.tests.participations);
                // Option[Test]
                const selectedTest = window.guardian.config.tests.definitions.find(definition => (
                    serverParticipations.some(testId => {
                        const isInTest = serverParticipations[testId];
                        return isInTest && testId === definition.id;
                    })
                ));
                // testID: String
                return selectedTest && selectedTest.variants[0];
            })()
        }
    }), '*');
});
