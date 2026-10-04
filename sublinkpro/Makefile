# SPDX-License-Identifier: MIT

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
PKG_MAINTAINER:=xiaohaisly

PKG_BUILD_DEPENDS:=golang/host node/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=sublink
GO_PKG_BUILD_PKG:=sublink
GO_PKG_TAGS:=prod
GO_PKG_INSTALL_EXTRA:=^./static/ ^./template/ ^./skill-sublinkpro/ ^./VERSION

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/sublinkpro
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  TITLE:=SublinkPro 订阅管理与转换工具
  URL:=https://github.com/ZeroDeng01/sublinkPro
  DEPENDS:=+ca-bundle
endef

define Package/sublinkpro/description
  SublinkPro 节点订阅管理、转换与测速平台，自带 Web 管理界面。
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
	echo "v$(PKG_VERSION)" > $(PKG_BUILD_DIR)/VERSION
endef

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
	$(call GoPackage/Package/Install/Bin,$(1))

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/sublinkpro.conf $(1)/etc/config/sublinkpro
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/sublinkpro.init $(1)/etc/init.d/sublinkpro
endef

$(eval $(call BuildPackage,sublinkpro))
