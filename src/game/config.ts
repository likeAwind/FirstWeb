import Phaser from 'phaser';
import { WORLD_WIDTH } from './core';
import { GameScene } from './scenes/GameScene';
import { GAME_HEIGHT } from './scenes/view';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
	return {
		type: Phaser.AUTO,
		width: WORLD_WIDTH,
		height: GAME_HEIGHT,
		parent,
		backgroundColor: '#0b0e1a',
		banner: false,
		scene: [GameScene],
	};
}
