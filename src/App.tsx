import { useState, useEffect } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [statusMsg, setStatusMsg] = useState("");
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [ev, setEv] = useState<Channel<string>>();

  async function start_me_up() {
    const chan = new Channel<string>();
    chan.onmessage = (message: any) => {
      setGreetMsg(JSON.stringify(message));
    }
    setEv(chan);
  }

  useEffect(() => {
    // on page load, start the unit
    start_me_up();
  }, []);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function start_audio() {
    setStatusMsg(await invoke("start", {
        onEvent: ev,
        inDev: "hw:PCH",
        outDev: "hw:PCH",
      }
    ));
  }

  async function stop_audio() {
    setStatusMsg(await invoke("stop", {}));
  }

  return (
    <main className="container">
      <h1>FX Board</h1>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p className="row">
        <button type="button" onClick={start_audio}>Start</button>
        <button type="button" onClick={stop_audio}>Stop</button>
      </p>
      <p>{statusMsg}</p>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
