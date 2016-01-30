// Mini Cycle.js
// http://jsbin.com/joyowa/6/edit?js,output
// BMI
// http://jsbin.com/bicoziniqu/1/edit?js,output

/*eslint-disable no-console*/
/*eslint-env browser*/
/*eslint-disable new-cap*/
/*global chrome*/
import Rx from 'rx-dom';
import Im from 'immutable';

import Cycle from '@cycle/core';
import isolate from '@cycle/isolate';
import {makeDOMDriver, h} from '@cycle/dom';

// TODO: Why is this needed?
const ih = (tagName, options, children) => {
    if (!children) {
        children = options;
        options = {};
    }
    return h(tagName, options, children.toJS ? children.toJS() : children);
};

// Get data from and send data to the tab of this Chrome extension
const tabDriver = function (data$) {
    //
    // Write side effects
    //
    const getTab = () => new Promise((resolve) => {
        chrome.tabs.query({ currentWindow: true, active: true }, tabs => resolve(tabs[0]));
    });

    const sendMessageToPage =
        message => new Promise(resolve =>
            getTab().then(tab => chrome.tabs.sendMessage(tab.id, message, resolve)));

    // TEST:
    // const setParticipations = () => {};
    const setParticipations = participations =>
        sendMessageToPage({ action: 'setParticipations', data: { participations: participations.toJS() } });

    data$.subscribe(data => {
        const { participations } = data;
        if (participations) {
            console.log('Setting participations', JSON.stringify(participations));
            setParticipations(participations);
        }
    });

    //
    // Read side effects
    //

    // TEST:
    /* eslint-disable */
    // const mockData = {"participations":{"FrontsOnArticles2":"notintest","RemoveStickyNav":"new","RelatedVariants":"notintest","PrebidPerformance":"notintest","LiveblogToast":"notintest","UserzoomSurveyMessageV3":"notintest"},"tests":[{"id":"FrontsOnArticles2","start":"2015-12-08","expiry":"2016-4-1","author":"Josh Holder","description":"Inject fronts containers on articles","audience":0.06,"audienceOffset":0.3,"successMeasure":"","audienceCriteria":"All users","dataLinkNames":"","idealOutcome":"","variants":[{"id":"control"},{"id":"oneAndThree"},{"id":"twoAndTwo"}]},{"id":"RemoveStickyNav","start":"2015-1-07","expiry":"2016-3-1","author":"Josh Holder","description":"0% AB test for removing the sticky nav","audience":0.5,"audienceOffset":0.5,"successMeasure":"","audienceCriteria":"All users","dataLinkNames":"","idealOutcome":"","variants":[{"id":"old"},{"id":"new"}]},{"id":"RelatedVariants","start":"2016-01-15","expiry":"2016-02-15","author":"Maria Chiorean","description":"Gets related content in using 3 new variants","audience":0.08,"audienceOffset":0.2,"successMeasure":"","audienceCriteria":"All users","dataLinkNames":"","idealOutcome":"","variants":[{"id":"control"},{"id":"tags-only"},{"id":"tags-headline"},{"id":"in-body-links"}]},{"id":"IdentityRegisterV2","start":"2016-01-27","expiry":"2016-03-01","author":"James Pamplin","description":"New user registration page variant for Identity","audience":0.2,"audienceOffset":0.5,"successMeasure":"More people register","audienceCriteria":"everyone","dataLinkNames":"","idealOutcome":"More people register","variants":[{"id":"A"}]},{"id":"IdentitySignInV2","start":"2015-12-15","expiry":"2016-03-01","author":"James Pamplin","description":"New sign in page variants for Identity","audience":0.2,"audienceOffset":0.5,"successMeasure":"More people sign in","audienceCriteria":"everyone","dataLinkNames":"","idealOutcome":"More people sign in","variants":[{"id":"A"},{"id":"B"}]},{"id":"RtrtEmailFormArticlePromoV2","start":"2015-12-17","expiry":"2016-02-03","author":"Gareth Trufitt","description":"Test promotion of email form at bottom vs three paragraphs from end of article pages (when clicked from front)","audience":1,"audienceOffset":0,"successMeasure":"Increase email sign-up numbers","audienceCriteria":"Visitors hitting articles after visiting a front","dataLinkNames":"","idealOutcome":"Email sign-up is increased","variants":[{"id":"bottom-of-page"},{"id":"three-paras-from-bottom"}]},{"id":"PrebidPerformance","start":"2016-01-15","expiry":"2016-01-31","author":"Jimmy Breck-McKye","description":"run prebid.js header-bidding auctions before displaying DFP advertising","audience":0.02,"audienceOffset":0.1,"successMeasure":"","audienceCriteria":"All users","dataLinkNames":"","idealOutcome":"","variants":[{"id":"control"},{"id":"variant"}]},{"id":"LiveblogToast","start":"2015-1-21","expiry":"2016-3-1","author":"Josh Holder","description":"0% AB test that enables liveblog toast notifications","audience":0,"audienceOffset":0,"successMeasure":"","audienceCriteria":"All users","dataLinkNames":"","idealOutcome":"","variants":[{"id":"control"},{"id":"toast"}]},{"id":"UserzoomSurveyMessageV3","start":"2016-01-20","expiry":"2016-02-11","author":"Gareth Trufitt","description":"Segment the userzoom data-team survey","audience":0.2,"audienceOffset":0.7,"successMeasure":"Gain qualitative feedback via a survey","audienceCriteria":"10% of UK visitors to article page, on desktop, that haven't seen the message previously","dataLinkNames":"","idealOutcome":"","variants":[{"id":"control"},{"id":"survey-shown"}]}]};
    /* eslint-enable */
    // const getData = () => Promise.resolve(mockData);
    const getData = () => sendMessageToPage({ action: 'getData' });

    // TEST:
    // return { getData: () => new Promise((resolve, reject) => setTimeout(() => {
    //     getData().then(resolve, reject)
    // }, 40000)) };
    return { getData };
};

