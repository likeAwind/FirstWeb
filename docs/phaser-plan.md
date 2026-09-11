# MVP-7 Plan：四植物阵容 + 卡牌冷却 + 向日葵经济 + 坚果防线 + 寒冰减速 + 第四波

先不要执行代码。等明确回复「批准执行」后再改 `src/**`。

把「只有豌豆射手」升级成第一版有策略差异的阵容：输出 / 经济 / 防御 / 控制。不生成、不修改 PNG 或音频。不新依赖、不 Physics、不用 Phaser Timer / `setInterval` / `Date.now` 当玩法钟。不建 ECS / Manager / class 层级。

---

## 0. 当前真实基线

已读 `src/game/core/**`、`src/game/scenes/**`、`src/components/GameMount.astro`、现有 `docs/phaser-plan.md`。

**Git（只记录，Plan 阶段不 commit/push）：** `game-phaser4-mvp` 相对 origin **ahead 1**。最新本地提交 `83f7694 完成 MVP-6 HUD 优化与音频系统接入`。工作树干净。HUD + Audio **已经落地并提交**，不要把未完成旧工作和 MVP-7 混在一起。未 push 不等于代码缺失。

**PlantKind：** 仅 `'pea-shooter'`。

**PLANT_CONFIG：** `Record<PlantKind, { hp, attackDamage, attackInterval, cost }>`。豌豆 `hp 5 / dmg 1 / interval 1 / cost 100`。无 `behavior`、无 `cardCooldown`、无产阳光字段。

**PlantState：** `id, kind, lane, columnIndex, x, hp, attackDamage, attackInterval, attackCooldown`。无 `productionCooldown`。

**ProjectileState：** 无 `kind`。同 lane、向左飞、swept hit、无 `targetId`。

**ZombieState：** 无 `slowRemaining`。`findBlockingPlant`：同 lane、hp>0、`plant.x >= zombie.x`、取最小 x。接触钳制：已在接触内不向左瞬移。

**WorldState：** 无 `cardCooldowns`。有 `sun`、`sunIncomeElapsed`、三个 nextId、`gameStatus`、Wave runtime。

**PlacementError：** `'invalid-status' | 'invalid-cell' | 'occupied' | 'insufficient-sun'`。无卡牌冷却错误。`validatePlacement` 顺序：status → cell → occupancy → sun。失败不扣阳光、不 push。

**placePlant：** 成功才扣阳光并 push。攻击三字段一律从 config 拷贝，`attackCooldown = 0`。

**stepSunIncome：** 仅 playing，+25 / 3s，`STARTING_SUN = 300`。

**applyPlantAttacks：** **对数组里每一株都减 cooldown 并可能发射**。这是 MVP-7 必须改掉的点：向日葵 / 坚果若只靠 `attackDamage=0` 仍会走发射分支（`findTarget` 成功就会 spawn）。必须以 `behavior === 'shooter'` 判断。

**stepWorld（playing）：** 被动阳光 → 僵尸 → 滤死植物 → GO 则清空豌豆并 return 0 hits → 豌豆 → 滤死尸/过期豌豆 → 植物攻击 → Wave。`WorldStepEvents` 仅 `{ projectileHitCount }`（pea-hit SFX）。

**Waves：** 3 波。W1 三路 basic；W2 两波三路齐出；W3 中路 fat + 边路 escort。胜利条件不变。

**View：** Canvas `768×576`（HUD 96 + 战场 480）。`GameMount.astro` 已是该高度，本阶段不改。单卡在 HUD 中央 `148×76`（`HUD_CARD_X = 384`），开始按钮右侧。`plantViewKeys` 只处理 `'pea-shooter'`。植物动态 Map；新豌豆 View 时 `playPlantAttack(sourcePlantId)` + pea-shoot SFX。无 tint。键盘仅 ESC。`GameScene.ts` 约 787 行。

**Audio：** BGM 在 `startBattle` 成功后 loop 0.35；终端 / shutdown 停。SFX 走 `this.sound.play`。终局 SFX 靠 `previousGameStatus` 从 playing 切出一次。Restart 不因 Scene destroy 误播死亡音。这些必须回归，本阶段不加新音频。

