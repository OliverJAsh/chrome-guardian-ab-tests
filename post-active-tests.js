require(['common/modules/experiments/ab'], function (abTests) {
    window.postMessage(JSON.stringify({ type: 'tests', tests: abTests.getActiveTests() }), '*');
});
