# Backend

Spring Boot 后端服务，提供登录认证、缺陷查询、台账查询、数据导出和 2D/3D 可视化任务接口。

## 环境要求

- Java 17
- MySQL 8.x
- Maven Wrapper 已包含在仓库中

## 启动

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

## 常用环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | 后端服务端口 |
| `DB_URL` | `jdbc:mysql://localhost:3306/railline?...` | MySQL 连接地址 |
| `DB_USERNAME` | `root` | 数据库账号 |
| `DB_PASSWORD` | 空 | 数据库密码 |
| `JWT_SECRET` | 示例值 | JWT 签名密钥，部署时必须替换 |
| `PYTHON_EXE` | `C:/Python313/python.exe` | Python 解释器路径 |
| `ANALYZE_SCRIPT` | `./scripts/plot_npy.py` | NPY 分析脚本 |
| `VIZ_SCRIPT_2D` | `./scripts/front_side_2D.py` | 2D 可视化脚本 |
| `VIZ_SCRIPT_3D` | `./scripts/front_side_3D.py` | 3D 可视化脚本 |

## 主要模块

- `controller`: REST API 控制器
- `service`: 查询、可视化任务和结果处理
- `repository`: JPA 数据访问
- `security`: JWT 认证与过滤器
- `viz`: Python 脚本调用封装
