import Phaser from 'phaser';
import { LANE_COUNT, WORLD_WIDTH, createInitialWorld, stepWorld } from '../core';
import type { WorldState } from '../core';
import {
	GAME_HEIGHT,
	PLANT_VIEW_WIDTH,
	PLANT_VIEW_HEIGHT,
	ZOMBIE_VIEW_WIDTH,
	ZOMBIE_VIEW_HEIGHT,
	PEA_VIEW_WIDTH,
	PEA_VIEW_HEIGHT,
	PLANT_IDLE_SHEET_KEY,
	PLANT_IDLE_ANIM_KEY,
	PLANT_IDLE_SHEET_URL,
	PLANT_ATTACK_SHEET_KEY,
	PLANT_ATTACK_ANIM_KEY,
	PLANT_ATTACK_SHEET_URL,
	PLANT_FRAME_WIDTH,
	PLANT_FRAME_HEIGHT,
	PLANT_IDLE_FRAME_RATE,
	PLANT_ATTACK_FRAME_RATE,
	PEA_SHEET_KEY,
	PEA_FLY_ANIM_KEY,
	PEA_SHEET_URL,
	PEA_FRAME_WIDTH,
	PEA_FRAME_HEIGHT,
	PEA_FLY_FRAME_RATE,
	ZOMBIE_SHEET_KEY,
	ZOMBIE_WALK_ANIM_KEY,
	ZOMBIE_SHEET_URL,
	ZOMBIE_DEATH_SHEET_KEY,
	ZOMBIE_DEATH_ANIM_KEY,
	ZOMBIE_DEATH_SHEET_URL,
	ZOMBIE_FRAME_WIDTH,
	ZOMBIE_FRAME_HEIGHT,
	ZOMBIE_WALK_FRAME_RATE,
	ZOMBIE_DEATH_FRAME_RATE,
	COLOR_LANE_LINE,
	COLOR_HP,
	HP_LABEL_OFFSET_Y,
	laneToY,
} from './view';

export class GameScene extends Phaser.Scene {
	private world!: WorldState;
	private plantViews = new Map<string, Phaser.GameObjects.Sprite>();
	private projectileViews = new Map<string, Phaser.GameObjects.Sprite>();
	private zombieViews = new Map<string, Phaser.GameObjects.Sprite>();
	private zombieHpViews = new Map<string, Phaser.GameObjects.Text>();

	constructor() {
		super('GameScene');
	}

	preload(): void {
		this.load.spritesheet(PLANT_IDLE_SHEET_KEY, PLANT_IDLE_SHEET_URL, {
			frameWidth: PLANT_FRAME_WIDTH,
			frameHeight: PLANT_FRAME_HEIGHT,
		});
		this.load.spritesheet(PLANT_ATTACK_SHEET_KEY, PLANT_ATTACK_SHEET_URL, {
			frameWidth: PLANT_FRAME_WIDTH,
			frameHeight: PLANT_FRAME_HEIGHT,
		});
		this.load.spritesheet(PEA_SHEET_KEY, PEA_SHEET_URL, {
			frameWidth: PEA_FRAME_WIDTH,
			frameHeight: PEA_FRAME_HEIGHT,
		});
		this.load.spritesheet(ZOMBIE_SHEET_KEY, ZOMBIE_SHEET_URL, {
			frameWidth: ZOMBIE_FRAME_WIDTH,
			frameHeight: ZOMBIE_FRAME_HEIGHT,
		});
		this.load.spritesheet(ZOMBIE_DEATH_SHEET_KEY, ZOMBIE_DEATH_SHEET_URL, {
			frameWidth: ZOMBIE_FRAME_WIDTH,
			frameHeight: ZOMBIE_FRAME_HEIGHT,
		});
	}

	create(): void {
		this.registerAnimations();

		this.world = createInitialWorld();
		this.plantViews.clear();
		this.projectileViews.clear();
		this.zombieViews.clear();
		this.zombieHpViews.clear();

		this.drawLanes();

		for (const plant of this.world.plants) {
			const sprite = this.add.sprite(plant.x, laneToY(plant.lane), PLANT_IDLE_SHEET_KEY);
			sprite.setDisplaySize(PLANT_VIEW_WIDTH, PLANT_VIEW_HEIGHT);
			sprite.play(PLANT_IDLE_ANIM_KEY);
			this.registerPlantAttackComplete(sprite);
			this.plantViews.set(plant.id, sprite);
		}

		for (const zombie of this.world.zombies) {
			const y = laneToY(zombie.lane);
			const sprite = this.add.sprite(zombie.x, y, ZOMBIE_SHEET_KEY);
			sprite.setDisplaySize(ZOMBIE_VIEW_WIDTH, ZOMBIE_VIEW_HEIGHT);
			sprite.play(ZOMBIE_WALK_ANIM_KEY);
			this.zombieViews.set(zombie.id, sprite);

			const hpText = this.add.text(zombie.x, y - HP_LABEL_OFFSET_Y, String(zombie.hp), {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: COLOR_HP,
			});
			hpText.setOrigin(0.5, 0.5);
			this.zombieHpViews.set(zombie.id, hpText);
		}
	}

