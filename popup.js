import Rx         from 'rx';
import moment     from 'moment';
import h          from 'virtual-dom/h';
import diff       from 'virtual-dom/diff';
import patch      from 'virtual-dom/patch';
import virtualize from 'vdom-virtualize';
import Im from 'immutable';

const getData = () => new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getData' }, resolve);
    });
});

const setParticipations = (participations) => new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'setParticipations', data: { participations } }, resolve);
    });
});

const ih = (tagName, children) => h(tagName, children.toJS ? children.toJS() : children);

export default function () {

    getData().then(data => {
        function tableComponent() {
            const select$ = new Rx.Subject();
            const headers = ['id', 'description', 'variants'];

            function variantButtonElement(test, variant) {
                // <paper-radio-group selected="small">
                //     <paper-radio-button name="small">Small</paper-radio-button>
                //     <paper-radio-button name="medium">Medium</paper-radio-button>
                //     <paper-radio-button name="large">Large</paper-radio-button>
                // </paper-radio-group>
                return h('paper-radio-button', {
                    onclick: () => select$.onNext({ id: test.get('id'), variant }),
                    // className: variant === test.get('variant') ? 'is-active' : ''
                    attributes: {
                        name: variant
                    }
                }, variant);
            }

            function variantsElement(test, variants) {
                return ih('paper-radio-group', { attributes: { selected: 'small' } },
                    variants.map(variant => variantButtonElement(test, variant)));
            }

            function view$(tests$) {
                const rows$ = tests$.map(tests =>
                    tests.map(test =>
                        h('tr', headers.map(header =>
                            ih('td', header !== 'variants'
                                ? test.get(header)
                                // TODO: Find a way not to pass in test
                                : variantsElement(test, test.get('variants')))))));

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

            const participations$ = table.intents.select$.startWith({}).scan(Im.fromJS(data.participations), (participations, selectedTest) =>
                participations.setIn([selectedTest.id], selectedTest.variant));
            participations$.subscribe(participations => console.log(participations.toJS()));
            participations$.subscribe(participations => setParticipations(participations.toJS()));

            const tests = Im.fromJS(data.tests)
                .map(test =>
                    test
                        .updateIn(['variants'], variants => variants.map(variant => variant.get('id')))
                        .updateIn(['variants'], variants => variants.push('notintest')));

            const tests$ = participations$.scan(tests, (tests, participations) =>
                tests.map(test =>
                    test.set('variant', participations.find((variant, participation) =>
                        participation === test.get('id')))));
            tests$.subscribe(tests => console.table(tests.toJS()));

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
