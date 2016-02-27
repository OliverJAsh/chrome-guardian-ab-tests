// Mini Cycle.js
// http://jsbin.com/joyowa/6/edit?js,output
// BMI
// http://jsbin.com/bicoziniqu/1/edit?js,output
// https://github.com/futurice/power-ui/blob/master/src/components/widgets/MonthSelector/index.js

/*eslint-disable no-console*/
/*eslint-env browser*/
/*eslint-disable new-cap*/
/*global chrome*/
import Rx from 'rx-dom';
import Im from 'immutable';

import Cycle from '@cycle/core';
import {makeDOMDriver, h} from '@cycle/dom';

// Helper for using immutable iterables inside hyperscript
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
    // const getData = () => Promise.resolve(Im.fromJS(mockData));
    const getData = () => sendMessageToPage({ action: 'getData' }).then(data => Im.fromJS(data));

    // TEST:
    // return { getData: () => new Promise((resolve, reject) => setTimeout(() => {
    //     getData().then(resolve, reject)
    // }, 40000)) };
    return { getData };
};

const clientSideTests = (sources) => {
    const intent = DOM => ({
        changeTestVariant$: DOM.select('input').events('change')
            .map(event => ({ id: event.target.name, variant: event.target.value }))
    });

    const model = (actions, dataPromise) => {
        const testsPromise = dataPromise.then(data => (
            data.get('tests').map(test => (
                test.updateIn(['variants'], variants => (
                    variants
                        .map(variant => variant.get('id'))
                        .push('notintest')
                ))
            ))
        ));
        const initialParticipationsPromise = dataPromise.then(data => data.get('participations'));

        const initialParticipations$ = Rx.Observable.fromPromise(initialParticipationsPromise);
        const participations$ = initialParticipations$.flatMap(initialParticipations => (
            actions.changeTestVariant$
                .scan((participations, newTestState) => (
                    participations.set(newTestState.id, newTestState.variant)
                ), initialParticipations)
                .startWith(initialParticipations)
        ));
        const tests$ = Rx.Observable.fromPromise(testsPromise);

        return Rx.Observable.of({ tests$: tests$.share(), participations$: participations$.share() });
    };

    const view = (state$) => {
        const cols = ['ID', 'Variants'];
        const tbodyView = (state) => (
            Rx.Observable.combineLatest(
                state.tests$, state.participations$,
                (tests, participations) => (
                    tests.map(test => {
                        const selectedVariant = participations.get(test.get('id'));
                        return h('tr', { title: test.get('description') }, [
                            h('td.mdl-data-table__cell--non-numeric', test.get('id')),
                            ih('td.mdl-data-table__cell--non-numeric', (
                                test.get('variants').map(variant => {
                                    return h('label.mdl-radio.mdl-js-radio.mdl-js-ripple-effect', [
                                        h('input.mdl-radio__button', {
                                            type: 'radio',
                                            name: test.get('id'),
                                            value: variant,
                                            checked: variant === selectedVariant
                                        }),
                                        h('span.mdl-radio__label', variant)
                                    ]);
                                })
                            ))
                        ]);
                    })
                )
            )
                .startWith([h('tr', h('td.loading-col', { attributes: { colspan: cols.length + 1 } }, 'Loading'))])
                .map(rowVTrees => ih('tbody', rowVTrees))
        );

        return state$.map(state => (
            h('table.mdl-data-table.mdl-js-data-table.mdl-shadow--2dp', [
                h('thead', h('tr', cols.map(key => h('th.mdl-data-table__cell--non-numeric', key)))),
                tbodyView(state)
            ])
        ));
    };

    const create = sources => {
        const state$ = model(intent(sources.DOM), sources.dataPromise);

        const tabData$ = state$
            .flatMap(state => state.participations$)
            .map(participations => ({ participations }));

        const sinks = {
            DOM: view(state$),
            tab: tabData$
        };

        return sinks;
    };

    return create(sources);
};


const main = (sources) => {
    const dataPromise = sources.tab.getData();
    const clientSideTestSinks = clientSideTests({ DOM: sources.DOM, dataPromise: dataPromise });
    return {
        DOM: clientSideTestSinks.DOM,
        tab: clientSideTestSinks.tab
    };
};

const domDriver = makeDOMDriver('body');
const drivers = {
    // We wrap the DOM driver to apply Material Design side effects
    DOM: vtree$ => {
        const DOM = domDriver(
            vtree$
                .share()
                // https://github.com/cyclejs/cycle-dom/issues/28
                .observeOn(Rx.Scheduler.requestAnimationFrame)
        );
        DOM.observable.subscribe(() => window.componentHandler.upgradeDom());
        return DOM;
    },
    tab: tabDriver
};

Cycle.run(main, drivers);
