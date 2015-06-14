System.config({
    // TODO: Use CSP version
    // https://github.com/systemjs/systemjs/issues/517#issuecomment-111835690
    meta: {
        'build': { format: 'register' }
    }
});

System.import('popup').then(function (module) {
    module.default();
});