	private registerAnimations(): void {
		if (!this.anims.exists(PLANT_IDLE_ANIM_KEY)) {
			this.anims.create({
				key: PLANT_IDLE_ANIM_KEY,
				frames: this.anims.generateFrameNumbers(PLANT_IDLE_SHEET_KEY, { start: 0, end: 7 }),
				frameRate: PLANT_IDLE_FRAME_RATE,
				repeat: -1,
			});
		}

		if (!this.anims.exists(PLANT_ATTACK_ANIM_KEY)) {
			this.anims.create({
				key: PLANT_ATTACK_ANIM_KEY,
				frames: this.anims.generateFrameNumbers(PLANT_ATTACK_SHEET_KEY, { start: 0, end: 7 }),
				frameRate: PLANT_ATTACK_FRAME_RATE,
				repeat: 0,
			});
		}

		if (!this.anims.exists(PEA_FLY_ANIM_KEY)) {
			this.anims.create({
				key: PEA_FLY_ANIM_KEY,
				frames: this.anims.generateFrameNumbers(PEA_SHEET_KEY, { start: 0, end: 3 }),
				frameRate: PEA_FLY_FRAME_RATE,
				repeat: -1,
			});
		}

		if (!this.anims.exists(ZOMBIE_WALK_ANIM_KEY)) {
			this.anims.create({
				key: ZOMBIE_WALK_ANIM_KEY,
				frames: this.anims.generateFrameNumbers(ZOMBIE_SHEET_KEY, { start: 0, end: 7 }),
				frameRate: ZOMBIE_WALK_FRAME_RATE,
				repeat: -1,
			});
		}

		if (!this.anims.exists(ZOMBIE_DEATH_ANIM_KEY)) {
			this.anims.create({
				key: ZOMBIE_DEATH_ANIM_KEY,
				frames: this.anims.generateFrameNumbers(ZOMBIE_DEATH_SHEET_KEY, { start: 0, end: 7 }),
				frameRate: ZOMBIE_DEATH_FRAME_RATE,
				repeat: 0,
			});
		}
	}

	private registerPlantAttackComplete(sprite: Phaser.GameObjects.Sprite): void {
		sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: Phaser.Animations.Animation) => {
			if (animation.key === PLANT_ATTACK_ANIM_KEY) {
				sprite.play(PLANT_IDLE_ANIM_KEY);
			}
		});
	}

	private playPlantAttack(sourcePlantId: string): void {
		const sprite = this.plantViews.get(sourcePlantId);
		if (!sprite) return;
		sprite.play(PLANT_ATTACK_ANIM_KEY);
	}

	private drawLanes(): void {
		for (let i = 1; i < LANE_COUNT; i++) {
			const y = (GAME_HEIGHT / LANE_COUNT) * i;
			this.add.rectangle(WORLD_WIDTH / 2, y, WORLD_WIDTH, 2, COLOR_LANE_LINE);
		}
	}

	private playZombieDeath(sprite: Phaser.GameObjects.Sprite): void {
		sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ZOMBIE_DEATH_ANIM_KEY, () => {
			sprite.destroy();
		});
		sprite.play(ZOMBIE_DEATH_ANIM_KEY);
	}

	private destroyMissingZombieViews(): void {
		const liveIds = new Set(this.world.zombies.map((zombie) => zombie.id));

		for (const id of [...this.zombieViews.keys()]) {
			if (liveIds.has(id)) continue;

			const sprite = this.zombieViews.get(id);
			const hpText = this.zombieHpViews.get(id);

			this.zombieViews.delete(id);
			this.zombieHpViews.delete(id);
			hpText?.destroy();

			if (sprite) this.playZombieDeath(sprite);
		}
	}

	private syncProjectileViews(): void {
		const liveIds = new Set(this.world.projectiles.map((projectile) => projectile.id));

		for (const id of [...this.projectileViews.keys()]) {
			if (liveIds.has(id)) continue;
			this.projectileViews.get(id)?.destroy();
			this.projectileViews.delete(id);
		}

		for (const projectile of this.world.projectiles) {
			let sprite = this.projectileViews.get(projectile.id);
			if (!sprite) {
				sprite = this.add.sprite(projectile.x, laneToY(projectile.lane), PEA_SHEET_KEY);
				sprite.setDisplaySize(PEA_VIEW_WIDTH, PEA_VIEW_HEIGHT);
				sprite.play(PEA_FLY_ANIM_KEY);
				this.projectileViews.set(projectile.id, sprite);
				this.playPlantAttack(projectile.sourcePlantId);
				continue;
			}

			sprite.x = projectile.x;
		}
	}

	override update(_time: number, delta: number): void {
		const dt = Math.min(delta / 1000, 0.05);
		stepWorld(this.world, dt);

		this.destroyMissingZombieViews();

		for (const zombie of this.world.zombies) {
			const sprite = this.zombieViews.get(zombie.id);
			if (sprite) sprite.x = zombie.x;

			const hpText = this.zombieHpViews.get(zombie.id);
			if (hpText) {
				hpText.setText(String(zombie.hp));
				hpText.x = zombie.x;
				hpText.y = laneToY(zombie.lane) - HP_LABEL_OFFSET_Y;
			}
		}

		this.syncProjectileViews();
	}
}
