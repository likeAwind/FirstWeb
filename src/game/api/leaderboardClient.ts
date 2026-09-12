export const LEADERBOARD_GAME_VERSION = 'mvp-8';

const API_BASE_URL = '';

export interface SubmitScoreResult {
	runId: string;
	playerName: string;
	clearTimeMs: number;
	gameVersion: string;
	createdAt: string;
}

export interface LeaderboardEntryView {
	rank: number;
	playerName: string;
	clearTimeMs: number;
	createdAt: string;
}

export interface LeaderboardListResult {
	gameVersion: string;
	entries: LeaderboardEntryView[];
}

export async function submitScore(playerName: string, clearTimeMs: number): Promise<SubmitScoreResult> {
	const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			playerName,
			clearTimeMs,
			gameVersion: LEADERBOARD_GAME_VERSION,
		}),
	});
	const body = await response.json().catch(() => null);
	if (!response.ok) {
		const message = body && typeof body.message === 'string' ? body.message : '提交失败';
		throw new Error(message);
	}
	return body as SubmitScoreResult;
}

export async function fetchTop10(): Promise<LeaderboardListResult> {
	const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
	const body = await response.json().catch(() => null);
	if (!response.ok) {
		throw new Error('排行榜加载失败');
	}
	return body as LeaderboardListResult;
}

export function formatClearTime(ms: number): string {
	const safe = Math.max(0, Math.round(ms));
	const minutes = Math.floor(safe / 60000);
	const seconds = Math.floor((safe % 60000) / 1000);
	const millis = safe % 1000;
	return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}
