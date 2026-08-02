# API 说明

后端默认基础地址：

```text
http://localhost:8080/api
```

## 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/login` | 用户登录，返回认证信息 |

## 元数据

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/lines` | 查询线路列表 |
| `GET` | `/disease-types` | 查询病害类型列表 |

## 缺陷与台账

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/detections` | 查询缺陷检测结果 |
| `GET` | `/ledgers` | 查询病害台账 |
| `GET` | `/details/{id}` | 查询缺陷或台账详情 |

常用查询参数：

| 参数 | 说明 |
| --- | --- |
| `line` | 线路名称 |
| `type` | 病害类型 |
| `start` | 起始日期 |
| `end` | 结束日期 |

## 导出

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/export-detection` | 导出检测结果 |
| `GET` | `/export-ledger` | 导出台账 |
| `GET` | `/export-all` | 导出全部数据 |

## 可视化

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/viz/run2d` | 启动 2D 可视化 |
| `GET` | `/viz/run2d/stream` | 监听 2D 任务输出 |
| `POST` | `/viz3d/run` | 启动 3D 可视化 |
| `GET` | `/viz3d/status/{uuid}` | 查询 3D 任务状态 |
| `GET` | `/slots` | 查询可视化槽位 |
| `POST` | `/slots/{slotId}` | 保存槽位 |
| `DELETE` | `/slots/{slotId}` | 删除槽位 |
| `POST` | `/slots/{slotId}/snapshot` | 保存槽位快照 |

具体请求体可根据 `backend/src/main/java/com/bjtu/raillinebackend/controller` 中的控制器实现继续补充。
