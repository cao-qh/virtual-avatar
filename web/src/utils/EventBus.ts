/**
 * 简单的事件总线，用于在 TypeScript 类和 Vue 组件之间通信
 */

type EventCallback = (data?: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * 监听事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 移除事件监听
   * @param event 事件名称
   * @param callback 要移除的回调函数（如果不提供，则移除所有监听器）
   */
  off(event: string, callback?: EventCallback): void {
    if (!this.events.has(event)) {
      return;
    }

    if (callback) {
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.events.delete(event);
      }
    } else {
      this.events.delete(event);
    }
  }

  /**
   * 一次性事件监听
   * @param event 事件名称
   * @param callback 回调函数
   */
  once(event: string, callback: EventCallback): void {
    const onceCallback: EventCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }
}

// 创建全局事件总线实例
const eventBus = new EventBus();

export default eventBus;