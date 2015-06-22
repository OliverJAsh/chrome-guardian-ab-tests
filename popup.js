import Rx         from 'rx';
import moment     from 'moment';
import h          from 'virtual-dom/h';
import diff       from 'virtual-dom/diff';
import patch      from 'virtual-dom/patch';
import virtualize from 'vdom-virtualize';
import Im from 'immutable';

const getTab = () => new Promise((resolve, reject) => {
    // For debugging we allow the popup to be used as a tab itself
    const query = window.document.title === 'A/B Tests'
        ? Im.Map({ url: [
            '*://www.theguardian.com/*',
            '*://m.code.dev-theguardian.com/*',
            '*://preview.gutools.co.uk/*',
            '*://m.thegulocal.com/*',
            // TODO: Why doesn't * work for this scheme?
            'http://localhost:9000/*'
        ] })
        : Im.Map({ active: true });
    chrome.tabs.query(Im.Map({ currentWindow: true }).merge(query).toJS(), tabs => resolve(tabs[0]));
})
    .then(tab => { console.log(`Tab: ${tab.url}`); return tab; });

const sendMessageToPage = message => new Promise(resolve =>
    getTab().then(tab => chrome.tabs.sendMessage(tab.id, message, resolve)));

const getData = () => sendMessageToPage({ action: 'getData' });
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

export default function () {

    getData().then(data => {
        const tests = Im.fromJS(data.tests)
            .map(test =>
                test
                    .updateIn(['variants'], variants => variants.map(variant => variant.get('id')))
                    .updateIn(['variants'], variants => variants.push('notintest')));
        const participations = Im.fromJS(data.participations);

        function tableComponent() {
            const select$ = new Rx.Subject();
            const headers = ['id', 'description', 'variants'];

            function variantButtonElement(test, variant) {
                return h('button', {
                    onclick: () => select$.onNext({ id: test.get('id'), variant }),
                    className: variant === test.get('variant') ? 'is-active' : ''
                }, variant);
            }

            function view$(tests$) {
                const rows$ = tests$.map(tests =>
                    tests.map(test =>
                        h('tr', headers.map(header =>
                            ih('td', header !== 'variants'
                                ? test.get(header)
                                : test.get('variants').map(variant => variantButtonElement(test, variant)))))));

                return rows$.map(rows => {
                    return h('table', [
                        h('thead', h('tr', headers.map(key => h('th', key)))),
                        ih('tbody', rows)
                    ]);
                });
            }

            return {
                view$,
                intents: {
                    select$
                }
            };
        }


        function view() {
            const table = tableComponent();

            const participations$ = table.intents.select$
                .startWith({})
                .scan(participations,
                    (participations, selectedTest) => participations.set(selectedTest.id, selectedTest.variant));

            participations$.subscribe(setParticipations);

            const updateTestVariant = (test, participations) => {
                const variant = participations.get(test.get('id'));
                return test.set('variant', variant);
            };

            const tests$ = participations$.scan(tests, (tests, participations) =>
                tests.map(test => updateTestVariant(test, participations)));

            const tree$ = table.view$(tests$);

            return { tree$ };
        }


        const v = view();


        const out = document.getElementById('out');
        const initialDom = virtualize(out);

        v.tree$.
            startWith(initialDom).
            bufferWithCount(2, 1).
            map(([last, current]) => diff(last, current)).
            reduce((out, patches) => patch(out, patches), out).
            subscribeOnError(err => console.error(err));
    });


}
