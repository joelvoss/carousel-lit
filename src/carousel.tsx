/** @jsx jsx */
import React from 'react';
import { jsx, css } from '@emotion/core';
import rafSchd from 'raf-schd';
import smoothscroll from 'smoothscroll-polyfill';
import { ContextProvider, useDispatch, ActionType, useState } from './context';
import { CarouselProps, TrackProps } from './types';
import {
  useResizeObserver,
  useLayoutEffect,
  getRangeToRender,
  getStartIndexForOffset,
} from './utils';

if (typeof window !== 'undefined') {
  smoothscroll.polyfill();
}

////////////////////////////////////////////////////////////////////////////////

const container = css`
  position: relative;
`;

export const Carousel: React.FC<CarouselProps> = ({ children, offset = 0 }) => {
  return (
    <ContextProvider
      initialState={{
        offset,
      }}
    >
      <div css={container}>{children}</div>
    </ContextProvider>
  );
};

////////////////////////////////////////////////////////////////////////////////

const trackOuter = css`
  position: relative;
  width: 100%;
  overflow: hidden;
  overflow-x: scroll;
  will-change: transform;
  -webkit-overflow-scrolling: touch;
  /* Disable scroll bars */
  scrollbar-width: none;
  -ms-overflow-style: none;
  ::-webkit-scrollbar {
    width: 0px;
    height: 0px;
    background: transparent;
  }
`;

const trackInner = css`
  width: 100%;
  white-space: nowrap;
  overflow-x: auto;
  display: flex;
  flex-direction: row;
  /* Disable scroll bars */
  scrollbar-width: none;
  -ms-overflow-style: none;
  ::-webkit-scrollbar {
    width: 0px;
    height: 0px;
    background: transparent;
  }
`;

export function Track<T>({
  data,
  children,
}: React.PropsWithChildren<TrackProps<T>>) {
  const dispatch = useDispatch();
  const {
    itemSizeCache,
    trackWidth,
    contentWidth,
    trackHeight,
    offset,
    entries,
    range,
  } = useState();

  useLayoutEffect(() => {
    if (data.length > 0) {
      dispatch({ type: ActionType.SET_ENTRIES, payload: data });
    }
  }, [data, dispatch]);

  // As soon as our CarouselTrack is rendered, measure all relevant elements
  // and initialize the carousel state.
  const [entry, ref] = useResizeObserver();
  useLayoutEffect(() => {
    if (entry) {
      const { target, contentRect } = entry;
      const track = target.firstChild as HTMLDivElement;
      const contentWidth = contentRect.width;

      let offset = 0;
      let newTrackHeight = trackHeight || 0;
      let newItemSizeCache = itemSizeCache || [];
      for (let i = 0; i < data.length; i++) {
        // If we already have a cached version, use it.
        // TODO: Do we need some kinde of cache invalidation?
        if (newItemSizeCache[i] != null) {
          offset = newItemSizeCache[i].offset + newItemSizeCache[i].size;
          continue;
        }

        const element = track.children[i] as HTMLElement;
        if (element != null) {
          const { width, height } = element.getBoundingClientRect();
          newItemSizeCache[i] = { size: width, offset };
          offset += width;
          newTrackHeight = newTrackHeight < height ? height : newTrackHeight;
        }
      }

      const trackWidth = offset;

      dispatch({
        type: ActionType.INITIALIZE,
        payload: {
          itemSizeCache: newItemSizeCache,
          trackWidth,
          contentWidth,
          trackHeight: newTrackHeight,
          scrollable: target,
        },
      });
    }
  }, [data.length, dispatch, entry, itemSizeCache, trackHeight]);

  const setScrollOffset = rafSchd((clientWidth, scrollLeft, scrollWidth) => {
    // Prevent Safari's elastic scrolling from causing visual shaking when
    // scrolling past bounds.
    const scrollOffset = Math.max(
      0,
      Math.min(scrollLeft, scrollWidth - clientWidth),
    );
    dispatch({ type: ActionType.UPDATE_OFFSET, payload: scrollOffset });
  });

  /**
   * onScroll updates the current scroll offset position and forces a re-render
   */
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { clientWidth, scrollLeft, scrollWidth } = event.currentTarget;
    // raf-scheduled function call
    setScrollOffset(clientWidth, scrollLeft, scrollWidth);
  };

  useLayoutEffect(() => {
    if (offset != null && contentWidth && itemSizeCache) {
      const [startIndex, stopIndex] = getRangeToRender(
        itemSizeCache,
        offset,
        contentWidth,
      );

      const entries = [];
      if (itemSizeCache.length > 0) {
        for (let index = startIndex; index <= stopIndex; index++) {
          entries.push(data[index]);
        }
      }

      dispatch({
        type: ActionType.FLUSH_ITEMS,
        payload: {
          entries,
          range: [startIndex, stopIndex],
        },
      });
    }
  }, [offset, contentWidth, itemSizeCache, dispatch, data]);

  return (
    <div css={trackOuter} ref={ref} onScroll={onScroll}>
      <div
        css={trackInner}
        style={
          trackWidth && trackHeight
            ? // ? { width: `${trackWidth}%`, height: trackHeight }
              { width: trackWidth, height: trackHeight }
            : {}
        }
      >
        {entries &&
          entries.map((entry, i) => {
            const _range = range || [0, 0];
            const index = _range[0] + i;
            const first = index === 0;
            const last = index === _range[1] - 1;
            return (
              <div
                key={index}
                style={
                  contentWidth && itemSizeCache
                    ? {
                        position: 'absolute',
                        left: itemSizeCache[index].offset,
                      }
                    : { position: 'relative' }
                }
              >
                {children({ entry, index, first, last })}
              </div>
            );
          })}
      </div>
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////

const button = css`
  display: block;
  appearance: none;
  background: none;
  border: none;
  margin: 0;
  padding: 0;
`;

export const Previous: React.FC<any> = ({ children, ...rest }) => {
  const { offset, scrollable, contentWidth, itemSizeCache } = useState();

  const scroll = () => {
    if (
      !(scrollable && offset !== undefined && contentWidth && itemSizeCache)
    ) {
      return;
    }

    const lastItemIndex = getStartIndexForOffset(
      itemSizeCache,
      offset - contentWidth,
    );
    const lastOffset = itemSizeCache[lastItemIndex].offset;

    // This requires the a smoothscroll-polyfill
    // @see https://github.com/iamdustan/smoothscroll
    scrollable.scroll({
      top: 0,
      left: lastOffset,
      behavior: 'smooth',
    });
  };
  return (
    <button css={button} onClick={scroll} {...rest}>
      {children}
    </button>
  );
};

////////////////////////////////////////////////////////////////////////////////

export const Next: React.FC<any> = ({ children, ...rest }) => {
  const { scrollable, offset, contentWidth, itemSizeCache } = useState();

  const scroll = () => {
    if (
      !(scrollable && offset !== undefined && contentWidth && itemSizeCache)
    ) {
      return;
    }

    const lastItemIndex = getStartIndexForOffset(
      itemSizeCache,
      offset + contentWidth,
    );
    const lastOffset = itemSizeCache[lastItemIndex].offset;

    // This requires the a smoothscroll-polyfill
    // @see https://github.com/iamdustan/smoothscroll
    scrollable.scroll({
      top: 0,
      left: lastOffset,
      behavior: 'smooth',
    });
  };
  return (
    <button css={button} onClick={scroll} {...rest}>
      {children}
    </button>
  );
};
