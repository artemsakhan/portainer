import {isoDateFromTimestamp} from '@/portainer/filters/filters';

import {columnHelper} from './helper';

export const cpuUsage = columnHelper.accessor(
    (row) => isoDateFromTimestamp(row.Created),
    {
        header: 'CPU',
        id: 'cpu-usage',
        cell: ({row}) => createCPUUsageBar(row.original.Stats.cpu_stats, row.original.Stats.precpu_stats) || '-',
    }
);

function calculateCpuUsage(cpuStats, prevCpuStats) {
    const cpuUsage = cpuStats.cpu_usage.total_usage;
    const prevCpuUsage = prevCpuStats.cpu_usage.total_usage;
    const systemCpuUsage = cpuStats.system_cpu_usage;
    const prevSystemCpuUsage = prevCpuStats.system_cpu_usage;
    const onlineCpus = cpuStats.online_cpus;

    // Calculate CPU usage percentage
    return ((cpuUsage - prevCpuUsage) / (systemCpuUsage - prevSystemCpuUsage)) * onlineCpus * 100;
}

function createCPUUsageBar(cpuStats, prevCpuStats) {
    if (!cpuStats.cpu_usage.total_usage) {
        return '-'
    }

    const cpuUsage = calculateCpuUsage(cpuStats, prevCpuStats).toFixed(1)

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
                    width: `${cpuUsage}%`,
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
                    {`${cpuUsage}%`}
                </div>
            </div>
        </div>
    );
}