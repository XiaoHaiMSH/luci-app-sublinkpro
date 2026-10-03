# SPDX-License-Identifier: GPL-3.0-only
#
# OpenWrt package for SublinkPro (https://github.com/ZeroDeng01/sublinkPro)

include $(TOPDIR)/rules.mk

PKG_NAME:=sublinkpro
PKG_VERSION:=1.2.19
PKG_RELEASE:=1

PKG_SOURCE:=sublinkPro-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/ZeroDeng01/sublinkPro/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=35047d9270f2591a4943609132ef172ee3ebe57aa26bb65a8c23a69539a97ed1
PKG_BUILD_DIR:=$(BUILD_DIR)/sublinkPro-$(PKG_VERSION)

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=XiaoHaiSly

PKG_BUILD_DEPENDS:=golang/host node/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

# go.mod 里 module 名就是 "sublink", 入口 main.go 在仓库根目录
GO_PKG:=sublink
GO_PKG_BUILD_PKG:=sublink
GO_PKG_TAGS:=prod
# golang-package.mk 默认只把 .go/go.mod/go.sum 拷进 Go 工作目录，
# 而上游用 //go:embed 内嵌了下面这些非 Go 文件，必须额外带上，否则编译会报 "no matching files found"
# (不要用 GO_PKG_INSTALL_ALL，会把 webs/node_modules 也拷一遍)
GO_PKG_INSTALL_EXTRA:=^./static/ ^./template/ ^./skill-sublinkpro/ ^./VERSION

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/sublinkpro
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  TITLE:=SublinkPro subscription manager and converter
  URL:=https://github.com/ZeroDeng01/sublinkPro
  DEPENDS:=+ca-bundle
  USERID:=sublinkpro=5567:sublinkpro=5567
endef

define Package/sublinkpro/description
  SublinkPro is a self-hosted proxy subscription management, conversion and
  node-testing platform with a built-in Web UI (Clash / Surge / v2ray output).
  This package ships the core service. Web UI listens on port 8000 by default,
  default account is admin / 123456 on first run (change it immediately).
endef

define Package/sublinkpro/config
  depends on $(subst @,,$(GO_ARCH_DEPENDS))
endef

define Package/sublinkpro/conffiles
/etc/config/sublinkpro
/etc/sublinkpro/
endef

define Build/Prepare
	$(call Build/Prepare/Default)
	# 上游 VERSION 文件在 CI 里才写入, 这里补上, 否则程序显示的版本是空的
	echo "v$(PKG_VERSION)" > $(PKG_BUILD_DIR)/VERSION
endef

# 先在线构建前端 (webs/, Vite + Yarn 4), 产物放到 static/, 再用 -tags=prod 内嵌进二进制。
# 上游 package.json 声明 node>=24, 但 feeds 里的 node/host 可能是 22.x; 实测 Node 22 可以正常构建。
# OpenWrt 的 node 包不带 corepack, 所以用 npm 临时装一份 yarn 4.10.3 (与上游 packageManager 一致)。
define Build/Compile
	cd $(PKG_BUILD_DIR)/webs && \
		export PATH="$(STAGING_DIR_HOSTPKG)/bin:$$$$PATH" && \
		export npm_config_cache="$(PKG_BUILD_DIR)/.npm-cache" && \
		export YARN_IGNORE_PATH=1 YARN_ENABLE_TELEMETRY=0 && \
		export YARN_GLOBAL_FOLDER="$(PKG_BUILD_DIR)/.yarn-global" && \
		export YARN_CACHE_FOLDER="$(PKG_BUILD_DIR)/.yarn-cache" && \
		export NODE_OPTIONS="--max-old-space-size=2048" && \
		npm install --no-audit --no-fund --prefix "$(PKG_BUILD_DIR)/.yarn-cli" @yarnpkg/cli-dist@4.10.3 && \
		node "$(PKG_BUILD_DIR)/.yarn-cli/node_modules/@yarnpkg/cli-dist/bin/yarn.js" install --immutable && \
		node "$(PKG_BUILD_DIR)/.yarn-cli/node_modules/@yarnpkg/cli-dist/bin/yarn.js" run build
	rm -rf $(PKG_BUILD_DIR)/static
	$(CP) $(PKG_BUILD_DIR)/webs/dist $(PKG_BUILD_DIR)/static
	$(call GoPackage/Build/Compile)
endef

define Package/sublinkpro/install
	$(INSTALL_DIR) $(1)/usr/bin
	# 上游 Go 二进制名是 sublink (module 名), 安装时改成官方的 sublinkPro
	$(INSTALL_BIN) $(GO_PKG_BUILD_BIN_DIR)/sublink $(1)/usr/bin/sublinkPro

	$(INSTALL_DIR) $(1)/etc/sublinkpro
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/sublinkpro.conf $(1)/etc/config/sublinkpro
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/sublinkpro.init $(1)/etc/init.d/sublinkpro
endef

$(eval $(call BuildPackage,sublinkpro))
