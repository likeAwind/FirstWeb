import { HIT_DISTANCE, PROJECTILE_MIN_X } from './constants';
import type { ProjectileState, WorldState, ZombieState } from './types';

function findSweptHit(projectile: ProjectileState, prevX: number, zombies: ZombieState[]): ZombieState | null {
	const lo = projectile.x - HIT_DISTANCE;
	const hi = prevX + HIT_DISTANCE;
	let best: ZombieState | null = null;

	for (const zombie of zombies) {
		if (zombie.hp <= 0) continue;
		if (zombie.lane !== projectile.lane) continue;
		if (zombie.x < lo || zombie.x > hi) continue;
		if (!best || zombie.x > best.x) best = zombie;
	}

	return best;
}

export function stepExistingProjectiles(world: WorldState, dt: number): Set<string> {
	const expiredIds = new Set<string>();

	for (const projectile of world.projectiles) {
		const prevX = projectile.x;
		projectile.x -= projectile.speed * dt;

		const hit = findSweptHit(projectile, prevX, world.zombies);
		if (hit) {
			hit.hp -= projectile.damage;
			expiredIds.add(projectile.id);
			continue;
		}

		if (projectile.x < PROJECTILE_MIN_X) {
			expiredIds.add(projectile.id);
		}
	}

	return expiredIds;
}
