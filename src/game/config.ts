import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';

export const GAME_WIDTH = 768;
export const GAME_HEIGHT = 480;

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
	return {
		type: Phaser.AUTO,
		width: GAME_WIDTH,
		height: GAME_HEIGHT,
		parent,
		backgroundColor: '#0b0e1a',
		banner: false,
		scene: [BootScene],
	};
}
