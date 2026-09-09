import Phaser from 'phaser';
import { createGameConfig } from './config';

let game: Phaser.Game | null = null;

export function createGame(parent: HTMLElement): Phaser.Game | null {
	if (typeof window === 'undefined') return null;

	if (game) {
		game.destroy(true);
		game = null;
	}

	game = new Phaser.Game(createGameConfig(parent));
	return game;
}

export function destroyGame(): void {
	if (!game) return;
	game.destroy(true);
	game = null;
}
