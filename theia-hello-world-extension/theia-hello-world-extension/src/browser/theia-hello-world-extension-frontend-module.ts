/**
 * Generated using theia-extension-generator
 */
import { TheiaHelloWorldExtensionCommandContribution, TheiaHelloWorldExtensionMenuContribution } from './theia-hello-world-extension-contribution';
import {bindStudioLanguagePreferences} from './studio-language-preference';
import {
    CommandContribution,
    MenuContribution
} from "@theia/core/lib/common";
import { ContainerModule } from "inversify";

export default new ContainerModule(bind => {
    // add your contribution bindings here
    bindStudioLanguagePreferences(bind);
    bind(MenuContribution).to(TheiaHelloWorldExtensionMenuContribution);
    bind(CommandContribution).to(TheiaHelloWorldExtensionCommandContribution);
});
