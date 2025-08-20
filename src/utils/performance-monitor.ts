// src/utils/performance-monitor.ts
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }

    const elapsed = performance.now() - startTime;
    this.timers.delete(name);
    return elapsed;
  }

  static measureFunction<T>(fn: () => T, name?: string): { result: T; duration: number } {
    const timerName = name || fn.name || 'anonymous';
    this.startTimer(timerName);
    
    try {
      const result = fn();
      const duration = this.endTimer(timerName);
      return { result, duration };
    } catch (error) {
      this.timers.delete(timerName);
      throw error;
    }
  }

  static async measureAsyncFunction<T>(
    fn: () => Promise<T>, 
    name?: string
  ): Promise<{ result: T; duration: number }> {
    const timerName = name || fn.name || 'anonymous';
    this.startTimer(timerName);
    
    try {
      const result = await fn();
      const duration = this.endTimer(timerName);
      return { result, duration };
    } catch (error) {
      this.timers.delete(timerName);
      throw error;
    }
  }
}

// Export all utilities
export default PerformanceMonitor 