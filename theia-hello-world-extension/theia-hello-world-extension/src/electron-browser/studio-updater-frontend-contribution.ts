/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { remote, Menu, BrowserWindow } from 'electron';
import { inject, injectable, postConstruct } from 'inversify';
import { isOSX } from '@theia/core/lib/common/os';
import { CommonMenus } from '@theia/core/lib/browser';
import {
    Emitter,
    Command,
    MenuPath,
    MessageService,
    MenuModelRegistry,
    MenuContribution,
    CommandRegistry,
    CommandContribution
} from '@theia/core/lib/common';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { StudioUpdater, StudioUpdaterClient, UpdateStatus } from '../common/updater/studio-updater'
const log = require("electron-log");
log.transports.file.level = "debug";

export namespace StudioUpdaterCommands {

    const category = 'Flexem Studio Updater';

    export const CHECK_FOR_UPDATES: Command = {
        id: 'flexem-studio:check-for-updates',
        label: 'Check for Updates...',
        category
    };

    export const RESTART_TO_UPDATE: Command = {
        id: 'flexem-studio:restart-to-update',
        label: 'Restart to Update (1)',
        category
    };
}

export namespace StudioUpdaterMenu {
    export const MENU_PATH: MenuPath = [...CommonMenus.FILE_SETTINGS_SUBMENU, '3_settings_submenu_update'];
}

@injectable()
export class StudioUpdaterClientImpl implements StudioUpdaterClient {

    protected readonly onReadyToInstallEmitter = new Emitter<void>();
    readonly onReadyToInstall = this.onReadyToInstallEmitter.event;

    protected readonly onUpdaterMsgPushEmitter = new Emitter<any>();
    readonly onUpdaterMsgPush = this.onUpdaterMsgPushEmitter.event;

    notifyReadyToInstall(): void {
        this.onReadyToInstallEmitter.fire();
    }

    notifyUpdaterMsgPush(event: any): string {
        return this.onUpdaterMsgPushEmitter.fire(event);
    }
}

// Dynamic menus aren't yet supported by electron: https://github.com/eclipse-theia/theia/issues/446
@injectable()
export class ElectronMenuUpdater {

    @inject(ElectronMainMenuFactory)
    protected readonly factory: ElectronMainMenuFactory;

    public update(): void {
        this.setMenu();
    }

    private setMenu(menu: Menu = this.factory.createMenuBar(), electronWindow: BrowserWindow = remote.getCurrentWindow()): void {
        if (isOSX) {
            remote.Menu.setApplicationMenu(menu);
        } else {
            electronWindow.setMenu(menu);
        }
    }
}

@injectable()
export class StudioUpdaterFrontendContribution implements CommandContribution, MenuContribution {

    @inject(StudioUpdater)
    protected readonly updater: StudioUpdater;

    @inject(StudioUpdaterClientImpl)
    protected readonly updaterClient: StudioUpdaterClientImpl;

    @inject(ElectronMenuUpdater)
    protected readonly menuUpdater: ElectronMenuUpdater;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    protected readyToUpdate = false;

    @postConstruct()
    protected init(): void {
        this.updaterClient.onReadyToInstall(async () => {
            log.info('Backend download updater completed, notify the frontend switch menu item display')
            this.readyToUpdate = true;
            this.menuUpdater.update();
        });

        this.updaterClient.onUpdaterMsgPush((message: any) => {
            log.info("Messaged is pushed from backend, something happened during auto updater working");
            log.info(message.status);

            switch (message.status) {
                case UpdateStatus.Available: {
                    this.handleUpdatesAvailable();
                    break;
                }
                case UpdateStatus.NotAvailable: {
                    this.messageService.info(`You’re all good. You’ve got the latest version`, { timeout: 5000 });
                    break;
                }
                case UpdateStatus.DownloadProcessing: {
                    this.messageService.warn(`Update downloading: ${ message.progress }`, { timeout: 1000 });
                    break;
                }
                case UpdateStatus.DownloadComplete: {
                    this.messageService.info('Update is ready, it will be installed when you quit the app', { timeout: 5000 });
                    break;
                }
                case UpdateStatus.Error: {
                    this.messageService.error('Error occurs', {timeout: 5000});
                }
                default: log.info('default status, nothing to do');
            }
        })
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(StudioUpdaterCommands.CHECK_FOR_UPDATES, {
            execute: async () => {
                this.updater.checkForUpdates()
            },
            isEnabled: () => !this.readyToUpdate,
            isVisible: () => !this.readyToUpdate
        });

        registry.registerCommand(StudioUpdaterCommands.RESTART_TO_UPDATE, {
            execute: () => {
                this.updater.onRestartToUpdateRequested();
                this.messageService.info('Updates is ready, it will be installed when you quit the app', { timeout: 3000 });
            },
            isEnabled: () => this.readyToUpdate,
            isVisible: () => this.readyToUpdate
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(StudioUpdaterMenu.MENU_PATH, {
            commandId: StudioUpdaterCommands.CHECK_FOR_UPDATES.id
        });
        registry.registerMenuAction(StudioUpdaterMenu.MENU_PATH, {
            commandId: StudioUpdaterCommands.RESTART_TO_UPDATE.id
        });
    }

    protected async handleUpdatesAvailable(): Promise<void> {
        const answer = await this.messageService.info('Found updates, do you want update now?', 'No', 'Yes');
        if (answer === 'Yes') {
            this.updater.onUpdateDownloadRequested();
        }
    }
}
