const VERSION = Object.freeze({
  APP: "2.0.0",
  CONFIG_EXPORT: "2.0.0",
});

const { createApp } = Vue;

createApp({
  data() {
    return {
      editMode: false,
      fabMenuOpen: false,
      showSettingsModal: false,
      showAddModuleModal: false,
      showEditModuleModal: false,
      showAddLinkModal: false,
      showEditLinkModal: false,
      showAddSearchEngineModal: false,
      showEditSearchEngineModal: false,
      settingsTab: "background",

      // 背景设置
      bgColor: "#46a3ff",
      bgImageUrl: "",
      bgImageData: "",
      bgOpacity: 0.5,

      // 搜索引擎
      searchEngines: [],
      currentSearchEngine: {},
      selectedSearchEngineId: null,
      searchQuery: "",

      // 链接模块
      modules: [],
      currentModule: {},
      currentModuleIndex: -1,

      // 链接
      currentLink: {},
      currentLinkModuleIndex: -1,
      currentLinkIndex: -1,

      // 导入导出
      exportedConfig: "",
      importedConfig: "",

      // 预设配置
      presets: [
        { name: "默认配置", key: "default" },
        { name: "极简配置", key: "minimal" },
        { name: "完整配置", key: "full" },
      ],

      // 拖拽实例
      searchEngineSortable: null,
      moduleSortable: null,
      linkSortables: [],
      linkRowRefs: {},
      versionInfo: VERSION,
    };
  },

  computed: {
    selectedSearchEngine() {
      return (
        this.searchEngines.find((e) => e.id === this.selectedSearchEngineId) ||
        null
      );
    },
  },

  mounted() {
    this.loadConfig();
    this.initSortable();
    this.updateExportedConfig();
    this.applyBackground();
  },

  watch: {
    editMode() {
      this.$nextTick(() => {
        this.initSortable();
      });
    },
    selectedSearchEngineId() {
      this.saveConfig();
    },
    searchEngines: {
      handler() {
        this.saveConfig();
        this.updateExportedConfig();
      },
      deep: true,
    },
    modules: {
      handler() {
        this.saveConfig();
        this.updateExportedConfig();
      },
      deep: true,
    },
  },

  methods: {
    // 初始化配置
    loadConfig() {
      const saved = localStorage.getItem("naviConfig");
      if (saved) {
        try {
          const config = JSON.parse(saved);
          this.searchEngines =
            config.searchEngines || this.getDefaultSearchEngines();
          this.modules = config.modules || this.getDefaultModules();
          this.setBackgroundSettings(config);
          // 初始化选中的搜索引擎
          this.selectedSearchEngineId =
            config.selectedSearchEngineId ||
            (this.searchEngines.length > 0 ? this.searchEngines[0].id : null);
        } catch (e) {
          console.error("加载配置失败", e);
          this.loadDefaultConfig();
        }
      } else {
        this.loadDefaultConfig();
      }
    },

    loadDefaultConfig() {
      this.searchEngines = this.getDefaultSearchEngines();
      this.modules = this.getDefaultModules();
      // 初始化选中的搜索引擎
      this.selectedSearchEngineId =
        this.searchEngines.length > 0 ? this.searchEngines[0].id : null;
      this.setBackgroundSettings({});
    },

    saveConfig() {
      const config = {
        searchEngines: this.searchEngines,
        modules: this.modules,
        bgColor: this.bgColor,
        bgImageUrl: this.bgImageUrl,
        bgImageData: this.bgImageData,
        bgOpacity: this.bgOpacity,
        selectedSearchEngineId: this.selectedSearchEngineId,
      };
      localStorage.setItem("naviConfig", JSON.stringify(config));
    },

    // 默认搜索引擎
    getDefaultSearchEngines() {
      return [
        {
          id: 1,
          name: "Google",
          searchUrl: "https://www.google.com/search",
          homeUrl: "https://www.google.com",
          queryParam: "q",
          icon: "fa-google",
        },
        {
          id: 2,
          name: "Bing",
          searchUrl: "https://www.bing.com/search",
          homeUrl: "https://www.bing.com",
          queryParam: "q",
          icon: "fa-bold",
        },
        {
          id: 3,
          name: "Baidu",
          searchUrl: "https://www.baidu.com/s",
          homeUrl: "https://www.baidu.com",
          queryParam: "wd",
          icon: "fa-search",
        },
      ];
    },

    // 默认链接模块
    getDefaultModules() {
      return [
        {
          id: 1,
          title: "常用 - 国内",
          links: [
            {
              id: 1,
              title: "知乎",
              url: "https://www.zhihu.com/",
              icon: "fa-comments",
              iconType: "fa",
            },
            {
              id: 2,
              title: "BiliBili",
              url: "https://www.bilibili.com/",
              icon: "fa-video-camera",
              iconType: "fa",
            },
            {
              id: 3,
              title: "网易云音乐",
              url: "https://music.163.com/",
              icon: "fa-music",
              iconType: "fa",
            },
          ],
        },
        {
          id: 2,
          title: "常用 - 国外",
          links: [
            {
              id: 1,
              title: "Youtube",
              url: "https://www.youtube.com/",
              icon: "fa-youtube",
              iconType: "fa",
            },
            {
              id: 2,
              title: "Twitter",
              url: "https://www.twitter.com/",
              icon: "fa-twitter",
              iconType: "fa",
            },
            {
              id: 3,
              title: "Gmail",
              url: "https://mail.google.com/",
              icon: "fa-envelope-o",
              iconType: "fa",
            },
          ],
        },
        {
          id: 3,
          title: "开发与工具",
          links: [
            {
              id: 1,
              title: "GitHub",
              url: "https://github.com/",
              icon: "fa-github",
              iconType: "fa",
            },
            {
              id: 2,
              title: "StackOverflow",
              url: "https://stackoverflow.com/",
              icon: "fa-stack-overflow",
              iconType: "fa",
            },
            {
              id: 3,
              title: "Google 翻译",
              url: "https://translate.google.com/",
              icon: "fa-language",
              iconType: "fa",
            },
          ],
        },
      ];
    },

    // 编辑模式
    toggleEditMode() {
      this.editMode = !this.editMode;
      this.fabMenuOpen = false;

      // 手动切换类名
      const app = document.getElementById("app");
      if (this.editMode) {
        app.classList.add("edit-mode");
      } else {
        app.classList.remove("edit-mode");
      }
    },

    // 初始化拖拽
    initSortable() {
      // 先销毁现有实例
      try {
        if (this.searchEngineSortable) {
          this.searchEngineSortable.destroy();
          this.searchEngineSortable = null;
        }
        if (this.moduleSortable) {
          this.moduleSortable.destroy();
          this.moduleSortable = null;
        }
        // 销毁所有链接拖拽实例
        this.linkSortables.forEach((sortable) => {
          if (sortable) sortable.destroy();
        });
        this.linkSortables = [];
      } catch (e) {
        console.warn("销毁Sortable实例时出错:", e);
      }

      if (!this.editMode) {
        return; // 非编辑模式下不初始化
      }

      const vm = this; // 保存 this 引用

      // 搜索引擎拖拽
      const searchContainer = this.$refs.searchEnginesContainer;
      if (searchContainer) {
        try {
          this.searchEngineSortable = Sortable.create(searchContainer, {
            animation: 150,
            handle: ".drag-handle",
            ghostClass: "sortable-ghost",
            onEnd: (evt) => {
              const item = vm.searchEngines.splice(evt.oldIndex, 1)[0];
              vm.searchEngines.splice(evt.newIndex, 0, item);
              vm.$nextTick(() => {
                vm.saveConfig();
              });
            },
          });
        } catch (e) {
          console.error("初始化搜索引擎拖拽失败:", e);
        }
      }

      // 模块拖拽
      const modulesContainer = this.$refs.modulesContainer;
      if (modulesContainer) {
        try {
          this.moduleSortable = Sortable.create(modulesContainer, {
            animation: 150,
            handle: ".panel-heading-custom",
            ghostClass: "sortable-ghost",
            onEnd: (evt) => {
              const item = vm.modules.splice(evt.oldIndex, 1)[0];
              vm.modules.splice(evt.newIndex, 0, item);
              vm.$nextTick(() => {
                vm.saveConfig();
              });
            },
          });
        } catch (e) {
          console.error("初始化模块拖拽失败:", e);
        }
      }

      // 链接拖拽（支持跨模块）
      this.modules.forEach((module) => {
        const rowEl = this.linkRowRefs[module.id];
        if (rowEl) {
          try {
            const sortable = Sortable.create(rowEl, {
              group: "links", // 同一组可以跨容器拖拽
              animation: 150,
              ghostClass: "sortable-ghost",
              filter: ".fa-plus-circle, .fa-edit, .fa-trash",
              preventOnFilter: false,
              onEnd: (evt) => {
                const linkId = parseInt(evt.item.getAttribute("data-link-id"));
                const oldModuleId = parseInt(
                  evt.item.getAttribute("data-module-id")
                );

                // 获取新模块ID - 从目标容器的第一个链接获取
                let newModuleId = oldModuleId;
                const firstLinkInTarget =
                  evt.to.querySelector("[data-module-id]");
                if (firstLinkInTarget) {
                  newModuleId = parseInt(
                    firstLinkInTarget.getAttribute("data-module-id")
                  );
                }

                // 找到源模块和目标模块
                const oldModuleIndex = vm.modules.findIndex(
                  (m) => m.id === oldModuleId
                );
                const newModuleIndex = vm.modules.findIndex(
                  (m) => m.id === newModuleId
                );

                if (oldModuleIndex !== -1 && newModuleIndex !== -1) {
                  // 从源模块中移除链接
                  const linkIndex = vm.modules[oldModuleIndex].links.findIndex(
                    (l) => l.id === linkId
                  );
                  if (linkIndex !== -1) {
                    const link = vm.modules[oldModuleIndex].links.splice(
                      linkIndex,
                      1
                    )[0];
                    // 更新链接的模块ID（如果跨模块移动）
                    // 注意：data-module-id 会在下次渲染时自动更新

                    // 添加到目标模块
                    vm.modules[newModuleIndex].links.splice(
                      evt.newIndex,
                      0,
                      link
                    );
                    // 强制触发响应式更新和保存
                    vm.$nextTick(() => {
                      vm.saveConfig();
                    });
                  }
                }
              },
            });
            vm.linkSortables.push(sortable);
          } catch (e) {
            console.error("初始化链接拖拽失败 (模块" + module.id + "):", e);
          }
        }
      });
    },

    // 搜索引擎管理
    selectSearchEngine(engineId) {
      this.selectedSearchEngineId = engineId;
    },

    handleUnifiedSearch(event) {
      event.preventDefault();
      const engine = this.searchEngines.find(
        (e) => e.id === this.selectedSearchEngineId
      );

      if (!engine) return;

      const query = this.searchQuery.trim();

      if (!query && engine.homeUrl) {
        window.open(engine.homeUrl, "_self");
      } else if (query) {
        const url = `${engine.searchUrl}?${engine.queryParam
          }=${encodeURIComponent(query)}`;
        window.open(url, "_self");
      }
    },

    editSearchEngine(engine) {
      this.currentSearchEngine = { ...engine };
      this.showEditSearchEngineModal = true;
    },

    deleteSearchEngine(id) {
      if (confirm("确定删除此搜索引擎？")) {
        this.searchEngines = this.searchEngines.filter((e) => e.id !== id);
        // 如果删除的是当前选中的,切换到第一个
        if (
          this.selectedSearchEngineId === id &&
          this.searchEngines.length > 0
        ) {
          this.selectedSearchEngineId = this.searchEngines[0].id;
        }
      }
    },

    saveSearchEngine() {
      if (this.showEditSearchEngineModal) {
        const index = this.searchEngines.findIndex(
          (e) => e.id === this.currentSearchEngine.id
        );
        if (index !== -1) {
          this.searchEngines[index] = { ...this.currentSearchEngine };
        }
      } else {
        const newId = Math.max(...this.searchEngines.map((e) => e.id), 0) + 1;
        this.searchEngines.push({ ...this.currentSearchEngine, id: newId });
      }
      this.closeSearchEngineModal();
    },

    closeSearchEngineModal() {
      this.showAddSearchEngineModal = false;
      this.showEditSearchEngineModal = false;
      this.currentSearchEngine = {};
    },

    // 模块管理
    editModule(module) {
      this.currentModule = { ...module };
      this.currentModuleIndex = this.modules.findIndex(
        (m) => m.id === module.id
      );
      this.showEditModuleModal = true;
    },

    deleteModule(id) {
      if (confirm("确定删除此模块？")) {
        this.modules = this.modules.filter((m) => m.id !== id);
      }
    },

    saveModule() {
      if (this.showEditModuleModal) {
        this.modules[this.currentModuleIndex] = { ...this.currentModule };
      } else {
        const newId = Math.max(...this.modules.map((m) => m.id), 0) + 1;
        this.modules.push({
          id: newId,
          title: this.currentModule.title || "新模块",
          links: [],
        });
      }
      this.closeModuleModal();
    },

    closeModuleModal() {
      this.showAddModuleModal = false;
      this.showEditModuleModal = false;
      this.currentModule = {};
      this.currentModuleIndex = -1;
    },

    // 链接管理
    addLink(module) {
      this.currentLinkModuleIndex = this.modules.findIndex(
        (m) => m.id === module.id
      );
      this.currentLink = {
        title: "",
        url: "",
        icon: "fa-link",
        iconType: "fa",
      };
      this.showAddLinkModal = true;
    },

    editLink(module, link) {
      this.currentLinkModuleIndex = this.modules.findIndex(
        (m) => m.id === module.id
      );
      this.currentLinkIndex = module.links.findIndex((l) => l.id === link.id);
      this.currentLink = { ...link };
      this.showEditLinkModal = true;
    },

    deleteLink(module, linkId) {
      if (confirm("确定删除此链接？")) {
        const moduleIndex = this.modules.findIndex((m) => m.id === module.id);
        this.modules[moduleIndex].links = this.modules[
          moduleIndex
        ].links.filter((l) => l.id !== linkId);
      }
    },

    saveLink() {
      // 如果是图片类型且未提供图标URL，自动获取favicon
      if (
        this.currentLink.iconType === "image" &&
        !this.currentLink.icon &&
        this.currentLink.url
      ) {
        try {
          const url = new URL(this.currentLink.url);
          this.currentLink.icon = `${url.origin}/favicon.ico`;
        } catch (e) {
          console.error("无效的URL", e);
        }
      }

      if (this.showEditLinkModal) {
        this.modules[this.currentLinkModuleIndex].links[this.currentLinkIndex] =
          { ...this.currentLink };
      } else {
        const module = this.modules[this.currentLinkModuleIndex];
        const newId = Math.max(...module.links.map((l) => l.id), 0) + 1;
        module.links.push({ ...this.currentLink, id: newId });
      }
      this.closeLinkModal();
    },

    closeLinkModal() {
      this.showAddLinkModal = false;
      this.showEditLinkModal = false;
      this.currentLink = {};
      this.currentLinkModuleIndex = -1;
      this.currentLinkIndex = -1;
    },

    handleImageError(event, link) {
      // 图片加载失败时使用默认图标
      event.target.style.display = "none";
      event.target.insertAdjacentHTML(
        "afterend",
        '<i class="fa fa-link link-favicon"></i>'
      );
    },

    // 背景设置
    setBackgroundSettings(config = {}) {
      const source = config && typeof config === "object" ? config : {};
      const defaults = {
        bgColor: "#46a3ff",
        bgImageUrl: "",
        bgImageData: "",
        bgOpacity: 0.5,
      };
      const getOrDefault = (key) =>
        Object.prototype.hasOwnProperty.call(source, key)
          ? source[key]
          : defaults[key];

      this.bgColor = getOrDefault("bgColor");
      this.bgImageUrl = getOrDefault("bgImageUrl");
      this.bgImageData = getOrDefault("bgImageData");
      const opacity = getOrDefault("bgOpacity");
      this.bgOpacity =
        typeof opacity === "number" ? opacity : defaults.bgOpacity;
    },

    applyBackground() {
      const body = document.body;

      if (this.bgImageData) {
        body.style.backgroundImage = `url(${this.bgImageData})`;
        body.style.backgroundColor = "";
      } else if (this.bgImageUrl) {
        body.style.backgroundImage = `url(${this.bgImageUrl})`;
        body.style.backgroundColor = "";
      } else {
        body.style.backgroundImage = "";
        const rgb = this.hexToRgb(this.bgColor);
        body.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.bgOpacity})`;
      }

      this.saveConfig();
    },

    handleBgImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.bgImageData = e.target.result;
          this.bgImageUrl = "";
        };
        reader.readAsDataURL(file);
      }
    },

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
        : { r: 70, g: 163, b: 255 };
    },

    // 导入导出
    updateExportedConfig() {
      const config = {
        searchEngines: this.searchEngines,
        modules: this.modules,
        bgColor: this.bgColor,
        bgImageUrl: this.bgImageUrl,
        bgImageData: this.bgImageData,
        bgOpacity: this.bgOpacity,
        selectedSearchEngineId: this.selectedSearchEngineId,
        version: VERSION.CONFIG_EXPORT,
        exportDate: new Date().toISOString(),
      };
      this.exportedConfig = JSON.stringify(config, null, 2);
    },

    downloadConfig() {
      const blob = new Blob([this.exportedConfig], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `navi-config-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    importFromJSON() {
      try {
        const config = JSON.parse(this.importedConfig);
        if (confirm("确定导入此配置？当前配置将被覆盖！")) {
          this.searchEngines =
            config.searchEngines || this.getDefaultSearchEngines();
          this.modules = config.modules || this.getDefaultModules();
          this.setBackgroundSettings(config);
          this.selectedSearchEngineId =
            config.selectedSearchEngineId ||
            (this.searchEngines.length > 0 ? this.searchEngines[0].id : null);
          this.saveConfig();
          this.applyBackground();
          alert("配置导入成功！");
          this.importedConfig = "";
        }
      } catch (e) {
        alert("JSON格式错误，请检查！");
        console.error(e);
      }
    },

    handleConfigUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.importedConfig = e.target.result;
          this.importFromJSON();
        };
        reader.readAsText(file);
      }
    },

    // 预设配置
    async loadPreset(presetKey) {
      if (!confirm("确定加载此预设配置？当前配置将被覆盖！")) {
        return;
      }

      try {
        // 从 JSON 文件加载配置
        const response = await fetch(
          `configs/${presetKey}.json?v=${Date.now()}`,
          {
            cache: "no-cache",
          }
        );
        if (!response.ok) {
          throw new Error(
            `无法加载配置文件: configs/${presetKey}.json (HTTP ${response.status})`
          );
        }

        const config = await response.json();
        this.searchEngines =
          config.searchEngines || this.getDefaultSearchEngines();
        this.modules = config.modules || this.getDefaultModules();
        this.selectedSearchEngineId =
          config.selectedSearchEngineId ||
          (this.searchEngines.length > 0 ? this.searchEngines[0].id : null);
        this.setBackgroundSettings(config);

        this.saveConfig();
        this.applyBackground();
        alert("预设配置加载成功！");
      } catch (error) {
        console.error("加载预设配置失败:", error);
        alert(`加载预设配置失败：${error.message}`);
      }
    },
  },
}).mount("#app");
