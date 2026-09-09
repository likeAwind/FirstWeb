import Phaser from 'phaser';
import { LANE_COUNT, WORLD_WIDTH, createInitialWorld, stepWorld } from '../core';
import type { WorldState } from '../core';
import {
	GAME_HEIGHT,
	PLANT_VIEW_WIDTH,
	PLANT_VIEW_HEIGHT,
	ZOMBIE_VIEW_WIDTH,
	ZOMBIE_VIEW_HEIGHT,
	COLOR_PLANT,
	COLOR_ZOMBIE,
	COLOR_LANE_LINE,
	laneToY,
} from './view';

export class GameScene extends Phaser.Scene {
	private world!: WorldState;
	private zombieViews = new Map<string, Phaser.GameObjects.Rectangle>();

	constructor() {
		super('GameScene');
	}

	create(): void {
		this.world = createInitialWorld();
		this.zombieViews.clear();

		this.drawLanes();

		for (const plant of this.world.plants) {
			this.add.rectangle(
				plant.x,
				laneToY(plant.lane),
				PLANT_VIEW_WIDTH,
				PLANT_VIEW_HEIGHT,
				COLOR_PLANT,
			);
		}

		for (const zombie of this.world.zombies) {
			const rect = this.add.rectangle(
				zombie.x,
				laneToY(zombie.lane),
				ZOMBIE_VIEW_WIDTH,
				ZOMBIE_VIEW_HEIGHT,
				COLOR_ZOMBIE,
			);
			this.zombieViews.set(zombie.id, rect);
		}
	}

	private drawLanes(): void {
		for (let i = 1; i < LANE_COUNT; i++) {
			const y = (GAME_HEIGHT / LANE_COUNT) * i;
			this.add.rectangle(WORLD_WIDTH / 2, y, WORLD_WIDTH, 2, COLOR_LANE_LINE);
		}
	}

	override update(_time: number, delta: number): void {
		const dt = Math.min(delta / 1000, 0.05);
		stepWorld(this.world, dt);

		for (const zombie of this.world.zombies) {
			const rect = this.zombieViews.get(zombie.id);
			if (rect) rect.x = zombie.x;
		}
	}
}
