import { createContext, useContext } from 'react';

/** true once the first-load preloader has finished */
export const ReadyContext = createContext(false);
export const useReady = () => useContext(ReadyContext);
