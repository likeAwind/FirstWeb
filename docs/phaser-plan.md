# MVP-6 Plan：布置 + 网格 + 阳光 + 准备阶段 + Restart

先不要执行代码。等明确回复「批准执行」后再改。

把自动演示关卡改成可操作塔防：选卡片 → 花阳光点格种植 → 开始战斗 → 战斗中攒阳光补种 → 胜负后重新开始。不生成、不修改 PNG。不新依赖、不 Physics、不用 Phaser Timer 当经济/Wave 钟。

---

## 0. 当前真实基线

已读代码。MVP-5 **已在本分支落地**，与 prompt 描述基本一致。

**Git（只记录，Plan 阶段不 commit/push）：** `game-phaser4-mvp` 相对 origin **ahead 1**（`7db426a MVP5`）。工作树干净。未 push 不等于代码缺失。

**WorldState 现有字段：** `plants`、`zombies`、`projectiles`、`nextProjectileId`、`nextZombieId`、`gameStatus: 'playing'|'victory'|'game-over'`、`waveIndex`、`waveElapsed`、`nextSpawnIndex`。无 `sun`、无 `nextPlantId`、无 `preparing`。

**植物：** `createInitialWorld()` 仍固定 3 株（`plant-${lane}`，x=`PLANT_X=688`，HP=5）。`GameScene.create()` 一次性建 Sprite/HP；update 里只有 `destroyMissingPlantViews` + `syncLivePlantHp`，**不能动态创建新植物 View**。

**stepWorld：** 非 playing 则 return → 僵尸走/打 → 清死植物 → reachedEnd 则 GO 并清空豌豆 → 豌豆步进 → 清死尸/过期豌豆 → `applyPlantAttacks`（已按每株独立 cooldown/`findTarget`）→ `stepWaves`。

**已可复用、预计不改：** `findBlockingPlant`（同 lane、前方最近，即最小 x）、`applyPlantAttacks` 全数组循环、僵尸/豌豆动态 View、植物 death（先出 Map 再播 die；attack complete 只回 idle）。

`GameScene.ts` 约 352 行。本阶段会加 Grid/Card/Pointer/HUD/按钮，继续全塞会难读 → **新增轻量 `placementView.ts`**（格子几何、命中、hover 色），不建 Manager。

---

## 1. 状态与配置

**`GameStatus` 增加 `'preparing'`。** 初始 `preparing`。`stepWorld` 仅 `playing` 推进；preparing / victory / game-over 都 return（与现在「非 playing 就停」兼容，只需初始值改掉）。

**`PlantKind = 'pea-shooter'`**（卡片/花费已需要 kind，不是空字段）。

**PlantState 新增：** `kind`、`columnIndex`。保留 id/lane/x/hp/攻击三字段。x **只**来自网格常量。

**WorldState 新增：** `nextPlantId`、`sun`、`sunIncomeElapsed`。`createInitialWorld()`：`plants=[]`，`zombies=[]`，`projectiles=[]`，三个 nextId=1，`gameStatus='preparing'`，`sun=STARTING_SUN`，`sunIncomeElapsed=0`，Wave runtime 仍从 0。

id：`plant-${nextPlantId++}`。禁止 Date/random/DOM。

**唯一植物配置（删除 `PLANT_HP` / `PLANT_ATTACK_DAMAGE` / `PLANT_ATTACK_INTERVAL`）：**

```ts
PLANT_CONFIG = {
  'pea-shooter': { hp: 5, attackDamage: 1, attackInterval: 1, cost: 100 },
};
```

**网格（确认可用，不改数值）：**

```ts
PLANT_COLUMN_COUNT = 5
PLANT_GRID_XS = [448, 508, 568, 628, 688]  // 间距 60；末列 = 旧 PLANT_X
```

`PLANT_X` 改为 `PLANT_GRID_XS[4]` 的别名（728 终点仍在最右植物右侧）。Zombie 出生 68，最左列 448 明显更险，符合多层防线。

**经济：** `STARTING_SUN=300`，`SUN_INCOME_AMOUNT=25`，`SUN_INCOME_INTERVAL=3`。无上限。preparing 不产阳光（否则无限等，测不了开局 300）。terminal 也不产。

ZOMBIE_CONFIG / Wave 表 **保持 MVP-5 数值**。

---

## 2. Core API（Scene 不改 sun/plants/status）

新增 `src/game/core/plants.ts`：

