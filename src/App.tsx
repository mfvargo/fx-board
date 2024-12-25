import "./App.css";
import { HandlerContextProvider } from "./utils/HandlerContext";
import BoardSet from "./components/BoardSet";

function App() {
  return (
    <HandlerContextProvider>
      <main className="container">
        <BoardSet/>
      </main>
    </HandlerContextProvider>
  );
}

export default App;
