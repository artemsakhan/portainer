import {useEffect, useRef} from 'react';

export function useContainerStatsSSE(
    environmentId: number,
    onMessage: (data: any) => void,
    onError?: (err: any) => void
) {
    // Store the latest callbacks in refs to avoid restarting the connection
    const onMessageRef = useRef(onMessage);
    const onErrorRef = useRef(onError);

    // Update refs when callbacks change
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
        const url = `/api/docker/${environmentId}/containers/stats`;
        const source = new EventSource(url, {withCredentials: true});

        source.onopen = () => console.log('SSE connection opened');

        source.addEventListener('open', (event) => {
            console.log('Open event:', event);
        });

        source.addEventListener('stats', (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessageRef.current(data);
            } catch (e) {
                console.warn('Invalid stats message:', e, 'Raw data:', event.data);
            }
        });

        source.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessageRef.current(data);
            } catch (e) {
                console.warn('Invalid generic message:', e, 'Raw data:', event.data);
            }
        });

        source.addEventListener('error', (event) => {
            console.error('Error event:', event);
            onErrorRef.current?.(event);
        });

        source.onerror = (err) => {
            console.error('SSE error:', err);
            onErrorRef.current?.(err);
        };

        return () => {
            source.close();
            console.log('SSE connection closed');
        };
    }, [environmentId]); // Only restart connection if environmentId changes
}