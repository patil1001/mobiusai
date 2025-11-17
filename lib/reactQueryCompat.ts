import {
  useQuery as baseUseQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'

type LegacyUseQueryArgs<TData, TError> =
  | [UseQueryOptions<TData, TError>]
  | [QueryKey, UseQueryOptions<TData, TError>['queryFn']]
  | [QueryKey, UseQueryOptions<TData, TError>['queryFn'], UseQueryOptions<TData, TError>]

function normalizeQueryArgs<TData, TError>(
  args: LegacyUseQueryArgs<TData, TError>
): UseQueryOptions<TData, TError> {
  if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    return args[0]
  }

  const [queryKey, queryFnOrOptions, maybeOptions] = args
  const options: UseQueryOptions<TData, TError> = {
    queryKey: queryKey as QueryKey,
  }

  if (typeof queryFnOrOptions === 'function') {
    options.queryFn = queryFnOrOptions
    if (maybeOptions && typeof maybeOptions === 'object') {
      Object.assign(options, maybeOptions)
    }
  } else if (queryFnOrOptions && typeof queryFnOrOptions === 'object') {
    Object.assign(options, queryFnOrOptions)
  }

  return options
}

export function useQuery<TData = unknown, TError = unknown>(
  ...args: LegacyUseQueryArgs<TData, TError>
): UseQueryResult<TData, TError> {
  if (!args.length) {
    throw new Error('useQuery requires at least a queryKey or options object')
  }

  const normalized = normalizeQueryArgs(args)
  return baseUseQuery<TData, TError>(normalized)
}

export type {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'

