var urlMatchRegExpStr = 'localhost|m\.thegulocal\.com|m\.code\.dev-theguardian\.com|preview\.gutools\.co\.uk|www\.theguardian\.com';

// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
    console.log('Installed');
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([
            {
                // That fires when page URL matches
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { urlMatches: urlMatchRegExpStr }
                    })
                ],
                // And shows the extension's page action.
                actions: [ new chrome.declarativeContent.ShowPageAction() ]
            }
        ]);
    });
});

chrome.runtime.onMessage.addListener(function (message) {
    if (message === 'updatedServerSideVariant') {
        var key = 'server-side-variant';
        chrome.storage.local.get(key, function (data) {
            var variantId = data[key];

            // Reset
            chrome.declarativeWebRequest.onRequest.removeRules(['set-header']);

            if (variantId) {
                var setHeaderRule = {
                    id: 'set-header',
                    conditions: [
                        new chrome.declarativeWebRequest.RequestMatcher({
                            url: { hostContains: urlMatchRegExpStr }
                        })
                    ],
                    actions: [
                        new chrome.declarativeWebRequest.SetRequestHeader(
                            { name: 'X-GU-mvt-variant', value: `variant-${variantId}` })
                    ]
                };

                chrome.declarativeWebRequest.onRequest.addRules([setHeaderRule]);
            }
        });
    }
});
