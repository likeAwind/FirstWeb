# MVP-4 Plan：豌豆射手动画 + Projectile

先不要执行代码。等明确回复「批准执行」后再改。

把绿色植物 Rectangle 换成豌豆射手 Sprite（idle / attack），并把「开火瞬间扣血」改成：**core 生成豌豆 → 向左飞 → 命中同 lane 僵尸才扣 HP**。

素材目录移动是既定输入：**不恢复** `public/game/zombie/walk.png` / `die.png`。僵尸改用 `/game/zombie/basic/...`。不生成、不修改 PNG。执行时先核对真实像素；不符则停。

`pea-shooter/die.png` **本阶段不接**（没有植物死亡规则）。

---

## 1. 当前 direct-damage 在哪

`src/game/core/combat.ts` 的 `applyPlantAttacks`：cooldown 到 0 且 `findTarget()` 有目标时：

```ts
target.hp -= plant.attackDamage;
```

`findTarget`（同 lane、`hp > 0`、`x < plant.x`、取最大 x）保留，只用来决定**是否开火**，不再直接打伤害。

Scene 不写 `hp -=`。植物目前仍是 `add.rectangle`。僵尸 URL 仍是旧的 `/game/zombie/walk.png`（文件已不在该路径）——执行时必须改 View URL。

---

## 2. 新数据模型

**足够，且尽量小：**

```ts
interface ProjectileState {
  id: string;
  lane: LaneId;
  x: number;
  speed: number;
  damage: number;
  sourcePlantId: string;
}

interface WorldState {
  plants: PlantState[];
  zombies: ZombieState[];
  projectiles: ProjectileState[];
  nextProjectileId: number;
}
```

| 字段 | 决定 |
|---|---|
| `sourcePlantId` | **要。** core 命中不用它；Scene 用它给对应植物播 attack |
| `kind: 'pea'` | **不要。** 只有一种子弹 |
| `targetId` | **不要。** 沿 lane 飞，碰到谁打谁，不锁定开火时的目标 |
| `nextProjectileId` | 从 1 递增；`id = \`pea-${nextProjectileId++}\``，一局里唯一、不靠 Date/DOM |

`createInitialWorld()`：`projectiles: []`，`nextProjectileId: 1`。

---

## 3. 发射 / 移动 / 命中

**开火（复用 cooldown + findTarget）：** 有合法目标且 cooldown≤0 → 生成一颗 pea，然后 `attackCooldown = attackInterval`。没目标不生成。

**spawn x（纯逻辑）：** `plant.x - PROJECTILE_SPAWN_OFFSET_X`，`OFFSET = 28`。core 不知道炮口像素；28 大约让豌豆出现在植物中心左侧。

**速度：** `PEA_SPEED = 320`（僵尸 48）。肉眼能看清飞行，又明显更快。frameRate 不准带动 `x`。

**移动：** `projectile.x -= speed * dt`（右→左）。

**命中：同 lane + 存活 + 1D 扫掠（防穿透）。**  
dt 上限 0.05 时，一帧最多飞 `320*0.05=16`。只比 `abs(p.x-z.x)` 可能漏。做法：

```
prevX = x（移动前）
x -= speed * dt
命中：同 lane、hp>0，且 zombie.x 落在 [x - HIT_DISTANCE, prevX + HIT_DISTANCE]
HIT_DISTANCE = 20
```

同帧多只合法僵尸：取 **x 最大**（从右飞来最先碰到的）。打一次伤害并标记删除；真正从数组移除放在步骤 3。

**出界：** `x < PROJECTILE_MIN_X`（`0`）则删除。禁止子弹永远留在数组里。

**创建当帧：** 新 pea 只进数组、不移动、不检测命中。靠 `stepWorld` 顺序保证（先处理本帧开始前已有的 pea，再 spawn），**不要** `justSpawned` / `age` / `spawnedThisFrame`。下一帧才开始飞和命中。

---

## 4. `stepWorld` 顺序

```
1. 僵尸移动（现有）
2. 更新本帧开始前已经存在的 Projectile：
   - 记 prevX → 左移
   - 扫掠命中检测
   - 命中则扣 HP 并标记删除
   - 出界标记删除
3. 清理死亡 Zombie 和失效 Projectile
   - zombies = filter(hp > 0)
   - 去掉已命中 / 出界的 projectile
4. 更新 Plant cooldown / findTarget
5. 可攻击则创建新的 Projectile（不扣血、不移动）
6. 新创建 Projectile 下一帧才进入步骤 2
```

不在遍历里 splice。伤害只在 core 命中处发生。

因为 spawn 放在「已有 pea 的移动/命中」之后，本帧新建的 pea 不会被步骤 2 扫到。不用额外标记字段。

**文件：** 保留 `combat.ts` 的 `findTarget` + 把 `applyPlantAttacks` 改成发射；新增轻量 `core/projectiles.ts`（移动、命中、出界）。`update.ts` 编排。不拆 ECS。

---

## 5. Phaser View

**植物：** `plantViews: Map<id, Sprite>`。idle 循环。

每个植物 Sprite **创建时**注册一个稳定的 `animationcomplete` 监听（只挂一次，不随开火增减）：

- 若完成的动画是 attack → `play(idle)`
- 其他动画（idle 循环）忽略

