/** @jsx jsx */
import * as React from 'react';
import { jsx, css } from '@emotion/core';
import rafSchd from 'raf-schd';
import smoothscroll from 'smoothscroll-polyfill';
import {
	ContextProvider,
	useDispatch,
	ActionType,
	useState,
	ReducerAction,
} from './context';
import {
	useResizeObserver,
	useLayoutEffect,
	getRangeToRender,
	getStartIndexForOffset,
} from './utils';

////////////////////////////////////////////////////////////////////////////////

if (typeof window !== 'undefined') {
	smoothscroll.polyfill();
}

////////////////////////////////////////////////////////////////////////////////

export type OnInitializePayload = {
	contentWidth: number;
	trackHeight: number;
};

export interface CarouselProps {
	startAt?: number;
	onInitialize?: (payload: OnInitializePayload) => void;
}

export interface Entry<T> {
	entry: T;
	index: number;
	first: boolean;
	last: boolean;
}

export interface TrackProps<T> {
	data: T[];
	children(entry: Entry<T>): React.ReactNode;
}

////////////////////////////////////////////////////////////////////////////////

const container = css`
	position: relative;
`;

export const Carousel: React.FC<CarouselProps> = ({
	children,
	startAt = 0,
	onInitialize,
}) => {
	const middleware = (action: ReducerAction) => {
		if (
			typeof onInitialize === 'function' &&
			action.type === ActionType.INITIALIZE
		) {
			onInitialize({
				contentWidth: action.payload.contentWidth || 0,
				trackHeight: action.payload.trackHeight || 0,
			});
		}
	};

	return (
		<ContextProvider
			initialState={{ offset: 0, startAt }}
			middleware={middleware}
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
		startAt,
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

			if (
				newItemSizeCache != null &&
				startAt != null &&
				newItemSizeCache[startAt] != null
			) {
				const scrollOffset = newItemSizeCache[startAt].offset;
				target.scroll({
					top: 0,
					left: scrollOffset,
					behavior: 'auto',
				});
			}

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
	}, [data.length, dispatch, entry, itemSizeCache, startAt, trackHeight]);

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

export const Previous: React.FC<any> = ({
	children,
	alwaysVisible = false,
	...rest
}) => {
	const { offset, scrollable, contentWidth, itemSizeCache } = useState();

	// Decide, if the component should be rendered.
	const [visible, setVisibility] = React.useState(true);
	React.useEffect(() => {
		if (alwaysVisible) {
			return setVisibility(true);
		}

		if (offset === 0) {
			setVisibility(false);
		} else {
			setVisibility(true);
		}
	}, [offset, alwaysVisible]);

	// Handle the onClick event of the <button> and scroll to the new offset
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

	if (visible) {
		return (
			<button css={button} onClick={scroll} {...rest}>
				{children}
			</button>
		);
	}
	return null;
};

////////////////////////////////////////////////////////////////////////////////

export const Next: React.FC<any> = ({
	children,
	alwaysVisible = false,
	...rest
}) => {
	const { scrollable, offset, contentWidth, itemSizeCache } = useState();

	// Decide, if the component should be rendered.
	const [visible, setVisibility] = React.useState(true);
	React.useEffect(() => {
		if (itemSizeCache != null && contentWidth != null) {
			const lastItemSize = itemSizeCache[itemSizeCache.length - 1];
			const endOffset = lastItemSize.offset + lastItemSize.size - contentWidth;

			if (alwaysVisible) {
				return setVisibility(true);
			}

			if (endOffset < 0 || (endOffset > 0 && offset === endOffset)) {
				setVisibility(false);
			} else {
				setVisibility(true);
			}
		}
	}, [offset, alwaysVisible, itemSizeCache, contentWidth]);

	// Handle the onClick event of the <button> and scroll to the new offset
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

	if (visible) {
		return (
			<button css={button} onClick={scroll} {...rest}>
				{children}
			</button>
		);
	}
	return null;
};
