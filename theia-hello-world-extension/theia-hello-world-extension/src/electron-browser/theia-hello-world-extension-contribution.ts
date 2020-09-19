import { injectable, inject, postConstruct } from "inversify";
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService, DisposableCollection } from "@theia/core/lib/common";
import { CommonMenus, PreferenceService, PreferenceScope } from "@theia/core/lib/browser"; 
import * as intl from 'react-intl-universal';
import { StudioLanguagePreferences } from "../browser/studio-language-preference";
import {ElectronMenuUpdater} from "./electron-menu-updater";
const locales = {
    "en-US": require('../common/i18n/en.json'),
    "zh-CN": require('../common/i18n/cn.json'),
};

export var TheiaHelloWorldExtensionCommand = {
    id: 'TheiaHelloWorldExtension.command',
    label: intl.get("CHANGE_LANGUAGE")
};

@injectable()
export class TheiaHelloWorldExtensionCommandContribution implements CommandContribution {

    public static readonly LANGUAGE_PREFERENCE: string = 'studio.language';

    @inject (StudioLanguagePreferences)
    protected readonly studioLanguagePreference : StudioLanguagePreferences

    @inject(MessageService) 
    protected readonly messageService: MessageService;

    @postConstruct()
    protected init(): void {
        this.studioLanguagePreference.onPreferenceChanged(e => {
            if (e.preferenceName === TheiaHelloWorldExtensionCommandContribution.LANGUAGE_PREFERENCE) {
                intl.init({
                    currentLocale: e.newValue,
                    locales,
                })
            }
        });
    }

    constructor(@inject (PreferenceService) protected readonly preferencesService: PreferenceService) {
        var settingLanguage = this.studioLanguage();
        intl.init({
            currentLocale: settingLanguage,
            locales,
        })
    }

    registerCommands(registry: CommandRegistry): void {
        var settingLanguage = this.studioLanguage();
        intl.init({
            currentLocale: settingLanguage,
            locales,
        })

        registry.registerCommand(TheiaHelloWorldExtensionCommand, {
            execute: () => {
                this.messageService.info(intl.get("CHANGE_LANGUAGE_MESSAGE")),
                this.changeLanguage()
            }
        });
    }

    private studioLanguage(): string {
        const language = this.preferencesService.get(TheiaHelloWorldExtensionCommandContribution.LANGUAGE_PREFERENCE);
        return language as string || 'en-US';
    }

    private async changeLanguage(): Promise<void> {
        var studioSetLanguage = this.studioLanguage();
        var studioLanguageChangedTo;
        if (studioSetLanguage === 'en-US') {
            studioLanguageChangedTo = 'zh-CN';   
        } else {
            studioLanguageChangedTo = 'en-US';
        }

        this.preferencesService.set(TheiaHelloWorldExtensionCommandContribution.LANGUAGE_PREFERENCE, studioLanguageChangedTo, PreferenceScope.User); 
    }
}

@injectable()
export class TheiaHelloWorldExtensionMenuContribution implements MenuContribution {

    protected toDispose = new DisposableCollection();

    @inject (StudioLanguagePreferences)
    protected readonly studioLanguagePreference : StudioLanguagePreferences

    @inject(MenuModelRegistry)
    protected readonly menuProvider: MenuModelRegistry;

    @inject(ElectronMenuUpdater)
    protected readonly menuUpdater: ElectronMenuUpdater;

    @postConstruct()
    protected init(): void {
        this.studioLanguagePreference.onPreferenceChanged((e: any) => {
            if (e.preferenceName === TheiaHelloWorldExtensionCommandContribution.LANGUAGE_PREFERENCE) {
                intl.init({
                    currentLocale: e.newValue,
                    locales,
                })

                this.updateMenus(this.menuProvider)
            }
        });
    }
    
    registerMenus(menus: MenuModelRegistry): void {  
    }

    updateMenus(menus: MenuModelRegistry) {
        this.toDispose.dispose();

        this.toDispose.push(
            menus.registerMenuAction(CommonMenus.EDIT_FIND, {
                commandId: TheiaHelloWorldExtensionCommand.id,
                label: intl.get("CHANGE_LANGUAGE") // Get the I10N label value
            })
        );

        this.menuUpdater.update();
    }
}
