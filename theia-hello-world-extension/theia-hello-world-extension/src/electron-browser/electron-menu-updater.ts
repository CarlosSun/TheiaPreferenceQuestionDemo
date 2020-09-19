import { injectable, inject } from "inversify";
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { remote, Menu, BrowserWindow } from 'electron';
import { isOSX } from '@theia/core/lib/common/os';

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