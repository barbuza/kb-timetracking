import {
  AppState,
  IAppEvent,
  isConnectEvent,
  isDisconnectEvent,
  isEndEvent,
  isPauseEvent,
  isUnpauseEvent,
} from './utils';

function connected(connectedDevices: { [deviceId: string]: number }): boolean {
  let firstUserId: number | null = null;
  for (const deviceId in connectedDevices) {
    const userId = connectedDevices[deviceId];
    if (firstUserId === null) {
      firstUserId = userId;
    } else if (firstUserId !== userId) {
      return true;
    }
  }
  return false;
}

export function reduce(events: IAppEvent[]): {
  trackedTime: number,
  lastActive: number | null,
  stateTime: number | null,
  state: AppState,
} {
  let trackedTime = 0;
  const connectedDevices: { [deviceId: string]: number } = {};
  let lastBothConnected: number | null = null;
  let lastActive: number | null = null;
  let paused = false;
  let stateTime: number | null = null;
  for (const event of events) {
    if (isConnectEvent(event)) {
      const prevConnected = connected(connectedDevices);
      connectedDevices[event.d] = event.u;
      if (!prevConnected && connected(connectedDevices) && !paused) {
        lastBothConnected = event.c;
        lastActive = event.c;
      }
    } else if (isDisconnectEvent(event)) {
      const prevConnected = connected(connectedDevices);
      delete connectedDevices[event.d];
      if (prevConnected && lastBothConnected !== null && !connected(connectedDevices) && !paused) {
        trackedTime += event.c - lastBothConnected;
        lastBothConnected = null;
      }
    } else if (isPauseEvent(event)) {
      if (lastBothConnected !== null && !paused) {
        trackedTime += event.c - lastBothConnected;
        lastBothConnected = null;
      }
      paused = true;
    } else if (isUnpauseEvent(event)) {
      if (connected(connectedDevices)) {
        lastBothConnected = event.c;
        lastActive = event.c;
      }
      paused = false;
    } else if (isEndEvent(event)) {
      if (lastBothConnected !== null && !paused) {
        trackedTime += event.c - lastBothConnected;
        lastBothConnected = null;
      }
      break;
    }
    stateTime = event.c;
  }

  let state: AppState = AppState.IDLE;
  if (paused) {
    state = AppState.PAUSED;
  } else if (connected(connectedDevices)) {
    state = AppState.IN_PROGRESS;
  }

  return { trackedTime, lastActive, stateTime, state };
}