**已可复用、预计少改：** `findBlockingPlant`、接触钳制、动态 View Map、植物 death（先出 Map 再播 die）、attack complete → idle、hover 走 `canPlacePlant`、成功种植清选择 / 失败保留选择、pointer 与 ESC 的 SHUTDOWN `off`。

---

## 1. 类型与配置（唯一真相）

### PlantKind

```ts
type PlantKind = 'pea-shooter' | 'sunflower' | 'wall-nut' | 'snow-pea';
```

配套常量（卡牌栏顺序 = 数字键 1~4）：

```ts
const PLANT_KINDS = ['pea-shooter', 'sunflower', 'wall-nut', 'snow-pea'] as const;
```

### ProjectileKind

```ts
type ProjectileKind = 'pea' | 'snow-pea';
```

不新增 `PROJECTILE_CONFIG`：两种弹速度、偏移、伤害来源都与现豌豆相同，单独配表只会多一层无分支的查找。

### Discriminated union config（采用）

避免 sunflower / wall-nut 上堆 `attackDamage?` 可选汤。不允许 class / ECS。

```ts
type PlantConfigBase = { hp: number; cost: number; cardCooldown: number };

type ShooterPlantConfig = PlantConfigBase & {
  behavior: 'shooter';
  attackDamage: number;
  attackInterval: number;
  projectileKind: ProjectileKind;
};

type ProducerPlantConfig = PlantConfigBase & {
  behavior: 'producer';
  sunAmount: number;
  sunInterval: number;
};

type BlockerPlantConfig = PlantConfigBase & { behavior: 'blocker' };

type PlantConfig = ShooterPlantConfig | ProducerPlantConfig | BlockerPlantConfig;

const PLANT_CONFIG: Record<PlantKind, PlantConfig> = { /* 见下表 */ };
```

战斗里用 `PLANT_CONFIG[plant.kind].behavior === 'shooter'` 再收窄，读取 `projectileKind`。

### 四种植物数值（本阶段定稿，执行时按此写入）

| kind | 职责 | hp | cost | cardCooldown | 其它 |
|---|---|---|---|---|---|
| `pea-shooter` | shooter | 5 | 100 | 2.5s | dmg 1，interval 1.0，弹 `pea` |
| `sunflower` | producer | 4 | 50 | 5s | +25 / 6s，不攻击 |
| `wall-nut` | blocker | 20 | 75 | 6s | 不攻击 |
| `snow-pea` | shooter | 5 | 150 | 4s | dmg 1，interval 1.25，弹 `snow-pea` |

被动阳光 **保持**：`STARTING_SUN = 300`，+25 / 3s。向日葵是额外加速器，不是唯一经济。

### Slow 常量

```ts
SLOW_DURATION = 3
SLOW_MULTIPLIER = 0.5
```

只改移动速度，不改 `attackDamage` / `attackInterval` / `attackCooldown`。

### PlantState runtime

在现有字段上 **固定增加** `productionCooldown: number`（所有植物都有，避免 runtime 再拆 union）：

- shooter / blocker：恒为 `0`，生产循环跳过
- producer：新种时设为 `sunInterval`（6），**不当帧给阳光**；之后每产一次再 `+= sunInterval`

shooter 的 `attackDamage` / `attackInterval` 仍在种植时从 config 拷贝；非 shooter 写 `0`。`attackCooldown` 初值 `0`。不以 `attackDamage===0` 当行为开关。

### ProjectileState

新增 `kind: ProjectileKind`。保留 `id, lane, x, speed, damage, sourcePlantId`。仍无 `targetId`。

### ZombieState

新增 `slowRemaining: number`，出生 `0`。

### WorldState

新增 `cardCooldowns: Record<PlantKind, number>`。`createInitialWorld()` 四种皆 `0`。其余初始值与现在相同（空植物、preparing、阳光 300）。

### PlacementError

增加 `'card-cooldown'`。`PlacePlantResult` 仍是 `'placed' | PlacementError`。

### WorldStepEvents

**不扩展。** 寒冰弹发射 / 命中继续走 pea-shoot / pea-hit。Scene 不需要知道弹种来播 SFX。

---

## 2. 种植校验与卡牌冷却

逻辑继续只在 `plants.ts`。Scene 只调用 `placePlant` / `canPlacePlant`，不复制规则。

### preparing 为什么 bypass cooldown

