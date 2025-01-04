interface BoardListProps {
	boards: any;
}

export default function BoardList({ boards }: BoardListProps) {
	return (
		<ul>
			{boards.map((board) => {
				return (
					<li key={board.id}>
						{board.id} - {board.name}
					</li>
				);
			})}
		</ul>
	);
}
