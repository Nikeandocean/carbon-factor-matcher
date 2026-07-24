# 铝型材产品碳足迹 Demo 设计文档

**日期：** 2026-07-22
**状态：** 已确认
**目标：** 为 Carbon Factor Matcher MCP server 创建落地应用场景案例，展示产品碳足迹 (PCF) 核算全流程

## 背景

产品功能和商业层已基本开发完成，需要具体的落地应用场景案例来：
1. 证明 MCP server 在真实碳核算中的价值
2. 作为营销/销售素材展示给潜在客户

## 产品定义

**产品：** 建筑用铝合金挤压型材（6063-T5 合金牌号）
**功能单位：** 1 吨成品型材（出厂状态）
**场景：** 广东佛山，2024 年
**数据来源：** ecoinvent 3.10（Pro）+ ELCD 补充

### 为什么选择铝型材

- 电解铝是高耗能行业，碳排放数据丰富，ecoinvent 有大量铝产业链因子
- 欧盟 CBAM 覆盖产品，有现实商业意义
- BOM 复杂度适中（原材料 + 能源 + 加工工艺），能完整展示全部 4 个 MCP 工具
- 中国是全球最大铝生产国，受众共鸣强

## BOM 清单

| 序号 | 物料/工序 | 数量 | 单位 | 说明 |
|------|----------|------|------|------|
| 1 | 原铝锭 (primary aluminum ingot) | 1020 | kg | 含 2% 加工损耗 |
| 2 | 工业用电 (electricity, grid) | 1400 | kWh | 挤压 + 热处理 + 表面处理 |
| 3 | 天然气 (natural gas) | 120 | m³ | 铸棒均热炉、时效炉 |
| 4 | 阳极氧化 (anodizing) | 1 | t·μm | 表面处理，20μm 膜厚 |
| 5 | 包装材料 (packaging, PE film + paper) | 15 | kg | 保护膜 + 纸质隔板 |
| 6 | 工厂内运输 (forklift, diesel) | 5 | t·km | 厂区内物料搬运 |

## MCP 工具调用流程

### Step 1 — 清单预处理（`process_inventory`）

输入 6 条 BOM 记录，调用 `process_inventory` 工具进行：
- 去重检测（识别近似/重复项）
- 缺失排放因子补全（embedding 相似度 + 大类兜底）
- 灵敏度评估（变异系数 CV 分级）

**展示点：** 即使 BOM 数据不完美，工具也能自动处理并给出透明报告

### Step 2 — 逐项因子匹配（`factor_match` × 5）

对每个核心物料/工序调用 `factor_match`：

| 调用 | activity_data 输入 | 匹配目标 |
|------|-------------------|---------|
| 1 | "primary aluminum ingot production, China" | 铝锭生产 |
| 2 | "electricity, medium voltage, industrial, China" | 工业用电 |
| 3 | "natural gas, industrial furnace, China" | 天然气 |
| 4 | "anodizing, aluminum, sulfuric acid" | 阳极氧化 |
| 5 | "packaging film, LDPE, corrugated board" | 包装材料 |

**展示点：** 自然语言输入 → 智能匹配 → 候选列表 + 质量评分

### Step 3 — 质量深挖（`factor_detail` × 2）

对 Top 2 关键因子调用 `factor_detail`：
- 铝锭因子：查看 5 维质量评级详情（技术代表性、来源可靠性、地理代表性、时间代表性、因子类型）
- 电力因子：对比中国电网 vs 欧洲电网差异

**展示点：** 不只是给一个数字，还提供数据质量透明度

### Step 4 — 碳足迹计算

汇总计算：Σ (活动数据 × 排放因子) = 总碳足迹

分项展示：
- 原材料（铝锭）占比
- 能源（电力 + 天然气）占比
- 加工（阳极氧化）占比
- 其他（包装 + 运输）占比

**展示点：** 从因子匹配到最终结果的完整闭环

### Step 5 — 数据质量总结

引用 Step 3 的质量评级，给出：
- 整体数据可信度评估
- 高敏感替代项标注（如有）
- 改善建议（哪些数据可以用本地实测值替代以提高精度）

**展示点：** 不只是算出数字，还告诉用户这个数字有多可靠

## 交付物

```
docs/demos/
├── aluminum-pcf-demo.md      # 完整交互式对话记录（P0）
├── aluminum-pcf-bom.json     # BOM数据，可直接输入 process_inventory（P0）
├── aluminum-pcf-summary.md   # 一页纸营销摘要（P0）
└── video-script.md           # 30秒短视频脚本+分镜（P1）
```

### aluminum-pcf-demo.md（主文件）

完整交互式对话记录，包含：
1. 场景设定（产品、功能单位、BOM、地理/时间）
2. 每个 MCP 工具调用的输入 JSON + 输出 JSON + 解读
3. 碳足迹汇总表
4. 数据质量总结
5. 附录：工具调用 JSON 完整记录

格式：Markdown，每个工具调用用代码块展示 JSON 输入/输出，中间用自然语言解读

### aluminum-pcf-bom.json

可直接喂入 `process_inventory` 的 JSON 数组格式，方便用户复制使用

### aluminum-pcf-summary.md（营销摘要）

一页纸，适合发给客户或放在产品页面：
- 产品信息
- 碳足迹结果数字
- 数据质量评级
- 关键发现

### video-script.md（P1）

30 秒短视频脚本 + 分镜：
- 5 秒：问题钩子（"算一个产品碳足迹要多久？"）
- 15 秒：屏幕录制核心 factor_match 调用 + 结果跳出
- 10 秒：碳足迹汇总数字 + "5 分钟搞定"

用于 LinkedIn / 微信 / B站引流

## 录屏方案

| 层级 | 工具 | 用途 |
|------|------|------|
| 录屏 | OBS | 录制 Claude Code 会话 |
| 剪辑 | 剪映/CapCut | 截取 30 秒高光片段 |
| 文字版 | Markdown | 完整对话记录，可搜索可复制 |

录屏结构（3-5 分钟完整版）：
- 开头 30s：产品介绍
- 中间 2-3min：核心 factor_match 调用过程
- 结尾 30s：碳足迹汇总 + 数据质量评估

## 范围外

以下不在本次设计范围内：
- 纺织行业案例（数据风险大，与碳快项目定位重叠）
- Free vs Pro 对比展示（可后续补充）
- 多产品横向对比（本次聚焦单一产品深度展示）

## 成功标准

- Demo 可在 Claude Code 中完整复现
- 4 个 MCP 工具全部展示
- 碳足迹结果数字合理（铝型材 PCF 参考范围：9-14 tCO2e/t，其中铝锭原材料占 70%+）
- 营销摘要可直接用于客户沟通
