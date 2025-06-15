import "../css/style.css";
import { sketch } from "p5js-wrapper";
import imgTileset from "./img/6_6.png";
import regularMap from "./regularMap.json";
import makeRules from "./makeRules";
import drawGrid from "./drawGrid";
const tiles = [];
let tileset;
const tileSize = regularMap.tileheight;
let grid = [];
let chunks = [];
const DIM = 8; // размер сетки
const regionSize = 5;
const canvasSize = DIM * tileSize * regionSize;
let isPaused = false;
let collapseSpeed = 120; // Коллапсируем 5 ячеек в секунду
let defaultMap = regularMap.layers[0].data.map((item) => item - 1);
// defaultMap = [1, 2, 2, 1];
const [rules, regularMapTilesIndex] = makeRules(defaultMap);
const checkValid = (arr, valid) => {
	for (let i = arr.length - 1; i >= 0; i--) {
		// если в массиве arr содержится что то чего нет в массиве valid, то это вырезается из массива arr
		if (!valid.includes(arr[i])) arr.splice(i, 1);
	}
};
const filterValid = (arr, valid) => {
	return arr.filter((item) => valid.includes(item));
};
let previousGridState = [];

const saveGridState = () => {
	previousGridState = grid.map((cell) => ({
		collapsed: cell.collapsed,
		options: [...cell.options],
		error: cell.error,
	}));
};
const restoreGridState = () => {
	grid = previousGridState.map((cell) => ({
		collapsed: cell.collapsed,
		options: [...cell.options],
		error: cell.error,
	}));
};
sketch.preload = () => {
	tileset = loadImage(imgTileset);
};

sketch.setup = () => {
	createCanvas(canvasSize, canvasSize);
	const tilesPerRow = tileset.width / tileSize;
	const tilesPerCol = tileset.height / tileSize;

	for (let y = 0; y < tilesPerCol; y++) {
		for (let x = 0; x < tilesPerRow; x++) {
			const tile = tileset.get(x * tileSize, y * tileSize, tileSize, tileSize);
			tiles.push(tile);
		}
	}
	frameRate(collapseSpeed); // Устанавливаем частоту кадров
	resetGrid();
};

const resetGrid = () => {
	grid = [];
	for (let i = 0; i < DIM * DIM; i++) {
		grid[i] = {
			collapsed: false,
			options: [...regularMapTilesIndex],
		};
	}
};
const getRightEdgeFromLastChunk = () => {
	if (chunks.length === 0) return null;
	const lastChunk = chunks[chunks.length - 1];
	const rightEdge = [];
	for (let y = 0; y < DIM; y++) {
		const index = DIM - 1 + y * DIM; // Индексы правого края
		rightEdge.push(lastChunk[index].options[0]);
	}
	return rightEdge;
};
const getBottomEdgeFromUpperChunk = () => {
	if (chunks.length < regionSize) return null; // Нет чанка сверху

	const upperChunkIndex = chunks.length - regionSize;
	if (upperChunkIndex < 0) return null;

	const upperChunk = chunks[upperChunkIndex];
	const bottomEdge = [];

	for (let x = 0; x < DIM; x++) {
		const index = x + (DIM - 1) * DIM; // Индексы нижнего края верхнего чанка
		bottomEdge.push(upperChunk[index].options[0]);
	}

	return bottomEdge;
};
sketch.mousePressed = () => {
	// restoreGridState();
	isPaused = !isPaused;
};

const isGridFullyCollapsed = () => {
	return grid.every((cell) => cell.collapsed); // если все ячейки сколлапсированы
};

