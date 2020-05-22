import React from 'react';
import { ItemSizeCache } from './types';

export enum ActionType {
  SET_ENTRIES,
  INITIALIZE,
  UPDATE_OFFSET,
  FLUSH_ITEMS,
}

interface ReducerState {
  scrollable?: HTMLDivElement;
  itemSizeCache?: ItemSizeCache;
  trackWidth?: number;
  trackHeight?: number;
  contentWidth?: number;
  offset?: number;
  startAt?: number;
  entries?: any[];
  range?: [number, number];
}

export interface ReducerAction {
  type: ActionType;
  payload?: any;
}

type Middleware<T> = (action: T) => void;

////////////////////////////////////////////////////////////////////////////////

// React context for both state and dispatch
const StateContext = React.createContext<ReducerState>({});
const DispatchContext = React.createContext<React.Dispatch<ReducerAction>>(
  (_: ReducerAction) => {},
);

const reducer = (state: ReducerState, action: ReducerAction) => {
  switch (action.type) {
    case ActionType.SET_ENTRIES: {
      return {
        ...state,
        entries: action.payload,
      };
    }
    case ActionType.INITIALIZE: {
      return {
        ...state,
        ...action.payload,
      };
    }
    case ActionType.UPDATE_OFFSET: {
      return {
        ...state,
        offset: action.payload,
      };
    }
    case ActionType.FLUSH_ITEMS: {
      return {
        ...state,
        ...action.payload,
      };
    }
    default: {
      console.warn(`Unknown action type "${action.type}"`);
      return state;
    }
  }
};

////////////////////////////////////////////////////////////////////////////////

/**
 * <ContextProvider>
 * Wraps a given child with both state and dispatch context providers
 */
export const ContextProvider: React.FC<{
  initialState?: ReducerState;
  middleware?: Middleware<ReducerAction>;
}> = ({ initialState = {}, children, middleware }) => {
  const [state, dispatch] = React.useReducer<
    React.Reducer<ReducerState, ReducerAction>
  >(reducer, initialState);

  const enhancedDispatch = React.useCallback(
    (action: ReducerAction) => {
      dispatch(action);
      if (typeof middleware === 'function') {
        middleware(action);
      }
    },
    [middleware],
  );

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={enhancedDispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

////////////////////////////////////////////////////////////////////////////////

/**
 * useState exposes the current app state from context
 */
export function useState() {
  const context = React.useContext(StateContext);
  if (context === undefined) {
    throw new Error('useState must be used within a ContextProvider');
  }
  return context;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * useDispatch exposes the current dispatch function from context
 */
export function useDispatch() {
  const context = React.useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useDispatch must be used within a ContextProvider');
  }
  return context;
}
