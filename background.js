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
                        pageUrl: { urlMatches: 'localhost|m\.thegulocal\.com|m\.code\.dev-theguardian\.com|preview\.gutools\.co\.uk|www\.theguardian\.com' }
                    })
                ],
                // And shows the extension's page action.
                actions: [ new chrome.declarativeContent.ShowPageAction() ]
            }
        ]);
    });
});

