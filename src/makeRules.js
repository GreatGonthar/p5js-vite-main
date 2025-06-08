const makeRules = (arr) => {
	const DIM = Math.sqrt(arr.length);
	let regularMapTilesIndex = new Set();
	const rules = Array(arr.length)
		.fill()
		.map(() => [new Set(), new Set(), new Set(), new Set()]);
	for (let i = 0; i < DIM; i++) {
		for (let j = 0; j < DIM; j++) {
			const index = arr[j * DIM + i]; // Преобразуем (i,j) в индекс одномерного массива
			// Проверяем соседей
			// Верхний сосед (если j > 0)
			if (j > 0) {
				rules[index][0].add(arr[(j - 1) * DIM + i]);
				regularMapTilesIndex.add(index);
			}
			// Правый сосед (если i < DIM - 1)
			if (i < DIM - 1) {
				rules[index][1].add(arr[j * DIM + (i + 1)]);
				regularMapTilesIndex.add(index);
			}
			// Нижний сосед (если j < DIM - 1)
			if (j < DIM - 1) {
				rules[index][2].add(arr[(j + 1) * DIM + i]);
				regularMapTilesIndex.add(index);
			}
			// Левый сосед (если i > 0)
			if (i > 0) {
				rules[index][3].add(arr[j * DIM + (i - 1)]);
				regularMapTilesIndex.add(index);
			}
		}
	}
	const result = rules.map((directions) => directions.map((set) => Array.from(set)));
	return [result, regularMapTilesIndex];
};
export default makeRules;
