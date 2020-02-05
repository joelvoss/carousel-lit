export interface CarouselProps {
  offset?: number;
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
