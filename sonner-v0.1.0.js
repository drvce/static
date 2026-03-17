"use strict";
(() => {
    const DEFAULT_DURATION = 4000;
    const DEFAULT_POSITION = "bottom-right";
    const DEFAULT_MAX_VISIBLE = 3;
    const DEFAULT_GAP = 12;
    const DEFAULT_OFFSET = 24;
    const STYLE_ID = "sonner-vanilla-styles";
    let nextToastId = 1;
    const STYLE_TEXT = `
[data-sonner-vanilla-root] {
  position: fixed;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  gap: var(--sonner-gap, 12px);
  width: min(360px, calc(100vw - 32px));
  box-sizing: border-box;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

[data-sonner-vanilla-root][data-position^="top-"] {
  top: var(--sonner-offset, 24px);
}

[data-sonner-vanilla-root][data-position^="bottom-"] {
  bottom: var(--sonner-offset, 24px);
}

[data-sonner-vanilla-root][data-position$="-left"] {
  left: var(--sonner-offset, 24px);
}

[data-sonner-vanilla-root][data-position$="-right"] {
  right: var(--sonner-offset, 24px);
}

[data-sonner-vanilla-root][data-position$="-center"] {
  left: 50%;
  transform: translateX(-50%);
}

[data-sonner-vanilla-root][data-position^="bottom-"] {
  flex-direction: column-reverse;
}

[data-sonner-vanilla-toast] {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: start;
  box-sizing: border-box;
  width: 100%;
  padding: 14px 14px 14px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

[data-sonner-vanilla-toast][data-type="success"] {
  border-color: #bbf7d0;
}

[data-sonner-vanilla-toast][data-type="info"] {
  border-color: #bfdbfe;
}

[data-sonner-vanilla-toast][data-type="warning"] {
  border-color: #fde68a;
}

[data-sonner-vanilla-toast][data-type="error"] {
  border-color: #fecaca;
}

[data-sonner-vanilla-icon] {
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 14px;
  flex: 0 0 auto;
}

[data-sonner-vanilla-content] {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

[data-sonner-vanilla-title] {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

[data-sonner-vanilla-description] {
  font-size: 13px;
  line-height: 1.4;
  color: #4b5563;
  word-break: break-word;
}

[data-sonner-vanilla-actions] {
  display: flex;
  gap: 8px;
  align-items: center;
}

[data-sonner-vanilla-button],
[data-sonner-vanilla-close] {
  appearance: none;
  border: 0;
  border-radius: 8px;
  font: inherit;
  cursor: pointer;
}

[data-sonner-vanilla-button] {
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  background: #111827;
  color: #ffffff;
}

[data-sonner-vanilla-button][data-variant="cancel"] {
  background: #f3f4f6;
  color: #111827;
}

[data-sonner-vanilla-close] {
  width: 24px;
  height: 24px;
  background: transparent;
  color: #6b7280;
  font-size: 16px;
  line-height: 24px;
  padding: 0;
}

[data-sonner-vanilla-spinner] {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-top-color: #111827;
  border-radius: 999px;
  animation: sonner-vanilla-spin 0.8s linear infinite;
  box-sizing: border-box;
  margin: 2px;
}

@keyframes sonner-vanilla-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  [data-sonner-vanilla-root] {
    width: calc(100vw - 24px);
    left: 12px !important;
    right: 12px !important;
    transform: none !important;
  }
}
`;
    function resolveContent(value) {
        if (typeof value === "function") {
            return value();
        }
        return value !== null && value !== void 0 ? value : "";
    }
    function isBrowserReady() {
        return typeof window !== "undefined" && typeof document !== "undefined";
    }
    function ensureStyles() {
        if (!isBrowserReady() || document.getElementById(STYLE_ID)) {
            return;
        }
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = STYLE_TEXT;
        document.head.appendChild(style);
    }
    function createButton(button, variant, onClick) {
        const element = document.createElement("button");
        element.type = "button";
        element.textContent = button.label;
        element.dataset.sonnerVanillaButton = "";
        element.dataset.variant = variant;
        element.addEventListener("click", onClick);
        return element;
    }
    function createIcon(type) {
        const icon = document.createElement("div");
        icon.dataset.sonnerVanillaIcon = "";
        if (type === "loading") {
            const spinner = document.createElement("div");
            spinner.dataset.sonnerVanillaSpinner = "";
            icon.appendChild(spinner);
            return icon;
        }
        const symbols = {
            default: "•",
            success: "✓",
            info: "i",
            warning: "!",
            error: "×",
            loading: "",
        };
        icon.textContent = symbols[type];
        return icon;
    }
    function createToastRecord(title, type, options) {
        return {
            ...options,
            id: (options === null || options === void 0 ? void 0 : options.id) !== undefined ? options.id : nextToastId++,
            title,
            type,
            createdAt: Date.now(),
        };
    }
    function createToastApi(toaster) {
        const show = (title, options) => toaster.show(title, options);
        const api = show;
        api.success = (title, options) => toaster.success(title, options);
        api.info = (title, options) => toaster.info(title, options);
        api.warning = (title, options) => toaster.warning(title, options);
        api.error = (title, options) => toaster.error(title, options);
        api.loading = (title, options) => toaster.loading(title, options);
        api.mount = (parent) => toaster.mount(parent);
        api.unmount = () => toaster.unmount();
        api.configure = (options) => toaster.updateDefaults(options);
        api.dismiss = (id) => toaster.dismiss(id);
        api.promise = (promise, options) => toaster.promise(promise, options);
        api.getToasts = () => toaster.getToasts();
        api.getHistory = () => toaster.getHistory();
        return api;
    }
    function createToaster(initialOptions) {
        var _a, _b, _c, _d, _e, _f, _g;
        const defaults = {
            position: (_a = initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.position) !== null && _a !== void 0 ? _a : DEFAULT_POSITION,
            maxVisible: (_b = initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.maxVisible) !== null && _b !== void 0 ? _b : DEFAULT_MAX_VISIBLE,
            duration: (_c = initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.duration) !== null && _c !== void 0 ? _c : DEFAULT_DURATION,
            gap: (_d = initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.gap) !== null && _d !== void 0 ? _d : DEFAULT_GAP,
            offset: (_e = initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.offset) !== null && _e !== void 0 ? _e : DEFAULT_OFFSET,
            closeButton: (_f = initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.closeButton) !== null && _f !== void 0 ? _f : false,
            injectStyles: (_g = initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.injectStyles) !== null && _g !== void 0 ? _g : true,
            container: initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.container,
        };
        const activeToasts = new Map();
        const history = [];
        let root = null;
        let mountedParent = null;
        function mount(parent) {
            var _a, _b, _c, _d;
            if (!isBrowserReady()) {
                throw new Error("SonnerVanilla can only run in a browser.");
            }
            if (defaults.injectStyles) {
                ensureStyles();
            }
            const target = (_a = parent !== null && parent !== void 0 ? parent : defaults.container) !== null && _a !== void 0 ? _a : document.body;
            if (!target) {
                throw new Error("SonnerVanilla could not find a mount target.");
            }
            mountedParent = target;
            if (!root) {
                root = document.createElement("div");
                root.dataset.sonnerVanillaRoot = "";
            }
            root.dataset.position = (_b = defaults.position) !== null && _b !== void 0 ? _b : DEFAULT_POSITION;
            root.style.setProperty("--sonner-gap", `${(_c = defaults.gap) !== null && _c !== void 0 ? _c : DEFAULT_GAP}px`);
            root.style.setProperty("--sonner-offset", `${(_d = defaults.offset) !== null && _d !== void 0 ? _d : DEFAULT_OFFSET}px`);
            if (!root.parentElement) {
                target.appendChild(root);
            }
        }
        function unmount() {
            activeToasts.forEach((handle) => {
                clearTimer(handle);
                handle.element.remove();
            });
            activeToasts.clear();
            if (root) {
                root.remove();
            }
            root = null;
            mountedParent = null;
        }
        function ensureMounted() {
            if (root && root.parentElement) {
                return;
            }
            mount(mountedParent !== null && mountedParent !== void 0 ? mountedParent : undefined);
        }
        function clearTimer(handle) {
            if (handle.timerId !== null) {
                window.clearTimeout(handle.timerId);
                handle.timerId = null;
            }
        }
        function removeHandle(handle, reason) {
            var _a, _b, _c, _d;
            clearTimer(handle);
            activeToasts.delete(handle.id);
            handle.element.remove();
            if (reason === "auto") {
                (_b = (_a = handle.toast).onAutoClose) === null || _b === void 0 ? void 0 : _b.call(_a, handle.toast);
            }
            (_d = (_c = handle.toast).onDismiss) === null || _d === void 0 ? void 0 : _d.call(_c, handle.toast);
        }
        function startTimer(handle) {
            var _a, _b;
            clearTimer(handle);
            if (handle.toast.type === "loading") {
                return;
            }
            const duration = (_b = (_a = handle.toast.duration) !== null && _a !== void 0 ? _a : defaults.duration) !== null && _b !== void 0 ? _b : DEFAULT_DURATION;
            if (duration === Infinity) {
                return;
            }
            handle.remaining = handle.remaining > 0 ? handle.remaining : duration;
            handle.startedAt = Date.now();
            handle.timerId = window.setTimeout(() => {
                removeHandle(handle, "auto");
            }, handle.remaining);
        }
        function pauseTimer(handle) {
            if (handle.timerId === null) {
                return;
            }
            handle.remaining = Math.max(0, handle.remaining - (Date.now() - handle.startedAt));
            clearTimer(handle);
        }
        function createToastElement(handle) {
            var _a;
            const toast = handle.toast;
            const element = document.createElement("div");
            element.dataset.sonnerVanillaToast = "";
            element.dataset.type = toast.type;
            if (toast.className) {
                element.className = toast.className;
            }
            const icon = createIcon(toast.type);
            const content = document.createElement("div");
            content.dataset.sonnerVanillaContent = "";
            const title = document.createElement("div");
            title.dataset.sonnerVanillaTitle = "";
            title.textContent = resolveContent(toast.title);
            content.appendChild(title);
            const descriptionText = resolveContent(toast.description);
            if (descriptionText) {
                const description = document.createElement("div");
                description.dataset.sonnerVanillaDescription = "";
                description.textContent = descriptionText;
                content.appendChild(description);
            }
            const actions = document.createElement("div");
            actions.dataset.sonnerVanillaActions = "";
            if (toast.cancel) {
                const cancelButton = createButton(toast.cancel, "cancel", () => {
                    var _a, _b;
                    (_b = (_a = toast.cancel) === null || _a === void 0 ? void 0 : _a.onClick) === null || _b === void 0 ? void 0 : _b.call(_a);
                    instance.dismiss(toast.id);
                });
                actions.appendChild(cancelButton);
            }
            if (toast.action) {
                const actionButton = createButton(toast.action, "action", () => {
                    var _a, _b;
                    (_b = (_a = toast.action) === null || _a === void 0 ? void 0 : _a.onClick) === null || _b === void 0 ? void 0 : _b.call(_a);
                    instance.dismiss(toast.id);
                });
                actions.appendChild(actionButton);
            }
            const canClose = toast.dismissible !== false;
            const showCloseButton = (_a = toast.closeButton) !== null && _a !== void 0 ? _a : defaults.closeButton;
            if (showCloseButton && canClose) {
                const close = document.createElement("button");
                close.type = "button";
                close.textContent = "×";
                close.dataset.sonnerVanillaClose = "";
                close.addEventListener("click", () => instance.dismiss(toast.id));
                actions.appendChild(close);
            }
            element.appendChild(icon);
            element.appendChild(content);
            element.appendChild(actions);
            if (canClose) {
                element.addEventListener("mouseenter", () => pauseTimer(handle));
                element.addEventListener("mouseleave", () => startTimer(handle));
            }
            return element;
        }
        function upsertToast(record) {
            var _a, _b, _c, _d;
            ensureMounted();
            const existing = activeToasts.get(record.id);
            history.push(record);
            if (existing) {
                clearTimer(existing);
                existing.toast = record;
                const nextElement = createToastElement(existing);
                existing.element.replaceWith(nextElement);
                existing.element = nextElement;
                existing.remaining = (_b = (_a = record.duration) !== null && _a !== void 0 ? _a : defaults.duration) !== null && _b !== void 0 ? _b : DEFAULT_DURATION;
                startTimer(existing);
                trimVisible();
                return record.id;
            }
            const handle = {
                id: record.id,
                element: document.createElement("div"),
                timerId: null,
                remaining: (_d = (_c = record.duration) !== null && _c !== void 0 ? _c : defaults.duration) !== null && _d !== void 0 ? _d : DEFAULT_DURATION,
                startedAt: 0,
                toast: record,
            };
            handle.element = createToastElement(handle);
            activeToasts.set(record.id, handle);
            root.appendChild(handle.element);
            startTimer(handle);
            trimVisible();
            return record.id;
        }
        function trimVisible() {
            var _a;
            if (!root) {
                return;
            }
            const maxVisible = (_a = defaults.maxVisible) !== null && _a !== void 0 ? _a : DEFAULT_MAX_VISIBLE;
            const ordered = Array.from(activeToasts.values()).sort((a, b) => b.toast.createdAt - a.toast.createdAt);
            ordered.forEach((handle, index) => {
                handle.element.style.display = index < maxVisible ? "" : "none";
            });
        }
        function showWithType(type, title, options) {
            const record = createToastRecord(title, type, options);
            return upsertToast(record);
        }
        const instance = {
            mount(parent) {
                mount(parent);
            },
            unmount() {
                unmount();
            },
            show(title, options) {
                return showWithType("default", title, options);
            },
            success(title, options) {
                return showWithType("success", title, options);
            },
            info(title, options) {
                return showWithType("info", title, options);
            },
            warning(title, options) {
                return showWithType("warning", title, options);
            },
            error(title, options) {
                return showWithType("error", title, options);
            },
            loading(title, options) {
                return showWithType("loading", title, options);
            },
            dismiss(id) {
                if (id === undefined) {
                    Array.from(activeToasts.values()).forEach((handle) => removeHandle(handle, "manual"));
                    return;
                }
                const handle = activeToasts.get(id);
                if (handle) {
                    removeHandle(handle, "manual");
                }
            },
            async promise(promise, options) {
                var _a;
                const id = instance.loading(options.loading, {
                    ...options,
                    description: typeof options.description === "string" ? options.description : undefined,
                });
                try {
                    const result = await (typeof promise === "function" ? promise() : promise);
                    if (options.success) {
                        instance.success(typeof options.success === "function" ? options.success(result) : options.success, {
                            ...options,
                            id,
                            description: typeof options.description === "function"
                                ? options.description(result)
                                : options.description,
                        });
                    }
                    else {
                        instance.dismiss(id);
                    }
                    return result;
                }
                catch (error) {
                    if (options.error) {
                        instance.error(typeof options.error === "function" ? options.error(error) : options.error, {
                            ...options,
                            id,
                            description: typeof options.description === "function"
                                ? options.description(error)
                                : options.description,
                        });
                    }
                    else {
                        instance.dismiss(id);
                    }
                    throw error;
                }
                finally {
                    (_a = options.finally) === null || _a === void 0 ? void 0 : _a.call(options);
                }
            },
            getToasts() {
                return Array.from(activeToasts.values()).map((handle) => handle.toast);
            },
            getHistory() {
                return history.slice();
            },
            updateDefaults(options) {
                Object.assign(defaults, options);
                if (root) {
                    mount(mountedParent !== null && mountedParent !== void 0 ? mountedParent : undefined);
                    trimVisible();
                }
            },
        };
        return instance;
    }
    const defaultToaster = createToaster();
    const toast = createToastApi(defaultToaster);
    window.SonnerVanilla = {
        createToaster,
        toast,
    };
})();
