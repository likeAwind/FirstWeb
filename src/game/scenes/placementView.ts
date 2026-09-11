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
}

export function plantViewKeys(kind: PlantKind): PlantViewKeys {
	switch (kind) {
		case 'pea-shooter':
			return {
				idleSheet: PLANT_IDLE_SHEET_KEY,
				idleAnim: PLANT_IDLE_ANIM_KEY,
				attackAnim: PLANT_ATTACK_ANIM_KEY,
				deathAnim: PLANT_DEATH_ANIM_KEY,
			};
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
