import Rx         from 'rx';
import moment     from 'moment';
import h          from 'virtual-dom/h';
import diff       from 'virtual-dom/diff';
import patch      from 'virtual-dom/patch';
import virtualize from 'vdom-virtualize';
import Im from 'immutable';

export default function () {
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

    getData().then(data => {
        const participations = Im.fromJS(data.participations)
            .map(participation => participation.get('variant'));

        const tests = Im.fromJS(data.tests)
            .map(test =>
                test.set('variant', participations.find((variant, participation) =>
                    participation === test.get('id'))))
            .toJS();


        function tableComponent() {
            const select$ = new Rx.Subject();
            const headers = ['id', 'description', 'variants'];

            function view$(tests$) {
                const rows$ = tests$.map(tests =>
                    tests.map(test =>
                        h('tr', headers.map(header =>
                            h('td', header === 'variants'
                                ? test.variants.map(variant =>
                                    h('button', {
                                        onclick: () => select$.onNext({ id: test.id, variant: variant.id }),
                                        className: variant.id === test.variant ? 'is-active' : ''
                                    }, variant.id))
                                : test[header])
                        ))));

                return rows$.map(rows => {
                    return h('table', [
                        h('thead', [
                            h('tr', headers.map(key => h('th', key)))
                        ]),
                        h('tbody', rows)
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

            table.intents.select$.subscribe(selectedTest => console.log(`Test ${selectedTest.id}, variant ${selectedTest.variant}`));
            const participations$ = table.intents.select$.startWith({}).scan(participations, (participations, selectedTest) =>
                Im.fromJS(participations)
                    .setIn([selectedTest.id], selectedTest.variant)
                    .toJS());
            participations$.subscribe(participations => console.log(participations));
            participations$.subscribe(setParticipations);
            const tests$ = table.intents.select$.startWith({}).scan(tests, (tests, selectedTest) =>
                Im.fromJS(tests)
                    .map(test =>
                        test.get('id') === selectedTest.id
                            ? test.set('variant', selectedTest.variant)
                            : test)
                    .toJS());
            tests$.subscribe(tests => console.table(tests));
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
