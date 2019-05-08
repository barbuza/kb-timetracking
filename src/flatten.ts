import {
  IAppEvent,
  IDeviceEvent,
  isConnectEvent,
  isDeviceEvent,
  isDisconnectEvent,
  isEndEvent,
  isPauseEvent,
  isUnpauseEvent,
} from './utils';

export function flattenEventStream(events: IAppEvent[], ttl: number, currentTime: number | null): IAppEvent[] {
  events = events.slice();
  events.sort((a, b) => a.c - b.c);
  const { deviceStreams, otherEvents } = findDeviceStreams(events);
  let result = otherEvents;
  for (const deviceId in deviceStreams) {
    result = result.concat(flattenDeviceStream(deviceStreams[deviceId], ttl, currentTime));
  }
  result.sort((a, b) => a.c - b.c);
  return result;
}

export function findDeviceStreams(events: IAppEvent[]): {
  deviceStreams: { [deviceId: string]: IDeviceEvent[] },
  otherEvents: IAppEvent[],
} {
  const deviceStreams: { [deviceId: string]: IDeviceEvent[] } = {};
  const otherEvents: IAppEvent[] = [];
  let paused = false;
  for (const event of events) {
    if (isDeviceEvent(event)) {
      if (!deviceStreams[event.d]) {
        deviceStreams[event.d] = [];
      }
      deviceStreams[event.d].push(event);
    } else {
      let ignore = false;
      if (isPauseEvent(event)) {
        ignore = paused;
        paused = true;
      } else if (isUnpauseEvent(event)) {
        ignore = !paused;
        paused = false;
      }
      if (!ignore) {
        otherEvents.push(event);
      }
      if (isEndEvent(event)) {
        break;
      }
    }
  }
  return { deviceStreams, otherEvents };
}

export function flattenDeviceStream(events: IDeviceEvent[], ttl: number, currentTime: number | null): IDeviceEvent[] {
  if (!events.length) {
    return [];
  }

  let lastEvent: IDeviceEvent = events[0];
  const result: IDeviceEvent[] = [lastEvent];

  let lastConnected: number | null = null;
  if (isConnectEvent(lastEvent)) {
    lastConnected = lastEvent.c;
  }

  for (let i = 1, l = events.length; i < l; i++) {
    const event = events[i];

    if (isConnectEvent(event)) {

      let ignore = false;
      if (isConnectEvent(lastEvent)) {
        if (lastConnected !== null) {
          if (event.c - lastConnected < ttl) {
            ignore = true;
          } else {
            result.push({ t: 'd', c: lastConnected + ttl / 2, u: event.u, d: event.d });
          }
        }
      }
      if (!ignore) {
        result.push(event);
      }

      lastConnected = event.c;

    } else if (isDisconnectEvent(event)) {

      if (isConnectEvent(lastEvent) && lastConnected !== null && event.c - lastConnected >= ttl) {
        result.push({ t: 'd', c: lastConnected + ttl / 2, u: event.u, d: event.d });
      } else if (!isDisconnectEvent(lastEvent)) {
        result.push(event);
      }

    }

    lastEvent = result[result.length - 1];
  }

  if (isConnectEvent(lastEvent) && lastConnected !== null && currentTime !== null) {
    if (currentTime - lastConnected >= ttl) {
      result.push({ t: 'd', c: lastConnected + ttl / 2, u: lastEvent.u, d: lastEvent.d });
    }
  }

  return result;
}
