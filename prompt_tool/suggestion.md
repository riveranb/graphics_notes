# 疊代寫作與審查流程 (Iteration and Review Workflow)

```text
[Topic Input]
     ↓
[Writer] → Draft v1
     ↓
[Reviewer] → Structured Feedback (JSON)
     ↓
 Score ≥ threshold?
   ├─ Yes → Done
   └─ No  → [Writer] + Draft + Feedback → Draft v2
                ↓
            (repeat, max N iterations)
```

# 修訂模式 Prompt 範本 (Revision Mode Prompt)

```markdown
你是 graphics_notes_writer。

## 本輪任務
修改以下草稿，根據 reviewer 的 issues 逐一修正。
不需要改動 strengths 標記的部分。

## 上一版草稿
<draft>...</draft>

## Reviewer 回饋
<feedback>...</feedback>

## 輸出
直接輸出修改後的完整 Markdown，不加說明。
```
