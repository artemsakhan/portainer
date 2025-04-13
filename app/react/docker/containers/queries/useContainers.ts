import {useQuery} from '@tanstack/react-query';

import {EnvironmentId} from '@/react/portainer/environments/types';
import axios, {parseAxiosError} from '@/portainer/services/axios';
import {withGlobalError} from '@/react-tools/react-query';

import {DockerContainerResponse} from '../types/response';
import {toListViewModel} from '../utils';
import {ContainerListViewModel} from '../types';
import {buildDockerProxyUrl} from '../../proxy/queries/buildDockerProxyUrl';
import {withAgentTargetHeader, withFiltersQueryParam,} from '../../proxy/queries/utils';

import {Filters} from './types';
import {queryKeys} from './query-keys';
import {inspectContainer} from "@/react/docker/containers/queries/useContainerInspect";
import moment from "moment";
import {containerStats} from "@/react/docker/containers/queries/useContainerStats";

interface UseContainers {
    all?: boolean;
    filters?: Filters;
    nodeName?: string;
}

export function useContainers<T = ContainerListViewModel[]>(
    environmentId: EnvironmentId,
    {
        autoRefreshRate,
        select,
        enabled,
        ...params
    }: UseContainers & {
        autoRefreshRate?: number;
        select?: (data: ContainerListViewModel[]) => T;
        enabled?: boolean;
    } = {}
) {
    return useQuery(
        queryKeys.filters(environmentId, params),
        () => getContainers(environmentId, params),
        {
            ...withGlobalError('Unable to retrieve containers'),
            refetchInterval: autoRefreshRate ?? false,
            select,
            enabled,
        }
    );
}

export function useContainersWithStats<T = ContainerListViewModel[]>(
    environmentId: EnvironmentId,
    {
        autoRefreshRate,
        select,
        enabled,
        ...params
    }: UseContainers & {
        autoRefreshRate?: number;
        select?: (data: ContainerListViewModel[]) => T;
        enabled?: boolean;
    } = {}
) {
    return useQuery(
        queryKeys.filters(environmentId, params),
        () => getContainersWithStats(environmentId, params),
        {
            ...withGlobalError('Unable to retrieve containers'),
            refetchInterval: autoRefreshRate ?? false,
            select,
            enabled,
        }
    );
}


/**
 * Fetch containers and transform to ContainerListViewModel
 * @param environmentId
 * @param param1
 * @returns ContainerListViewModel[]
 */
export async function getContainers(
    environmentId: EnvironmentId,
    {all = true, filters, nodeName}: UseContainers = {}
) {
    try {
        const {data} = await axios.get<DockerContainerResponse[]>(
            buildDockerProxyUrl(environmentId, 'containers', 'json'),
            {
                params: {all, ...withFiltersQueryParam(filters)},
                headers: {...withAgentTargetHeader(nodeName)},
            }
        );
        return data.map((c) => toListViewModel(c));
    } catch (error) {
        throw parseAxiosError(error as Error, 'Unable to retrieve containers');
    }
}

export async function getContainersWithStats(
    environmentId: EnvironmentId,
    {all = true, filters, nodeName}: UseContainers = {}
) {
    try {
        const {data} = await axios.get<DockerContainerResponse[]>(
            buildDockerProxyUrl(environmentId, 'containers', 'json'),
            {
                params: {all, ...withFiltersQueryParam(filters)},
                headers: {...withAgentTargetHeader(nodeName)},
            }
        );

        const containers = data.map((c) => toListViewModel(c));

        const inspectResults = await Promise.all(
            containers.map(async (container) => {
                try {
                    const stats = await containerStats(environmentId, container.Id, {nodeName});
                    return {id: container.Id, stats};
                } catch (err) {
                    console.warn(`Failed to inspect container ${container.Id}`, err);
                    return {id: container.Id, inspect: null};
                }
            })
        );

        // Merge inspect data into containers
        return containers.map((container) => {
            const stats = inspectResults.find((r) => r.id === container.Id)?.stats;

            return {
                ...container,
                Stats: stats,
            };
        });
    } catch (error) {
        throw parseAxiosError(error as Error, 'Unable to retrieve containers with inspect info');
    }
}
