import { END_X } from './constants';
import type { WorldState } from './types';

export function stepWorld(world: WorldState, dt: number): void {
	for (const zombie of world.zombies) {
		if (zombie.reachedEnd) continue;

		zombie.x += zombie.speed * dt;

		if (zombie.x >= END_X) {
			zombie.x = END_X;
			zombie.reachedEnd = true;
		}
	}
}
