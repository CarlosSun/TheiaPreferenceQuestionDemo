import { interfaces } from 'inversify';
import {STUDIO_SUPPORTED_LANGUAGE} from './supported-languages';

import {
    createPreferenceProxy,
    PreferenceProxy,
    PreferenceService,
    PreferenceSchema,
    PreferenceChangeEvent,
    PreferenceContribution
} from '@theia/core/lib/browser/preferences';

export const studioLanguagePreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'scope': 'resource',
    'properties': {
        'studio.language': {
            'enum': Object.keys(STUDIO_SUPPORTED_LANGUAGE).sort(),
            'description': 'The Theia studio language'
        }
    }
}

export interface StudioLanguageConfiguration {
    'studio.language': string;
}

export type StudioLanguagePreferenceChange = PreferenceChangeEvent<StudioLanguageConfiguration>;
export const StudioLanguagePreferences = Symbol('StudioLanguagePreferences');
export type StudioLanguagePreferences = PreferenceProxy<StudioLanguageConfiguration>;

export function createStudioLanguagePreferences(preferences: PreferenceService): StudioLanguagePreferences {
    return createPreferenceProxy(preferences, studioLanguagePreferenceSchema);
}

export function bindStudioLanguagePreferences(bind: interfaces.Bind): void {
    bind(StudioLanguagePreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        return createStudioLanguagePreferences(preferences);
    }).inSingletonScope();

    bind(PreferenceContribution).toConstantValue({ schema: studioLanguagePreferenceSchema });
}