// TODO:
// observeOn(Rx.Scheduler.requestAnimationFrame).

const headers = ['id', 'variants'];

const Row = (sources) => {
    // TODO: Move up one scope
    const intent = DOM => ({
        changeVariant$: DOM.select('input').events('change')
            .map(event => event.target.value)
    });

    const model = (actions, props$) => {
        const test$ = props$.map(props => props.test);
        const initialParticipations$ = props$.map(props => props.initialParticipations);
        const initialSelectedVariant$ = Rx.Observable.combineLatest(
            test$, initialParticipations$,
            (test, initialParticipations) => initialParticipations.get(test.get('id'))
        );
        const selectedVariant$ = initialSelectedVariant$.concat(actions.changeVariant$);

        return Rx.Observable.combineLatest(
            test$, selectedVariant$,
            (test, selectedVariant) => Im.fromJS({ test, selectedVariant })
        );
    };

    const view = state$ => (
        state$.map(state => {
            const test = state.get('test');
            const selectedVariant = state.get('selectedVariant');

            return h('tr', headers.map((header) => (
                ih('td.mdl-data-table__cell--non-numeric', (
                    header !== 'variants'
                        ? test.get(header)
                        : test.get('variants').map(variant => {
                            return h('label.mdl-radio.mdl-js-radio.mdl-js-ripple-effect', [
                                h('input.mdl-radio__button', {
                                    type: 'radio',
                                    name: `${test.get('id')}[variant]`,
                                    value: variant,
                                    checked: variant === selectedVariant
                                }, variant),
                                variant
                            ]);
                        })
                ))
            )));
        })
    );

    const create = sources => {
        const state$ = model(intent(sources.DOM), sources.props$);

        const value$ = state$.map(state => Im.fromJS({
            id: state.get('test').get('id'),
            variant: state.get('selectedVariant')
        }));

        const sinks = {
            DOM: view(state$),
            value: value$
        };

        return sinks;
    };

    return create(sources);
};

const main = (sources) => {
    const intent = DOM => ({});

    const model = (actions, tab) => {
        const dataPromise = tab.getData();
        const testsDataPromise = dataPromise.then(data => Im.fromJS(data.tests));
        const participationsDataPromise = dataPromise.then(data => Im.fromJS(data.participations));

        const initialParticipations$ = Rx.Observable.fromPromise(participationsDataPromise);
        const tests$ = Rx.Observable.fromPromise(testsDataPromise)
            .map(tests => (
                tests.map(test => (
                    test.updateIn(['variants'], variants => (
                        variants
                            .map(variant => variant.get('id'))
                            .push('notintest')
                    ))
                ))
            ));

        return Rx.Observable.combineLatest(
            tests$, initialParticipations$,
            (tests, initialParticipations) => Im.fromJS({ tests, initialParticipations })
        );
    };

    const view = (state$, rowVTrees$) => (
        state$.map(() => (
            // TODO: Centre loading text
            h('table.mdl-data-table.mdl-js-data-table.mdl-shadow--2dp', [
                h('thead', h('tr', headers.map(key => h('th.mdl-data-table__cell--non-numeric', key)))),
                rowVTrees$
                    .startWith(h('tr', h('td', { attributes: { colspan: 2 } }, 'Loading')))
                    .map(children => h('tbody', children))
            ])
        ))
    );

    const create = sources => {
        const state$ = model(intent(sources.DOM), sources.tab);

        const rows$ = state$
            .map(state => {
                return state.get('tests').map(test => {
                    const rowProps$ = Rx.Observable.of({
                        test,
                        initialParticipations: state.get('initialParticipations')
                    });
                    const row = isolate(Row)({ DOM: sources.DOM, props$: rowProps$ });
                    return row;
                }).toJS();
            })
            .share();

        const rowVTrees$ = rows$.flatMap(rows => Rx.Observable.combineLatest(...rows.map(row => row.DOM)));
        const rowValues$ = rows$.flatMap(rows => Rx.Observable.combineLatest(...rows.map(row => row.value)));

        const participations$ = rowValues$
            .map(participations => (
                Im.fromJS(participations).reduce((acc, value, key) => {
                    return acc.set(value.get('id'), value.get('variant'));
                }, Im.Map())
            ));
        const tabData$ = participations$.map(participations => ({ participations }));

        const sinks = {
            DOM: view(state$, rowVTrees$),
            tab: tabData$
        };

        return sinks;
    };

    return create(sources);
};

const domDriver = makeDOMDriver('body');
const drivers = {
    // We wrap the DOM driver to apply Material Design side effects
    DOM: vtree$ => {
        const DOM = domDriver(vtree$.share());
        // TODO: Why does this run three times?
        DOM.observable.subscribe(() => window.componentHandler.upgradeDom());
        return DOM;
    },
    tab: tabDriver
};

Cycle.run(main, drivers);
