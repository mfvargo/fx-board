import { useContext, useEffect, useState } from 'react';
import { HandlerContext } from '../contexts/HandlerContext';
import { SavedBoard, UnitModel } from '../models/UnitModel';
import LevelMeter from './LevelMeter/LevelMeter';
import DefaultBoards from '../assets/defaultBoards.json';
import BoardList from '@/components/BoardList/BoardList';

export default function BoardSet() {
	const [statusMsg, setStatusMsg] = useState('');
	const { unitHandler, boardStorage } = useContext(HandlerContext);
	const [leftLevel, setLeftLevel] = useState(
		unitHandler.updatedModel.inputLeft
	);
	const [rightLevel, setRightLevel] = useState(
		unitHandler.updatedModel.inputRight
	);
	const [outLeftLevel, setOutLeftLevel] = useState(
		unitHandler.updatedModel.outputLeft
	);
	const [outRightLevel, setOutRightLevel] = useState(
		unitHandler.updatedModel.outputRight
	);
	const [boards, setBoards] = useState<SavedBoard[]>([]);
	const sliderOrientation = 'vertical';
	//     const board = unitHandler.updatedModel.boardInfo.loadedBoards[0];
	//     const pedalOptions = unitHandler.updatedModel.boardInfo.pedalOptions;
	//     const [editMode, setEditMode] = useState<boolean>(false);
	//     const [boardName, setBoardName] = useState<string>("New Board");

	useEffect(() => {
		var storedBoards = boardStorage.getItems();
		if (!storedBoards) {
			// If not, use DefaultBoards and store
			DefaultBoards.map((b) => {
				var bd: SavedBoard = {
					boardId: b.id,
					name: b.name,
					channel: 0,
					pedals: b.config,
				};
				boardStorage.setItem(bd);
			});
		}
		storedBoards = boardStorage.getItems();
		setBoards(storedBoards);
	}, []);

	useEffect(() => {
		unitHandler.subscribe('levels', 'fx-board-app', distributeLevels);
		return () => {
			unitHandler.unsubscribe('levels', 'fx-board-app');
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
		await unitHandler.refreshPedalConfig();
	}

	async function stop_audio() {
		await unitHandler.stopAudio();
	}

	async function retrieve_boards() {
		await unitHandler.refreshPedalConfig();
	}

	// This will fetch a board from the cloud and push it to the unit (or erase the board)
	//   async function loadBoard(_boardId: number) {
	//     setEditMode(false);
	//   }

	async function savePedalsForLater() {
		await boardStorage.setItem({
			...unitHandler.updatedModel.boardInfo.loadedBoards[0],
			name: 'lefty',
		});
		await boardStorage.setItem({
			...unitHandler.updatedModel.boardInfo.loadedBoards[0],
			name: 'righty',
		});
	}

	return (
		<div>
			<h1>FX Board</h1>
			<p className="row">
				<button type="button" onClick={start_audio}>
					Start
				</button>
				<button type="button" onClick={stop_audio}>
					Stop
				</button>
				<button type="button" onClick={retrieve_boards}>
					Retrieve
				</button>
				<button type="button" onClick={load_board}>
					Guitar
				</button>
				<button type="button" onClick={savePedalsForLater}>
					Save
				</button>
			</p>
			<LevelMeter
				signal={leftLevel}
				orientation={sliderOrientation}
				size={'16rem'}
			/>
			<LevelMeter
				signal={outLeftLevel}
				orientation={sliderOrientation}
				size={'16rem'}
			/>
			<LevelMeter
				signal={rightLevel}
				orientation={sliderOrientation}
				size={'16rem'}
			/>
			<LevelMeter
				signal={outRightLevel}
				orientation={sliderOrientation}
				size={'16rem'}
			/>

			<BoardList boards={boards} />

			<div>
				{/* <Pedalboard
                    channel={0}
                    pedals={board.pedals}
                    pedalOptions={pedalOptions}
                    boardId={board.boardId}
                    program={1}
                    boardName={boardName}
                    editMode={editMode}
                    isMine={true}
                    setEditMode={setEditMode}
                    setBoardName={setBoardName}
                    saveFunc={savePedalsForLater}
                    loadBoard={loadBoard}
                /> */}
			</div>
			<p>{statusMsg}</p>
		</div>
	);
}
