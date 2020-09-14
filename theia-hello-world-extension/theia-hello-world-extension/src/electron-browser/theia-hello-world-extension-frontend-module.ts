/**
 * Generated using theia-extension-generator
 */
import { TheiaHelloWorldExtensionCommandContribution, TheiaHelloWorldExtensionMenuContribution, ElectronMenuUpdater } 
from './theia-hello-world-extension-contribution';
import {bindStudioLanguagePreferences} from '../browser/studio-language-preference';
import {
    CommandContribution,
    MenuContribution
} from "@theia/core/lib/common";
import { ContainerModule } from "inversify";

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // add your contribution bindings here
    bindStudioLanguagePreferences(bind);
    bind(MenuContribution).to(TheiaHelloWorldExtensionMenuContribution);
    bind(CommandContribution).to(TheiaHelloWorldExtensionCommandContribution);
    bind(ElectronMenuUpdater).toSelf().inSingletonScope();
});
