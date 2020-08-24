/**
 * Generated using theia-extension-generator
 */
import { TheiaHelloWorldExtensionCommandContribution, TheiaHelloWorldExtensionMenuContribution, DynamicBrowserMenuBarContribution  } from './theia-hello-world-extension-contribution';
import {bindStudioLanguagePreferences} from './studio-language-preference';
import {
    CommandContribution,
    MenuContribution
} from "@theia/core/lib/common";
import { ContainerModule } from "inversify";
import { BrowserMenuBarContribution } from '@theia/core/lib/browser/menu/browser-menu-plugin';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // add your contribution bindings here
    bindStudioLanguagePreferences(bind);
    bind(MenuContribution).to(TheiaHelloWorldExtensionMenuContribution);
    bind(CommandContribution).to(TheiaHelloWorldExtensionCommandContribution);

    bind(DynamicBrowserMenuBarContribution).toSelf().inSingletonScope();
    rebind(BrowserMenuBarContribution).toService(DynamicBrowserMenuBarContribution);
});