后续开火：core 新 projectile 出现时用 `sourcePlantId` 找到 Sprite，只负责 `play` / **restart attack**（`repeat: 0`）。不要每次开火再 `once(animationcomplete)`，避免 listener 堆积。无状态机。

开火由 core 决定；attack 只是反馈。不能用第 N 帧去调 core。

**豌豆：** `projectileViews: Map<id, Sprite>`。  
新 id → 创建 Sprite、`play(pea-fly)`、顺带触发植物 attack；仍在 → `sprite.x = projectile.x`；id 没了 → `destroy` + delete。不每帧重建。

**僵尸：** 行为不变（walk / death 残留）。只改 URL 为 `/game/zombie/basic/walk.png`、`die.png`。

**同步顺序（update）：** `stepWorld` → 清缺失 zombie（播 die）→ 同步存活 zombie/HP → **补新建 pea / 删缺失 pea** → 同步 pea.x → 植物位置不动（x 恒定）。

---

## 6. 动画与显示（仅 view.ts）

| | idle | attack | pea-fly | zombie walk/die |
|---|---|---|---|---|
| URL | `/game/plants/pea-shooter/idle.png` | `.../attack.png` | `/game/projectiles/pea-fly.png` | `/game/zombie/basic/walk.png` / `die.png` |
| 切帧 | 48×48，0–7 | 同左 | **24×12，0–3** | 48×48，0–7 |
| repeat | -1 | 0 | -1 | walk -1 / die 0 |
| fps | 10 | 10 | 12 | 10 |
| 显示 | 植物 64×64 | | **豌豆 24×12（素材原尺寸，不放大）** | 僵尸仍 64×64 |

豌豆第一版显示 **24×12**，与切帧一致。若试玩太小，以后只改 View 常量，不改 core。

`anims.exists` 后再 create，防 HMR 重复注册。

植物 Rectangle 常量可留着不用，或改成 64 给 Sprite。`COLOR_PLANT` 不再画植物。

---

## 7. 文件范围

**新增**

- `src/game/core/projectiles.ts` — 移动 / 命中 / 出界

**修改**

- `core/types.ts` — `ProjectileState`，`WorldState.projectiles` + `nextProjectileId`
- `core/constants.ts` — `PEA_SPEED`、`PROJECTILE_SPAWN_OFFSET_X`、`HIT_DISTANCE`、`PROJECTILE_MIN_X`
- `core/world.ts` — 初始空数组
- `core/combat.ts` — 开火改为 spawn，删除 `hp -=`
- `core/update.ts` — 接入 projectile 步进
- `core/index.ts` — 导出新类型/常量
- `scenes/view.ts` — 植物/豌豆 sheet 与 key；僵尸新路径
- `scenes/GameScene.ts` — plant/projectile Map；创建时挂稳定 complete；idle/attack；pea 24×12；僵尸 URL 随 view 常量

**不改 / 不生成**

- `public/**`（含不恢复旧 zombie 根目录、不接 plant die）
- `main.ts`、`config.ts`、Astro、`package.json`
- **执行阶段不改** `docs/phaser-plan.md`

---

## 8. 未来 Wave

本阶段的「core 数组增删 id → Scene Map 创建/销毁 Sprite」可复用到动态 zombie spawn。  
**本阶段不实现 Wave / spawn timer。**

---

## 9. 实施步骤（批准后）

1. 核对 PNG 尺寸（植物 384×48、pea 96×12、僵尸 384×48）；不符则停。  
2. 改 types / constants / world。  
3. combat 改发射；写 `projectiles.ts`；串 `stepWorld`。  
4. view 常量 + 僵尸新 URL。  
5. GameScene：preload 植物 idle/attack + pea-fly；Maps；植物创建时挂稳定 complete 监听；同步。  
6. 确认 core 无 Phaser；Scene 无 `hp -=`；无 Physics。  
7. 按验收验证。

---

## 10. 验证

见 prompt 第 17 节全部条目。手工重点：开火瞬间 HP **不变**；新 pea 当帧停在炮口、下一帧才飞；豌豆飞到僵尸身上才掉血；飞出左边 pea 消失；显示 24×12；attack 完回 idle（连续开火不堆积 complete 监听）；僵尸走 `/game/zombie/basic/`；`npm.cmd run build`；`/` 不变。

---

## 11. 风险

| 风险 | 应对 |
|---|---|
| 旧 zombie 路径 404 | 只改 view URL，不恢复旧文件 |
| 仍直接扣血 | 删掉 combat 里 `target.hp -=` |
| 高速穿模 | 扫掠 + HIT_DISTANCE |
| 幽灵 pea | 出界/命中都从数组删，Scene 跟 id |
| attack 动画驱动开火 | 禁止；只跟新 projectile id |
| 连续开火叠动画 | restart attack；complete 监听只注册一次 |
| complete listener 堆积 | 禁止每次开火 `once`；创建 Sprite 时挂稳定监听 |
| spawn 当帧命中 | spawn 放在已有 pea 步进之后，无额外字段 |
| 误接 plant die | 不 preload / 不 play |
| HMR 重复 anim | `anims.exists` |

不做：植物死亡、僵尸打植物、爆炸、多种单位、AOE/DOT、Wave、放置、Game Over、物理、音效、新依赖、状态机。
