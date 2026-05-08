/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** API Port - Port number for TaskNotes HTTP API */
  "apiPort": string,
  /** API Token - Authentication token for TaskNotes HTTP API (optional) */
  "apiToken"?: string,
  /** Obsidian Vault Name - Name of the Obsidian vault containing your tasks (used for obsidian:// URLs) */
  "vaultName"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `check-connection` command */
  export type CheckConnection = ExtensionPreferences & {}
  /** Preferences accessible in the `quick-add` command */
  export type QuickAdd = ExtensionPreferences & {}
  /** Preferences accessible in the `view-tasks` command */
  export type ViewTasks = ExtensionPreferences & {}
  /** Preferences accessible in the `menu-bar-tasks` command */
  export type MenuBarTasks = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `check-connection` command */
  export type CheckConnection = {}
  /** Arguments passed to the `quick-add` command */
  export type QuickAdd = {}
  /** Arguments passed to the `view-tasks` command */
  export type ViewTasks = {}
  /** Arguments passed to the `menu-bar-tasks` command */
  export type MenuBarTasks = {}
}

