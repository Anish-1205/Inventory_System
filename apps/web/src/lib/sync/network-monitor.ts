type NetworkListener = (online: boolean) => void;

class NetworkMonitor {
  private listeners: Set<NetworkListener> = new Set();

  get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);

    const handleOnline = () => listener(true);
    const handleOffline = () => listener(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      this.listeners.delete(listener);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }
}

export const networkMonitor = new NetworkMonitor();
