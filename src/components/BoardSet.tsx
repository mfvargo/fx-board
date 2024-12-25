import { useContext, useEffect, useState } from "react";
import { HandlerContext } from "../utils/HandlerContext";
import { UnitModel } from "../utils/UnitModel";
import LevelMeter from "./LevelMeter/LevelMeter";
import Guitar from "../assets/guitar.json";
import Vocals from "../assets/vocals.json"

export default function BoardSet() {

    const [statusMsg, setStatusMsg] = useState("");
    const { unitHandler } = useContext(HandlerContext);
    const [leftLevel, setLeftLevel] = useState(unitHandler.updatedModel.inputLeft);
    const [rightLevel, setRightLevel] = useState(unitHandler.updatedModel.inputRight);
    const [outLeftLevel, setOutLeftLevel] = useState(unitHandler.updatedModel.outputLeft);
    const [outRightLevel, setOutRightLevel] = useState(unitHandler.updatedModel.outputRight);
    const sliderOrientation = "vertical"
  
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
        setStatusMsg(`Levels: ${JSON.stringify(model)}`);
        setLeftLevel(model.inputLeft);
        setRightLevel(model.inputRight);
        setOutLeftLevel(model.outputLeft);
        setOutRightLevel(model.outputRight);
    }
    
    async function start_audio() {
        await unitHandler.startAudio(callback);
    }

    async function load_board() {
        await unitHandler.loadBoardFromConfig(0, Vocals);
        await unitHandler.loadBoardFromConfig(1, Guitar);
        await unitHandler.refreshPedalConfig();
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
            <button type="button" onClick={load_board}>Guitar</button>
            </p>
            <LevelMeter
                signal={leftLevel}
                orientation={sliderOrientation}
                size={"16rem"}
            />
            <LevelMeter
                signal={outLeftLevel}
                orientation={sliderOrientation}
                size={"16rem"}
            />
            <LevelMeter
                signal={rightLevel}
                orientation={sliderOrientation}
                size={"16rem"}
            />
            <LevelMeter
                signal={outRightLevel}
                orientation={sliderOrientation}
                size={"16rem"}
            />
            <p>{statusMsg}</p>

        </div>
    )
}