const collapseNextCell = () => {
	saveGridState(); // Сохраняем текущее состояние перед коллапсом
	// Находим ячейки с минимальной энтропией (наименьшим количеством вариантов)
	const uncollapsedCells = grid.filter((cell) => !cell.collapsed); // убираем все ячейки где collapsed == true
	if (uncollapsedCells.length === 0) return;
	// let firstCell = uncollapsedCells[0];
	// firstCell.collapsed = true;
	// firstCell.options = [random(firstCell.options)];
	uncollapsedCells.sort((a, b) => a.options.length - b.options.length); // сортируем ячейки по энтропии
	const minEntropy = uncollapsedCells[0].options.length; // пусть по умолчанию минимальная энтропия у первой ячейки
	const candidates = uncollapsedCells.filter((cell) => cell.options.length === minEntropy);

	// Выбираем случайную ячейку из кандидатов и коллапсируем её
	const cell = random(candidates);

	// const cell = uncollapsedCells[candidates.length - 1];
	cell.collapsed = true;
	cell.options = [random(cell.options)];
};
let errorCount = 0;
let errors = 0;
const updateNeighbors = () => {
	const rightEdgeOfLastChunk = getRightEdgeFromLastChunk();
	const bottomEdgeOfUpperChunk = getBottomEdgeFromUpperChunk();
	const currentRow = Math.floor(chunks.length / regionSize);

	for (let j = 0; j < DIM; j++) {
		for (let i = 0; i < DIM; i++) {
			let index = i + j * DIM;
			const cell = grid[index];
			if (cell.collapsed) continue;
			cell.error = false;
			// Сохраняем оригинальные опции на случай ошибки
			const originalOptions = [...cell.options];
			// let options = [...cell.options]; // Копируем текущие варианты
			let options = [...regularMapTilesIndex]; // Начинаем с полного набора

			// Проверяем соседей
			if (i > 0) {
				// Левый сосед
				const leftCell = grid[i - 1 + j * DIM];
				const valid = leftCell.options?.flatMap((opt) => rules[opt][1]); // RIGHT rule
				// checkValid(options, valid);
				options = filterValid(options, valid);
			} else if (rightEdgeOfLastChunk) {
				// Если это левый край и есть предыдущий чанк - используем его правый край
				const valid = rules[rightEdgeOfLastChunk[j]][1]; // RIGHT rule для тайла из предыдущего чанка
				// checkValid(options, valid);
				options = filterValid(options, valid);
			}
			if (j > 0) {
				// Верхний сосед
				const upCell = grid[i + (j - 1) * DIM];
				const valid = upCell.options.flatMap((opt) => rules[opt][2]); // DOWN rule
				// checkValid(options, valid);
				options = filterValid(options, valid);
			} else if (currentRow > 0 && bottomEdgeOfUpperChunk) {
				// Если это верхний край и есть чанк сверху - используем его нижний край
				const valid = rules[bottomEdgeOfUpperChunk[i]][2]; // DOWN rule для тайла из верхнего чанка
				// checkValid(options, valid);
				options = filterValid(options, valid);
			}

			if (j < DIM - 1) {
				// Нижний сосед
				const downCell = grid[i + (j + 1) * DIM];
				const valid = downCell.options.flatMap((opt) => rules[opt][0]); // UP rule
				// checkValid(options, valid);
				options = filterValid(options, valid);
			}
			if (i < DIM - 1) {
				// Правый сосед
				const rightCell = grid[i + 1 + j * DIM];
				const valid = rightCell.options.flatMap((opt) => rules[opt][3]); // LEFT rule
				// const valid = rightCell.options.flatMap((opt) => console.log(opt));
				// checkValid(options, valid);
				options = filterValid(options, valid);
			}

			if (options.length === 0) {
				if (i <= 1 || j <= 1) {
					cell.error = true;
					cell.collapsed = false;
					cell.options = originalOptions;
				} else {
					restoreGridState();
					resetGrid();
					cell.options = originalOptions;
					cell.error = false;
				}
			} else {
				cell.options = options;
				// return;
				cell.error = false;
			}
		}
	}
};
const drawAllChunks = () => {
	const chunksPerRow = regionSize;
	const chunkWidth = DIM * tileSize;
	const chunkHeight = DIM * tileSize;

	for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
		const chunk = chunks[chunkIndex];
		const row = Math.floor(chunkIndex / chunksPerRow);
		const col = chunkIndex % chunksPerRow;

		push();
		translate(col * chunkWidth, row * chunkHeight);
		drawGrid(DIM, chunk, tiles, regularMapTilesIndex);
		pop();
	}
};
sketch.draw = () => {
	background(100);
	noSmooth();
	drawAllChunks();

	// Вычисляем позицию для текущей сетки (grid)
	const chunksPerRow = regionSize;
	const chunksInLastRow = chunks.length % chunksPerRow;
	const currentRow = Math.floor(chunks.length / chunksPerRow);

	// Отрисовываем текущую сетку справа от последнего чанка в строке
	// или с новой строки, если текущая строка заполнена
	push();
	if (chunksInLastRow === 0 && chunks.length > 0) {
		// Новая строка
		translate(0, currentRow * DIM * tileSize);
	} else {
		// Текущая строка
		translate(chunksInLastRow * DIM * tileSize, currentRow * DIM * tileSize);
	}
	drawGrid(DIM, grid, tiles, regularMapTilesIndex);
	pop();

	// Если сетка уже полностью коллапсирована — перезапускаем
	if (isGridFullyCollapsed()) {
		chunks.push([...grid]);
		console.log(chunks);
		resetGrid();
		return;
	}

	// Коллапсируем следующую ячейку (если не на паузе)
	if (!isPaused) {
		collapseNextCell();

		updateNeighbors();
	}
};
