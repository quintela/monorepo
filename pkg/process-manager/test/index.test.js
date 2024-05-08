// this test suite uses jasmine globals

const ProcessManager = require('../').constructor;
const Promise = require('bluebird');

describe('ProcessManager', () => {
  let processManager;

  beforeEach(() => {
    spyOn(process, 'exit');
    spyOn(console, 'error');
    processManager = new ProcessManager();
  });

  describe('constructor()', () => {
    it('sets the initial state', () => {
      expect(processManager.errors).toEqual([]);
      expect(processManager.forceShutdown).toMatchObject({
        promise: expect.any(Promise),
        reject: expect.any(Function),
        resolve: expect.any(Function),
      });
      expect(processManager.hooks).toEqual([]);
      expect(processManager.running).toEqual([]);
      expect(processManager.terminating).toEqual(false);
      expect(processManager.timeout).toEqual(30000);
    });
  });

  describe('addHook()', () => {
    it('adds the given handler to the handlers list', () => {
      const handler = () => '';
      const type = 'disconnect';

      expect(processManager.hooks).toEqual([]);
      processManager.addHook({ handler, type });
      expect(processManager.hooks).toMatchObject([
        {
          handler,
          name: 'a handler',
          timeoutError: {
            message: 'a handler took too long to complete disconnect hook',
          },
          type,
        },
      ]);
    });

    it('identifies the hook if `name` is provided', () => {
      const handler = () => '';
      const type = 'disconnect';

      processManager.addHook({ handler, name: 'foobar', type });
      expect(processManager.hooks).toMatchObject([
        {
          handler,
          name: 'foobar',
          timeoutError: {
            message: 'foobar took too long to complete disconnect hook',
          },
          type,
        },
      ]);
    });
  });

  describe('configure()', () => {
    it('keeps old timeout if nothing is passed', () => {
      expect(processManager.timeout).toBe(30000);
      processManager.configure();
      expect(processManager.timeout).toBe(30000);
    });

    it('keeps old timeout if value is NaN', () => {
      expect(processManager.timeout).toBe(30000);
      processManager.configure({ timeout: 'foo' });
      expect(processManager.timeout).toBe(30000);
    });

    it('updates timeout', () => {
      expect(processManager.timeout).toBe(30000);
      processManager.configure({ timeout: 20000 });
      expect(processManager.timeout).toBe(20000);
    });
  });

  describe('exit()', () => {
    it('calls `process.exit`', () => {
      processManager.exit();
      expect(process.exit).toHaveBeenCalled();
    });

    it('sets `process.exitCode` to 1 if there are errors', () => {
      processManager.errors = [new Error()];
      processManager.exit();
      expect(process.exit).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('calls `console.error` if `DEBUG` is not set', () => {
      processManager.errors = [new Error()];
      processManager.exit();

      expect(console.error).toHaveBeenCalled();

      expect(console.error).toHaveBeenCalledWith(...processManager.errors);
    });

    it('does not call `console.error` if `DEBUG` is set', () => {
      process.env.DEBUG = 'foo';
      processManager.errors = [new Error()];
      processManager.exit();

      expect(console.error).not.toHaveBeenCalled();

      delete process.env.DEBUG;
    });
  });

  describe('hook()', () => {
    it('calls all handlers for a given hook', () => {
      const [h1, h2] = [jest.fn(), jest.fn()];
      const type = 'disconnect';

      processManager.addHook({ handler: h1, type });
      processManager.addHook({ handler: h2, type });

      return processManager.hook(type).then(() => {
        expect(h1).toHaveBeenCalled();
        expect(h2).toHaveBeenCalled();
      });
    });

    it(`doesn't call handlers that don't belong to a given hook`, () => {
      const [h1, h2] = [jest.fn(), jest.fn()];
      const type = 'disconnect';

      processManager.addHook({ handler: h1, type });
      processManager.addHook({ handler: h2, type: 'otherHook' });

      return processManager.hook(type).then(() => {
        expect(h1).toHaveBeenCalled();
        expect(h2).not.toHaveBeenCalled();
      });
    });

    it('passes extra arguments to the handlers', () => {
      const h1 = jest.fn();
      const type = 'disconnect';

      processManager.addHook({ handler: h1, type });

      return processManager.hook(type, 'foobar').then(() => {
        expect(h1).toHaveBeenCalled();
        expect(h1).toHaveBeenCalledWith('foobar');
      });
    });

    it('resolves with a timeout if hook too long to finish', () => {
      return new Promise(done => {
        const [h1, h2] = [jest.fn(), jest.fn()];
        const type = 'disconnect';

        processManager.addHook({ handler: h1, type });
        processManager.addHook({
          handler: () => new Promise(() => {}).then(h2),
          type,
        });
        jest.useFakeTimers();
        processManager.hook(type).then(() => {
          expect(h1).toHaveBeenCalled();
          expect(h2).not.toHaveBeenCalled();
          jest.useRealTimers();
          done();
        });
        jest.runAllTimers();
      });
    });
  });

  describe('shutdown()', () => {
    it('sets `terminating` to true', () => {
      processManager.shutdown();
      expect(processManager.terminating).toBe(true);
    });

    it('creates `forceShutdown` promise', () => {
      processManager.shutdown();
      expect(processManager.forceShutdown.promise).toBeInstanceOf(Promise);
    });

    it('with `force` set to `true` it creates `forceShutdown` promise in reject state', () => {
      return new Promise(done => {
        processManager.shutdown({ force: true });
        processManager.forceShutdown.promise.catch(done);
      });
    });

    it('calls hook `drain`', () => {
      return new Promise(done => {
        spyOn(processManager, 'hook').and.callThrough();
        processManager.addHook({
          handler() {
            expect(processManager.hook).toHaveBeenCalledWith('drain');
            done();
          },
          type: 'drain',
        });
        processManager.shutdown();
      });
    });

    it('calls hook `disconnect`', () => {
      return new Promise(done => {
        spyOn(processManager, 'hook').and.callThrough();
        processManager.addHook({
          handler() {
            expect(processManager.hook).toHaveBeenCalledWith('disconnect');
            done();
          },
          type: 'disconnect',
        });
        processManager.shutdown();
      });
    });

    it('calls hook `exit`', () => {
      return new Promise(done => {
        spyOn(processManager, 'hook').and.callThrough();
        processManager.addHook({
          handler() {
            expect(processManager.hook).toHaveBeenCalledWith('exit', []);
            done();
          },
          type: 'exit',
        });
        processManager.shutdown();
      });
    });

    it('calls `processManager.exit`', () => {
      return new Promise(done => {
        spyOn(processManager, 'exit').and.callFake(() => {
          done();
        });
        processManager.shutdown();
      });
    });

    it('adds error to `processManager.errors`', () => {
      return new Promise(done => {
        const error = new Error();

        spyOn(processManager, 'exit').and.callFake(() => {
          expect(processManager.errors).toHaveLength(1);
          expect(processManager.errors).toContain(error);
          expect(processManager.exit).toHaveBeenCalled();
          expect(processManager.exit).toHaveBeenCalledTimes(1);
          done();
        });
        processManager.shutdown({ error });
      });
    });

    it('adds errors to `processManager.errors` if called more than once', () => {
      return new Promise(done => {
        const [e1, e2] = [new Error(), new Error()];

        spyOn(processManager, 'exit').and.callFake(() => {
          expect(processManager.errors).toHaveLength(2);
          expect(processManager.errors).toContain(e1);
          expect(processManager.errors).toContain(e2);
          expect(processManager.exit).toHaveBeenCalled();
          expect(processManager.exit).toHaveBeenCalledTimes(1);
          done();
        });
        processManager.shutdown({ error: e1 });
        processManager.shutdown({ error: e2 });
      });
    });

    it('forces shutdown if `processManager.shutdown` is called with force `true`', () => {
      return new Promise(done => {
        spyOn(processManager, 'exit').and.callFake(() => {
          processManager.forceShutdown.promise.catch(done);
        });
        processManager.loop(async () => {}, { interval: 1000 });
        processManager.shutdown();
        processManager.shutdown({ force: true });
      });
    });
  });

  describe('loop()', () => {
    it('loops until `terminating` is true', () => {
      const fn = jest.fn();

      let i = 0;

      return processManager
        .loop(async () => {
          fn();
          if (++i === 3) {
            processManager.shutdown();
          }
        })
        .then(() => {
          expect(fn).toHaveBeenCalledTimes(3);
        });
    });

    it('calls `shutdown` with error if an error is thrown while running the loop', () => {
      const error = new Error();

      spyOn(processManager, 'shutdown').and.callThrough();

      return processManager
        .loop(async () => {
          throw error;
        })
        .then(() => {
          expect(processManager.shutdown).toHaveBeenCalledWith({ error });
        });
    });
  });

  describe('on()', () => {
    it('calls the given function', () => {
      const fn = jest.fn();
      const on = processManager.on(async () => fn());

      return on().then(() => {
        expect(fn).toHaveBeenCalled();
      });
    });

    it('passes arguments to the given function', () => {
      const fn = jest.fn();
      const on = processManager.on(async value => fn(value));

      return on('foo').then(() => {
        expect(fn).toHaveBeenCalled();
        expect(fn).toHaveBeenCalledWith('foo');
      });
    });

    it('can be called repeatedly', () => {
      const fn = jest.fn();

      spyOn(processManager, 'shutdown');
      const on = processManager.on(async () => fn());

      let i = 0;
      const onArray = [];

      for (i; i < 10; i++) {
        onArray.push(on());
      }

      return Promise.all(onArray).then(() => {
        expect(fn).toHaveBeenCalledTimes(i);
        expect(processManager.shutdown).not.toHaveBeenCalled();
        processManager.shutdown();
      });
    });
  });

  describe('once()', () => {
    it('calls the given function', () => {
      const fn = jest.fn();

      return processManager
        .once(async () => fn())
        .then(() => {
          expect(fn).toHaveBeenCalled();
        });
    });
  });

  describe('run()', () => {
    it('does nothing if `processManager` is terminating', () => {
      const fn = jest.fn();

      processManager.terminating = true;
      const result = processManager.run(async () => fn());

      expect(fn).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('returns the coroutine', () => {
      return new Promise(done => {
        spyOn(processManager, 'shutdown').and.callFake(() => {
          done();
        });
        const chain = processManager.run(async () => {});

        expect(chain.then).toBeDefined();
        expect(typeof chain.id).toBe('symbol');
      });
    });

    it('calls `shutdown` with error if an error is thrown while running the function', () => {
      const error = new Error();

      spyOn(processManager, 'shutdown');

      return processManager
        .run(async () => {
          throw error;
        })
        .then(() => {
          expect(processManager.shutdown).toHaveBeenCalledWith({ error });
        });
    });

    it('calls `shutdown` after running the function', () => {
      spyOn(processManager, 'shutdown');

      return processManager
        .run(async () => {})
        .then(() => {
          expect(processManager.shutdown).toHaveBeenCalledWith({
            error: undefined,
          });
        });
    });
  });

  describe('event handling', () => {
    it('catches `unhandledRejection`', () => {
      return new Promise(done => {
        const processManager = require('../');

        spyOn(processManager, 'shutdown');
        const error = new Error();

        process.once('unhandledRejection', () => {
          expect(processManager.shutdown).toHaveBeenCalledWith({ error });
          done();
        });
        Promise.reject(error);
      });
    });
  });
});
