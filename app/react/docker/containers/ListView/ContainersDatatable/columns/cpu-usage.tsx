import {isoDateFromTimestamp} from '@/portainer/filters/filters';

import {columnHelper} from './helper';

export const cpuUsage = columnHelper.accessor(
    (row) => isoDateFromTimestamp(row.Created),
    {
        header: 'CPU',
        id: 'cpu-usage',
        cell: ({row}) => (row.original.Stats && createCPUUsageBar(row.original.Stats.cpu_stats, row.original.Stats.precpu_stats) || createEmptyCPUBar()) || createEmptyCPUBar(),
    }
);

function calculateCpuUsage(cpuStats, prevCpuStats) {
    // Safely check if the values are defined and greater than zero
    if (
        !cpuStats || !prevCpuStats ||
        !cpuStats.cpu_usage || !prevCpuStats.cpu_usage ||
        cpuStats.system_cpu_usage === undefined || prevCpuStats.system_cpu_usage === undefined ||
        cpuStats.cpu_usage.total_usage === 0 || prevCpuStats.cpu_usage.total_usage === 0 ||
        cpuStats.system_cpu_usage === 0 || prevCpuStats.system_cpu_usage === 0 ||
        cpuStats.online_cpus === 0
    ) {
        return 0; // return 0 if the calculation cannot be performed
    }

    const cpuUsage = cpuStats.cpu_usage.total_usage;
    const prevCpuUsage = prevCpuStats.cpu_usage.total_usage;
    const systemCpuUsage = cpuStats.system_cpu_usage;
    const prevSystemCpuUsage = prevCpuStats.system_cpu_usage;
    const onlineCpus = cpuStats.online_cpus;

    // Calculate CPU usage percentage
    return ((cpuUsage - prevCpuUsage) / (systemCpuUsage - prevSystemCpuUsage)) * onlineCpus * 100;
}

function createCPUUsageBar(cpuStats, prevCpuStats) {
    const cpuUsage = calculateCpuUsage(cpuStats, prevCpuStats);


    const cpuUsagePercent = cpuUsage.toFixed(1);

    return (
        <div style={{
            width: '100px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '4px',
            fontFamily: 'sans-serif',
            fontSize: '11px',
        }}>
            <div style={{
                position: 'relative',
                height: '24px',
                backgroundColor: '#eee',
                borderRadius: '4px',
                overflow: 'hidden',
            }}>
                <div style={{
                    width: `${cpuUsagePercent}%`,
                    height: '100%',
                    backgroundColor: '#4caf50',
                }}/>
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    textAlign: 'center',
                    top: 0,
                    left: 0,
                    lineHeight: '24px',
                    color: '#000',
                    fontSize: '12px',
                }}>
                    {`${cpuUsagePercent}%`}
                </div>
            </div>
        </div>
    );
}

function createEmptyCPUBar() {
    return (
        <div style={{
            width: '100px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '4px',
            fontFamily: 'sans-serif',
            fontSize: '11px',
        }}>
            <div style={{
                position: 'relative',
                height: '24px',
                backgroundColor: '#eee',
                borderRadius: '4px',
                overflow: 'hidden',
            }}>
                <div style={{
                    width: `0%`,
                    height: '100%',
                    backgroundColor: '#4caf50',
                }}/>
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    textAlign: 'center',
                    top: 0,
                    left: 0,
                    lineHeight: '24px',
                    color: '#000',
                    fontSize: '12px',
                }}>
                    {`-`}
                </div>
            </div>
        </div>
    );
}