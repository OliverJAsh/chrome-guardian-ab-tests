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
        const headers = ['id', 'variants'];

        function variantButtonElement(test, variant, selectedVariant) {
            return h('label', {
                className: 'mdl-radio mdl-js-radio mdl-js-ripple-effect'
            }, [
                h('input', {
                    type: 'radio',
                    name: `${test.get('id')}[variant]`,
                    onchange: () => select$.onNext({ id: test.get('id'), variant }),
                    checked: variant === selectedVariant,
                    className: 'mdl-radio__button'
                }, variant),
                variant
            ]);
        }

        function rowElement(test, participations) {
            const cellElement =
                header => ih('td', { className: 'mdl-data-table__cell--non-numeric' },
                    header !== 'variants'
                        ? test.get(header)
                        : test.get('variants').map(variant => {
                            const selectedVariant = participations.get(test.get('id'));
                            return variantButtonElement(test, variant, selectedVariant);
                        }));

            return h('tr', headers.map(cellElement));
        }

        function view$(tests, participations$) {
            const rows$ = participations$.map(participations => tests.map(test => rowElement(test, participations)));

            return rows$.map(rows => {
                return h('body', [
                    h('table', {
                        className: 'mdl-data-table mdl-js-data-table mdl-shadow--2dp'
                    }, [
                        h('thead', h('tr', headers.map(key => h('th', { className: 'mdl-data-table__cell--non-numeric' }, key)))),
                        ih('tbody', rows)
                    ])
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
            .scan(initialParticipations,
                (participations, selectedTest) => participations.set(selectedTest.id, selectedTest.variant));

        // Side effect
        participations$.subscribe(setParticipations);

        const tree$ = table.view$(initialTests, participations$);

        return { tree$ };
    }


    const v = view();


    const out = document.body;
    const initialDom = virtualize(out);

    v.tree$.
        startWith(initialDom).
        bufferWithCount(2, 1).
        map(([last, current]) => diff(last, current)).
        scan(out, (out, patches) => patch(out, patches)).
        // Material design
        do(() => window.componentHandler.upgradeDom()).
        observeOn(Rx.Scheduler.requestAnimationFrame).
        subscribeOnError((err) => { throw err; });

};

getData().then(render);
