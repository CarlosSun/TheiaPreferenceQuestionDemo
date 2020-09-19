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

import { inject, injectable, postConstruct } from 'inversify';
import { CommonMenus } from '@theia/core/lib/browser';
import {
    Emitter,
    Command,
    MenuPath,
    MessageService,
    MenuModelRegistry,
    MenuContribution,
    CommandRegistry,
    CommandContribution,
    DisposableCollection
} from '@theia/core/lib/common';
import { StudioLanguagePreferences } from "../browser/studio-language-preference";
import * as intl from 'react-intl-universal';
import { StudioUpdater, StudioUpdaterClient, UpdateStatus } from '../common/updater/studio-updater'
import {ElectronMenuUpdater} from "./electron-menu-updater";
const log = require("electron-log");
log.transports.file.level = "debug";

const locales = {
    "en-US": require('../common/i18n/en.json'),
    "zh-CN": require('../common/i18n/cn.json'),
};

export namespace StudioUpdaterCommands {

    const category = 'Flexem Studio Updater';

    export const CHECK_FOR_UPDATES: Command = {
        id: 'flexem-studio:check-for-updates',
        label: intl.get('CheckForUpdates_Label'),
        category
    };

    export const RESTART_TO_UPDATE: Command = {
        id: 'flexem-studio:restart-to-update',
        label: intl.get('RestartToUpdate_Label'),
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

    @inject (StudioLanguagePreferences)
    protected readonly studioLanguagePreference : StudioLanguagePreferences

    @inject(MenuModelRegistry)
    protected readonly menuProvider: MenuModelRegistry;

    protected toDispose = new DisposableCollection();

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
                    this.messageService.info(intl.get('AppGetLatestVersion_Message'), { timeout: 5000 });
                    break;
                }
                case UpdateStatus.DownloadProcessing: {
                    this.messageService.warn(`${intl.get('AppUpdateDownloading_Message')}${ message.progress }`, { timeout: 1000 });
                    break;
                }
                case UpdateStatus.DownloadComplete: {
                    this.messageService.info(intl.get('AppUpdateDownloadComplete_Message'), { timeout: 5000 });
                    break;
                }
                case UpdateStatus.Error: {
                    this.messageService.warn(intl.get('AppGetLatestVersion_Message'), { timeout: 5000 });
                }
                default: log.info('default status, nothing to do');
            }
        })

        this.studioLanguagePreference.onPreferenceChanged((e: any) => {
            if (e.preferenceName === 'studio.language') {
                intl.init({
                    currentLocale: e.newValue,
                    locales,
                })

                this.updateMenus(this.menuProvider)
            }
        });
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
                this.messageService.info(intl.get('AppUpdateDownloadComplete_Message'), { timeout: 3000 });
            },
            isEnabled: () => this.readyToUpdate,
            isVisible: () => this.readyToUpdate
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
    }

    updateMenus(menus: MenuModelRegistry) {
        this.toDispose.dispose();

        this.toDispose.push(
            menus.registerMenuAction(StudioUpdaterMenu.MENU_PATH, {
                commandId: StudioUpdaterCommands.CHECK_FOR_UPDATES.id,
                label: intl.get('CheckForUpdates_Label')
            })
        )

        this.toDispose.push(
            menus.registerMenuAction(StudioUpdaterMenu.MENU_PATH, {
                commandId: StudioUpdaterCommands.RESTART_TO_UPDATE.id,
                label: intl.get('RestartToUpdate_Label')
            })
        )

        this.menuUpdater.update();
    }

    protected async handleUpdatesAvailable(): Promise<void> {
        const answer = await this.messageService.info(intl.get('AppDetectedUpdateRequestDownload_Message'), intl.get('ChooseYes'), intl.get('ChooseLater'));
        if (answer === intl.get('ChooseYes')) {
            this.updater.onUpdateDownloadRequested();
        }
    }
}
