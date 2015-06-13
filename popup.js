chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getData' }, function (response) {
        console.log('Data:', response);
        document.body.innerHTML = JSON.stringify(response);
    });
});
