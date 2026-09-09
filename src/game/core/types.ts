export type LaneId = 0 | 1 | 2;

export interface PlantState {
	id: string;
	lane: LaneId;
	x: number;
	hp: number;
}

export interface ZombieState {
	id: string;
	lane: LaneId;
	x: number;
	hp: number;
	speed: number;
	reachedEnd: boolean;
}

export interface WorldState {
	plants: PlantState[];
	zombies: ZombieState[];
}
