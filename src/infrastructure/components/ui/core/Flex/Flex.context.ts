import { createContext, useContext } from 'react';

interface IFlexContextValue {
  readonly parentTag: string | undefined;
}

const FlexContext = createContext<IFlexContextValue>({ parentTag: undefined });

const useFlexContext = (): IFlexContextValue => useContext(FlexContext);

export { FlexContext, useFlexContext };
export type { IFlexContextValue };
