import Phaser from 'phaser';
import {
	LANE_COUNT,
	PLANT_COLUMN_COUNT,
	PLANT_CONFIG,
	PLANT_GRID_XS,
	WAVE_COUNT,
	WORLD_WIDTH,
	canPlacePlant,
	createInitialWorld,
	placePlant,
	startBattle,
	stepWorld,
} from '../core';
import type { GameStatus, PlacePlantResult, PlantKind, WorldState } from '../core';
import {
	BUTTON_FILL_COLOR,
	BGM_MAIN_KEY,
	BGM_MAIN_URLS,
	BGM_MAIN_VOLUME,
	CARD_FILL_COLOR,
	CARD_SELECTED_COLOR,
	COLOR_HP,
	COLOR_LANE_LINE,
	COLOR_UI,
	DEPTH_GRID,
	DEPTH_HP,
	DEPTH_HUD_BG,
	DEPTH_SPRITE,
	DEPTH_STATUS,
	DEPTH_UI,
	GRID_CELL_HEIGHT,
	GRID_CELL_WIDTH,
	GRID_FILL_ALPHA,
	GRID_FILL_COLOR,
	GRID_STROKE_COLOR,
	HINT_TEXT_X,
	HINT_TEXT_Y,
	HINT_WRAP_WIDTH,
	HOVER_INVALID_COLOR,
	HOVER_VALID_COLOR,
	HP_LABEL_OFFSET_Y,
	HUD_BG_COLOR,
	HUD_CARD_X,
	HUD_CARD_Y,
	HUD_HEIGHT,
	HUD_START_X,
	HUD_START_Y,
	PEA_FLY_ANIM_KEY,
	PEA_FRAME_HEIGHT,
	PEA_FRAME_WIDTH,
	PEA_FLY_FRAME_RATE,
	PEA_SHEET_KEY,
	PEA_SHEET_URL,
	PEA_VIEW_HEIGHT,
	PEA_VIEW_WIDTH,
	PLAYFIELD_CENTER_Y,
	PLAYFIELD_HEIGHT,
	PLAYFIELD_TOP,
	PLANT_ATTACK_FRAME_RATE,
	PLANT_ATTACK_SHEET_KEY,
	PLANT_ATTACK_SHEET_URL,
	PLANT_DEATH_FRAME_RATE,
	PLANT_DEATH_SHEET_KEY,
	PLANT_DEATH_SHEET_URL,
	PLANT_FRAME_HEIGHT,
	PLANT_FRAME_WIDTH,
	PLANT_IDLE_FRAME_RATE,
	PLANT_IDLE_SHEET_KEY,
	PLANT_IDLE_SHEET_URL,
	PLANT_VIEW_HEIGHT,
	PLANT_VIEW_WIDTH,
	SFX_BUTTON_CLICK_KEY,
	SFX_BUTTON_CLICK_VOLUME,
	SFX_FILES,
	SFX_GAME_OVER_KEY,
	SFX_GAME_OVER_VOLUME,
	SFX_PEA_HIT_KEY,
	SFX_PEA_HIT_VOLUME,
	SFX_PEA_SHOOT_KEY,
	SFX_PEA_SHOOT_VOLUME,
	SFX_PLANT_DEATH_KEY,
	SFX_PLANT_DEATH_VOLUME,
	SFX_PLANT_PLACE_KEY,
	SFX_PLANT_PLACE_VOLUME,
	SFX_VICTORY_KEY,
	SFX_VICTORY_VOLUME,
	SFX_ZOMBIE_DEATH_KEY,
	SFX_ZOMBIE_DEATH_VOLUME,
	STATUS_TEXT_SIZE,
	SUN_TEXT_X,
	SUN_TEXT_Y,
	WAVE_TEXT_X,
	WAVE_TEXT_Y,
	ZOMBIE_DEATH_ANIM_KEY,
	ZOMBIE_DEATH_FRAME_RATE,
	ZOMBIE_DEATH_SHEET_KEY,
	ZOMBIE_DEATH_SHEET_URL,
	ZOMBIE_FRAME_HEIGHT,
	ZOMBIE_FRAME_WIDTH,
	ZOMBIE_SHEET_KEY,
	ZOMBIE_SHEET_URL,
	ZOMBIE_WALK_ANIM_KEY,
	ZOMBIE_WALK_FRAME_RATE,
	laneToY,
	zombieViewSize,
} from './view';
import { hitTestPlantCell, plantViewKeys } from './placementView';

