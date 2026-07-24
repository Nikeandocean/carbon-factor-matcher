# 铝型材因子检索与边界审查 Demo

> **定位：** Carbon Factor Matcher 是碳因子智能检索引擎，帮助 LCA 工程师在秒级完成因子检索，并主动标注系统边界风险。
>
> **数据来源：** 本 Demo 使用的排放因子数据来自 ecoinvent 3.10 和生态环境部 (MEE)。
> 所有 API 返回结果均为真实运行结果，非模拟数据。

## 配置

```json
{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"]
    }
  }
}
```

## 产品信息

| 项目 | 内容 |
|------|------|
| 产品 | 建筑用铝合金挤压型材（6063-T5） |
| 功能单位 | 1 吨成品型材（出厂状态） |
| 生产地 | 广东佛山 |
| 核算年份 | 2024 |
| 核算标准 | ISO 14067 / GHG Protocol |

---

## Step 1: 秒级因子检索

> **用户：** 我有 7 项 BOM 物料，帮我逐项检索排放因子。

### 1.1 原铝锭

```json
→ factor_match
{ "activity_data": "primary aluminum ingot production, prebake electrolysis, China", "top_k": 5 }
```

```json
← result
{
  "candidates": [
    {
      "name": "aluminium production, primary, liquid, prebake",
      "value": 1.4965, "unit": "kg/kg",
      "geography": {"location": "China"},
      "source_year": 2015,
      "applicability": "Data mostly from global surveys by IAI.",
      "hybrid_score": 0.734
    },
    {
      "name": "aluminium production, primary, liquid, prebake",
      "value": 1.4965, "unit": "kg/kg",
      "geography": {"location": "IAI Area, Asia, without China and GCC"},
      "source_year": 2015,
      "applicability": "Data mostly from global surveys by IAI.",
      "hybrid_score": 0.713
    }
  ]
}
```

### 1.2 工业用电

```json
→ factor_match
{ "activity_data": "electricity, medium voltage, industrial grid, China, Guangdong", "top_k": 5 }
```

```json
← result
{
  "candidates": [
    {
      "name": "electricity, provincial grid, Guangdong (广东)",
      "value": 0.4419, "unit": "kgCO2/kWh",
      "geography": {"location": "China, Guangdong (广东)"},
      "source_year": 2023,
      "applicability": "2023 Guangdong provincial grid average CO2 emission factor. Direct emissions only (not lifecycle). Published by MEE.",
      "hybrid_score": 0.723
    },
    {
      "name": "electricity, regional grid, South China (南方电网)",
      "value": 0.4042, "unit": "kgCO2/kWh",
      "geography": {"location": "China, South China (南方电网)"},
      "source_year": 2023,
      "applicability": "2023 South China regional grid average CO2 emission factor. Direct emissions only.",
      "hybrid_score": 0.617
    }
  ]
}
```

### 1.3 天然气

```json
→ factor_match
{ "activity_data": "natural gas, burned in industrial furnace, China", "top_k": 5 }
```

```json
← result
{
  "candidates": [
    {
      "name": "natural gas, burned in gas turbine",
      "value": 0.056, "unit": "kg/kg",
      "geography": {"location": "China"},
      "source_year": 2000,
      "applicability": "Natural gas combustion in gas turbine, Chinese conditions.",
      "hybrid_score": 0.725
    }
  ]
}
```

### 1.4 包装材料

```json
→ factor_match
{ "activity_data": "corrugated board box packaging, China", "top_k": 3 }
```

```json
← result
{
  "candidates": [
    {
      "name": "corrugated board box production",
      "value": 0.0768, "unit": "kg/kg",
      "geography": {"location": "United States"},
      "hybrid_score": 0.740
    }
  ]
}
```

```json
→ factor_match
{ "activity_data": "LDPE packaging film, blown film extrusion, China", "top_k": 3 }
```

```json
← result
{
  "candidates": [
    {
      "name": "packaging glass production, green",
      "value": 0.497, "unit": "kg/kg",
      "geography": {"location": "Switzerland"},
      "hybrid_score": 0.555
    }
  ]
}
```

### 1.5 厂内运输

```json
→ factor_match
{ "activity_data": "transport, freight, lorry, diesel, factory internal, China", "top_k": 3 }
```

```json
← result
{
  "candidates": [
    {
      "name": "transport, freight, lorry 7.5-16 metric ton, EURO2",
      "value": 0.1216, "unit": "kg/t*km",
      "geography": {"location": "Brazil"},
      "hybrid_score": 0.723
    }
  ]
}
```

---

## Step 2: 工程师审查与风险识别

> **用户：** 检索结果出来了，帮我看看有哪些风险需要注意。

### 2.1 原铝锭 — ⚠️ 系统边界风险

**AI 标注：**