准备阶段要保留「阳光够、格子空就能连种」。Cooldown 是战斗中的补种节流，不是开局税。preparing 成功种植：**不写入** `cardCooldowns[kind]`。playing 成功种植：`cardCooldowns[kind] = config.cardCooldown`。

### validatePlacement 最终顺序

1. `invalid-status`（非 preparing/playing）
2. `invalid-cell`
3. `occupied`
4. `insufficient-sun`
5. `card-cooldown`：**仅当** `gameStatus === 'playing'` 且 `cardCooldowns[kind] > 0`

任一步失败立即 return，**不扣阳光、不 push、不改 cooldown**。

`canPlacePlant` 仍是 `validatePlacement === null`，hover 自动覆盖阳光不足 / 冷却 / 占用 / 终局。

### stepCardCooldowns

仅 playing：对 `PLANT_KINDS` 做 `max(0, cd - dt)`。preparing / 终局不减（终局 `stepWorld` 本就不会进）。放在 `stepWorld` 植物攻击之后、Wave 之前，保证每帧确定性；放置发生在指针回调（帧间），与减 CD 不打架。

每种卡独立。A 在冷却不影响 B。

---

## 3. 向日葵生产

新函数 `stepPlantProduction(world, dt)`，**放在 `plants.ts`**（该文件约 96 行，加上生产 + 卡 CD 仍可读）。不新建 `plantProduction.ts`。

规则：

- 仅 `gameStatus === 'playing'`
- 仅 `behavior === 'producer'` 且仍在 `world.plants` 里（hp>0）
- `productionCooldown -= dt`；`while <= 0`：`sun += sunAmount`，`productionCooldown += sunInterval`
- 两株各自计时
- 不用 Timer / Date

**第一次生产：** 种植时 `productionCooldown = 6`，需完整 6 秒。

**死亡同帧：** 见下一节顺序——生产在死植物过滤 **之后**。本帧被打死的向日葵已不在数组里，不产阳光。preparing / 终局不走进 `stepWorld` 生产。

本阶段不做 +25 飘字、不新产阳光音效。HUD 阳光数字增加即可。

---

## 4. 坚果、寒冰、Slow

### Wall-nut

高 HP 植物，无特殊减伤 / 护甲 / 治疗。`applyPlantAttacks` 跳过 `blocker`，永不 spawn。僵尸仍用现有 `findBlockingPlant`：同路前方最近（最小 x）的活植物。坚果在射手前面时先吃伤害；死后僵尸继续走，后排射手照常打（寒冰 / 豌豆找的是同路、`zombie.x < plant.x` 的最近僵尸，与坚果无关）。

### applyPlantAttacks

```
for plant of plants:
  config = PLANT_CONFIG[plant.kind]
  if config.behavior !== 'shooter': continue
  减 attackCooldown；就绪且 findTarget 成功则 spawn
  projectile.kind = config.projectileKind
  projectile.damage = config.attackDamage（种植时已拷贝，spawn 用 plant.attackDamage 亦可）
  attackCooldown = attackInterval
```

向日葵 / 坚果：不减攻击 CD、不 `findTarget`、不 spawn → 不会 `playPlantAttack`、不会 pea-shoot。现有「新 Projectile View → sourcePlantId → attack + SFX」自然保证这一点，但 combat 必须先不造弹。

豌豆 id 仍 `pea-${nextProjectileId++}`（历史前缀，不改协议）。

### 命中与 Slow

`stepExistingProjectiles` 保持 swept 1D、过界不计 hit。命中时：

1. `hit.hp -= damage`（两种弹都是 1）
2. 若 `projectile.kind === 'snow-pea'`：`hit.slowRemaining = SLOW_DURATION`（**刷新为 3 秒**，不叠乘。因上限就是 3，与 `max(current, 3)` 等价，写刷新更直观）
3. 记 expired + `hitCount++`

普通豌豆不改 `slowRemaining`。

### Slow 在僵尸步进里

`stepExistingZombies` **开头**（每只活且未到终点的僵尸）：

```
slowRemaining = max(0, slowRemaining - dt)
effectiveSpeed = slowRemaining > 0 ? speed * 0.5 : speed
```

之后 `findBlockingPlant` / 接触钳制 / 移动 / 攻击全部用 `effectiveSpeed` 替代原来的 `zombie.speed * dt`。攻击间隔与伤害仍用原字段。

