import './App.css';
import { HandlerContextProvider } from './contexts/HandlerContext';
import BoardSet from './components/BoardSet';
import '@/css/styles.scss';

function App() {
	return (
		<HandlerContextProvider>
			<main className="container">
				<BoardSet />
			</main>
		</HandlerContextProvider>
	);
}

export default App;
