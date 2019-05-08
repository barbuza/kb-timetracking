export enum AppState {
  IDLE = 0,
  IN_PROGRESS = 1,
  PAUSED = 2,
}

interface IBaseEvent {
  c: number;
}

export interface IStartEvent extends IBaseEvent {
  t: 's';
}

export interface IEndEvent extends IBaseEvent {
  t: 'e';
}

export interface IPauseEvent extends IBaseEvent {
  t: 'p';
}

export interface IUnpauseEvent extends IBaseEvent {
  t: 'u';
}

interface IBaseDeviceEvent extends IBaseEvent {
  d: string;
  u: number;
}

export interface IConnectEvent extends IBaseDeviceEvent {
  t: 'c';
}

export interface IDisconnectEvent extends IBaseDeviceEvent {
  t: 'd';
}

export type IAppEvent = IStartEvent | IEndEvent | IPauseEvent | IUnpauseEvent | IConnectEvent | IDisconnectEvent;

export type IDeviceEvent = IConnectEvent | IDisconnectEvent;

export interface IBillingState {
  state: AppState;
  trackedTime: number;
  lastActive: number | null;
  stateTime: number | null;
}

export function isDeviceEvent(event: IAppEvent): event is IDeviceEvent {
  return event.t === 'c' || event.t === 'd';
}

export function isConnectEvent(event: IAppEvent): event is IConnectEvent {
  return event.t === 'c';
}

export function isDisconnectEvent(event: IAppEvent): event is IDisconnectEvent {
  return event.t === 'd';
}

export function isPauseEvent(event: IAppEvent): event is IPauseEvent {
  return event.t === 'p';
}

export function isUnpauseEvent(event: IAppEvent): event is IUnpauseEvent {
  return event.t === 'u';
}

export function isStartEvent(event: IAppEvent): event is IEndEvent {
  return event.t === 's';
}

export function isEndEvent(event: IAppEvent): event is IEndEvent {
  return event.t === 'e';
}
