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

export type ItemSizeCache = {
  size: number;
  offset: number;
}[];
