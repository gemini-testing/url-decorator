'use strict';

const EventEmitter = require('events').EventEmitter;
const urlUpdater = require('../lib/url-updater');
const plugin = require('../gemini');

const mkGemini_ = () => {
    const emitter = new EventEmitter();
    emitter.events = {
        BEGIN_SUITE: 'beginSuite'
    };

    return emitter;
};

describe('url-decorator/gemini', () => {
    const sandbox = sinon.sandbox.create();

    let gemini;

    beforeEach(() => {
        gemini = mkGemini_();
        sandbox.spy(gemini, 'on');
        sandbox.stub(urlUpdater, 'updateUrl');
    });

    afterEach(() => sandbox.restore());

    it('should do nothing if "opts" is not an object', () => {
        plugin(gemini, null);

        assert.notCalled(gemini.on);
    });

    it('should do nothing if plugin is disabled', () => {
        plugin(gemini, {enabled: false});

        assert.notCalled(gemini.on);
    });

    it('should decorate suite url if suite has own url', () => {
        urlUpdater.updateUrl.returns('http://suite/updated/url');

        const data = {suite: {url: 'http://suite/url'}};

        plugin(gemini, {});
        gemini.emit(gemini.events.BEGIN_SUITE, data);

        assert.calledOnce(urlUpdater.updateUrl);
        assert.equal(data.suite.url, 'http://suite/updated/url');
    });

    it('should decorate suite url  if suite hasn\'t own url', () => {
        const data = {suite: {}};

        plugin(gemini, {});
        gemini.emit(gemini.events.BEGIN_SUITE, data);

        assert.notCalled(urlUpdater.updateUrl);
    });

    it('should not decorate suite if suite url exists only in prototype', () => {
        const proto = {url: 'rootUrl'};
        const suite = Object.create(proto);

        const data = {suite};

        plugin(gemini, {});
        gemini.emit(gemini.events.BEGIN_SUITE, data);

        assert.notCalled(urlUpdater.updateUrl);
    });

    it('should use only browser matched query parameters', () => {
        const data = {
            suite: {isRoot: true, url: 'http://suite/url'},
            browserId: 'foo-bro'
        };

        plugin(gemini, {
            url: {
                query: {
                    foo: {
                        value: 'foo',
                        browsers: 'foo-bro'
                    },
                    bar: {
                        value: 'bar',
                        browsers: 'bar-bro'
                    }
                }
            }
        });
        gemini.emit(gemini.events.BEGIN_SUITE, data);

        const query = urlUpdater.updateUrl.firstCall.args[1];

        assert.property(query, 'foo');
        assert.notProperty(query, 'bar');
    });
});
