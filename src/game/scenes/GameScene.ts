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
	COLOR_HP,
	HP_LABEL_OFFSET_Y,
	laneToY,
} from './view';

export class GameScene extends Phaser.Scene {
	private world!: WorldState;
	private zombieViews = new Map<string, Phaser.GameObjects.Rectangle>();
	private zombieHpViews = new Map<string, Phaser.GameObjects.Text>();

	constructor() {
		super('GameScene');
	}

	create(): void {
		this.world = createInitialWorld();
		this.zombieViews.clear();
		this.zombieHpViews.clear();

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
			const y = laneToY(zombie.lane);
			const rect = this.add.rectangle(
				zombie.x,
				y,
				ZOMBIE_VIEW_WIDTH,
				ZOMBIE_VIEW_HEIGHT,
				COLOR_ZOMBIE,
			);
			this.zombieViews.set(zombie.id, rect);

			const hpText = this.add.text(zombie.x, y - HP_LABEL_OFFSET_Y, String(zombie.hp), {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: COLOR_HP,
			});
			hpText.setOrigin(0.5, 0.5);
			this.zombieHpViews.set(zombie.id, hpText);
		}
	}

	private drawLanes(): void {
		for (let i = 1; i < LANE_COUNT; i++) {
			const y = (GAME_HEIGHT / LANE_COUNT) * i;
			this.add.rectangle(WORLD_WIDTH / 2, y, WORLD_WIDTH, 2, COLOR_LANE_LINE);
		}
	}

	private destroyMissingZombieViews(): void {
		const liveIds = new Set(this.world.zombies.map((zombie) => zombie.id));

		for (const id of [...this.zombieViews.keys()]) {
			if (liveIds.has(id)) continue;

			this.zombieViews.get(id)?.destroy();
			this.zombieHpViews.get(id)?.destroy();
			this.zombieViews.delete(id);
			this.zombieHpViews.delete(id);
		}
	}

	override update(_time: number, delta: number): void {
		const dt = Math.min(delta / 1000, 0.05);
		stepWorld(this.world, dt);

		this.destroyMissingZombieViews();

		for (const zombie of this.world.zombies) {
			const rect = this.zombieViews.get(zombie.id);
			if (rect) rect.x = zombie.x;

			const hpText = this.zombieHpViews.get(zombie.id);
			if (hpText) {
				hpText.setText(String(zombie.hp));
				hpText.x = zombie.x;
				hpText.y = laneToY(zombie.lane) - HP_LABEL_OFFSET_Y;
			}
		}
	}
}
