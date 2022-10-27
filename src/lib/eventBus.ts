export interface EventCallback {
  (event: Event): void;
}
type Event = any;

interface Events {
  [key: string]: EventCallback[];
}
export class EventBus {
  #events: Events;

  constructor() {
    this.#events = {};
  }

  emit(event: string, data: Event) {
    this.#events[event] && this.#events[event].forEach((fn) => fn(data));
  }
  on(event: string, fn: EventCallback) {
    this.#events[event] = this.#events[event] || [];
    this.#events[event].push(fn);
  }
  off(event: string, fn: EventCallback) {
    this.#events[event] = this.#events[event].filter((f) => f !== fn);
  }
}
