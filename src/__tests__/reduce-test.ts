import { reduce } from '../reduce';
import { AppState, IAppEvent } from '../utils';

function reduceTrackedTime(events: IAppEvent[]): number {
  return reduce(events).trackedTime;
}

function reduceLastActive(events: IAppEvent[]): number | null {
  return reduce(events).lastActive;
}

function reduceStateTime(events: IAppEvent[]): number | null {
  return reduce(events).stateTime;
}

function reduceState(events: IAppEvent[]): AppState {
  return reduce(events).state;
}

describe('reduce tracked time', () => {

  it('should be 0 with no users', () => {
    expect(reduceTrackedTime([
      { t: 's', c: 0 },
    ])).toBe(0);
  });

  it('should be 0 with one user', () => {
    expect(reduceTrackedTime([
      { t: 's', c: 0 },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'c', c: 2, u: 1, d: '2' },
    ])).toBe(0);
  });

  it('should track interval with both users connected', () => {
    expect(reduceTrackedTime([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 2, d: '2' },
      { t: 'd', c: 3, u: 2, d: '2' },
    ])).toBe(2);
  });

  it('should track interval with end event', () => {
    expect(reduceTrackedTime([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 2, d: '2' },
      { t: 'e', c: 3 },
    ])).toBe(2);
  });

  it('should handle pause with both users connected', () => {
    expect(reduceTrackedTime([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 2, d: '2' },
      { t: 'p', c: 3 },
      { t: 'u', c: 4 },
      { t: 'e', c: 6 },
    ])).toBe(4);
  });

  it('should track connecting while pausing', () => {
    expect(reduceTrackedTime([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'p', c: 1 },
      { t: 'c', c: 3, u: 2, d: '2' },
      { t: 'u', c: 4 },
      { t: 'e', c: 6 },
    ])).toBe(2);
  });

  it('shouldnt track unpausing while disconnected user', () => {
    expect(reduceTrackedTime([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'p', c: 1 },
      { t: 'c', c: 3, u: 2, d: '2' },
      { t: 'd', c: 4, u: 2, d: '2' },
      { t: 'u', c: 5 },
      { t: 'e', c: 6 },
    ])).toBe(0);
  });

  it('should end with end event', () => {
    expect(reduceTrackedTime([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 0, u: 2, d: '2' },
      { t: 'e', c: 3 },
      { t: 'c', c: 4, u: 1, d: '1' },
      { t: 'c', c: 4, u: 2, d: '2' },
      { t: 'd', c: 5, u: 1, d: '1' },
      { t: 'd', c: 5, u: 2, d: '2' },
    ])).toBe(3);
  });

  it('additional devices shouldnt change tracked time', () => {
    expect(reduceTrackedTime([
      { t: 's', c: 0 },
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 0, u: 2, d: '2' },
      { t: 'c', c: 10, u: 1, d: '3' },
      { t: 'd', c: 50, u: 1, d: '3' },
      { t: 'd', c: 100, u: 1, d: '1' },
      { t: 'd', c: 100, u: 2, d: '2' },
    ])).toBe(100);
  });

});

describe('last active time', () => {

  it('should be null with one user', () => {
    expect(reduceLastActive([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 1, d: '2' },
    ])).toBeNull();
  });

  it('should be last connected time with two users', () => {
    expect(reduceLastActive([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 2, d: '2' },
    ])).toBe(1);
  });

  it('should be unpaused time with two users', () => {
    expect(reduceLastActive([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 2, d: '2' },
      { t: 'p', c: 2 },
      { t: 'u', c: 3 },
    ])).toBe(3);
  });

  it('should keep connected time with one user unpaused', () => {
    expect(reduceLastActive([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 2, d: '2' },
      { t: 'p', c: 2 },
      { t: 'd', c: 3, u: 1, d: '1' },
      { t: 'u', c: 4 },
    ])).toBe(1);

  });

});

describe('state time', () => {

  it('should be null with empty events', () => {
    expect(reduceStateTime([])).toBeNull();
  });

  it('should be last event timestamp', () => {
    expect(reduceStateTime([
      { t: 's', c: 0 },
      { t: 'p', c: 1 },
    ])).toBe(1);
  });

});

describe('app state', () => {

  it('should be idle at start', () => {
    expect(reduceState([
      { t: 's', c: 0 },
    ])).toBe(AppState.IDLE);
  });

  it('should be paused', () => {
    expect(reduceState([
      { t: 's', c: 0 },
      { t: 'p', c: 1 },
    ])).toBe(AppState.PAUSED);
  });

  it('should be unpaused', () => {
    expect(reduceState([
      { t: 's', c: 0 },
      { t: 'p', c: 1 },
      { t: 'u', c: 2 },
    ])).toBe(AppState.IDLE);
  });

  it('should be idle with one user', () => {
    expect(reduceState([
      { t: 's', c: 0 },
      { t: 'c', c: 1, u: 1, d: '1' },
    ])).toBe(AppState.IDLE);
  });

  it('should be idle with one user from two devices', () => {
    expect(reduceState([
      { t: 's', c: 0 },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'c', c: 2, u: 1, d: '2' },
    ])).toBe(AppState.IDLE);
  });

  it('should be in progress with two users', () => {
    expect(reduceState([
      { t: 's', c: 0 },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'c', c: 2, u: 2, d: '2' },
    ])).toBe(AppState.IN_PROGRESS);
  });

  it('should be in progress with two users from two devices', () => {
    expect(reduceState([
      { t: 's', c: 0 },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'c', c: 2, u: 2, d: '2' },
      { t: 'c', c: 3, u: 1, d: '3' },
      { t: 'c', c: 4, u: 2, d: '4' },
    ])).toBe(AppState.IN_PROGRESS);
  });

  it('should be paused with two users', () => {
    expect(reduceState([
      { t: 's', c: 0 },
      { t: 'c', c: 1, u: 1, d: '1' },
      { t: 'p', c: 2 },
      { t: 'c', c: 3, u: 2, d: '2' },
    ])).toBe(AppState.PAUSED);
  });

  it('should be idle when user disconnects', () => {
    expect(reduceState([
      { t: 'c', c: 0, u: 1, d: '1' },
      { t: 'c', c: 1, u: 2, d: '2' },
      { t: 'd', c: 2, u: 2, d: '2' },
    ])).toBe(AppState.IDLE);
  });

});
