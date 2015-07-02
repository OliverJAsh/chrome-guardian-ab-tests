import Rx         from 'rx';
import moment     from 'moment';
import h          from 'virtual-dom/h';
import diff       from 'virtual-dom/diff';
import patch      from 'virtual-dom/patch';
import virtualize from 'vdom-virtualize';
import Im from 'immutable';

const getTab = () => new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => resolve(tabs[0]));
});

const sendMessageToPage =
    message => new Promise(resolve =>
        getTab().then(tab => chrome.tabs.sendMessage(tab.id, message, resolve)));

const getPageData = () => sendMessageToPage({ action: 'getData' });
const getServerSideVariant = () => new Promise(resolve => {
    const key = 'server-side-variant';
    chrome.storage.local.get(key, data => resolve(data[key]));
});
const getData = () => Promise.all([getPageData(), getServerSideVariant()])
    .then((results) => ({ tests: results[0].tests, participations: results[0].participations, serverSideVariant: results[1] }));

const setParticipations = participations =>
    sendMessageToPage({ action: 'setParticipations', data: { participations: participations.toJS() } });

// TODO: Why is this needed?
const ih = (tagName, options, children) => {
    if (!children) {
        children = options;
        options = {};
    }
    return h(tagName, options, children.toJS ? children.toJS() : children);
};

const render = data => {
    // Normalize data
    const initialTests = Im.fromJS(data.tests)
        .map(test =>
            test
                .updateIn(['variants'], variants => variants.map(variant => variant.get('id')))
                .updateIn(['variants'], variants => variants.push('notintest')));
    const initialParticipations = Im.fromJS(data.participations);

    function tableComponent() {
        const select$ = new Rx.Subject();
        const selectServerSideVariant$ = new Rx.Subject();
        const headers = ['id', 'variants'];

        function variantButtonElement(test, variant, selectedVariant) {
            return h('button', {
                onclick: () => select$.onNext({ id: test.get('id'), variant }),
                className: variant === selectedVariant ? 'is-active' : ''
            }, variant);
        }

        function rowElement(test, participations) {
            const cellElement =
                header => ih('td',
                    header !== 'variants'
                        ? test.get(header)
                        : test.get('variants').map(variant => {
                            const selectedVariant = participations.get(test.get('id'));
                            return variantButtonElement(test, variant, selectedVariant);
                        }));

            return h('tr', headers.map(cellElement));
        }

        function view$(tests, participations$, serverSideVariant$) {
            return Rx.Observable.combineLatest(
                participations$,
                serverSideVariant$,
                (participations, serverSideVariant) => {
                    const rows = tests.map(test => rowElement(test, participations, serverSideVariant));
                    const variantIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

                    return h('body', [
                        h('h3', 'Server-side test variant'),
                        h('div', {
                            onchange: event => selectServerSideVariant$.onNext(event.target.value)
                        }, [
                            // TODO: Or just have a clear button?
                            h('div', h('label', [
                                h('input', {
                                    type: 'radio',
                                    name: 'variant',
                                    value: '',
                                    checked: ! serverSideVariant
                                }),
                                'None'
                            ])),
                            variantIds
                                .map(variantId => h('div', [
                                    h('label', [
                                        h('input', {
                                            type: 'radio',
                                            name: 'variant',
                                            value: variantId,
                                            checked: serverSideVariant && Number(serverSideVariant) === variantId
                                        }),
                                        variantId.toString()
                                    ])
                                ]))
                        ]),
                        h('h3', 'Client-side tests'),
                        h('table', [
                            h('thead', h('tr', headers.map(key => h('th', key)))),
                            ih('tbody', rows)
                        ])
                    ]);
                });
        }

        return {
            view$,
            intents: {
                select$,
                selectServerSideVariant$
            }
        };
    }


    function view() {
        const table = tableComponent();

        const participations$ = table.intents.select$
            .startWith({})
            .scan(initialParticipations,
                (participations, selectedTest) => participations.set(selectedTest.id, selectedTest.variant));
        const serverSideVariant$ = table.intents.selectServerSideVariant$
            .startWith(data.serverSideVariant);

        // Side effect
        participations$.subscribe(setParticipations);

        serverSideVariant$.subscribe(variantId => {
            // TODO: Unique per domain!
            chrome.storage.local.set({ 'server-side-variant': variantId });
            chrome.runtime.sendMessage('updatedServerSideVariant');
        });

        const tree$ = table.view$(initialTests, participations$, serverSideVariant$);

        return { tree$ };
    }


    const v = view();


    const out = document.body;
    const initialDom = virtualize(out);

    v.tree$.
        startWith(initialDom).
        bufferWithCount(2, 1).
        map(([last, current]) => diff(last, current)).
        reduce((out, patches) => patch(out, patches), out).
        subscribeOnError(err => { throw err; });
};

getData().then(render);
