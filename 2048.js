const victoryOverlay = document.getElementById('victoryOverlay');
const yourScore = document.getElementById('currentScore');
const bestScore = document.getElementById('bestScore');
const mainBoard = document.getElementById('mainBoard');
const gameStatus = document.getElementById('gameStatus');
const keyMapping = {
	ArrowUp: 'up',
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right'
};

let gameOver = false;
let wonGame = false;
let movingCells = false;
let clientX, clientY;
let currentScore = 0, maxScore = 0;

function updateScore(increment) {
	if (increment > 0) {
		currentScore += increment;
		maxScore = Math.max(currentScore, maxScore);
	} else {
		currentScore = 0;
	}

	yourScore.innerText = currentScore;
	bestScore.innerText = maxScore;

}

function getCell(x, y, direction) {
	switch (direction) {
		case 'down':
			y = 3 - y;
			break;
		case 'left':
			[x, y] = [y, x];
			break;
		case 'right':
			[x, y] = [3 - y, x];
			break;
	}

	return mainBoard.children[y * 4 + x];
}

function getCellLevel(cell) {
	if (cell) {
		for (const className of cell.classList) {
			if (className.startsWith('level')) {
				return parseInt(className.split('-')[1]);
			}
		}
	}

	return 0;
}

function setCellLevel(cell, level, noAnimation = true) {
	cell.className = 'board-cell' + (noAnimation ? ' no-animation' : '') + ((level > 0 && level <= 17) ? (' level-' + level) : '');
}

function getCellOffset(cell, direction) {
	for (const className of cell.classList) {
		if (className.startsWith(direction)) {
			return parseInt(className.split('-')[1]);
		}
	}

	return 0;
}

function setCellOffset(cell, direction, offset) {
	cell.classList.remove('no-animation');

	for (const className of cell.classList) {
		const prefix = className.split('-')[0];

		if (Object.values(keyMapping).includes(prefix)) {
			cell.classList.remove(className);
			break;
		}
	}

	if (offset > 0 && offset < 4) {
		cell.className += ' ' + direction + '-' + offset;
	}
}

function moveCells(direction, test = false) {
	for (let x = 0; x < 4; ++x) {
		let upperCellY = 0;
		let upperCell = getCell(x, 0, direction);

		for (let y = 1; y < 4; ++y) {
			if (test && getCellLevel(getCell(x, y, direction)) === getCellLevel(getCell(x, y - 1, direction))) {
				return true;
			} else {
				const cell = getCell(x, y, direction);
				const cellLevel = getCellLevel(cell);

				if (cellLevel > 0) {
					const upperCellLevel = getCellLevel(upperCell);

					if (cellLevel === upperCellLevel) {
						setCellOffset(cell, direction, y - upperCellY);
						++upperCellY;
						movingCells = true;
					} else if (upperCellLevel === 0 || ++upperCellY < y) {
						setCellOffset(cell, direction, y - upperCellY);
						movingCells = true;
					}

					if (cellLevel !== upperCellLevel) {
						upperCell = cell;
					} else {
						upperCell = null;
					}
				}
			}
		}
	}

	if (test) {
		return false;
	} else if (movingCells) {
		setTimeout(() => {
			const cellsToIncrement = [];

			for (let x = 0; x < 4; ++x) {
				for (let y = 1; y < 4; ++y) {
					const cell = getCell(x, y, direction);
					const cellLevel = getCellLevel(cell);
					const cellOffset = getCellOffset(cell, direction);

					if (cellOffset > 0) {
						const upperCell = getCell(x, y - cellOffset, direction);
						const upperCellLevel = getCellLevel(upperCell);
						setCellLevel(upperCell, cellLevel);

						if (upperCellLevel === cellLevel) {
							cellsToIncrement.push(upperCell);
						}

						setCellLevel(cell, 0);
					}
				}
			}

			setTimeout(() => {
				for (const cell of cellsToIncrement) {
					const cellLevel = getCellLevel(cell);
					setCellLevel(cell, cellLevel + 1, false);

					if (!wonGame && cellLevel === 10) {
						victoryOverlay.classList.add('show');
						wonGame = true;
					}
				}

				addCell();
				movingCells = false;
			}, 50);

		}, 300);
	}
}

function addCell() {
	const emptyCells = [];

	for (const cell of mainBoard.children) {
		if (getCellLevel(cell) === 0) {
			emptyCells.push(cell);
		}
	}

	const emptyCell = emptyCells[Math.floor(emptyCells.length * Math.random())];
	const level = Math.floor(2 * Math.random() + 1);
	setCellLevel(emptyCell, level, false);
	updateScore(2 * level);

	if (emptyCells.length === 1) {
		testIfGameOver();
	}
}

function testIfGameOver() {
	for (const direction of Object.values(keyMapping)) {
		if (moveCells(direction, true)) {
			return;
		}
	}

	gameOver = true;
	gameStatus.innerText = 'Game over! Press any key or swipe to start again.';
	gameStatus.classList.add('game-over');
}

function newGame() {
	if (!movingCells) {
		gameOver = false;
		wonGame = false;
		movingCells = true;
		gameStatus.innerText = 'Win by getting a tile with number 2048 by merging tiles with the same number. Use arrows or swipe to move tiles.';
		gameStatus.classList.remove('game-over');

		for (const cell of mainBoard.children) {
			setCellLevel(cell, 0);
		}

		setTimeout(() => {
			updateScore(0);
			addCell();
			addCell();
			movingCells = false;
		}, 50);
	}
}

window.addEventListener('keydown', event => {
	victoryOverlay.classList.remove('show');

	if (gameOver) {
		newGame();
	} else if (!movingCells) {
		switch (event.key) {
			case 'ArrowUp':
			case 'ArrowDown':
			case 'ArrowLeft':
			case 'ArrowRight':
				event.preventDefault();
				moveCells(keyMapping[event.key]);
				break;
			case 'F2':
				newGame();
				break;
		}
	}
});

window.addEventListener('touchstart', event => {
	event.preventDefault();
	clientX = event.touches[0].clientX;
	clientY = event.touches[0].clientY;
});

window.addEventListener('touchend', event => {
	event.preventDefault();
	victoryOverlay.classList.remove('show');

	if (gameOver) {
		newGame();
	} else if (!movingCells) {
		const deltaX = event.changedTouches[0].clientX - clientX;
		const deltaY = event.changedTouches[0].clientY - clientY;

		if (Math.abs(Math.abs(deltaX) - Math.abs(deltaY)) > 50) {
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				moveCells(keyMapping[deltaX > 0 ? 'ArrowRight' : 'ArrowLeft']);
			} else {
				moveCells(keyMapping[deltaY > 0 ? 'ArrowDown' : 'ArrowUp']);
			}
		}
	}
});

window.addEventListener('click', event => {
	victoryOverlay.classList.remove('show');
});

newGame();
