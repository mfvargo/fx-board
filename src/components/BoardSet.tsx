import { useContext, useEffect, useState } from "react";
import { HandlerContext } from "../utils/HandlerContext";
import { UnitModel } from "../utils/UnitModel";

export default function BoardSet() {

    const [statusMsg, setStatusMsg] = useState("");
    const { unitHandler } = useContext(HandlerContext);
  
    useEffect(() => {
      unitHandler.subscribe("levels", "fx-board-app",  distributeLevels);
      return () => {
        unitHandler.unsubscribe("levels", "fx-board-app");
      };
  
    }, []);

    function callback(msg: any) {
        unitHandler.processMessage(msg);
    }

    async function distributeLevels(model: UnitModel) {
        setStatusMsg(`Levels: ${model.inputLeft.level}`);
    }
    
    async function start_audio() {
        await unitHandler.startAudio(callback);
    }
    
    async function stop_audio() {
        await unitHandler.stopAudio();
    }

    async function retrieve_boards() {
        await unitHandler.refreshPedalConfig();
    }

   
    return (
        <div>
            <h1>FX Board</h1>
            <p className="row">
            <button type="button" onClick={start_audio}>Start</button>
            <button type="button" onClick={stop_audio}>Stop</button>
            <button type="button" onClick={retrieve_boards}>Retrieve</button>
            </p>
            <p>{statusMsg}</p>
        </div>
    )
}