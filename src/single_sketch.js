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
const DIM = 16; // размер сетки
const regionSize = 5;
const canvasSize = DIM * tileSize * regionSize;
let isPaused = false;
let collapseSpeed = 120; // Коллапсируем 5 ячеек в секунду
const defaultMap = regularMap.layers[0].data.map((item) => item - 1);
const [rules, regularMapTilesIndex] = makeRules(defaultMap);
const checkValid = (arr, valid) => {
	for (let i = arr.length - 1; i >= 0; i--) {
		// если в массиве arr содержится что то чего нет в массиве valid, то это вырезается из массива arr
		if (!valid.includes(arr[i])) arr.splice(i, 1);
	}
};
let previousGridState = [];
let errorCount = 0;

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
			const tile = tileset.get(
				x * tileSize,
				y * tileSize,
				tileSize,
				tileSize
			);
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

sketch.mousePressed = () => {
	restoreGridState();
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

	uncollapsedCells.sort((a, b) => a.options.length - b.options.length); // сортируем ячейки по энтропии
	const minEntropy = uncollapsedCells[0].options.length; // пусть по умолчанию минимальная энтропия у первой ячейки
	const candidates = uncollapsedCells.filter(
		(cell) => cell.options.length === minEntropy
	);

	// Выбираем случайную ячейку из кандидатов и коллапсируем её
	const cell = random(candidates);

	// const cell = uncollapsedCells[0];
	cell.collapsed = true;
	cell.options = [random(cell.options)];
};
const updateNeighbors = () => {
	for (let j = 0; j < DIM; j++) {
		for (let i = 0; i < DIM; i++) {
			let index = i + j * DIM;
			const cell = grid[index];
			if (cell.collapsed) continue;
			let options = [...cell.options]; // Копируем текущие варианты

			// Проверяем соседей

			if (j > 0) {
				// Верхний сосед
				const upCell = grid[i + (j - 1) * DIM];
				const valid = upCell.options.flatMap((opt) => rules[opt][2]); // DOWN rule
				checkValid(options, valid);
			}
			if (i < DIM - 1) {
				// Правый сосед
				const rightCell = grid[i + 1 + j * DIM];
				const valid = rightCell.options.flatMap((opt) => rules[opt][3]); // LEFT rule
				// const valid = rightCell.options.flatMap((opt) => console.log(opt));
				checkValid(options, valid);
			}
			if (j < DIM - 1) {
				// Нижний сосед
				const downCell = grid[i + (j + 1) * DIM];
				const valid = downCell.options.flatMap((opt) => rules[opt][0]); // UP rule
				checkValid(options, valid);
			}
			if (i > 0) {
				// Левый сосед
				const leftCell = grid[i - 1 + j * DIM];
				const valid = leftCell.options?.flatMap((opt) => rules[opt][1]); // RIGHT rule
				checkValid(options, valid);
			}
			// if (i == 0 && chunks.length > 0) {
			// 	//правый край чанка

			// 	const lastChunk = chunks[chunks.length - 1];
			// 	const rightCell = lastChunk[j * DIM + DIM - 1];

			// 	const valid = rightCell.options?.flatMap(
			// 		(opt) => rules[opt][1]
			// 	); // RIGHT rule
			// 	checkValid(options, valid);
			// }
			if (options.length === 0) {
				console.log("ошибка №", i);
				// isPaused = true;
				// chunks.pop();
				// resetGrid();
				restoreGridState();
				return;
			} else {
				cell.options = options;
			}
		}
	}
};
sketch.draw = () => {
	background(100);
	noSmooth();
	//сначала рисуем все чанки

	// chunks.map((chunk, index) => {
	// 	const x = index % regionSize;
	// 	const y = Math.floor(index / regionSize);
	// 	// const y = 0;
	// 	drawGrid(DIM, chunk, tiles, regularMapTilesIndex, x, y);
	// });

	// потом рисуем сетку в процессе определения
	// const x = chunks.length % regionSize;
	// const y = Math.floor(chunks.length / regionSize);
	// const y = 0;
	drawGrid(DIM, grid, tiles, regularMapTilesIndex);

	// Если сетка уже полностью коллапсирована — перезапускаем
	if (isGridFullyCollapsed()) {
		// chunks.push(grid);
		resetGrid();
		return;
	}

	// Коллапсируем следующую ячейку (если не на паузе)
	if (!isPaused) {
		collapseNextCell();
		updateNeighbors();
	}
};
