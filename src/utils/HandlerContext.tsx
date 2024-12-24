import React, { createContext, ReactNode, useState } from "react";
import { UnitHandler } from "././unitHandler";

type HandlerContextObj = {
  unitHandler: UnitHandler;
};

const HandlerContext = createContext<HandlerContextObj>({
  unitHandler: new UnitHandler(),
});

type HandlerContextProviderProps = {
  children: ReactNode;
};

const HandlerContextProvider: React.FC<HandlerContextProviderProps> = (props) => {
  const [unitHandler] = useState(new UnitHandler());

  const contextValue: HandlerContextObj = {
    unitHandler,
  };

  return <HandlerContext.Provider value={contextValue}>{props.children}</HandlerContext.Provider>;
};

export { HandlerContext, HandlerContextProvider };
export type { HandlerContextObj };
