import {isoDateFromTimestamp} from '@/portainer/filters/filters';

import {columnHelper} from './helper';

export const created = columnHelper.accessor(
    (row) => isoDateFromTimestamp(row.Created),
    {
        header: 'Status',
        id: 'created',
        cell: ({row}) => row.original.StatusText,
    }
);