本帧 projectile phase 才命中 → Slow 从 **下一帧** 僵尸移动生效。不调换 `stepWorld` 现有大顺序去追求同帧减速。

---

## 5. 最终 stepWorld 顺序（仅 playing）

1. `stepSunIncome`（被动阳光）
2. `stepExistingZombies`（先减 Slow，再用有效速度）
3. 过滤死植物
4. 有 `reachedEnd` → `game-over`，清空豌豆，return `{ projectileHitCount: 0 }`
5. `stepExistingProjectiles`（寒冰在此刷新 Slow；hitCount 供 SFX）
6. 过滤死尸 / 过期豌豆
7. `stepPlantProduction`（死向日葵已过滤，本帧不产）
8. `applyPlantAttacks`
9. `stepCardCooldowns`
10. `stepWaves`

非 playing：仍立即 return 空 events（preparing / 终局都不产阳光、不减卡 CD、不 Slow tick——终局僵尸本就停着，Restart 会重建 world）。

---

## 6. Wave 4

**前三波不改**（回归基线）。`WAVE_COUNT` 随 `WAVES.length` 自动变 4。

现 W1~W3 清场串行大约：W1 ~14s + W2 ~17s + W3 fat 走完 ~22s ≈ **53s**。第四波目标把总时长收到约 **75~80s**，并让「三路最右各一豌豆」不再是最稳策略。

### Wave 4 spawn 表

| at (s) | lane | kind |
|---|---|---|
| 0.0 | 0 | fat |
| 0.4 | 2 | fat |
| 1.5 | 1 | basic |
| 2.5 | 1 | basic |
| 4.0 | 1 | fat |
| 5.0 | 0 | basic |
| 5.5 | 2 | basic |
| 7.0 | 0 | basic |
| 7.5 | 2 | basic |

### 平衡理由

- 边路各 1 fat + 2 basic ≈ 28 HP。最右列豌豆约 1 dps；fat 走到接触约 20.7s，单路有效输出约 21 < 28，**纯三豌豆边路很容易漏**。
- 中路先两只 basic 再 fat，压力小于边路，但仍要补种或减速才稳。
- 坚果（20 HP）能吃掉接触后的伤害窗口；寒冰把移动打到 0.5×，接触时间拉长，三路输出够把 fat 磨死；向日葵加速战斗中补种。
- 最后一只 fat 在 4s 出，走完约 26s → 总关卡约 **79s**，落在 60~80s。
- 不新僵尸种类、不随机。

胜利条件不变：最后一波 spawn 完且场上无僵尸 → victory 并清空豌豆。

---

## 7. View（无新 PNG）

### 植物 placeholder

四种 **复用** 现有豌豆 idle / attack / die。`plantViewKeys(kind)` 对四种都返回同一套 key（exhaustive switch，禁止漏 kind 掉进空分支）。

在 `placementView.ts` 增加纯数据 `plantPlaceholderStyle(kind)`（core 不知颜色）：

| kind | tint | 显示尺寸 |
|---|---|---|
| pea-shooter | 无（`clearTint`） | 64×64 |
| sunflower | `0xfacc15` | 64×64 |
| wall-nut | `0xb45309` | 72×72 |
| snow-pea | `0x38bdf8` | 64×64 |

`syncPlantViews` 创建时 `setDisplaySize` + `setTint` / 不清。不改 PNG。

`registerPlantAttackComplete` 现写死豌豆 anim key；四种共用同一套动画，可保持。仅 shooter 会 `playPlantAttack`。

### 弹与僵尸 Slow

- 弹仍用 `pea-fly.png`。创建时：`kind === 'snow-pea'` → `setTint(0x7dd3fc)`，普通豌豆不 tint。
- 活僵尸每帧：`slowRemaining > 0` → `setTint(0x7dd3fc)`，否则 `clearTint`。basic / fat 都走这套。
- **死亡前 `clearTint()`**，再播 die。避免 leftover death sprite 带着青色，生命周期与现「先出 Map 再播 die」一致。

### Card Bar

当前单卡 148 宽 × 4 会挤爆 HUD。**小改卡尺寸，不大改 HUD 分区：**

