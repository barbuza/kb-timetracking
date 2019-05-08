import { findDeviceStreams, flattenDeviceStream, flattenEventStream } from '../flatten';

describe('app stream', () => {

  it('should sort input', () => {
    expect(flattenEventStream([
      { t: 's', c: 1 },
      { t: 'c', c: 2, u: 1, d: '1' },
      { t: 'd', c: 4, u: 1, d: '1' },
      { t: 'e', c: 3 },
    ], 4, 4)).toEqual([
      { t: 's', c: 1 },
      { t: 'c', c: 2, u: 1, d: '1' },
      { t: 'e', c: 3 },
    ]);
  });

  it('should flatten app stream', () => {
    expect(flattenEventStream([
      { t: 's', c: 0 },
      { t: 'p', c: 1 },
      { t: 'c', c: 2, u: 1, d: '1' },
      { t: 'c', c: 3, u: 2, d: '2' },
      { t: 'c', c: 6, u: 1, d: '1' },
      { t: 'u', c: 7 },
    ], 4, 10)).toEqual([
      { t: 's', c: 0 },
      { t: 'p', c: 1 },
      { t: 'c', c: 2, u: 1, d: '1' },
      { t: 'c', c: 3, u: 2, d: '2' },
      { t: 'd', c: 4, u: 1, d: '1' },
      { t: 'd', c: 5, u: 2, d: '2' },
      { t: 'c', c: 6, u: 1, d: '1' },
      { t: 'u', c: 7 },
      { t: 'd', c: 8, u: 1, d: '1' },
    ]);
  });

  it('should skip duplicate pause events', () => {
    expect(flattenEventStream([
      { t: 'p', c: 1 },
      { t: 'p', c: 2 },
      { t: 'u', c: 3 },
      { t: 'u', c: 4 },
    ], 4, 10)).toEqual([
      { t: 'p', c: 1 },
      { t: 'u', c: 3 },
    ]);
  });

  it('should stop on end event', () => {
    expect(flattenEventStream([
      { t: 's', c: 1 },
      { t: 'p', c: 2 },
      { t: 'e', c: 3 },
      { t: 'u', c: 4 },
    ], 4, 10)).toEqual([
      { t: 's', c: 1 },
      { t: 'p', c: 2 },
      { t: 'e', c: 3 },
    ]);
  });

});

describe('stream splitting', () => {

  it('should find device streams', () => {
    expect(findDeviceStreams([
      { t: 's', c: 0 },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'p', c: 0 },
      { t: 'c', c: 1, u: 2, d: '2' },
      { t: 'd', c: 3, u: 1, d: '1' },
      { t: 'u', c: 3 },
      { t: 'e', c: 4 },
    ]).deviceStreams).toEqual({
      1: [
        { t: 'c', c: 1, u: 1, d: '1' },
        { t: 'd', c: 3, u: 1, d: '1' },
      ],
      2: [
        { t: 'c', c: 1, u: 2, d: '2' },
      ],
    });
  });

  it('should find other events', () => {
    expect(findDeviceStreams([
      { t: 's', c: 0 },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'p', c: 0 },
      { t: 'c', c: 1, u: 2, d: '2' },
      { t: 'd', c: 3, u: 1, d: '1' },
      { t: 'u', c: 3 },
      { t: 'e', c: 4 },
    ]).otherEvents).toEqual([
      { t: 's', c: 0 },
      { t: 'p', c: 0 },
      { t: 'u', c: 3 },
      { t: 'e', c: 4 },
    ]);
  });

});

describe('device stream', () => {

  it('should be empty on empty input', () => {
    expect(flattenDeviceStream([], 4, 4)).toEqual([]);
  });

  it('should flatten connect events', () => {
    expect(flattenDeviceStream([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'c', c: 2, u: 1, d: '1' },
      { t: 'c', c: 3, u: 1, d: '1' },
    ], 4, 4)).toEqual([
      { t: 'c', c: 0, u: 1, d: '1' },
    ]);
  });

  it('should flatten connect events with disconnect siblings', () => {
    expect(flattenDeviceStream([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'c', c: 2, u: 1, d: '1' },
      { t: 'd', c: 3, u: 1, d: '1' },
    ], 4, 4)).toEqual([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'd', c: 3, u: 1, d: '1' },
    ]);
  });

  it('should add trailing disconnect event', () => {
    expect(flattenDeviceStream([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'c', c: 2, u: 1, d: '1' },
      { t: 'c', c: 3, u: 1, d: '1' },
    ], 4, 10)).toEqual([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'd', c: 5, u: 1, d: '1' },
    ]);
  });

  it('shouldnt add trailing disconnect event in advance', () => {
    expect(flattenDeviceStream([
      { t: 'c', c: 3, u: 1, d: '1' },
    ], 4, 5)).toEqual([
      { t: 'c', c: 3, u: 1, d: '1' },
    ]);
  });

  it('should add disconnect events on timeout', () => {
    expect(flattenDeviceStream([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 5, u: 1, d: '1' },
    ], 4, 6)).toEqual([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'd', c: 2, u: 1, d: '1' },
      { t: 'c', c: 5, u: 1, d: '1' },
    ]);
  });

  it('should flatten disconnect events', () => {
    expect(flattenDeviceStream([
      { t: 'd', c: 0, u: 1, d: '1' },
      { t: 'd', c: 0, u: 1, d: '1' },
      { t: 'd', c: 0, u: 1, d: '1' },
    ], 4, 10)).toEqual([
      { t: 'd', c: 0, u: 1, d: '1' },
    ]);
  });

  it('should flatten injected disconnect events', () => {
    expect(flattenDeviceStream([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'd', c: 6, u: 1, d: '1' },
    ], 4, 10)).toEqual([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'd', c: 2, u: 1, d: '1' },
    ]);
  });

});
