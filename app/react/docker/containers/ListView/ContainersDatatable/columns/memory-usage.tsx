import {isoDateFromTimestamp} from '@/portainer/filters/filters';

import {columnHelper} from './helper';

export const memoryUsage = columnHelper.accessor(
    (row) => isoDateFromTimestamp(row.Created),
    {
        header: 'Mem',
        id: 'resource-usage',
        cell: ({row}) => (row.original.Stats && createMemoryUsageBar(row.original.Stats.memory_stats.usage, row.original.Stats.memory_stats.limit) || createEmptyMemBar()) || createEmptyMemBar(),
    }
);

function createMemoryUsageBar(usage, limit) {
    if (!usage && !limit) {
        return null
    }
    const percent = limit === 0 ? 0 : (usage / limit) * 100;
    const percentDisplay = percent.toFixed(1);

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
                    width: `${percent}%`,
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
                    {`${percentDisplay}%`}
                </div>
            </div>
        </div>
    );
}

function createEmptyMemBar() {
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