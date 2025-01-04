import { SavedBoard } from "@/models/UnitModel";

interface BoardListProps {
	boards: SavedBoard[];
}

export default function BoardList({ boards }: BoardListProps) {
	return (
		<ul>
			{boards.map((board) => {
				return (
					<li key={board.boardId}>
						{board.boardId} - {board.name}
					</li>
				);
			})}
		</ul>
	);
}