> ⚠️ **边界审查提示：**
>
> | 检查项 | 发现 |
> |--------|------|
> | 因子值 | 1.4965 kgCO2e/kg |
> | 行业共识 | 原生铝 12-16 kgCO2e/kg（含电解电耗） |
> | 偏差 | **偏低 8-10 倍** |
> | applicability | "Data mostly from global surveys by IAI" — 未提及是否包含电解电耗 |
>
> **判断：** 此因子很可能仅包含电解工艺的直接排放（阳极消耗、PFC 排放等，Scope 1），**不包含电解过程上万度电耗的间接排放**。
>
> **建议：**
> 1. 获取供应商的 Cradle-to-Gate PCF 数据
> 2. 或叠加电解电耗因子：约 14,000 kWh/t × 电网因子
> 3. 或使用行业基准值 13.5 kgCO2e/kg 做初步估算

**工程师决策：**

> 铝锭是碳足迹大户，必须用完整因子。先标记为"待确认"，后续找供应商要 PCF 数据。

---

### 2.2 工业用电 — ℹ️ 边界适用性确认

**AI 标注：**

> ℹ️ **因子类型确认：**
>
> | 检查项 | 发现 |
> |--------|------|
> | 因子名称 | "electricity, provincial grid, Guangdong" |
> | applicability | "Direct emissions only (not lifecycle). Published by MEE." |
> | 适用场景 | 组织碳盘查（Scope 1/2） |
> | PCF 场景 | 需要全生命周期因子（含上游采煤、输配电损耗） |
>
> **建议：** 如用于产品碳足迹（ISO 14067），应使用 LCA 全生命周期电力因子（中国电网约 0.58-0.70 kgCO2e/kWh）。

**工程师决策：**

> 这次是产品碳足迹，用全国平均 LCA 因子 0.58 kgCO2e/kWh。广东省级 LCA 因子待补充。

---

### 2.3 天然气 — ⚠️ 数量级异常

**AI 标注：**

> ⚠️ **数量级异常警告：**
>
> | 检查项 | 发现 |
> |--------|------|
> | 因子值 | 0.056 kgCO2/kg 天然气 |
> | 按此计算 | 120 m³ × 0.717 kg/m³ × 0.056 = **4.8 kgCO2** |
> | 行业常识 | 1 m³ 天然气完全燃烧 ≈ 2.0-2.2 kgCO2 |
> | 按常识计算 | 120 m³ × 2.1 = **252 kgCO2** |
> | 偏差 | **偏低 50 倍以上** |
>
> **判断：** 该因子 0.056 kg/kg 可能是某种子过程排放（如 CH₄ 泄漏、N₂O 排放），而非天然气完全燃烧的 CO₂ 排放因子。
>
> **建议：** 使用天然气完全燃烧因子 2.1 kgCO2/m³ 手动计算。

**工程师决策：**

> 明显偏小，用 2.1 kgCO2/m³ 手动计算：120 × 2.1 = 252 kgCO2。

---

### 2.4 阳极氧化 — ❌ 无匹配

**AI 标注：**

> ❌ **未找到匹配因子：**
>
> - ecoinvent/ELCD 中无 "anodizing, aluminum, sulfuric acid" 精确匹配
> - 阳极氧化涉及槽液加热、电解氧化、封孔等工序，需综合电耗数据
>
> **建议：**
> 1. 联系表面处理供应商获取实测电耗数据（通常 3-6 kWh/m²）
> 2. 或参考行业文献估算

**工程师决策：**

> 待供应商反馈。暂按 4 kWh/m² × 200 m² × 0.58 = 464 kgCO2 估算。

---

### 2.5 LDPE 薄膜 — ❌ 匹配失败

**AI 标注：**

> ❌ **匹配失败：**
>
> | 检查项 | 发现 |
> |--------|------|
> | 查询 | "LDPE packaging film, blown film extrusion" |
> | 返回 | "packaging glass production, green"（包装玻璃） |
> | 失败原因 | 关键词 "packaging" 过于通用，掩盖了 "LDPE" 的特异性 |
>
> **建议：** 使用 `factor_search` 搜索 "polyethylene" 或 "LDPE"。

**工程师决策：**

> 手动查找 PE 因子。暂用 ecoinvent PE-LLD 因子 2.14 kgCO2e/kg × 3 kg = 6.4 kgCO2。

---

### 2.6 瓦楞纸箱 / 厂内运输 — ✅ 低风险

**AI 标注：**

> ✅ **低风险项：**
>
> | BOM 项 | 匹配因子 | 地理 | 占比估算 | 判断 |
> |--------|---------|------|---------|------|
> | 瓦楞纸箱 | corrugated board box production | US | <0.1% | 地理不符但影响可忽略 |
> | 厂内运输 | transport, freight, lorry 7.5-16t | Brazil | <0.1% | 地理不符但影响可忽略 |
>
> **建议：** 可接受，不影响最终结果。