- 左侧 Wave / 阳光 / hint 不动（hint wrap 220）
- 右侧开始按钮位置、尺寸不动
- 四张卡放在中间空隙：约 x=248 起，宽 **80**、高 **72**、间距 **8**（4×80+3×8=344，右缘约 592，开始按钮左缘约 608，不撞）
- 每张：中文名、`{cost} 阳光`；playing 且 CD>0 时第三行 `{n.toFixed(1)}s`；preparing 或 CD=0 隐藏冷却字
- 选中：描边 `CARD_SELECTED_COLOR`（仅当前 kind）
- playing 且（阳光不足或该卡 CD>0）：卡面 `setAlpha(0.45)`；preparing 只因阳光不足变暗，**不因 CD 变暗**
- 变暗仍可点击：选中该卡并给 hint（「阳光不足」/「卡片冷却中：2.3s」）。最终能否种仍由 core 裁决
- 不需要 radial CD

中文名：豌豆射手 / 向日葵 / 坚果 / 寒冰射手。

**拆 `src/game/scenes/cardView.ts`：** 卡布局、标签、冷却字、alpha/描边同步。`GameScene` 仍负责 create 调用、pointer、选中状态、SFX。不建 UIManager。`placementView.ts` 继续只管格子几何 + 植物 placeholder key/style，不塞四卡 UI。

`syncHud` 去掉对单个 `cardBg` 的描边，改为 `syncCardBar(...)`。

### 选择行为

`selectedPlantKind` 仍只在 Scene。

- 点卡 / 按 1~4：若已是该 kind → 取消并 hint「已取消选择」；否则选中，hint「点击格子种植」
- **成功 `placed`：取消选择**（与现在一致）
- **失败：保持选择**，只改 hint
- ESC：取消，纳入现有 `cancelSelection`

hover 继续 `canPlacePlant`；冷却中格子为 invalid 色。

---

## 8. 数字键与 HMR

继续用 Phaser Scene keyboard，**不用** `window.addEventListener`。

在现有 ESC 旁注册：

- `keydown-ONE` → pea-shooter
- `keydown-TWO` → sunflower
- `keydown-THREE` → wall-nut
- `keydown-FOUR` → snow-pea

与点卡共用 `selectCard(kind)`。点卡播 button-click；数字键也走同一 select，**数字键不额外播 SFX**（避免和点卡重复约定；快捷键静默选中即可）。

`create()` 里 `on`，现有 SHUTDOWN 回调里 `off` 这五类 keydown（含 ESC）。Restart / HMR 不得叠加。禁止在 `update` 里重复 `on`。

---

## 9. Audio / Restart 回归

不改音频文件、不改加载表。

| 事件 | 行为 |
|---|---|
| 四种成功种植 | plant-place |
| 四种死亡（Map 先删再播 die） | plant-death |
| 新弹 View（仅 shooter 会有） | pea-shoot + attack anim |
| `projectileHitCount` | pea-hit（含寒冰，且仅真命中） |
| 向日葵 / 坚果 | 不出现新弹 → 不误播 pea-shoot |
| Start / 点卡 / Restart | button-click 保持 |
| playing → victory / game-over | 终局 SFX 各一次；`create()` 重置 `previousGameStatus` |
| BGM | 仍仅 `startBattle` 成功后；终端/shutdown 停；Restart 不双 BGM |

Restart：`createInitialWorld()` 自然清植物 / 僵尸 / 弹 / 阳光 / 向日葵计时 / cardCooldowns / slow / Wave / id。Scene 清选择、hint、Maps；死亡 leftover 仍走现逻辑。新 world 无 Slow、无 CD。不要在 Restart 时对旧 sprite 播死亡 SFX（现「先清 world 再 scene.restart」路径保持）。

---

## 10. 文件

**新增**

- `src/game/scenes/cardView.ts`（卡布局与视觉 helper）

**修改**

