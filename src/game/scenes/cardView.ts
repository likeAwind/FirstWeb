import Phaser from 'phaser';
import { PLANT_CONFIG, PLANT_KINDS } from '../core';
import type { PlantKind, WorldState } from '../core';
import {
	CARD_DISABLED_ALPHA,
	CARD_FILL_COLOR,
	CARD_SELECTED_COLOR,
	COLOR_UI,
	DEPTH_UI,
	GRID_STROKE_COLOR,
	HUD_CARD_GAP,
	HUD_CARD_HEIGHT,
	HUD_CARD_START_X,
	HUD_CARD_WIDTH,
	HUD_CARD_Y,
} from './view';

export interface CardView {
	kind: PlantKind;
	bg: Phaser.GameObjects.Rectangle;
	nameText: Phaser.GameObjects.Text;
	costText: Phaser.GameObjects.Text;
	cooldownText: Phaser.GameObjects.Text;
}

export const PLANT_CARD_LABELS: Record<PlantKind, string> = {
	'pea-shooter': '豌豆射手',
	sunflower: '向日葵',
	'wall-nut': '坚果',
	'snow-pea': '寒冰射手',
};

export function cardCenterX(index: number): number {
	return HUD_CARD_START_X + HUD_CARD_WIDTH / 2 + index * (HUD_CARD_WIDTH + HUD_CARD_GAP);
}

export function createCardViews(scene: Phaser.Scene): CardView[] {
	return PLANT_KINDS.map((kind, index) => {
		const x = cardCenterX(index);
		const config = PLANT_CONFIG[kind];

		const bg = scene.add.rectangle(x, HUD_CARD_Y, HUD_CARD_WIDTH, HUD_CARD_HEIGHT, CARD_FILL_COLOR);
		bg.setStrokeStyle(2, GRID_STROKE_COLOR);
		bg.setInteractive({ useHandCursor: true });
		bg.setDepth(DEPTH_UI);

		const nameText = scene.add
			.text(x, HUD_CARD_Y - 18, PLANT_CARD_LABELS[kind], {
				fontFamily: 'sans-serif',
				fontSize: '12px',
				color: COLOR_UI,
			})
			.setOrigin(0.5, 0.5)
			.setDepth(DEPTH_UI);

		const costText = scene.add
			.text(x, HUD_CARD_Y + 2, `${config.cost} 阳光`, {
				fontFamily: 'sans-serif',
				fontSize: '12px',
				color: COLOR_UI,
			})
			.setOrigin(0.5, 0.5)
			.setDepth(DEPTH_UI);

		const cooldownText = scene.add
			.text(x, HUD_CARD_Y + 20, '', {
				fontFamily: 'sans-serif',
				fontSize: '11px',
				color: COLOR_UI,
			})
			.setOrigin(0.5, 0.5)
			.setDepth(DEPTH_UI);
		cooldownText.setVisible(false);

		return { kind, bg, nameText, costText, cooldownText };
	});
}

export function syncCardBar(
	cards: CardView[],
	world: WorldState,
	selectedPlantKind: PlantKind | null,
): void {
	const playing = world.gameStatus === 'playing';

	for (const card of cards) {
		const config = PLANT_CONFIG[card.kind];
		const cooldown = world.cardCooldowns[card.kind];
		const selected = selectedPlantKind === card.kind;
		const unaffordable = world.sun < config.cost;
		const onCooldown = playing && cooldown > 0;
		const dimmed = unaffordable || onCooldown;

		card.bg.setStrokeStyle(2, selected ? CARD_SELECTED_COLOR : GRID_STROKE_COLOR);

		const alpha = dimmed ? CARD_DISABLED_ALPHA : 1;
		card.bg.setAlpha(alpha);
		card.nameText.setAlpha(alpha);
		card.costText.setAlpha(alpha);
		card.cooldownText.setAlpha(alpha);

		if (playing && cooldown > 0) {
			card.cooldownText.setText(`${cooldown.toFixed(1)}s`);
			card.cooldownText.setVisible(true);
		} else {
			card.cooldownText.setVisible(false);
		}
	}
}
