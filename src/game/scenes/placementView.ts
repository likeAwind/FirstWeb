import { LANE_COUNT, PLANT_COLUMN_COUNT, PLANT_GRID_XS, WORLD_WIDTH } from '../core';
import type { LaneId, PlantKind } from '../core';
import {
	GAME_HEIGHT,
	GRID_CELL_HEIGHT,
	GRID_CELL_WIDTH,
	PLAYFIELD_TOP,
	PLANT_ATTACK_ANIM_KEY,
	PLANT_DEATH_ANIM_KEY,
	PLANT_IDLE_ANIM_KEY,
	PLANT_IDLE_SHEET_KEY,
	PLANT_VIEW_HEIGHT,
	PLANT_VIEW_WIDTH,
	SUNFLOWER_DIE_ANIM_KEY,
	SUNFLOWER_HURT_ANIM_KEY,
	SUNFLOWER_IDLE_ANIM_KEY,
	SUNFLOWER_IDLE_SHEET_KEY,
	SUNFLOWER_PRODUCE_ANIM_KEY,
	laneToY,
} from './view';

export interface GridCellHit {
	lane: LaneId;
	columnIndex: number;
}

export interface PlantViewKeys {
	idleSheet: string;
	idleAnim: string;
	attackAnim: string;
	deathAnim: string;
	produceAnim?: string;
	hurtAnim?: string;
}

export interface PlantPlaceholderStyle {
	width: number;
	height: number;
	tint: number | null;
}

const PEA_SHOOTER_VIEW_KEYS: PlantViewKeys = {
	idleSheet: PLANT_IDLE_SHEET_KEY,
	idleAnim: PLANT_IDLE_ANIM_KEY,
	attackAnim: PLANT_ATTACK_ANIM_KEY,
	deathAnim: PLANT_DEATH_ANIM_KEY,
};

const SUNFLOWER_VIEW_KEYS: PlantViewKeys = {
	idleSheet: SUNFLOWER_IDLE_SHEET_KEY,
	idleAnim: SUNFLOWER_IDLE_ANIM_KEY,
	attackAnim: PLANT_ATTACK_ANIM_KEY,
	deathAnim: SUNFLOWER_DIE_ANIM_KEY,
	produceAnim: SUNFLOWER_PRODUCE_ANIM_KEY,
	hurtAnim: SUNFLOWER_HURT_ANIM_KEY,
};

export function plantViewKeys(kind: PlantKind): PlantViewKeys {
	switch (kind) {
		case 'sunflower':
			return SUNFLOWER_VIEW_KEYS;
		case 'pea-shooter':
		case 'wall-nut':
		case 'snow-pea':
			return PEA_SHOOTER_VIEW_KEYS;
	}
}

export function plantPlaceholderStyle(kind: PlantKind): PlantPlaceholderStyle {
	switch (kind) {
		case 'pea-shooter':
			return { width: PLANT_VIEW_WIDTH, height: PLANT_VIEW_HEIGHT, tint: null };
		case 'sunflower':
			return { width: PLANT_VIEW_WIDTH, height: PLANT_VIEW_HEIGHT, tint: null };
		case 'wall-nut':
			return { width: 72, height: 72, tint: 0xb45309 };
		case 'snow-pea':
			return { width: PLANT_VIEW_WIDTH, height: PLANT_VIEW_HEIGHT, tint: 0x38bdf8 };
	}
}

export function hitTestPlantCell(px: number, py: number): GridCellHit | null {
	if (px < 0 || py < PLAYFIELD_TOP || px > WORLD_WIDTH || py > GAME_HEIGHT) return null;

	let lane: LaneId | null = null;
	for (let i = 0; i < LANE_COUNT; i++) {
		const laneId = i as LaneId;
		if (Math.abs(py - laneToY(laneId)) <= GRID_CELL_HEIGHT / 2) {
			lane = laneId;
			break;
		}
	}
	if (lane === null) return null;

	for (let columnIndex = 0; columnIndex < PLANT_COLUMN_COUNT; columnIndex++) {
		if (Math.abs(px - PLANT_GRID_XS[columnIndex]) <= GRID_CELL_WIDTH / 2) {
			return { lane, columnIndex };
		}
	}

	return null;
}