interface GridCellView {
	lane: 0 | 1 | 2;
	columnIndex: number;
	rect: Phaser.GameObjects.Rectangle;
}

export class GameScene extends Phaser.Scene {
	private world!: WorldState;
	private selectedPlantKind: PlantKind | null = null;
	private hoveredCell: { lane: 0 | 1 | 2; columnIndex: number } | null = null;
	private hint = '';

	private plantViews = new Map<string, Phaser.GameObjects.Sprite>();
	private plantHpViews = new Map<string, Phaser.GameObjects.Text>();
	private projectileViews = new Map<string, Phaser.GameObjects.Sprite>();
	private zombieViews = new Map<string, Phaser.GameObjects.Sprite>();
	private zombieHpViews = new Map<string, Phaser.GameObjects.Text>();
	private gridCells: GridCellView[] = [];

	private waveText!: Phaser.GameObjects.Text;
	private sunText!: Phaser.GameObjects.Text;
	private hintText!: Phaser.GameObjects.Text;
	private statusText!: Phaser.GameObjects.Text;
	private cardBg!: Phaser.GameObjects.Rectangle;
	private startButton!: Phaser.GameObjects.Rectangle;
	private startLabel!: Phaser.GameObjects.Text;
	private restartButton!: Phaser.GameObjects.Rectangle;
	private restartLabel!: Phaser.GameObjects.Text;
	private bgm?: Phaser.Sound.BaseSound;
	private previousGameStatus: GameStatus = 'preparing';

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
		this.load.audio(BGM_MAIN_KEY, BGM_MAIN_URLS);
		for (const sfx of SFX_FILES) {
			this.load.audio(sfx.key, sfx.url);
		}
	}

	create(): void {
		this.registerAnimations();

		this.world = createInitialWorld();
		this.previousGameStatus = this.world.gameStatus;
		this.selectedPlantKind = null;
		this.hoveredCell = null;
		this.hint = '准备阶段：选择植物并点击格子种植';
		this.plantViews.clear();
		this.plantHpViews.clear();
		this.projectileViews.clear();
		this.zombieViews.clear();
		this.zombieHpViews.clear();
		this.gridCells = [];

		this.drawLanes();
		this.drawGrid();
		this.createHud();
		this.createCard();
		this.createButtons();
		this.registerInput();

		this.syncHud();
	}

	private registerInput(): void {
		this.input.on('pointerdown', this.onPointerDown, this);
		this.input.on('pointermove', this.onPointerMove, this);
		this.input.keyboard?.on('keydown-ESC', this.cancelSelection, this);

		this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this.input.off('pointerdown', this.onPointerDown, this);
			this.input.off('pointermove', this.onPointerMove, this);
			this.input.keyboard?.off('keydown-ESC', this.cancelSelection, this);
			this.stopBgm();
			this.bgm?.destroy();
			this.bgm = undefined;
		});
	}

	private registerAnimations(): void {
		const idleKeys = plantViewKeys('pea-shooter');

		if (!this.anims.exists(idleKeys.idleAnim)) {
			this.anims.create({
				key: idleKeys.idleAnim,
				frames: this.anims.generateFrameNumbers(PLANT_IDLE_SHEET_KEY, { start: 0, end: 7 }),
				frameRate: PLANT_IDLE_FRAME_RATE,
				repeat: -1,
			});
		}

		if (!this.anims.exists(idleKeys.attackAnim)) {
			this.anims.create({
				key: idleKeys.attackAnim,
				frames: this.anims.generateFrameNumbers(PLANT_ATTACK_SHEET_KEY, { start: 0, end: 7 }),
				frameRate: PLANT_ATTACK_FRAME_RATE,
				repeat: 0,
			});
		}

		if (!this.anims.exists(idleKeys.deathAnim)) {
			this.anims.create({
				key: idleKeys.deathAnim,
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

	private drawLanes(): void {
		this.add
			.rectangle(WORLD_WIDTH / 2, PLAYFIELD_TOP, WORLD_WIDTH, 2, COLOR_LANE_LINE)
			.setDepth(DEPTH_GRID);

		for (let i = 1; i < LANE_COUNT; i++) {
			const y = PLAYFIELD_TOP + (PLAYFIELD_HEIGHT / LANE_COUNT) * i;
			this.add.rectangle(WORLD_WIDTH / 2, y, WORLD_WIDTH, 2, COLOR_LANE_LINE).setDepth(DEPTH_GRID);
		}
	}

	private drawGrid(): void {
		for (let lane = 0; lane < LANE_COUNT; lane++) {
			const laneId = lane as 0 | 1 | 2;
			for (let columnIndex = 0; columnIndex < PLANT_COLUMN_COUNT; columnIndex++) {
				const rect = this.add.rectangle(
					PLANT_GRID_XS[columnIndex],
					laneToY(laneId),
					GRID_CELL_WIDTH,
					GRID_CELL_HEIGHT,
					GRID_FILL_COLOR,
					GRID_FILL_ALPHA,
				);
				rect.setStrokeStyle(1, GRID_STROKE_COLOR, 0.8);
				rect.setDepth(DEPTH_GRID);
				this.gridCells.push({ lane: laneId, columnIndex, rect });
			}
		}
	}

	private createHud(): void {
		this.add.rectangle(WORLD_WIDTH / 2, HUD_HEIGHT / 2, WORLD_WIDTH, HUD_HEIGHT, HUD_BG_COLOR).setDepth(DEPTH_HUD_BG);

		this.waveText = this.add.text(WAVE_TEXT_X, WAVE_TEXT_Y, '', {
			fontFamily: 'sans-serif',
			fontSize: '18px',
			color: COLOR_UI,
		});
		this.waveText.setDepth(DEPTH_UI);

		this.sunText = this.add.text(SUN_TEXT_X, SUN_TEXT_Y, '', {
			fontFamily: 'sans-serif',
			fontSize: '18px',
			color: COLOR_UI,
		});
		this.sunText.setDepth(DEPTH_UI);

		this.hintText = this.add.text(HINT_TEXT_X, HINT_TEXT_Y, '', {
			fontFamily: 'sans-serif',
			fontSize: '14px',
			color: COLOR_UI,
			wordWrap: { width: HINT_WRAP_WIDTH },
		});
		this.hintText.setDepth(DEPTH_UI);

		this.statusText = this.add.text(WORLD_WIDTH / 2, PLAYFIELD_CENTER_Y, '', {
			fontFamily: 'sans-serif',
			fontSize: STATUS_TEXT_SIZE,
			color: COLOR_UI,
		});
		this.statusText.setOrigin(0.5, 0.5);
		this.statusText.setVisible(false);
		this.statusText.setDepth(DEPTH_STATUS);
	}

	private createCard(): void {
		const cost = PLANT_CONFIG['pea-shooter'].cost;
		this.cardBg = this.add.rectangle(HUD_CARD_X, HUD_CARD_Y, 148, 76, CARD_FILL_COLOR);
		this.cardBg.setStrokeStyle(2, GRID_STROKE_COLOR);
		this.cardBg.setInteractive({ useHandCursor: true });
		this.cardBg.setDepth(DEPTH_UI);
		this.cardBg.on('pointerdown', this.onCardClicked, this);

		this.add
			.text(HUD_CARD_X, HUD_CARD_Y - 14, '豌豆射手', {
				fontFamily: 'sans-serif',
				fontSize: '16px',
				color: COLOR_UI,
			})
			.setOrigin(0.5, 0.5)
			.setDepth(DEPTH_UI);

		this.add
			.text(HUD_CARD_X, HUD_CARD_Y + 14, `${cost} 阳光`, {
				fontFamily: 'sans-serif',
				fontSize: '14px',
				color: COLOR_UI,
			})
			.setOrigin(0.5, 0.5)
			.setDepth(DEPTH_UI);
	}

	private createButtons(): void {
		this.startButton = this.add.rectangle(HUD_START_X, HUD_START_Y, 148, 40, BUTTON_FILL_COLOR);
		this.startButton.setStrokeStyle(2, GRID_STROKE_COLOR);
		this.startButton.setInteractive({ useHandCursor: true });
		this.startButton.setDepth(DEPTH_UI);
		this.startButton.on('pointerdown', this.onStartClicked, this);

		this.startLabel = this.add
			.text(HUD_START_X, HUD_START_Y, '开始战斗', {
				fontFamily: 'sans-serif',
				fontSize: '16px',
				color: COLOR_UI,
			})
			.setOrigin(0.5, 0.5)
			.setDepth(DEPTH_UI);

		this.restartButton = this.add.rectangle(WORLD_WIDTH / 2, PLAYFIELD_CENTER_Y + 56, 160, 40, BUTTON_FILL_COLOR);
		this.restartButton.setStrokeStyle(2, GRID_STROKE_COLOR);
		this.restartButton.setInteractive({ useHandCursor: true });
		this.restartButton.setDepth(DEPTH_STATUS);
		this.restartButton.on('pointerdown', this.onRestartClicked, this);

		this.restartLabel = this.add
			.text(WORLD_WIDTH / 2, PLAYFIELD_CENTER_Y + 56, '重新开始', {
				fontFamily: 'sans-serif',
				fontSize: '16px',
				color: COLOR_UI,
			})
			.setOrigin(0.5, 0.5)
			.setDepth(DEPTH_STATUS);
	}

	private onCardClicked(): void {
		this.playSfx(SFX_BUTTON_CLICK_KEY, SFX_BUTTON_CLICK_VOLUME);
		if (this.selectedPlantKind === 'pea-shooter') {
			this.cancelSelection();
			this.hint = '已取消选择';
			this.syncHud();
			return;
		}

		this.selectedPlantKind = 'pea-shooter';
		this.hint = '点击格子种植';
		this.syncHud();
	}

	private onStartClicked(): void {
		this.playSfx(SFX_BUTTON_CLICK_KEY, SFX_BUTTON_CLICK_VOLUME);
		if (!startBattle(this.world)) {
			this.hint = '请先种至少一株植物';
			this.syncHud();
			return;
		}

		this.hint = '战斗开始';
		this.cancelSelection();
		this.startBgm();
		this.syncHud();
	}

	private startBgm(): void {
		if (this.bgm?.isPlaying) return;

		if (!this.bgm) {
			this.bgm = this.sound.add(BGM_MAIN_KEY, {
				loop: true,
				volume: BGM_MAIN_VOLUME,
			});
		}

		if (!this.bgm.isPlaying) {
			this.bgm.play();
		}
	}

	private stopBgm(): void {
		if (!this.bgm) return;
		if (this.bgm.isPlaying) this.bgm.stop();
	}

	private playSfx(key: string, volume: number): void {
		this.sound.play(key, { volume });
	}

	private onRestartClicked(): void {
		this.playSfx(SFX_BUTTON_CLICK_KEY, SFX_BUTTON_CLICK_VOLUME);
		this.scene.restart();
	}

	private cancelSelection = (): void => {
		this.selectedPlantKind = null;
		this.hoveredCell = null;
		this.resetGridFill();
		this.syncHud();
	};

	private onPointerDown(pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]): void {
		if (currentlyOver.length > 0) return;

		const cell = hitTestPlantCell(pointer.x, pointer.y);
		if (!cell) return;

		if (!this.selectedPlantKind) {
			this.hint = '请先选择植物';
			this.syncHud();
			return;
		}

		this.tryPlace(this.selectedPlantKind, cell.lane, cell.columnIndex);
	}

	private onPointerMove(pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]): void {
		if (currentlyOver.length > 0 || !this.selectedPlantKind) {
			if (this.hoveredCell) {
				this.hoveredCell = null;
				this.resetGridFill();
			}
			return;
		}

		const cell = hitTestPlantCell(pointer.x, pointer.y);
		if (!cell) {
			if (this.hoveredCell) {
				this.hoveredCell = null;
				this.resetGridFill();
			}
			return;
		}

		this.hoveredCell = cell;
		this.updateGridHover();
	}

	private tryPlace(kind: PlantKind, lane: 0 | 1 | 2, columnIndex: number): void {
		const result = placePlant(this.world, kind, lane, columnIndex);
		if (result === 'placed') {
			this.playSfx(SFX_PLANT_PLACE_KEY, SFX_PLANT_PLACE_VOLUME);
			this.hint = '';
			this.cancelSelection();
			return;
		}

		this.hint = this.hintForResult(result);
		this.syncHud();
	}

	private hintForResult(result: PlacePlantResult): string {
		switch (result) {
			case 'occupied':
				return '这个格子已经有植物';
			case 'insufficient-sun':
				return '阳光不足';
			case 'invalid-status':
				return '现在不能种植';
			case 'invalid-cell':
				return '不能种在这里';
			case 'placed':
				return '';
		}
	}

	private resetGridFill(): void {
		for (const cell of this.gridCells) {
			cell.rect.setFillStyle(GRID_FILL_COLOR, GRID_FILL_ALPHA);
		}
	}

	private updateGridHover(): void {
		this.resetGridFill();
		if (!this.hoveredCell || !this.selectedPlantKind) return;

		const valid = canPlacePlant(
			this.world,
			this.selectedPlantKind,
			this.hoveredCell.lane,
			this.hoveredCell.columnIndex,
		);
		const color = valid ? HOVER_VALID_COLOR : HOVER_INVALID_COLOR;
		const target = this.gridCells.find(
			(cell) => cell.lane === this.hoveredCell?.lane && cell.columnIndex === this.hoveredCell.columnIndex,
		);
		target?.rect.setFillStyle(color, 0.35);
	}

	private setButtonShown(
		button: Phaser.GameObjects.Rectangle,
		label: Phaser.GameObjects.Text,
		shown: boolean,
	): void {
		button.setVisible(shown);
		label.setVisible(shown);
		if (shown) {
			if (button.input) button.input.enabled = true;
			else button.setInteractive({ useHandCursor: true });
		} else {
			button.disableInteractive();
		}
	}

	private registerPlantAttackComplete(sprite: Phaser.GameObjects.Sprite): void {
		const attackKey = plantViewKeys('pea-shooter').attackAnim;
		const idleKey = plantViewKeys('pea-shooter').idleAnim;
		sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: Phaser.Animations.Animation) => {
			if (animation.key === attackKey) {
				sprite.play(idleKey);
			}
		});
	}

	private playPlantAttack(sourcePlantId: string): void {
		const sprite = this.plantViews.get(sourcePlantId);
		const plant = this.world.plants.find((item) => item.id === sourcePlantId);
		if (!sprite || !plant) return;
		sprite.play(plantViewKeys(plant.kind).attackAnim);
	}

	private playZombieDeath(sprite: Phaser.GameObjects.Sprite): void {
		sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ZOMBIE_DEATH_ANIM_KEY, () => {
			sprite.destroy();
		});
		sprite.play(ZOMBIE_DEATH_ANIM_KEY);
	}

	private playPlantDeath(sprite: Phaser.GameObjects.Sprite, kind: PlantKind): void {
		const deathKey = plantViewKeys(kind).deathAnim;
		sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + deathKey, () => {
			sprite.destroy();
		});
		sprite.play(deathKey);
	}

	private syncPlantViews(): void {
		const liveIds = new Set(this.world.plants.map((plant) => plant.id));

		for (const id of [...this.plantViews.keys()]) {
			if (liveIds.has(id)) continue;

			const sprite = this.plantViews.get(id);
			const hpText = this.plantHpViews.get(id);
			this.plantViews.delete(id);
			this.plantHpViews.delete(id);
			hpText?.destroy();

			if (sprite) {
				this.playSfx(SFX_PLANT_DEATH_KEY, SFX_PLANT_DEATH_VOLUME);
				const kind = (sprite.getData('plantKind') ?? 'pea-shooter') as PlantKind;
				this.playPlantDeath(sprite, kind);
			}
		}

		for (const plant of this.world.plants) {
			const y = laneToY(plant.lane);
			let sprite = this.plantViews.get(plant.id);
			if (!sprite) {
				const keys = plantViewKeys(plant.kind);
				sprite = this.add.sprite(plant.x, y, keys.idleSheet);
				sprite.setDisplaySize(PLANT_VIEW_WIDTH, PLANT_VIEW_HEIGHT);
				sprite.setDepth(DEPTH_SPRITE);
				sprite.play(keys.idleAnim);
				sprite.setData('plantKind', plant.kind);
				this.registerPlantAttackComplete(sprite);
				this.plantViews.set(plant.id, sprite);

				const hpText = this.add.text(plant.x, y - HP_LABEL_OFFSET_Y, String(plant.hp), {
					fontFamily: 'monospace',
					fontSize: '14px',
					color: COLOR_HP,
				});
				hpText.setOrigin(0.5, 0.5);
				hpText.setDepth(DEPTH_HP);
				this.plantHpViews.set(plant.id, hpText);
				continue;
			}

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

			if (sprite) {
				this.playSfx(SFX_ZOMBIE_DEATH_KEY, SFX_ZOMBIE_DEATH_VOLUME);
				this.playZombieDeath(sprite);
			}
		}

		for (const zombie of this.world.zombies) {
			const y = laneToY(zombie.lane);
			let sprite = this.zombieViews.get(zombie.id);
			if (!sprite) {
				const size = zombieViewSize(zombie.kind);
				sprite = this.add.sprite(zombie.x, y, ZOMBIE_SHEET_KEY);
				sprite.setDisplaySize(size.width, size.height);
				sprite.setDepth(DEPTH_SPRITE);
				sprite.play(ZOMBIE_WALK_ANIM_KEY);
				this.zombieViews.set(zombie.id, sprite);

				const hpText = this.add.text(zombie.x, y - HP_LABEL_OFFSET_Y, String(zombie.hp), {
					fontFamily: 'monospace',
					fontSize: '14px',
					color: COLOR_HP,
				});
				hpText.setOrigin(0.5, 0.5);
				hpText.setDepth(DEPTH_HP);
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
				sprite.setDepth(DEPTH_SPRITE);
				sprite.play(PEA_FLY_ANIM_KEY);
				this.projectileViews.set(projectile.id, sprite);
				this.playPlantAttack(projectile.sourcePlantId);
				this.playSfx(SFX_PEA_SHOOT_KEY, SFX_PEA_SHOOT_VOLUME);
				continue;
			}

			sprite.x = projectile.x;
		}
	}

	private syncHud(): void {
		this.sunText.setText(`阳光：${this.world.sun}`);
		this.hintText.setText(this.hint);

		if (this.world.gameStatus === 'preparing') {
			this.waveText.setText('准备阶段');
		} else {
			this.waveText.setText(`Wave ${this.world.waveIndex + 1} / ${WAVE_COUNT}`);
		}

		const preparing = this.world.gameStatus === 'preparing';
		const terminal = this.world.gameStatus === 'victory' || this.world.gameStatus === 'game-over';

		if (terminal) this.stopBgm();

		this.setButtonShown(this.startButton, this.startLabel, preparing);
		this.setButtonShown(this.restartButton, this.restartLabel, terminal);

		this.cardBg.setStrokeStyle(2, this.selectedPlantKind ? CARD_SELECTED_COLOR : GRID_STROKE_COLOR);

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
		const events = stepWorld(this.world, dt);

		for (let i = 0; i < events.projectileHitCount; i++) {
			this.playSfx(SFX_PEA_HIT_KEY, SFX_PEA_HIT_VOLUME);
		}

		this.handleStatusTransition();
		this.syncPlantViews();
		this.syncZombieViews();
		this.syncProjectileViews();
		this.syncHud();
		if (this.selectedPlantKind && this.hoveredCell) this.updateGridHover();
	}

	private handleStatusTransition(): void {
		const status = this.world.gameStatus;
		const wasPlaying = this.previousGameStatus === 'playing';

		if (wasPlaying && status === 'victory') {
			this.stopBgm();
			this.playSfx(SFX_VICTORY_KEY, SFX_VICTORY_VOLUME);
		} else if (wasPlaying && status === 'game-over') {
			this.stopBgm();
			this.playSfx(SFX_GAME_OVER_KEY, SFX_GAME_OVER_VOLUME);
		}

		this.previousGameStatus = status;
	}
}
