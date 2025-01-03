import React, { createContext, ReactNode, useState } from "react";
import { UnitHandler } from "@/utils/unitHandler";
import { ItemsStorage as BoardStorage } from "@/utils/boardStorage";

type HandlerContextObj = {
  unitHandler: UnitHandler;
  boardStorage: BoardStorage;
};

const HandlerContext = createContext<HandlerContextObj>({
  unitHandler: UnitHandler.getInstance(),
  boardStorage: BoardStorage.getInstance(),
});

type HandlerContextProviderProps = {
  children: ReactNode;
};

const HandlerContextProvider: React.FC<HandlerContextProviderProps> = (props) => {
  const [unitHandler] = useState(UnitHandler.getInstance());
  const [boardStorage] = useState(BoardStorage.getInstance());

  const contextValue: HandlerContextObj = {
    unitHandler,
    boardStorage,
  };

  return <HandlerContext.Provider value={contextValue}>{props.children}</HandlerContext.Provider>;
};

export { HandlerContext, HandlerContextProvider };
export type { HandlerContextObj };
