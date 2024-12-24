import { useState, useEffect, useContext } from "react";
import "./App.css";
import { HandlerContext, HandlerContextProvider } from "./utils/HandlerContext";

function App() {
  const [statusMsg, setStatusMsg] = useState("");
  const { unitHandler } = useContext(HandlerContext);

  async function start_audio() {
    await unitHandler.startAudio();
  }

  async function stop_audio() {
    await unitHandler.stopAudio();
  }

  return (
    <HandlerContextProvider>
      <main className="container">
        <h1>FX Board</h1>
        <p className="row">
          <button type="button" onClick={start_audio}>Start</button>
          <button type="button" onClick={stop_audio}>Stop</button>
        </p>
        <p>{statusMsg}</p>
      </main>
    </HandlerContextProvider>
  );
}

export default App;
