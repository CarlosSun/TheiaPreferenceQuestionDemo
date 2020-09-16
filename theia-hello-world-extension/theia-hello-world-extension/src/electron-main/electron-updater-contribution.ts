import { injectable } from 'inversify';
import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { autoUpdater } from "electron-updater";
const log = require("electron-log");
log.transports.file.level = "debug";
autoUpdater.logger = log;

@injectable()
export class ElectronUpdaterContribution implements ElectronMainApplicationContribution {
    onStart(application: ElectronMainApplication): void {
        console.log('Check upgrade server if new version app is ready');
        autoUpdater.checkForUpdatesAndNotify();
    }

    onStop(application: ElectronMainApplication): void {
    }
}
