# MVP-8 Plan：Spring Boot + SQLite 最速通关排行榜

先不要执行代码。等明确回复「批准执行」后再创建 `D:\MyProgram\FirstWebServer`、改前端、下依赖、建库。

目标：独立后端保存全部合法通关成绩；GET Top 10 只读 JVM Cache。数据库是真相，内存是热点缓存。不把 Spring 源码塞进 FirstWeb。

---

## Review 修订（相对上一版）

| 级别 | 问题 | 修订 |
|---|---|---|
| Blocker | 排行榜必须按 `gameVersion` 隔离 | `findTop` / 索引 / Cache 只针对当前版本；不同版本成绩互不进入同一榜 |
| Blocker | `createdAt` 不应依赖 ISO TEXT 字典序 | SQLite 存 **INTEGER epoch millis（UTC）**；排序用数值比较。ISO 只出现在 HTTP 展示 |
| Blocker | Schema → Cache 启动顺序必须真实依赖 | `Store` 构造注入 `SQLiteSchemaInitializer`；`Cache` 构造注入 `Store`。Spring 保证被依赖 bean 的 `@PostConstruct` 完成后才注入 |
| Major | WAL 初始化位置 | **只在 Schema 初始化连接**设 `journal_mode=WAL`。CRUD 连接不重复设 WAL |
| Major | Cache 实际仍包含 IP | Cache / GET 使用无 IP 的 `LeaderboardRecord`。`client_ip` 只进 SQLite |
| Major | POST rank / COUNT | **删除**。Store 不再有 `countStrictlyBetter`；201 不返回 rank |
| Major | Spring Boot OSS | 改为 **4.1.1**；Web starter 为 `spring-boot-starter-webmvc` |

架构 / Java 风格 / JDBC / Cache 方向 / 前后端边界：保持上一轮 PASS，不扩大范围。

---

## 0. 当前真实基线

已读 `src/game/core/**`、`GameScene.ts`、`GameMount.astro`、`config.ts`、`main.ts`、`package.json`、`.gitignore`。`D:\MyProgram\FirstWebServer` **尚不存在**。

**Git（只记录）：** 分支 `game-phaser4-mvp`，与 origin 同步。最新提交 `be0f011 完成 MVP-7 多植物体系与向日葵动画接入`。Plan 阶段不 commit/push。

**Victory 路径：** `stepWaves()` 在最后一波 spawn 完且 `zombies` 为空时设 `victory`。Scene 只展示。「游戏结束」不走提交。

**时间入口：** `GameScene.update` → 唯一一次 `stepWorld(world, dt)`。无 `runElapsed`，无 score。

**Restart：** `scene.restart()` → `createInitialWorld()`。

**Victory UI：** Phaser「胜利」+ Restart。无姓名输入、无 HTTP。

---

## 1. 31 问（修订后锁定）

1. **Victory：** `waves.ts` 的 `stepWaves` 写状态；Scene 只展示。
2. **`stepWorld`：** 唯一玩法时间入口。
3. **`runElapsed`：** 放 `WorldState`。
4. **Restart：** `createInitialWorld()` 设 `runElapsed: 0`。
5. **UI：** 通关时间用 Phaser Text；姓名 / 榜单用 `#game-root` 上的 DOM overlay。
6. **package：** `com.likewind.firstwebserver`。
7. **Spring Boot：`4.1.1`。** 当前稳定线，支持 Java 21。3.5.16 已结束 OSS。不用 WebFlux。Boot 4 将 `starter-web` 重命名为 **`spring-boot-starter-webmvc`**。业务代码仍是传统 class / getter / `for` / `if`。
8. **SQLite JDBC：** `org.xerial:sqlite-jdbc:3.53.4.0`。不加 `starter-jdbc` / Hikari。
9. **Connection：** `DriverManager` + `SQLiteConfig.openConnection()`。
10. **每条 CRUD 连接必设（connection-level）：** `synchronous=FULL`、`busy_timeout=5000`、`foreign_keys=ON`。
11. **PRAGMA 作用域：**
    - `journal_mode=WAL`：**database-level**。只在 **Schema 初始化**那一次连接上设置并确认。之后 CRUD **不再**设 WAL。
    - `synchronous` / `busy_timeout` / `foreign_keys`：connection-level，**每个**新连接都设。