- `src/game/core/types.ts` — PlantKind、ProjectileKind、PlacementError、Plant/Zombie/Projectile/WorldState、PlantConfig 相关类型
- `src/game/core/constants.ts` — `PLANT_KINDS`、discriminated `PLANT_CONFIG`、Slow 常量
- `src/game/core/plants.ts` — 校验顺序、种植拷贝、`stepPlantProduction`、`stepCardCooldowns`
- `src/game/core/combat.ts` — 只 shooter 开火，弹带 kind
- `src/game/core/projectiles.ts` — 寒冰命中写 Slow
- `src/game/core/zombies.ts` — Slow tick + 有效速度
- `src/game/core/update.ts` — 新 step 顺序
- `src/game/core/waves.ts` — Wave 4；`spawnZombie` 写 `slowRemaining: 0`
- `src/game/core/world.ts` — `cardCooldowns` 初值
- `src/game/core/index.ts` — 导出新类型/常量（按现有风格，不导出 Scene 用不到的内部 helper 也可）
- `src/game/scenes/view.ts` — 四卡布局常量（起始 x、宽高、间距）；可留 tint 色值若希望集中。不大改 HUD 高度
- `src/game/scenes/placementView.ts` — `plantViewKeys` 四种；`plantPlaceholderStyle`
- `src/game/scenes/GameScene.ts` — 四卡、快捷键、弹/植物/僵尸 tint、hint 新分支、`syncCardBar`

**不修改**

- `public/**`（PNG / 音频）
- `package.json` / `package-lock.json`
- Astro 页面与 `GameMount.astro`（高度已正确）
- 不新依赖

---

## 11. Prompt 48 问（逐项）

1. **当前 PlantKind / PlantState / PLANT_CONFIG：** 仅豌豆；config 为 `{hp, attackDamage, attackInterval, cost}`；PlantState 无生产字段。
2. **Card UI：** `GameScene.createCard()` 单矩形 + 两行字，位置 `HUD_CARD_X/Y`。
3. **card cooldown：** World 里没有。
4. **四种 PlantKind：** `pea-shooter | sunflower | wall-nut | snow-pea`。
5. **PLANT_CONFIG 结构：** discriminated union，见 §1。
6. **是否 union：** 是，为去掉 optional 汤；无 class。
7. **PlantState：** 现有字段 + `productionCooldown`。
8. **向日葵 timer：** 每株 `productionCooldown`，不在 World 级单时钟。
9. **producer step 文件：** `plants.ts` 的 `stepPlantProduction`。
10. **第一次产阳光：** 种植后完整 6s，不当帧给。
11. **被动阳光：** 保持 +25/3s 与开局 300。
12. **坚果不攻击：** `behavior !== 'shooter'` 则 `applyPlantAttacks` continue。
13. **ProjectileKind：** `'pea' | 'snow-pea'`。
14. **ProjectileState：** 加 `kind`。
15. **Snow Pea spawn：** shooter config 的 `projectileKind` 写入弹。
16. **Slow 字段：** `ZombieState.slowRemaining`。
17. **时长 / 倍率：** 3s，移动 ×0.5。
18. **重复命中：** 刷新为 3s，不叠乘。
19. **Slow decrement：** `stepExistingZombies` 开头。
20. **命中生效帧：** 下一帧移动；本帧弹 phase 才写入。
21. **是否影响攻击：** 否。
22. **弹 tint：** 复用 pea-fly；寒冰 `0x7dd3fc`；普通不 tint。
23. **僵尸 Slow tint：** 活着时按 `slowRemaining` set/clear；**death 前 clearTint**。
24. **植物区分：** 黄 / 棕更大 / 青 / 原色，见 §7。
25. **动画：** 四种共用豌豆三套动画。
26. **Card Bar 布局：** HUD 中段四张 80×72，间距 8，左文案右开始键不动。
27. **CD runtime：** `world.cardCooldowns: Record<PlantKind, number>`。
28. **preparing bypass：** 连种自由；成功种植不写 CD。
29. **playing 校验顺序：** status → cell → occupied → sun → card-cooldown。
30. **PlacePlantResult：** 增加 `'card-cooldown'`。
31. **CD 递减：** `stepWorld` 第 9 步 `stepCardCooldowns`，仅 playing。
32. **1~4：** Scene `keydown-ONE..FOUR`，SHUTDOWN 与 ESC 一起 `off`。
33. **selectedPlantKind：** 成功取消，失败保留；再点同一卡取消。
34. **combat 跳过：** `behavior === 'shooter'` 才开火。
35. **PROJECTILE_CONFIG：** 不新增。
36. **WorldStepEvents：** 不扩展。
37. **SFX：** 表见 §9；寒冰复用 pea-shoot/hit。
38. **Wave 4 表：** §6。
39. **平衡理由：** §6。
40. **前三波：** 不改。
41. **Victory 测试布局：** 准备阶段两路豌豆 + 一向日葵（或一路坚果），战斗用攒的阳光补坚果 / 寒冰；对比纯三豌豆。
42. **Slow 测试：** 单路寒冰打 basic/fat，看变慢、3s 恢复、连击不叠成 0.25×、tint 清除。
43. **坚果测试：** 前排坚果、后排豌豆；僵尸先打坚果，坚果死后继续走，后排不停火、无豌豆从坚果身上飞错。
44. **Restart 新状态：** `cardCooldowns`、`productionCooldown`（随植物数组清空）、`slowRemaining`（随僵尸清空）、选择、tint、BGM/终局 SFX 路径。
45. **拆 cardView.ts：** 是。
46. **文件清单：** §10。
47. **主要风险：** 见 §13。
48. **回归顺序：** 见 §12。

