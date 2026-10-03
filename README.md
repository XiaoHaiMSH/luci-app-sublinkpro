# SublinkPro for OpenWrt

两个包（目录结构和 sing-box 的写法一致）：

- `sublinkpro/` — 核心程序（Go 编译，前端已内嵌）+ procd 启动脚本 + UCI 配置
- `luci-app-sublinkpro/` — LuCI 界面（服务 → SublinkPro），含中文翻译

## 使用

把两个目录放进你的 feeds / 固件源码仓库的 package 目录，然后：

    make menuconfig   # Network → Web Servers/Proxies → sublinkpro ；LuCI → Applications → luci-app-sublinkpro
    make package/sublinkpro/compile V=s
    make package/luci-app-sublinkpro/compile V=s

OpenWRT-CI 里直接在 Config 里加：

    CONFIG_PACKAGE_luci-app-sublinkpro=y
    CONFIG_PACKAGE_sublinkpro=y

## 说明

- 上游版本 v1.2.19。`go.mod` 要求 **Go ≥ 1.26.4**，编译机 feeds 里的 `golang/host` 必须不低于这个版本，否则会编译失败。
- 编译时需要联网下载 Go 依赖（含 mihomo），和 sing-box 一样。
- 前端在编译时在线构建：`PKG_BUILD_DEPENDS` 带了 `node/host`，用 npm 临时装 Yarn 4.10.3 构建 `webs/`，产物复制到 `static/` 后用 `-tags=prod` 内嵌。需要联网，约下载 470MB 依赖，编译机建议 ≥ 2GB 内存。
- 上游声明 `node >= 24`，feeds 里的 `node/host` 可能是 22.x；我在 Node 22 上实测构建通过，如果你的 feeds 里 node 版本更旧会失败。
- Makefile 里设置了 `GO_PKG_INSTALL_EXTRA`：上游用 `//go:embed` 内嵌了 `static/`、`template/`、`skill-sublinkpro/`、`VERSION`，而 golang-package.mk 默认只拷 `.go` 文件，不加会报 no matching files。
- 二进制会比较大（内嵌 mihomo + 前端），闪存小的设备请注意；上游发布的二进制对部分架构用了 UPX。
- 默认数据目录 `/etc/sublinkpro`（在 overlay 上），建议在 LuCI「高级设置」里改到 U 盘/硬盘。
- 默认账号 `admin / 123456`，首次登录后马上改；重置密码：`/etc/init.d/sublinkpro reset_password <新密码>`。
- 默认以非 root 用户 `sublinkpro` 运行，监听 8000 端口，需要局域网访问就在 LuCI 里勾选「允许局域网访问」。
