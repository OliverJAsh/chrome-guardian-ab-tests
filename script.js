System.import('common/modules/experiments/ab').then(function (abTests) {
    window.postMessage(JSON.stringify({ type: 'tests', tests: abTests.getActiveTests() }), '*');
});