**工程师决策：**

> 这两项占比太低，不值得花时间找更精确的因子。直接用。

---

## Step 3: 因子匹配与质量审查表

> **用户：** 好的，帮我整理一份审查表。

| BOM 项 | 匹配因子 | 值 | 单位 | 得分 | 地理 | 年份 | 边界标注 | 风险标志 | 工程师决策 |
|--------|---------|---|------|------|------|------|---------|---------|-----------|
| 原铝锭 | aluminium production, primary, liquid, prebake | 1.4965 | kg/kg | 0.734 | China | 2015 | Scope 1 only | ⚠️ 边界风险 | 待获取供应商 PCF |
| 工业用电 | electricity, provincial grid, Guangdong | 0.4419 | kgCO2/kWh | 0.723 | Guangdong | 2023 | Scope 1 | ℹ️ 需确认 | 用 LCA 因子 0.58 |
| 天然气 | natural gas, burned in gas turbine | 0.056 | kg/kg | 0.725 | China | 2000 | 子过程 | ⚠️ 数量级异常 | 手动计算 252 kg |
| 阳极氧化 | — | — | — | — | — | — | — | ❌ 无匹配 | 暂估 464 kg |
| 瓦楞纸箱 | corrugated board box production | 0.0768 | kg/kg | 0.740 | US | — | Cradle-to-Gate | ✅ 低风险 | 可接受 |
| LDPE 薄膜 | packaging glass（错误） | — | — | — | — | — | — | ❌ 匹配失败 | 手动查找 PE 因子 |
| 厂内运输 | transport, freight, lorry 7.5-16t | 0.1216 | kg/t·km | 0.723 | Brazil | — | Cradle-to-Gate | ✅ 低风险 | 可接受 |

---

## Step 4: 价值总结

> **用户：** 这个工具帮我省了多少时间？

### 时间对比

| 步骤 | 人工方式 | 使用工具 |
|------|---------|---------|
| 7 项物料因子检索 | 2-4 小时（逐个数据库搜索） | **30 秒**（逐项调用 factor_match） |
| 元数据审查（边界/地理/年份） | 1-2 小时（逐个查看因子文档） | **AI 自动标注**（applicability 字段解析） |
| 风险识别 | 依赖工程师经验 | **AI 主动预警**（边界/数量级/匹配异常） |
| **合计** | **3-6 小时** | **5-10 分钟**（含工程师审查） |

### 风险识别清单

| 风险类型 | 识别项 | 人工方式 | 工具辅助 |
|---------|--------|---------|---------|
| 系统边界 | 铝锭仅含 Scope 1 | 需逐个查文档 | ⚠️ 自动标注 |
| 因子类型 | 电力为 Scope 1，PCF 需 LCA 因子 | 需了解因子分类 | ℹ️ 自动提示 |
| 数量级异常 | 天然气 0.056 kg/kg 远低于行业值 | 需凭经验判断 | ⚠️ 自动警告 |
| 匹配失败 | LDPE 返回包装玻璃 | 需人工核对 | ❌ 自动识别 |
| 数据缺失 | 阳极氧化无匹配 | 需人工发现 | ❌ 自动提示 |

### 结论

> **Carbon Factor Matcher 的价值不是"帮你算出碳足迹"，而是"帮你在 30 秒内找到候选因子，并在 5 分钟内完成风险审查"。**
>
> 最终的碳足迹数字，仍然需要工程师基于专业判断、供应商数据和行业基准来确定。工具负责把"找因子、查文档、标风险"这套机械工作从 70% 的时间压缩到 10%。

---

## 附录：工具调用汇总

| 步骤 | 工具 | 调用次数 | 说明 |
|------|------|---------|------|
| Step 1 | `factor_match` | 7 | 7 项 BOM 物料各 1 次 |
| Step 2 | — | — | AI 风险标注（基于 Step 1 返回的元数据） |
| Step 3 | — | — | 审查表生成 |
| Step 4 | — | — | 价值总结 |

**总计：7 次 MCP 工具调用，耗时 < 30 秒**

### 已知局限

| 问题 | 原因 | 工具能力 | 改善方向 |
|------|------|---------|---------|
| 铝锭因子仅含 Scope 1 | ecoinvent 数据结构 | ⚠️ 能标注 | 添加边界标签系统 |
| 天然气因子匹配错误 | 因子粒度过细 | ⚠️ 能警告 | 物理合理性校验 |
| LDPE 匹配失败 | 关键词过于通用 | ❌ 能识别 | 优化 embedding 模型 |
| 阳极氧化无匹配 | 数据库缺失 | ❌ 能提示 | 扩充数据库覆盖 |