12. **Schema：** `SQLiteSchemaInitializer` `@PostConstruct`：建目录、打开连接、**先 WAL**、再三条 connection PRAGMA、再 `CREATE TABLE/INDEX`。不在 `save()` 建表。
13. **Cache 必在 Schema 之后：** 见下方「启动依赖链」。不是“两个 @PostConstruct 碰运气”。
14. **Cache 线程安全：** 内部 `List<LeaderboardRecord>` + `lock`；`snapshot` / `replaceAll` / `consider` 均 `synchronized (lock)`；对外新 List。
15. **GET 不碰 SQLite：** `listTop()` 只 `cache.snapshot()`。
16. **DB 成功、Cache 失败：** 仍 201 + error 日志；重启从 DB 恢复。不回滚 INSERT。
17. **DB 失败绝不改 Cache。**
18. **排名比较：** `clearTimeMs ASC` → **`createdAtMillis ASC`（数值）** → `id ASC`。Java `compare` 与 SQL `ORDER BY` 用同一套整数键，**不**用 ISO 字符串比较。
19. **IP：** `request.getRemoteAddr()`。只写入 SQLite。
20. **不读 `X-Forwarded-For`。** 未来可信反代再开 forwarded strategy。
21. **时间：** Domain `Instant`；SQLite **`created_at INTEGER`（`toEpochMilli()`）**。HTTP JSON 可由 DTO 格式化成 ISO 字符串，那是展示，不是排序键。
22. **不要独立 score。**
23. **CORS：** 仅 `http://localhost:4321`。
24. **前端 HTTP：** `src/game/api/leaderboardClient.ts`。
25. **重启测 Cache：** 对照当前 `gameVersion` 的 Top10。
26. **gitignore：** `data/*.db*`、`target/`、`.idea/`；保留 `data/.gitkeep`。
27. **独立 repo：** 以后再做远程。Execute 不建 origin。
28–29. 见 §4。
30. **不改** combat / Slow / 卡牌 CD / Wave / 植物数值 / 向日葵动画 / 音频 / PNG。
31. **不用** Stream / `*Async` / `@Async` / Executor / `new Thread` / Virtual Thread / `parallelStream`。排序用普通方法。

### 启动依赖链（Blocker 3）

```
SQLiteConfig
    ↑
SQLiteSchemaInitializer(SQLiteConfig)
    @PostConstruct：目录 + WAL + schema
    ↑
SQLiteLeaderboardStore(SQLiteConfig, SQLiteSchemaInitializer)
    构造注入 Initializer，即使 Store 方法不调用它
    ↑
LeaderboardCache(LeaderboardStore, 当前 gameVersion)
    @PostConstruct：store.findTop(10, gameVersion) → replaceAll
    ↑
LeaderboardService → Controller
```

Spring 规则：一个 bean **完整初始化（含自己的 @PostConstruct）之后**才会被注入别人。因此：

1. Schema 的 `@PostConstruct` 结束 → 才创建 Store  
2. Store 就绪 → 才创建 Cache  
3. Cache 的 `@PostConstruct` 才 `findTop`  
4. 以上都在 Web 容器对外服务之前  

禁止：Cache 只依赖 Config、和 Schema 平级各跑 `@PostConstruct`。禁止只靠 `@Order` / `ApplicationRunner` 当唯一顺序保证（Runner 可以作日志，不能替代这条构造依赖）。

---

## 2. 锁定的产品规则

| 项 | 决定 |
|---|---|
| 玩家名 | trim 非空；最长 20；`^[\p{L}\p{N}]+$`；重名可多条 |
| `clearTimeMs` | `> 0` 且 `<= 600000`。不是反作弊 |
| `gameVersion` | 服务器常量 `mvp-8`。客户端必须传相同值，否则 400。库内写服务器常量 |
| 榜单隔离 | **同一 `game_version` 才同榜**。Cache / GET / `findTop` 都带当前版本 |
| `runId` | 服务器 UUID |
| `createdAt` | 服务器 `Instant.now()`；库内 epoch millis |
| `clientIp` | 只进 SQLite；Response / Cache / `LeaderboardRecord` **无此字段** |
| 排序 | 更短时间 → 更早 `created_at` 数值 → 更小 id |
| POST | 先 INSERT 再 Cache；**不算全局 rank** |
| GET | 当前版本 Top 10，只读 Cache；列表上的 1..n 只是本页名次 |

