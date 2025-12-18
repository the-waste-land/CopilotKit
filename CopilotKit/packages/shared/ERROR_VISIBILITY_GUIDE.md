# CopilotKit 错误可见性指南

## 错误可见性类型

CopilotKit 使用 `ErrorVisibility` 枚举来控制错误在不同环境下的显示行为：

### 1. `BANNER` - 关键业务错误
**显示给**: 所有用户（开发和生产环境）  
**显示方式**: 固定在顶部的横幅，必须手动关闭  
**使用场景**: 
- 网络连接错误 (`NETWORK_ERROR`)
- 认证失败 (`AUTHENTICATION_ERROR`)
- API 未找到 (`API_NOT_FOUND`)
- Agent 未找到 (`AGENT_NOT_FOUND`)
- 远程端点未找到 (`REMOTE_ENDPOINT_NOT_FOUND`)

**示例**:
```typescript
const error = new CopilotKitError({
  message: "Authentication failed. Please check your API keys.",
  code: CopilotKitErrorCode.AUTHENTICATION_ERROR,
  // visibility: ErrorVisibility.BANNER (自动从 ERROR_CONFIG 获取)
});
```

### 2. `TOAST` - 一般错误
**显示给**: 所有用户（开发和生产环境）  
**显示方式**: 可自动消失的提示框  
**使用场景**: 
- 未知错误 (`UNKNOWN`)
- 一般性操作失败

**示例**:
```typescript
const error = new CopilotKitError({
  message: "An unexpected error occurred",
  code: CopilotKitErrorCode.UNKNOWN,
  // visibility: ErrorVisibility.TOAST (自动从 ERROR_CONFIG 获取)
});
```

### 3. `DEV_ONLY` - 开发时错误
**显示给**: 仅开发环境（`showDevConsole={true}`）  
**显示方式**: Banner 或 Toast（取决于严重性）  
**使用场景**: 
- 版本不匹配 (`VERSION_MISMATCH`)
- API 误用 (`MISUSE`)
- 配置问题（非关键）

**示例**:
```typescript
const error = new CopilotKitError({
  message: "Version mismatch detected",
  code: CopilotKitErrorCode.VERSION_MISMATCH,
  // visibility: ErrorVisibility.DEV_ONLY (自动从 ERROR_CONFIG 获取)
});
```

### 4. `SILENT` - 静默错误
**显示给**: 无（仅记录到控制台）  
**显示方式**: `console.error()`  
**使用场景**: 
- 内部调试信息
- 非关键性警告
- 已恢复的错误

**示例**:
```typescript
const error = new CopilotKitError({
  message: "Internal debug info",
  code: CopilotKitErrorCode.UNKNOWN,
  visibility: ErrorVisibility.SILENT,
});
```

## 错误配置

所有错误的默认配置在 `ERROR_CONFIG` 中定义：

```typescript
export const ERROR_CONFIG = {
  [CopilotKitErrorCode.NETWORK_ERROR]: {
    statusCode: 503,
    visibility: ErrorVisibility.BANNER,  // 显示给所有用户
    severity: Severity.CRITICAL,
  },
  [CopilotKitErrorCode.VERSION_MISMATCH]: {
    statusCode: 400,
    visibility: ErrorVisibility.DEV_ONLY,  // 仅开发环境
    severity: Severity.INFO,
  },
  // ...
};
```

## 控制错误显示

### 在应用中启用开发模式

```tsx
<CopilotKit 
  showDevConsole={true}  // 显示 DEV_ONLY 错误
  // ...其他配置
>
  {children}
</CopilotKit>
```

### 在生产环境

```tsx
<CopilotKit 
  showDevConsole={false}  // 或不设置（默认 false）
  // ...其他配置
>
  {children}
</CopilotKit>
```

- ✅ `BANNER` 和 `TOAST` 错误仍然显示
- ❌ `DEV_ONLY` 错误被隐藏（仅记录到控制台）
- ❌ `SILENT` 错误始终不显示

## 最佳实践

### 1. 业务逻辑错误使用 `BANNER` 或 `TOAST`
```typescript
// ✅ 好的做法 - 用户需要知道
throw new CopilotKitError({
  message: "Failed to save data. Please try again.",
  code: CopilotKitErrorCode.NETWORK_ERROR,
});
```

### 2. 开发配置问题使用 `DEV_ONLY`
```typescript
// ✅ 好的做法 - 只在开发时提醒
throw new CopilotKitError({
  message: "API version mismatch. Please update packages.",
  code: CopilotKitErrorCode.VERSION_MISMATCH,
});
```

### 3. 内部调试使用 `SILENT`
```typescript
// ✅ 好的做法 - 不打扰用户
throw new CopilotKitError({
  message: "Cache miss, fetching from server",
  code: CopilotKitErrorCode.UNKNOWN,
  visibility: ErrorVisibility.SILENT,
});
```

## 自定义错误可见性

可以在创建错误时覆盖默认的 visibility：

```typescript
const error = new CopilotKitError({
  message: "Custom error",
  code: CopilotKitErrorCode.UNKNOWN,
  visibility: ErrorVisibility.DEV_ONLY,  // 覆盖默认配置
});
```

## 总结

| Visibility | 开发环境 | 生产环境 | 使用场景 |
|-----------|---------|---------|---------|
| `BANNER` | ✅ 显示 | ✅ 显示 | 关键业务错误 |
| `TOAST` | ✅ 显示 | ✅ 显示 | 一般错误 |
| `DEV_ONLY` | ✅ 显示 | ❌ 隐藏 | 开发配置问题 |
| `SILENT` | ❌ 隐藏 | ❌ 隐藏 | 调试信息 |
