import React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { ItemSizeCache } from './types';

export function getRangeToRender(
  itemSizeCache: ItemSizeCache,
  scrollOffset: number,
  contentSize: number,
) {
  const itemCount = itemSizeCache.length;

  if (itemCount === 0) {
    return [0, 0, 0, 0];
  }

  const startIndex = getStartIndexForOffset(itemSizeCache, scrollOffset);
  const stopIndex = getStopIndexForStartIndex(
    itemSizeCache,
    startIndex,
    scrollOffset,
    contentSize,
  );

  // Overscan by one item in each direction so that tab/focus works.
  // If there isn't at least one extra item, tab loops back around.
  const overscan = 1;

  return [
    Math.max(0, startIndex - overscan),
    Math.max(0, Math.min(itemCount - 1, stopIndex + overscan)),
    startIndex,
    stopIndex,
  ];
}

/**
 * getStartIndexForOffset binary searches in our list of measurements
 * for the nearest item index for a given scroll offset.
 */
export function getStartIndexForOffset(
  itemSizeCache: ItemSizeCache,
  offset: number,
) {
  let low = 0;
  let high = itemSizeCache.length - 1;

  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = itemSizeCache[middle].offset;

    if (currentOffset === offset) {
      return middle;
    } else if (currentOffset < offset) {
      low = middle + 1;
    } else if (currentOffset > offset) {
      high = middle - 1;
    }
  }

  if (low > 0) {
    return low - 1;
  } else {
    return 0;
  }
}

export function getStopIndexForStartIndex(
  itemSizeCache: ItemSizeCache,
  startIndex: number,
  scrollOffset: number,
  contentWidth: number,
) {
  const itemCount = itemSizeCache.length;
  const itemMetadata = itemSizeCache[startIndex];
  const maxOffset = scrollOffset + contentWidth;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < itemCount - 1 && offset < maxOffset) {
    stopIndex++;
    offset += itemSizeCache[stopIndex].size;
  }

  return stopIndex;
}

export const useResizeObserver = (): [
  ResizeObserverEntry | undefined,
  React.Dispatch<any>,
] => {
  const [entry, setEntry] = React.useState<ResizeObserverEntry>();
  const [node, setNode] = React.useState();
  const observer = React.useRef<ResizeObserver>();

  const disconnect = React.useCallback(() => {
    const { current } = observer;
    current && current.disconnect();
  }, []);

  const observe = React.useCallback(() => {
    observer.current = new ResizeObserver(([entry]) => setEntry(entry));
    node && observer.current.observe(node);
  }, [node]);

  useLayoutEffect(() => {
    observe();
    return () => disconnect();
  }, [disconnect, observe]);

  return [entry, setNode];
};

export const useLayoutEffect =
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
    ? React.useLayoutEffect
    : React.useEffect;

export const usePrevious = (value: any) => {
  const ref = React.useRef();
  // Store current value in ref
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};
