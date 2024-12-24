export class EventDispatcher {
  subscriptions: {
    [key: string]: any;
  };

  constructor() {
    this.subscriptions = {};
  }

  isEmpty() {
    return Object.keys(this.subscriptions).length === 0;
  }

  set(error: any) {
    this.publish(error);
  }

  async publish(data: any) {
    const subscriptionKeys = Object.keys(this.subscriptions);
    for (const i in subscriptionKeys) {
      const key = subscriptionKeys[i];
      try {
        await this.subscriptions[key](data);
      } catch (error) {
        console.log(`component did not unregister ${key}`);
      }
    }
  }

  subscribe(name: string, handler: any) {
    this.subscriptions[name] = handler;
  }

  unsubscribe(name: string) {
    delete this.subscriptions[name];
  }
}
