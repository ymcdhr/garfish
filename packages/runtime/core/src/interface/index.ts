import { EventEmitter } from 'events';
import { SyncHook, AsyncSeriesBailHook } from '@garfish/hooks';
import {
  Loader,
  StyleManager,
  ModuleManager,
  TemplateManager,
  JavaScriptManager,
} from '@garfish/loader';
import { AppInterface } from '../module/app';

export namespace interfaces {
  export type DomGetter = Element | (() => Element | null) | string;

  export interface LoaderResult {
    mount: () => void;
    unmount: () => void;
  }

  export declare type LifeCycleFn = (
    appInfo: AppInfo,
    path: string,
  ) => Promise<void> | void;

  export interface App extends AppInterface {}

  export interface AppInfo
    extends Exclude<
      Options,
      [
        'apps',
        'appID',
        'plugins',
        'disableStatistics',
        'disablePreloadApp',
        'plugins',
      ]
    > {
    name: string;
    entry: string;
    cache?: boolean; // Whether the cache
    activeWhen?: string | ((path: string) => boolean);
    hooks?: Hooks;
  }

  export interface Garfish {
    flag: symbol;
    version: string;
    running: boolean;
    externals: Record<string, any>;
    hooks: Hooks;
    loader: Loader;
    options: Options;
    channel: EventEmitter;
    activeApps: Array<interfaces.App>;
    plugins: Array<interfaces.Plugin>;
    cacheApps: Record<string, interfaces.App>;
    appInfos: Record<string, interfaces.AppInfo>;
    loadApp(
      name: string,
      opts: Partial<interfaces.LoadAppOptions> | string,
    ): Promise<interfaces.App | null>;
  }

  export interface AppRenderInfo {
    isMount?: boolean;
    isUnmount?: boolean;
  }

  export interface Provider {
    destroy: ({ dom: HTMLElement, appRenderInfo: AppRenderInfo }) => void;
    render: ({
      dom: HTMLElement,
      basename: string,
      appRenderInfo: AppRenderInfo,
    }) => void;
  }

  export interface SandboxConfig {
    open?: boolean;
    snapshot?: boolean;
    useStrict?: boolean;
    strictIsolation?: boolean;
  }

  export interface Config {
    appID?: string;
    basename?: string;
    apps?: Array<AppInfo>;
    sandbox?: SandboxConfig;
    plugins?: Array<(context: Garfish) => Plugin>;
    props?: Record<string, any>;
    disableStatistics?: boolean;
    disablePreloadApp?: boolean;
    // onNotMatchRouter?: (path: string) => Promise<void> | void;
    // autoRefreshApp?: boolean;
    domGetter?: DomGetter;
    nested?: boolean;
  }

  export interface HooksLifecycle {
    beforeEval?: LifeCycleFn;
    afterEval?: LifeCycleFn;
    beforeMount?: LifeCycleFn;
    afterMount?: LifeCycleFn;
    beforeUnmount?: LifeCycleFn;
    afterUnmount?: LifeCycleFn;
    beforeLoad?: (
      appInfo: AppInfo,
      opts: LoadAppOptions,
    ) => Promise<void | false> | void | false;
    afterLoad?: (
      appInfo: AppInfo,
      opts: LoadAppOptions,
    ) => Promise<void> | void;
    errorLoadApp?: (err: Error | string, appInfo: AppInfo) => void;
    errorMountApp?: (err: Error | string, appInfo: AppInfo) => void;
    errorUnmountApp?: (err: Error | string, appInfo: AppInfo) => void;
    customLoader?: (
      provider: Provider,
      appInfo: AppInfo,
      path: string,
    ) => Promise<LoaderResult | void> | LoaderResult | void;
  }

  export interface StyleManagerInterface extends StyleManager {}
  export interface ModuleManagerInterface extends ModuleManager {}
  export interface TemplateManagerInterface extends TemplateManager {}
  export interface JavaScriptManagerInterface extends JavaScriptManager {}

  export type Options = Config & HooksLifecycle;

  export type LoadAppOptions = Pick<AppInfo, Exclude<keyof AppInfo, 'name'>> & {
    entry?: string;
    domGetter: DomGetter;
  };

  export interface ResourceModules {
    js: Array<JavaScriptManager>;
    link: Array<StyleManagerInterface>;
    modules: Array<ModuleManager>;
  }

  export type BootStrapArgs = [Garfish, Options];

  type AppConstructor = new (
    context: Garfish,
    appInfo: AppInfo,
    entryResManager: TemplateManagerInterface,
    resources: interfaces.ResourceModules,
    isHtmlMode: boolean,
  ) => any;

  export interface Lifecycle {
    // beforeInitialize: SyncHook<Options, void>;
    initialize: SyncHook<Options, void>;
    beforeBootstrap: SyncHook<Options, void>;
    bootstrap: SyncHook<Options, void>;
    beforeRegisterApp: SyncHook<[AppInfo | Array<AppInfo>], void>;
    registerApp: SyncHook<[Record<string, interfaces.AppInfo>], void>;
    beforeLoad: AsyncSeriesBailHook<AppInfo, boolean | void | AppConstructor>; // 根据返回值决定是否继续执行后续代码 or return a constructor
    initializeApp: AsyncSeriesBailHook<
      [
        Garfish,
        AppInfo,
        TemplateManagerInterface,
        interfaces.ResourceModules,
        boolean,
      ],
      App
    >;
    afterLoad: SyncHook<[AppInfo, App | void], void | boolean>;
    processResource: SyncHook<
      [AppInfo, TemplateManagerInterface, interfaces.ResourceModules],
      void | boolean
    >;
    beforeEval: SyncHook<
      [
        AppInfo,
        string,
        Record<string, any>,
        string,
        { async?: boolean; noEntry?: boolean },
      ],
      void
    >;
    afterEval: SyncHook<
      [
        AppInfo,
        string,
        Record<string, any>,
        string,
        { async?: boolean; noEntry?: boolean },
      ],
      void
    >;
    beforeMount: SyncHook<[AppInfo, interfaces.App], void>;
    afterMount: SyncHook<[AppInfo, interfaces.App], void>;
    beforeUnMount: SyncHook<[AppInfo, interfaces.App], void>;
    afterUnMount: SyncHook<[AppInfo, interfaces.App], void>;
    errorLoadApp: SyncHook<[Error, AppInfo], void>;
    errorMountApp: SyncHook<[Error, AppInfo], void>;
    errorUnmountApp: SyncHook<[Error, AppInfo], void>;
    errorExecCode: SyncHook<[AppInfo, Error], void>;
  }

  type ConstructorParameters<T> = T extends SyncHook<any, any>
    ? T extends {
        tap: (options: any, fn: (...args: infer P) => infer R) => any;
      }
      ? (...args: P) => R
      : never
    : T extends {
        tapPromise: (options: any, fn: (...args: infer A) => infer AR) => any;
      }
    ? (...args: A) => AR
    : never;

  type PickParam<T> = {
    [k in keyof T]: ConstructorParameters<T[k]>;
  };

  export interface Plugin extends PickParam<Partial<interfaces.Lifecycle>> {
    name: string;
    version?: string;
  }

  export interface Hooks {
    lifecycle: Lifecycle;
    usePlugins(plugin: Plugin): void;
  }
}
