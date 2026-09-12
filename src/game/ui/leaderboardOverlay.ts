import { fetchTop10, formatClearTime, submitScore } from '../api/leaderboardClient';
import type { LeaderboardEntryView } from '../api/leaderboardClient';

export interface LeaderboardOverlay {
	showPreparing(): void;
	showPlaying(): void;
	showVictory(clearTimeMs: number): void;
	showGameOver(): void;
	destroy(): void;
}

export function createLeaderboardOverlay(root: HTMLElement): LeaderboardOverlay {
	const existing = root.querySelector('[data-leaderboard-overlay="true"]');
	if (existing) existing.remove();

	const host = document.createElement('div');
	host.dataset.leaderboardOverlay = 'true';
	host.style.position = 'absolute';
	host.style.left = '0';
	host.style.top = '0';
	host.style.width = '100%';
	host.style.height = '100%';
	host.style.pointerEvents = 'none';
	host.style.zIndex = '20';
	host.style.fontFamily = 'sans-serif';
	host.style.fontSize = '13px';
	host.style.boxSizing = 'border-box';

	const entryButton = document.createElement('button');
	entryButton.type = 'button';
	entryButton.textContent = '排行榜';
	entryButton.style.position = 'absolute';
	entryButton.style.top = '4px';
	entryButton.style.right = '8px';
	entryButton.style.height = '22px';
	entryButton.style.padding = '0 8px';
	entryButton.style.pointerEvents = 'auto';
	entryButton.style.display = 'none';

	const panel = document.createElement('div');
	panel.style.position = 'absolute';
	panel.style.left = '50%';
	panel.style.top = '112px';
	panel.style.transform = 'translateX(-50%)';
	panel.style.width = '320px';
	panel.style.padding = '12px';
	panel.style.background = 'rgba(17, 24, 39, 0.92)';
	panel.style.color = '#ffffff';
	panel.style.pointerEvents = 'auto';
	panel.style.display = 'none';
	panel.style.boxSizing = 'border-box';

	const timeLine = document.createElement('div');
	const form = document.createElement('div');
	const nameInput = document.createElement('input');
	nameInput.type = 'text';
	nameInput.maxLength = 20;
	nameInput.placeholder = '玩家名';
	nameInput.style.width = '100%';
	nameInput.style.margin = '8px 0';
	nameInput.style.boxSizing = 'border-box';

	const submitButton = document.createElement('button');
	submitButton.type = 'button';
	submitButton.textContent = '提交成绩';

	const boardButton = document.createElement('button');
	boardButton.type = 'button';
	boardButton.textContent = '刷新榜单';
	boardButton.style.marginLeft = '8px';

	const closeButton = document.createElement('button');
	closeButton.type = 'button';
	closeButton.textContent = '关闭';
	closeButton.style.marginLeft = '8px';

	const message = document.createElement('div');
	message.style.marginTop = '8px';
	message.style.minHeight = '18px';

	const list = document.createElement('ol');
	list.style.paddingLeft = '20px';
	list.style.margin = '8px 0 0';

	form.appendChild(nameInput);
	form.appendChild(submitButton);
	form.appendChild(boardButton);
	form.appendChild(closeButton);
	panel.appendChild(timeLine);
	panel.appendChild(form);
	panel.appendChild(message);
	panel.appendChild(list);
	host.appendChild(entryButton);
	host.appendChild(panel);
	root.appendChild(host);

	let currentClearTimeMs = 0;
	let submitted = false;
	let mode: 'hidden' | 'preparing' | 'victory' = 'hidden';

	function hidePanel(): void {
		panel.style.display = 'none';
		list.replaceChildren();
		message.textContent = '';
	}

	function showPanel(): void {
		panel.style.display = 'block';
	}

	async function refreshBoard(): Promise<void> {
		try {
			const result = await fetchTop10();
			renderEntries(result.entries);
		} catch (error) {
			message.textContent = error instanceof Error ? error.message : '排行榜加载失败';
		}
	}

	function renderEntries(entries: LeaderboardEntryView[]): void {
		list.replaceChildren();
		if (entries.length === 0) {
			const empty = document.createElement('li');
			empty.textContent = '暂无成绩';
			list.appendChild(empty);
			return;
		}
		for (const entry of entries) {
			const item = document.createElement('li');
			item.textContent = `${entry.playerName}  ${formatClearTime(entry.clearTimeMs)}`;
			list.appendChild(item);
		}
	}

	entryButton.addEventListener('click', () => {
		if (mode !== 'preparing') return;
		showPanel();
		void refreshBoard();
	});

	closeButton.addEventListener('click', () => {
		if (mode === 'preparing') hidePanel();
	});

	submitButton.addEventListener('click', async () => {
		if (submitted) return;
		submitButton.disabled = true;
		try {
			await submitScore(nameInput.value, currentClearTimeMs);
			submitted = true;
			message.textContent = '提交成功';
			await refreshBoard();
		} catch (error) {
			submitButton.disabled = false;
			message.textContent = error instanceof Error ? error.message : '提交失败';
		}
	});

	boardButton.addEventListener('click', () => {
		void refreshBoard();
	});

	return {
		showPreparing(): void {
			mode = 'preparing';
			entryButton.style.display = 'inline-block';
			hidePanel();
			timeLine.textContent = '';
			nameInput.style.display = 'none';
			submitButton.style.display = 'none';
			closeButton.style.display = 'inline-block';
		},
		showPlaying(): void {
			mode = 'hidden';
			entryButton.style.display = 'none';
			hidePanel();
		},
		showVictory(clearTimeMs: number): void {
			mode = 'victory';
			currentClearTimeMs = clearTimeMs;
			submitted = false;
			submitButton.disabled = false;
			entryButton.style.display = 'none';
			showPanel();
			timeLine.textContent = `通关时间 ${formatClearTime(clearTimeMs)}`;
			nameInput.style.display = 'block';
			nameInput.value = '';
			submitButton.style.display = 'inline-block';
			closeButton.style.display = 'none';
			message.textContent = '';
			list.replaceChildren();
		},
		showGameOver(): void {
			mode = 'hidden';
			entryButton.style.display = 'none';
			hidePanel();
		},
		destroy(): void {
			host.remove();
		},
	};
}
