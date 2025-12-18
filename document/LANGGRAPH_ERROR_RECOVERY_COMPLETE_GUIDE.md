# LangGraph Agent 错误恢复完整指南

> **修复日期**: 2024-12-18  
> **影响版本**: v1.9.4-cvte 及之前  
> **修复版本**: v1.9.4-cvte+

---

## 📋 目录

1. [问题描述](#问题描述)
2. [根本原因分析](#根本原因分析)
3. [修复方案](#修复方案)
4. [修复效果对比](#修复效果对比)
5. [影响范围](#影响范围)
6. [测试指南](#测试指南)
7. [技术细节](#技术细节)
8. [后续建议](#后续建议)

---

## 问题描述

### 用户报告的问题

用户在使用 CopilotKit 调用 LangGraph agent 时遇到以下情况：

1. **第一次调用**：Agent 在 token 校验步骤报错
   ```python
   raise Exception(f"Token verification failed: {e}")
   ```

2. **第二次调用**：CopilotKit 调用了 `updateState`，**跳过了 token 校验步骤**

### 问题表现

| 调用次数 | 预期行为 | 实际行为 | 结果 |
|---------|---------|---------|------|
| 第 1 次 | 执行 token 校验 | 执行 token 校验 | ❌ 校验失败 |
| 第 2 次 | 重新执行 token 校验 | **跳过 token 校验** | ❌ 关键步骤被跳过 |

---

## 根本原因分析

### 问题流程

#### 1. 第一次调用失败

- LangGraph agent 在执行过程中抛出异常（如 token 校验失败）
- LangGraph 保存了 thread 状态，包括失败时的节点位置
- 失败的任务记录在 `agentState.tasks[].error` 中

#### 2. 第二次调用错误行为

- CopilotKit 检测到 thread 已存在
- 判断条件：`threadId && nodeName != "__end__" && nodeName != undefined && nodeName != null`
- 设置 `mode = "continue"`
- 调用 `client.threads.updateState(threadId, { values: state, asNode: nodeName })`
- **结果：直接从失败的节点继续执行，跳过了失败的步骤**

### 关键代码位置

**文件**: `CopilotKit/packages/runtime/src/lib/runtime/remote-lg-action.ts`

**修复前（第 235-238 行）**：

```typescript
const mode =
  threadId && nodeName != "__end__" && nodeName != undefined && nodeName != null
    ? "continue"
    : "start";
```

**问题**: 没有检查上次执行是否失败，盲目地继续执行。

---

## 修复方案

### 实现逻辑

在决定执行模式之前，检查 `agentState.tasks` 中是否有任务包含错误：

- ✅ **有错误** → 强制使用 `"start"` 模式（从头开始）
- ✅ **无错误** → 使用 `"continue"` 模式（继续执行）

### 修复后的代码

```typescript
// 检查上次执行是否失败 - 通过检查 tasks 中是否有错误
// 如果任何任务有错误，我们应该从头开始而不是继续
const previousExecutionFailed = agentState.tasks?.some(task => task.error != null) ?? false;

if (previousExecutionFailed) {
  const errorTasks = agentState.tasks?.filter(task => task.error != null) ?? [];
  logger.info(
    `Previous agent execution failed with ${errorTasks.length} error(s). Restarting from the beginning instead of continuing from node ${nodeName}.`
  );
  errorTasks.forEach(task => {
    logger.debug(`Task ${task.name} (${task.id}) failed with error: ${task.error}`);
  });
}

// 如果上次执行失败，强制使用 "start" 模式
const mode =
  threadId && nodeName != "__end__" && nodeName != undefined && nodeName != null && !previousExecutionFailed
    ? "continue"
    : "start";
```

### 代码清理

同时清理了调试代码：
- ❌ 删除了 `console.error("+++++++++++liweixin+++++++++++, message: ")`
- ❌ 删除了 `console.log("!!!liweixin!!!, push file")`

---

## 修复效果对比

### 修复前 ❌

| 调用 | Thread 状态 | 执行模式 | 行为 | 结果 |
|-----|------------|---------|------|------|
| 第 1 次 | 新建 | `start` | 从头开始执行 | ❌ 在 token 校验失败 |
| 第 2 次 | 存在（有错误） | `continue` | **继续执行** | ❌ 跳过 token 校验 |

### 修复后 ✅

| 调用 | Thread 状态 | 执行模式 | 行为 | 结果 |
|-----|------------|---------|------|------|
| 第 1 次 | 新建 | `start` | 从头开始执行 | ❌ 在 token 校验失败 |
| 第 2 次 | 存在（有错误） | `start` | **从头开始** | ✅ 重新执行 token 校验 |

---

## 影响范围

### ✅ 受影响的场景

#### 1. Agent 执行失败后重试
- 任何导致 agent 执行失败的错误（网络、业务逻辑、认证等）
- 用户在错误后重新发送消息

### ✅ 不受影响的场景

#### 1. 正常执行完成的 agent
- `tasks` 中没有错误
- 继续使用 `"continue"` 模式

#### 2. Interrupt 场景
- 已有单独的处理逻辑（第 265-268 行）
- 不会受到此修复影响

#### 3. 新建的 thread
- `wasInitiatedWithExistingThread === false`
- 始终使用 `"start"` 模式

### 性能影响

- **轻微增加**: 每次继续执行时需要检查 `agentState.tasks`
- **整体改善**: 避免了错误状态下的无效继续执行

---

## 测试指南

### 单元测试结果

```bash
pnpm test --filter @copilotkit/runtime
```

**结果**: ✅ 所有 56 个测试通过

```
Test Suites: 9 passed, 9 total
Tests:       56 passed, 56 total
```

### 手动测试步骤

#### 1. 测试错误恢复 ⚠️

```typescript
// 第一次调用 - 应该失败
await agent.execute({ message: "trigger token error" });
// 预期：agent 在 token 校验失败

// 第二次调用 - 应该重新开始
await agent.execute({ message: "retry" });
// 预期：重新执行 token 校验（而不是跳过）
// 预期日志：看到 "Previous agent execution failed..." 消息
```

**验证点**:
- ✅ 第二次调用重新执行 token 校验
- ✅ 控制台显示 logger.info 日志
- ✅ 错误任务信息被记录

#### 2. 测试正常继续 ✅

```typescript
// 第一次调用 - 正常执行到某个节点
await agent.execute({ message: "start task" });
// 预期：agent 正常执行

// 第二次调用 - 应该继续
await agent.execute({ message: "continue" });
// 预期：从上次停止的地方继续（不重新开始）
```

**验证点**:
- ✅ 使用 `"continue"` 模式
- ✅ 不重新开始执行
- ✅ 保持执行上下文

#### 3. 测试 Interrupt 场景 🔄

```typescript
// 第一次调用 - 触发 interrupt
await agent.execute({ message: "need approval" });
// 预期：agent 等待用户输入

// 第二次调用 - 恢复执行
await agent.execute({ message: "approved" });
// 预期：从 interrupt 点继续
```

**验证点**:
- ✅ Interrupt 正常触发
- ✅ 提供响应后正常恢复
- ✅ 不受此修复影响

### 测试清单

- [ ] **错误恢复测试**
  - [ ] 第一次调用触发 token 错误
  - [ ] 第二次调用重新执行 token 校验
  - [ ] 查看日志确认错误检测逻辑生效
  
- [ ] **正常继续测试**
  - [ ] 正常执行到某个节点
  - [ ] 第二次调用继续执行（不重新开始）
  - [ ] 确认使用 `"continue"` 模式
  
- [ ] **Interrupt 测试**
  - [ ] 触发 interrupt
  - [ ] 提供响应后继续执行
  - [ ] 确认正常恢复

---

## 技术细节

### ThreadState 数据结构

根据 `@langchain/langgraph-sdk` 的类型定义：

```typescript
interface ThreadState<ValuesType = DefaultValues> {
  values: ValuesType;
  next: string[];
  checkpoint: Checkpoint;
  metadata: Metadata;
  created_at: Optional<string>;
  parent_checkpoint: Optional<Checkpoint>;
  tasks: Array<ThreadTask>;  // ⚠️ 用于检测错误
}

interface ThreadTask {
  id: string;
  name: string;
  result?: unknown;
  error: Optional<string>;  // ⚠️ 如果不为空，表示任务失败
  interrupts?: Array<Interrupt>;
}
```

### 错误检测逻辑

```typescript
// 使用 Array.some() 检查是否有任何任务包含错误
const previousExecutionFailed = agentState.tasks?.some(task => task.error != null) ?? false;

// 如果没有 tasks 数组，默认为 false（没有失败）
// 使用空值合并运算符 (??) 处理 undefined 情况
```

### 日志记录

```typescript
if (previousExecutionFailed) {
  // 记录错误任务数量
  logger.info(`Previous agent execution failed with ${errorTasks.length} error(s)...`);
  
  // 详细记录每个错误任务
  errorTasks.forEach(task => {
    logger.debug(`Task ${task.name} (${task.id}) failed with error: ${task.error}`);
  });
}
```

---

## 后续建议

### 1. 监控日志 📊

- 关注 "Previous agent execution failed..." 日志
- 统计错误恢复的频率
- 分析常见的失败原因

### 2. 考虑优化 🔧

#### 重试限制
- 是否需要限制重试次数？
- 避免无限重试循环

#### 状态清理
- 是否需要清理失败的 thread 状态？
- 定期清理过期的错误 thread

#### 用户体验
- 是否需要向用户显示更友好的错误信息？
- 提供重试建议或解决方案

### 3. 文档更新 📚

- 在用户文档中说明错误恢复机制
- 提供最佳实践指南
- 添加常见问题解答

---

## 修改的文件

### 主要修改

- ✅ `CopilotKit/packages/runtime/src/lib/runtime/remote-lg-action.ts`
  - 添加错误检测逻辑（+15 行）
  - 清理调试代码（-4 行）

### 文档

- ✅ `LANGGRAPH_ERROR_RECOVERY_COMPLETE_GUIDE.md` - 本文档（综合指南）
- 🗑️ `LANGGRAPH_ERROR_RECOVERY_FIX.md` - 已合并
- 🗑️ `FIX_SUMMARY.md` - 已合并
- 🗑️ `修复说明.md` - 已合并

---

## 相关资源

### 文档
- [ERROR_DISPLAY_SUMMARY.md](./ERROR_DISPLAY_SUMMARY.md) - CopilotKit 错误显示规则

### 外部链接
- [LangGraph SDK Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangGraph Thread Management](https://changelog.langchain.com/announcements/reliable-streaming-and-efficient-state-management-in-langgraph)
- [LangGraph Error Handling Best Practices](https://langchain-ai.github.io/langgraphjs/how-tos/error-handling/)

---

## 版本信息

| 项目 | 值 |
|-----|---|
| 修复日期 | 2024-12-18 |
| 分支 | v1.9.4-cvte |
| 影响版本 | v1.9.4-cvte 及之前 |
| 修复版本 | v1.9.4-cvte+ |

---

## 总结

### 问题
第二次调用时跳过失败的节点，导致关键步骤（如 token 校验）被跳过。

### 原因
没有检查上次执行是否失败，盲目使用 `"continue"` 模式。

### 修复
检查 `agentState.tasks` 中是否有错误，如果有则强制从头开始。

### 效果
- ✅ 错误后重试会重新执行失败的步骤
- ✅ 正常执行不受影响
- ✅ Interrupt 场景不受影响
- ✅ 所有测试通过

---

*本文档整合了之前的三个文档：`修复说明.md`、`FIX_SUMMARY.md` 和 `LANGGRAPH_ERROR_RECOVERY_FIX.md`*