**POST 201（无 rank）：**

```json
{
  "runId": "...",
  "playerName": "likeAwind",
  "clearTimeMs": 68342,
  "gameVersion": "mvp-8",
  "createdAt": "2026-09-12T07:30:00Z"
}
```

**GET 200：**

```json
{
  "gameVersion": "mvp-8",
  "entries": [
    { "rank": 1, "playerName": "...", "clearTimeMs": 61000, "createdAt": "..." }
  ]
}
```

`rank` 仅表示 **当前版本 Cache 快照里的位置**，不是跨版本、也不是全库名次。

---

## 3. Phase

### Phase A — 后端骨架

新建 `D:\MyProgram\FirstWebServer\`。`spring-boot-starter-parent` **4.1.1**。

依赖：

- `spring-boot-starter-webmvc` 4.1.1（Boot 4 名称，不是 `starter-web`）
- `spring-boot-starter-validation` 4.1.1
- `spring-boot-starter-test` 4.1.1（test）
- `org.xerial:sqlite-jdbc` 3.53.4.0

不加 JPA / Security / Lombok / starter-jdbc。

```
server.port=8080
app.sqlite.path=./data/leaderboard.db
app.leaderboard.game-version=mvp-8
app.leaderboard.top-limit=10
app.cors.allowed-origin=http://localhost:4321
```

**验证：** JDK 21；`mvn -q -DskipTests package` 能起 8080。

---

### Phase B — SQLite Config + Schema

**`SQLiteConfig.openConnection()`（CRUD 与 Schema 共用开门）：**

1. `DriverManager.getConnection`
2. **只设** `synchronous=FULL`、`busy_timeout=5000`、`foreign_keys=ON`
3. **不设** `journal_mode`

**`SQLiteSchemaInitializer.@PostConstruct`：**

1. 建 `data/`
2. `openConnection()`
3. **仅此处** `PRAGMA journal_mode = WAL;` 并读取确认结果为 `wal`
4. `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`
5. 关闭连接

```sql
CREATE TABLE IF NOT EXISTS leaderboard_entry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL UNIQUE,
    player_name TEXT NOT NULL,
    clear_time_ms INTEGER NOT NULL,
    client_ip TEXT NOT NULL,
    game_version TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_ranking
ON leaderboard_entry(game_version, clear_time_ms, created_at, id);
```

`created_at` 是 UTC 毫秒整数。排序是数值，不依赖文本格式。

索引最左列 `game_version`，查询：

```sql
SELECT id, run_id, player_name, clear_time_ms, game_version, created_at
FROM leaderboard_entry
WHERE game_version = ?
ORDER BY clear_time_ms ASC, created_at ASC, id ASC
LIMIT ?
```

**不 SELECT `client_ip`。**

**验证：** 文件出现；`PRAGMA journal_mode` 为 wal；索引存在。

---

### Phase C — Domain + Port + JDBC

**`LeaderboardEntry`（写库 Domain，可含 IP）：**  
`id, runId, playerName, clearTimeMs, clientIp, gameVersion, createdAt`  
构造 + getter；无 setter；无 JDBC 注解。

**`LeaderboardRecord`（读榜 / Cache，无 IP）：**  
`id, runId, playerName, clearTimeMs, gameVersion, createdAt`

**`LeaderboardStore`：**

```java
LeaderboardEntry save(LeaderboardEntry entry);
List<LeaderboardRecord> findTop(int limit, String gameVersion);
```

无 `countStrictlyBetter`。接口无 JDBC 类型。

**`SQLiteLeaderboardStore`：** 构造注入 `SQLiteConfig` **和** `SQLiteSchemaInitializer`。每次操作 try-with-resources。`save` 写全部列（含 IP、`created_at` millis）。`findTop` 带 `game_version = ?`，映射为 `LeaderboardRecord`。

`SQLException` → `PersistenceException`。

---

### Phase D — Cache

内部只持有 `List<LeaderboardRecord>`。`consider` / `replaceAll` 只接受 Record。

比较：`LeaderboardRanking.compare(a, b)` 用 `clearTimeMs`、`createdAt.toEpochMilli()`、`id`。与 SQL 三列整数序一致。

`consider`：只处理 `record.gameVersion` 等于缓存版本的条目；其它版本直接忽略（防御）。size&lt;10 插入；否则与第 10 名比较；排序；截断 10。

启动：`findTop(10, currentGameVersion)`。

---

### Phase E — Service / Controller / DTO

- 请求校验同前；`gameVersion` 必须等于服务器常量
- POST：组 `LeaderboardEntry`（含 IP）→ `save` → 从已保存条目抽出 **Record（丢掉 IP）** → `cache.consider` → 201（无 rank）
- GET：`cache.snapshot()`，按顺序填 1..n
- CORS 仅 `http://localhost:4321`
- 校验 400 / 持久化 500；响应不泄漏 SQL/路径