```ts
isPlantCellOccupied(world, lane, columnIndex): boolean
  // 活植物同 lane + 同 columnIndex。不用 Sprite 判断。

validatePlacement(world, kind, lane, columnIndex): PlacePlantResult | 'ok'
  // 1 status 须 preparing|playing
  // 2 lane 0..2，column 0..4
  // 3 未占用
  // 4 sun >= cost

canPlacePlant(...): boolean  // hover 用，内部走 validate，不复制规则

placePlant(world, kind, lane, columnIndex): PlacePlantResult
  // 'placed' | 'invalid-status' | 'invalid-cell' | 'occupied' | 'insufficient-sun'
  // 成功：扣 cost，push Plant（config 数值，cooldown=0，x=PLANT_GRID_XS[column]）

startBattle(world): boolean
  // 仅 preparing 且 plants.length>=1 → playing，true；否则 false，不改状态
```

不强制每 lane 一株。0 株点开始：core 拒绝，Scene 提示「请先种至少一株植物」。

**`stepSunIncome`：** 同放在 `plants.ts`（约十几行，不单开 economy.ts）。仅 playing：`elapsed += dt`，`while >= interval: sun += 25; elapsed -= interval`。禁止 setInterval / Phaser Timer。

玩家输入发生在两次 `stepWorld` 之间。playing 中新植物 **下一帧** 进入 `applyPlantAttacks`。不加 justPlaced。

---

## 3. `stepWorld` 最终顺序

```
if (gameStatus !== 'playing') return   // preparing 完全不走 Wave/尸/豆/阳光

1. stepSunIncome
2. stepExistingZombies（挡最近植物 / 走 / 打）
3. filter hp<=0 Plant
4. reachedEnd → game-over，projectiles=[]，return
5. stepExistingProjectiles
6. filter 死尸 / 过期豌豆
7. applyPlantAttacks（所有仍活植物，各自 cooldown）
8. stepWaves
```

同 lane 多植物：blocker 已是最小 x，先打前排；死后下一帧走向下一株。combat 已按株循环，**预计不改**。新植物开火仍当帧不飞豌豆（spawn 在步进之后）。

---

## 4. View / UI

**动态植物：** 删掉 create() 里一次性种植循环。`syncPlantViews()` 对齐僵尸 Map：新 id → 按 `plant.kind` 轻量 switch 取 pea-shooter idle 贴图（现在只有一分支，但必须走 kind）→ idle + HP Text；仍在 → 同步 HP；消失 → 出 Map、毁 HP、播 die、complete destroy。保留「先出 Map 所以残留豌豆不能 restart attack」。

**Grid：** 15 个描边 Rectangle（约 56×100，中心 `(PLANT_GRID_XS[col], laneToY(lane))`），低 depth、半透明，不挡 Sprite。逻辑 x 仍只来自常量。

**Pointer：** Scene 把像素映射成 `{lane, columnIndex}`（格子 interactive 或几何命中），再只调 `placePlant`。不把 pointer.x 当 `plant.x`。点在格子外 / UI 上：不种。

**选中态（仅 Scene）：** `selectedPlantKind: PlantKind | null`。点卡片选中；再点同一卡片或 **ESC** 取消。种成功 → `null`。不进 WorldState。

**Hover：** 已选中时，合法（`canPlacePlant`）绿高亮，非法（占用/阳光不足/terminal）红高亮。View 不写第二套 cost 规则。

**卡片：** Rectangle+Text「豌豆射手 / 100 阳光」。cost 文案读 `PLANT_CONFIG`（经 core 导出），Scene 不写死 100。

**HUD：** `阳光：${world.sun}`；preparing 显示「准备阶段」，playing 起 `Wave n / 3`；hint 一条 Text，下次操作覆盖，不用 Timer 消失。

**开始战斗：** 仅 preparing 可见。点 `startBattle`；成功隐藏按钮 + hint「战斗开始」；失败 hint 如上。Phaser Text/Rectangle，不用 HTML。

**重新开始：** 仅 victory/game-over 可见。`this.scene.restart()` → `create()` + `createInitialWorld()`。不手写 resetWorld。create 开头：Maps clear、`selectedPlantKind=null`、hint 清空。死亡残留是 Scene 子对象，restart 会拆掉。

**Listener：** 只用 `this.input` / `this.input.keyboard`（Scene 自带，shutdown 会清）。禁止 window 全局。按钮 `setInteractive`。`anims.exists` 防 HMR 重复动画。UI depth 高于格子，避免点按钮误种。

布局：卡片与开始键靠左（x 小），格子在 448–688，互不重叠。

---

## 5. 文件

**新增**

