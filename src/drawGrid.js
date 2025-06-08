const drawGrid = (
	DIM = 0,
	grid = [],
	tiles = [],
	regularMapTilesIndex = 0,
	x = 0,
	y = 0
) => {
	if (!tiles || !regularMapTilesIndex) {
		// 🔥 Проверка на загрузку
		console.error("🔥 Проверка на загрузку");
		return;
	}
	const wCell = 16;
	const hCell = 16;
	for (let j = 0; j < DIM; j++) {
		for (let i = 0; i < DIM; i++) {
			const index = i + j * DIM;
			const cell = grid[index];
			if (cell.error) {
				// fill(255, 0, 0); // Красный цвет для ошибок
				// // image(tiles[[...regularMapTilesIndex][0]], i * wCell, j * hCell, wCell, hCell);
				// rect(i * wCell * DIM * x, j * hCell * DIM * y, wCell, hCell);
				// fill(255); // Белый цвет текста
				// textSize(wCell * 0.5); // Размер текста (адаптивный)
				// textAlign(CENTER, CENTER);
				// text("error");
			} else if (cell.collapsed) {
				image(
					tiles[cell.options[0]],
					i * wCell + wCell * DIM * x,
					j * hCell + hCell * DIM * y,
					wCell,
					hCell
				);
			} else {
				const grayValue = map(
					cell.options.length,
					1,
					[...regularMapTilesIndex].length,
					100,
					20
				);
				fill(grayValue);
				// stroke(255);
				rect(
					i * wCell + wCell * DIM * x,
					j * hCell + hCell * DIM * y,
					wCell,
					hCell
				);
				fill(255 - grayValue); // Белый цвет текста
				textSize(wCell * 0.5); // Размер текста (адаптивный)
				textAlign(CENTER, CENTER);
				text(
					cell.options.length,
					i * wCell + wCell * DIM * x + wCell / 2,
					j * hCell + hCell * DIM * y + hCell / 2
				);
			}
		}
	}
};
export default drawGrid;
