import { ContainerModule } from 'inversify';
import { ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { ElectronUpdaterContribution } from './electron-updater-contribution';

export default new ContainerModule(bind => {
    bind(ElectronMainApplicationContribution).to(ElectronUpdaterContribution).inSingletonScope();
});