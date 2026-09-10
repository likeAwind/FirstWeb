import Phaser from 'phaser';
import { LANE_COUNT, WAVE_COUNT, WORLD_WIDTH, createInitialWorld, stepWorld } from '../core';
import type { WorldState } from '../core';
import {
	GAME_HEIGHT,
	PLANT_VIEW_WIDTH,
	PLANT_VIEW_HEIGHT,
	PEA_VIEW_WIDTH,
	PEA_VIEW_HEIGHT,
	PLANT_IDLE_SHEET_KEY,
	PLANT_IDLE_ANIM_KEY,
	PLANT_IDLE_SHEET_URL,
	PLANT_ATTACK_SHEET_KEY,
	PLANT_ATTACK_ANIM_KEY,
	PLANT_ATTACK_SHEET_URL,
	PLANT_DEATH_SHEET_KEY,
	PLANT_DEATH_ANIM_KEY,
	PLANT_DEATH_SHEET_URL,
	PLANT_FRAME_WIDTH,
	PLANT_FRAME_HEIGHT,
	PLANT_IDLE_FRAME_RATE,
	PLANT_ATTACK_FRAME_RATE,
	PLANT_DEATH_FRAME_RATE,
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
	COLOR_UI,
	HP_LABEL_OFFSET_Y,
	WAVE_TEXT_X,
	WAVE_TEXT_Y,
	STATUS_TEXT_SIZE,
	laneToY,
	zombieViewSize,
} from './view';

export class GameScene extends Phaser.Scene {
	private world!: WorldState;
	private plantViews = new Map<string, Phaser.GameObjects.Sprite>();
	private plantHpViews = new Map<string, Phaser.GameObjects.Text>();
	private projectileViews = new Map<string, Phaser.GameObjects.Sprite>();
	private zombieViews = new Map<string, Phaser.GameObjects.Sprite>();
	private zombieHpViews = new Map<string, Phaser.GameObjects.Text>();
	private waveText!: Phaser.GameObjects.Text;
	private statusText!: Phaser.GameObjects.Text;

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
		this.load.spritesheet(PLANT_DEATH_SHEET_KEY, PLANT_DEATH_SHEET_URL, {
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
		this.plantHpViews.clear();
		this.projectileViews.clear();
		this.zombieViews.clear();
		this.zombieHpViews.clear();

		this.drawLanes();

		for (const plant of this.world.plants) {
			const y = laneToY(plant.lane);
			const sprite = this.add.sprite(plant.x, y, PLANT_IDLE_SHEET_KEY);
			sprite.setDisplaySize(PLANT_VIEW_WIDTH, PLANT_VIEW_HEIGHT);
			sprite.play(PLANT_IDLE_ANIM_KEY);
			this.registerPlantAttackComplete(sprite);
			this.plantViews.set(plant.id, sprite);

			const hpText = this.add.text(plant.x, y - HP_LABEL_OFFSET_Y, String(plant.hp), {
				fontFamily: 'monospace',
				fontSize: '14px',
				color: COLOR_HP,
			});
			hpText.setOrigin(0.5, 0.5);
			this.plantHpViews.set(plant.id, hpText);
		}

		this.waveText = this.add.text(WAVE_TEXT_X, WAVE_TEXT_Y, '', {
			fontFamily: 'sans-serif',
			fontSize: '18px',
			color: COLOR_UI,
		});
		this.statusText = this.add.text(WORLD_WIDTH / 2, GAME_HEIGHT / 2, '', {
			fontFamily: 'sans-serif',
			fontSize: STATUS_TEXT_SIZE,
			color: COLOR_UI,
		});
		this.statusText.setOrigin(0.5, 0.5);
		this.statusText.setVisible(false);

		this.syncHud();
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

		if (!this.anims.exists(PLANT_DEATH_ANIM_KEY)) {
			this.anims.create({
				key: PLANT_DEATH_ANIM_KEY,
				frames: this.anims.generateFrameNumbers(PLANT_DEATH_SHEET_KEY, { start: 0, end: 7 }),
				frameRate: PLANT_DEATH_FRAME_RATE,
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

	private playPlantDeath(sprite: Phaser.GameObjects.Sprite): void {
		sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + PLANT_DEATH_ANIM_KEY, () => {
			sprite.destroy();
		});
		sprite.play(PLANT_DEATH_ANIM_KEY);
	}

	private destroyMissingPlantViews(): void {
		const liveIds = new Set(this.world.plants.map((plant) => plant.id));

		for (const id of [...this.plantViews.keys()]) {
			if (liveIds.has(id)) continue;

			const sprite = this.plantViews.get(id);
			const hpText = this.plantHpViews.get(id);

			this.plantViews.delete(id);
			this.plantHpViews.delete(id);
			hpText?.destroy();

			if (sprite) this.playPlantDeath(sprite);
		}
	}

	private syncLivePlantHp(): void {
		for (const plant of this.world.plants) {
			const hpText = this.plantHpViews.get(plant.id);
			if (hpText) hpText.setText(String(plant.hp));
		}
	}

	private syncZombieViews(): void {
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

		for (const zombie of this.world.zombies) {
			const y = laneToY(zombie.lane);
			let sprite = this.zombieViews.get(zombie.id);
			if (!sprite) {
				const size = zombieViewSize(zombie.kind);
				sprite = this.add.sprite(zombie.x, y, ZOMBIE_SHEET_KEY);
				sprite.setDisplaySize(size.width, size.height);
				sprite.play(ZOMBIE_WALK_ANIM_KEY);
				this.zombieViews.set(zombie.id, sprite);

				const hpText = this.add.text(zombie.x, y - HP_LABEL_OFFSET_Y, String(zombie.hp), {
					fontFamily: 'monospace',
					fontSize: '14px',
					color: COLOR_HP,
				});
				hpText.setOrigin(0.5, 0.5);
				this.zombieHpViews.set(zombie.id, hpText);
				continue;
			}

			sprite.x = zombie.x;

			const hpText = this.zombieHpViews.get(zombie.id);
			if (hpText) {
				hpText.setText(String(zombie.hp));
				hpText.x = zombie.x;
				hpText.y = y - HP_LABEL_OFFSET_Y;
			}
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

	private syncHud(): void {
		this.waveText.setText(`Wave ${this.world.waveIndex + 1} / ${WAVE_COUNT}`);

		if (this.world.gameStatus === 'victory') {
			this.statusText.setText('胜利');
			this.statusText.setVisible(true);
			return;
		}

		if (this.world.gameStatus === 'game-over') {
			this.statusText.setText('游戏结束');
			this.statusText.setVisible(true);
			return;
		}

		this.statusText.setVisible(false);
	}

	override update(_time: number, delta: number): void {
		const dt = Math.min(delta / 1000, 0.05);
		stepWorld(this.world, dt);

		this.destroyMissingPlantViews();
		this.syncLivePlantHp();
		this.syncZombieViews();
		this.syncProjectileViews();
		this.syncHud();
	}
}
