import React, {createContext} from 'react';

export const AppStateContext = createContext();

export const AppStateProvider = props => {

  const contextValue={price: {label: null, value: null}, term: null}

  return (
    <AppStateContext.Provider value={contextValue}>
      {props.children}
    </AppStateContext.Provider>
  );
};