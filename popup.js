export default function () {
    const getData = () => new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getData' }, resolve);
        });
    });

    getData().then(data => {
        console.log('Data:', data);
        document.body.innerHTML = JSON.stringify(data);
    })
};
