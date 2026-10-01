type LoadingListener = (visible: boolean) => void;

let pendingRequests = 0;
const listeners = new Set<LoadingListener>();

function notify() {
    const visible = pendingRequests > 0;
    listeners.forEach((listener) => listener(visible));
}

export function startLoading() {
    pendingRequests++;
    notify();
}

export function stopLoading() {
    pendingRequests = Math.max(0, pendingRequests - 1);
    notify();
}

export function subscribeLoading(listener: LoadingListener) {
    listeners.add(listener);
    listener(pendingRequests > 0);

    return () => {
        listeners.delete(listener);
    };
}
