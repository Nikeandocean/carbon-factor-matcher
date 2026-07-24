# Aluminum PCF Demo V2 Implementation Plan

**Goal:** 重构铝型材案例，从"AI 自动算碳"转为"AI 辅助工程师快速检索与审查因子"。

**设计文档：** `docs/superpowers/specs/2026-07-24-aluminum-demo-v2-design.md`

---

### Task 1: 创建 V2 完整对话演示

**文件：** `docs/demos/aluminum-pcf-demo-v2.md`

- [ ] **Step 1: 场景设定**

写入产品信息、功能单位、BOM、MCP 配置。与 V1 相同。

- [ ] **Step 2: Step 1 — 秒级因子检索**

逐项调用 factor_match，展示：
- 响应速度（<1 秒）
- Top-5 候选列表
- 每个候选的元数据（geography, source_year, applicability, hybrid_score）

使用 real_api_results.json 中的真实数据。

- [ ] **Step 3: Step 2 — 工程师审查与风险识别**

对每项物料写出 AI 标注 + 工程师决策：

1. **铝锭** — 边界风险：1.4965 kg/kg 远低于行业共识 12-16 kg/kg，仅含 Scope 1
2. **电力** — 边界确认：0.4419 是 Scope 1 因子，PCF 需用 LCA 因子 0.58
3. **天然气** — 数量级异常：0.056 kg/kg × 120 m³ = 4.8 kg，行业基准 240-264 kg
4. **LDPE** — 匹配失败：返回包装玻璃
5. **阳极氧化** — 无匹配
6. **包装/运输** — 低风险可接受

- [ ] **Step 4: Step 3 — 因子匹配与质量审查表**

输出表格，不是碳足迹报告。列：BOM 项、匹配因子、值、单位、得分、地理、年份、边界标注、风险标志、工程师决策。

- [ ] **Step 5: Step 4 — 价值总结**

时间对比表 + 风险识别总结。

- [ ] **Step 6: 提交**

```bash
git add docs/demos/aluminum-pcf-demo-v2.md
git commit -m "docs: add aluminum PCF demo v2 (factor search engine positioning)"
```

---

### Task 2: 创建 V2 营销摘要

**文件：** `docs/demos/aluminum-pcf-summary-v2.md`

- [ ] **Step 1: 写摘要**

内容：
- 场景设定（与 V1 相同）
- 因子检索结果表（7 项物料，秒级完成）
- 风险识别亮点（3 个关键预警）
- 时间对比（3-6 小时 → 5-10 分钟）
- 产品定位（因子检索引擎，不是自动碳核算）

- [ ] **Step 2: 提交**

```bash
git add docs/demos/aluminum-pcf-summary-v2.md
git commit -m "docs: add aluminum PCF summary v2 (factor search engine positioning)"
```

---

### Task 3: 更新推文

- [ ] **Step 1: 基于 V2 案例重写公众号推文**

关键改动：
- 标题改为"7 项物料 30 秒完成因子检索"
- 删除"5 分钟算清碳足迹"的叙事
- 铝锭部分突出边界审查
- 最终输出是审查表，不是碳足迹报告
- 定位改为"碳因子智能检索引擎"

- [ ] **Step 2: 审核数据一致性**

确保推文中的所有数字与 V2 案例一致。