---

### Phase F — 测试

覆盖：建表、重启仍在、WAL、按版本隔离（插入另一 `game_version` 行不得出现在 GET）、数值 `created_at` 同毫秒靠 id 稳定、Cache ≤10、GET 不调 Store、无 IP 出现在 GET JSON、非法输入 400。

---

### Phase G — `runElapsed`

`WorldState.runElapsed`，playing 时 `stepWorld` **最先** `+= dt`。Victory 冻结。提交 `Math.round(runElapsed * 1000)`。

---

### Phase H–K

与上一版相同：DOM overlay + `leaderboardClient.ts`；联调 4321/8080；DB Browser 只读；`mvn test` + `npm.cmd run build`；不 commit/push。

GET 展示的 `createdAt` ISO 字符串由前端或 DTO 从 millis/Instant 格式化，**不参与**服务端排序。

---

## 4. 文件清单

**后端新建：**

```
FirstWebServer/
  pom.xml
  .gitignore
  data/.gitkeep
  src/main/resources/application.properties
  src/main/java/com/likewind/firstwebserver/
    Application.java
    exception/PersistenceException.java
    exception/GlobalExceptionHandler.java
    infrastructure/sqlite/SQLiteConfig.java
    infrastructure/sqlite/SQLiteSchemaInitializer.java
    infrastructure/sqlite/SQLiteLeaderboardStore.java
    leaderboard/domain/LeaderboardEntry.java
    leaderboard/domain/LeaderboardRecord.java
    leaderboard/domain/LeaderboardRanking.java
    leaderboard/port/LeaderboardStore.java
    leaderboard/cache/LeaderboardCache.java
    leaderboard/service/LeaderboardService.java
    leaderboard/controller/LeaderboardController.java
    leaderboard/dto/SubmitScoreRequest.java
    leaderboard/dto/SubmitScoreResponse.java
    leaderboard/dto/LeaderboardEntryResponse.java
    leaderboard/dto/LeaderboardListResponse.java
    leaderboard/dto/ErrorResponse.java
    config/CorsConfig.java
  src/test/...
```

**前端改：** `types.ts`、`world.ts`、`update.ts`、`GameScene.ts`、`GameMount.astro`；（可能）`view.ts`、`core/index.ts`  
**前端新：** `src/game/api/leaderboardClient.ts`、`src/game/ui/leaderboardOverlay.ts`

---

## 5. 明确不做

注册/登录/JWT、反作弊、JPA、Redis、分页、跨版本合并榜、多实例 Cache、Docker、把 Spring 放进 FirstWeb。

---

## 6. 风险（更新）

- Boot 4 starter 名称：必须用 `webmvc`，写错 `starter-web` 会解析失败。
- Schema/Cache 顺序：靠 **构造注入 Initializer**，不靠声明顺序。
- 旧版 Plan 的 TEXT `created_at` 已作废；本库是新库，无迁移。

---

等待明确回复「批准执行」后再实施。