---

## 12. 验收与回归顺序

执行后按这个顺序手测，再 `npm.cmd run build`。

1. **准备阶段阵容：** 1~4 与点卡选中；ESC 取消；阳光够时四格连种四种；preparing 无 CD 限制；阳光不足变暗但仍可点出 hint；成功种植清选择。
2. **战斗 CD：** 开战后补种同种进入 CD，hint「卡片冷却中」且不扣阳光；其它卡可种；卡上显示剩余秒；Restart 后 CD 为 0。
3. **向日葵：** 准备期阳光只随种植扣除、不自动涨（被动阳光也不跑）；开战后约 3s 被动 +25、约 6s 向日葵 +25；两株错开；打死该株后不再涨它那份。
4. **坚果：** 前排挡住、HP 20、无攻击动画/pea-shoot；死后僵尸继续。
5. **寒冰：** 弹青色；命中掉 1 血并变慢；攻击间隔看起来不变；连发只刷新；结束恢复；fat/basic 都行；死亡动画无残留青 tint。
6. **豌豆回归：** 弹无 tint、伤害与 swept、出界无 pea-hit。
7. **Wave：** 1~3 体感与现在接近；出现 Wave 4；三豌豆最右列在 W4 明显吃力；混种有机会赢。
8. **Audio：** 四种种植/死亡；向日葵坚果不开枪；寒冰开枪/命中；胜负音一次；Restart 无双 BGM。
9. **HMR / Restart 三次：** 按 1 仍只选一次。
10. **首页 `/` 与 `/game`、刷新、build。**

验收标准覆盖 prompt §36 的 roster / 向日葵 / 坚果 / 寒冰 / CD / 输入 / 弹 / Wave / View / Audio / 架构 / build；不在此重复编号。

---

## 13. 主要风险

- **`applyPlantAttacks` 漏改：** 向日葵/坚果会误发射。这是最高优先级回归。
- **`plantViewKeys` 非穷尽：** 新 kind 编译失败或运行落到空。switch 必须覆盖四种。
- **四卡挤 HUD：** 已改为 80 宽；若实机仍撞开始键，只微调 `HUD_CARD_START_X` / 卡宽，不改 canvas 高度。
- **Wave 4 过难或过易：** 表已按「三豌豆边路 HP 缺口」设计；若实机必败或无脑赢，只改 Wave 4 的 basic 数量或最后一只 fat 的 `at`，不动前三波、不动植物数值（除非 CD/费用明显无策略）。
- **Slow 同帧：** 接受「命中下一帧才慢」；不要为此重排 stepWorld。
- **死亡同帧生产：** 已把生产放过滤之后；不要再改回「先产再死」除非有理由。
- **数字键泄漏：** 必须 SHUTDOWN `off`，与 ESC 同一回调。
- **tint 残留：** 僵尸 death 前 clear；Restart 重建 Scene。
- **选择态：** 失败保留选择，避免冷却失败后还要再点卡。

---

## 14. 明确不做

第五种植物、新僵尸、新 PNG、新音频、阳光掉落拾取、铲子/出售/升级/移动、AOE/DOT/眩晕/冻结停死、Slow 叠层、弹 target lock、Physics、Pause、存档、随机/无尽/选关、移动端专项 UI、Manager/ECS。

---

等待明确回复「批准执行」后再改 `src/**`。