- `src/game/core/plants.ts` — occupancy / validate / place / startBattle / stepSunIncome
- `src/game/scenes/placementView.ts` — 格子尺寸、命中、hover 色、kind→贴图入口

**修改**

- `types.ts` / `constants.ts` / `world.ts` / `update.ts` / `index.ts`
- `view.ts` — 阳光/按钮/格子颜色与 depth
- `GameScene.ts` — 动态植物、输入、HUD、Start/Restart

**预计不改：** `combat.ts`、`projectiles.ts`、`zombies.ts`、`waves.ts`、`main.ts`、`config.ts`、`public/**`、package、**执行时不改 Plan**。

若 `applyPlantAttacks` 因 kind 要选子弹类型再动 combat；本阶段只有豌豆，应不动。

---

## 6. 验证（无 Debug 改常量）

**准备：** 无植物、阳光 300、Wave 不走、阳光不涨、3×5 格、卡片 100、开始键、「准备阶段」。

**种植：** 选卡 → 合法格种成功 -100、自动取消选择；占用/阳光不足不扣；ESC 取消；终局不能种。

**开始：** 0 株拒绝；≥1 株进入 playing，此后才 spawn。

**基线胜利：** 三路最右列（column 4，x=688）多种 3 株，300→0，Start。应接近 MVP-5。战斗中约 12s 再攒 100 补一株。

**自然 Game Over：** 只种 1 路 → 空路僵尸破门。不改 `PLANT_HP`。

**Restart：** 回 preparing、阳光 300、空世界、id 从 1、无幽灵 Sprite/监听。

`npm.cmd run build`；core 无 Phaser；`/` 不变。

---

## 7. 风险

| 风险 | 应对 |
|---|---|
| 开局仍 3 株 / playing | world 空数组 + preparing |
| Scene 直接扣阳光 | 只走 placePlant |
| 阳光 preparing 刷爆 | income 仅 playing |
| 点 HUD 误种 | UI 与格子分区 + 更高 depth |
| restart 双监听 | 只用 Scene input |
| death 被切回 idle | 先出 Map，complete 仅 attack |
| 同 lane 穿植物 | 回归 findBlockingPlant 最小 x |
| 两套植物数值 | 删旧 PLANT_HP 等 |

不做：第二种植物、向日葵、掉落阳光、卡片 CD、铲子、音效、暂停、随机波、Physics。

---

## 8. 对 prompt 42 问

1. 见第 0 节 WorldState。  
2. world 固定 3 株 + create() 一次建 View。  
3. 空 plants + placePlant + syncPlantViews。  
4. `'pea-shooter'`。  
5. kind + columnIndex。  
6. hp/damage/interval/cost。  
7. **删除** 旧三项。  
8. `[448,508,568,628,688]`。  
9. **存** columnIndex。  
10. 同 lane+column 的活植物。  
11. `placePlant(world, kind, lane, columnIndex)`。  
12. 五值 union。  
13. `plant-${nextPlantId++}`。  
14. 300。  
15. +25 / 3s。  
16. 否则无限等，开局经济无意义。  
17. 联合类型加 preparing，初始 preparing。  
18. `plants.ts` 的 `startBattle`。  
19. plants.length===0 → false。  
20. stepWorld 直接 return。  
21. 见第 3 节。  
22. 格子中心命中 → lane+column，再 placePlant。  
23. 只是手里选了什么，不是世界真相。  
24. hover 调 `canPlacePlant`。  
25. selected=null，去高亮。  
26. sync 见新 id 则按 kind 建 Sprite+HP。  
27. 与 MVP-5 相同残留 die。  
28. 最小 x 先挡。  
29. combat 已按株开火，预计不改。  
30. 每帧读 world.sun。  
31. preparing 文案 / 其后 Wave n/3。  
32. 仅 preparing 的 Phaser 按钮 → startBattle。  
33. 仅终局按钮 → scene.restart()。  
34. 足够：create 重建 world 与 Maps。  
35. Scene-owned input；anims.exists。  
36. 只种一路。  
37. 三路最右列花光 300。  
38. 要 plants.ts。  
39. 不要 economy.ts。  
40. 要 placementView.ts。  
41. combat/projectiles/zombies/waves/main/config/public。  
42. 见第 7 节。

---

## 9. 批准后步骤

1. types / constants / world。  
2. plants.ts + 改 update 顺序。  
3. placementView + view 常量。  
4. GameScene：动态植物、格子、卡片、阳光、Start/Restart、ESC。  
5. 手测准备/种植/开始/补种/一路 GO/三路最右 Victory/Restart。  
6. build；确认 core 无 Phaser。
