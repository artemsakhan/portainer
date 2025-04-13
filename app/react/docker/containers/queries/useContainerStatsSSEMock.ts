import { useEffect, useRef } from 'react';

export function useContainerStatsSSEMock(
    environmentId: number,
    onMessage: (data: any) => void,
    onError?: (err: any) => void
) {
    // Store the latest callbacks in refs to avoid restarting the interval
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
        console.log('Mock SSE started for environmentId:', environmentId);

        const interval = setInterval(() => {
            const now = new Date().toISOString();

            const mockStat = {
                read: now,
                num_procs: 0,
                storage_stats: {},
                cpu_stats: {
                    cpu_usage: {
                        total_usage: Math.floor(Math.random() * 1e10),
                        usage_in_kernelmode: Math.floor(Math.random() * 1e9),
                        usage_in_usermode: Math.floor(Math.random() * 1e9),
                    },
                    system_cpu_usage: Math.floor(Math.random() * 1e14),
                    online_cpus: 10,
                    throttling_data: {
                        periods: 0,
                        throttled_periods: 0,
                        throttled_time: 0,
                    },
                },
                precpu_stats: {
                    cpu_usage: {
                        total_usage: Math.floor(Math.random() * 1e10),
                        usage_in_kernelmode: Math.floor(Math.random() * 1e9),
                        usage_in_usermode: Math.floor(Math.random() * 1e9),
                    },
                    system_cpu_usage: Math.floor(Math.random() * 1e14),
                    throttling_data: {
                        periods: 0,
                        throttled_periods: 0,
                        throttled_time: 0,
                    },
                },
                memory_stats: {
                    usage: Math.floor(Math.random() * 500 * 1024 * 1024),
                    stats: {},
                    limit: 8 * 1024 * 1024 * 1024, // 8 GB
                },
            };

            // Use the latest onMessage callback from the ref
            onMessageRef.current({
                cid: '480301961b2ee09f6d3ff2bfaaa28689fc8369ea8f543aadd621b8ba6825bdad',
                stats: mockStat,
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            console.log('Mock SSE stopped');
        };
    }, [environmentId]); // Only restart interval if environmentId changes
}