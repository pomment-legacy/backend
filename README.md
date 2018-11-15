# Pomment 服务端

评论系统『Pomment』的服务端程序。

## 部署

1. 安装最新 LTS 版 Node.js。建议为 Pomment 单独创建 UNIX 用户或容器，并使用 [n-install](https://github.com/mklement0/n-install) 以用户态部署。
2. 安装 Pomment 服务端：

```bash
yarn global add git+https://git.reallserver.cn/pomment/backend-v2
```

3. 初始化数据文件夹：

```bash
pomment-init path/to/your/directory
```

如果指定路径不存在，Pomment 会为你创建好相应的路径。

随后 `pomment-init` 将会自动启动配置向导。修改好相应的选项，然后退出即可。

4. 启动 Pomment 服务端：

```bash
pomment-server path/to/your/directory
```

## 维护

* 如果需要调整设置，你可以执行 `pomment-config path/to/your/directory` 命令进入 TUI 管理界面，或者直接修改数据文件夹下的 `config.json`。

## 让服务端持续运行

TBD