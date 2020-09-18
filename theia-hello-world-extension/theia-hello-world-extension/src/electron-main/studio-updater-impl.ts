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

import { injectable, inject } from 'inversify';
import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { StudioUpdater, StudioUpdaterClient, UpdateStatus } from '../common/updater/studio-updater';
import { autoUpdater } from "electron-updater";
const { dialog } = require('electron')
const log = require("electron-log");
log.transports.file.level = "debug";
autoUpdater.logger = log;

// The autoUpdater checkUpdate() action is triggered automatically or by user
let checkedAuto = false;

let clients: Array<StudioUpdaterClient> = [];

autoUpdater.on('error', (error) => {
    log.error('Error Occured: ');
    log.error((error.stack || error).toString())
    if (!checkedAuto) {
        for (const client of clients) {
            log.info('===============> error <==============')
            client.notifyUpdaterMsgPush({ status: UpdateStatus.Error });
        }
    }
    dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})

autoUpdater.on('update-available', (msg: any) => {
    log.info(`update-available`);
    log.info(msg);

    for (const client of clients) {
        log.info('===============> update-available<==============')
        client.notifyUpdaterMsgPush({ status: UpdateStatus.Available });
    }

    // if (actionFromUser) {
    //     actionFromUser = false;
    //     dialog.showMessageBox({
    //         type: 'info',
    //         title: 'Found Updates',
    //         message: 'Found updates, do you want update now?',
    //         buttons: ['Sure', 'Later']
    //     }).then((userChoose: any) => {
    //         if (userChoose.response === 0) {
    //             autoUpdater.downloadUpdate()
    //         }
    //     })
    // }
})

autoUpdater.on('update-not-available', (msg: any) => {
    log.info(`update-not-available`);
    log.info(msg);

    if (!checkedAuto) {
        for (const client of clients) {
            log.info('===============> update-not-available <==============')
            client.notifyUpdaterMsgPush({ status: UpdateStatus.NotAvailable });
        }
    }

    // if (actionFromUser) {
    //     actionFromUser = false;
    //     log.info('request is triggered by user');
    //     dialog.showMessageBox({
    //         title: 'No Updates',
    //         message: 'Current version is up-to-date.'
    //     })
    // } else {
    //     log.info('request is triggered auto');
    // }
})

autoUpdater.on('update-downloaded', (msg: any) => {
    log.info(`update-downloaded`);
    log.info(msg);
    if (!checkedAuto) {
        for (const client of clients) {
            log.info('Notify all the frontends, the updater is downloaded completed - Switch the menu item')
            client.notifyReadyToInstall();
            client.notifyUpdaterMsgPush({ status: UpdateStatus.DownloadComplete });
        }
    }

    // dialog.showMessageBox({
    //     title: 'Install Updates',
    //     message: 'Updates downloaded, application will update after quit.'
    // }, () => {
    //     setImmediate(() => autoUpdater.quitAndInstall(false, true))
    // })
})

autoUpdater.on('download-progress', (progressObj: any) => {
    let log_message = progressObj.percent.toFixed(2) + '%';
    log.info('download-progress is triggered')
    log.info(log_message);

    for (const client of clients) {
        log.info('===============> download-progress <==============')
        client.notifyUpdaterMsgPush({ status: UpdateStatus.DownloadProcessing, progress: log_message });
    }
});

@injectable()
export class StudioUpdaterImpl implements StudioUpdater, ElectronMainApplicationContribution {

    @inject(ElectronMainApplication)
    protected readonly application: ElectronMainApplication;

    /**
     * The frontend menu item will trigger
     */
    checkForUpdates(): void {
        checkedAuto = false;
        autoUpdater.autoDownload = false;
        autoUpdater.checkForUpdates();
    }

    onRestartToUpdateRequested(): void {
        log.info("'Update to Restart' was requested by the frontend.");
        setImmediate(() => {
            autoUpdater.quitAndInstall(false, true)
        })
        // dialog.showMessageBox({
        //     title: 'Install Updates',
        //     message: 'Updates downloaded, application will update after quit.'
        // }, () => {
        //     setImmediate(() => {
        //         autoUpdater.quitAndInstall(false, true)
        //     })
        // })
    }

    onUpdateDownloadRequested(): void {
        log.info('Download the update button is triggered by the frontend, start download the update.')
        setImmediate(() => {
            autoUpdater.downloadUpdate();
        })    
    }

    /**
     * Will be triggered when studio launching
     */
    onStart(application: ElectronMainApplication): void {
        log.info('Checking the upgrade server if new app is ready');
        checkedAuto = true;
        autoUpdater.autoDownload = true;
        autoUpdater.checkForUpdatesAndNotify();
        log.info('End checking');
    }

    onStop(application: ElectronMainApplication): void {
        // Nothing to do now
    }

    setClient(client: StudioUpdaterClient | undefined): void {
        if (client) {
            clients.push(client);
            log.info('Registered a new studio updater client.');
        } else {
            log.warn("Couldn't register undefined client.");
        }
    }

    disconnectClient(client: StudioUpdaterClient): void {
        const index = clients.indexOf(client);
        if (index !== -1) {
            clients.splice(index, 1);
            log.info('Disposed a flexem studio updater client.');
        } else {
            log.warn("Couldn't dispose client; it was not registered.");
        }
    }

    dispose(): void {
        console.info('>>> Disposing studio updater service...');
        clients.forEach(this.disconnectClient.bind(this));
        console.info('>>> Disposed studio updater service.');
    }
}
