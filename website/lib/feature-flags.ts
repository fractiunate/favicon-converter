/**
 * Feature Flags Configuration
 *
 * These flags control the availability of features in the application.
 * They are NOT configurable via UI - they are code-level settings.
 *
 * To enable/disable a feature, change the value here and rebuild.
 */

export const FEATURE_FLAGS = {
    /**
     * Enable Zen Mode feature
     * - Shows/hides zen mode toggle in header
     * - Enables distraction-free interface
     */
    ZEN_MODE_ENABLED: true,

    /**
     * Enable the Workspaces feature
     * - Shows/hides workspace selector in header
     * - Enables/disables workspace persistence
     */
    WORKSPACES_ENABLED: true,

    /**
     * Enable the Pomodoro Timer feature
     * - Shows/hides Pomodoro Timer in tools list
     * - Shows/hides global playbar
     * - Enables/disables Pomodoro context provider
     */
    POMODORO_ENABLED: false,

    /**
     * Enable the Todo List feature
     * - Shows/hides Todo List in tools list
     */
    TODO_LIST_ENABLED: true,

    /**
     * Enable the AI Code Editor feature
     * - Shows/hides AI Code Editor in tools list
     */
    CODE_EDITOR_ENABLED: true,

    /**
     * Enable the Password Generator feature
     * - Shows/hides Password Generator in tools list
     */
    PASSWORD_GENERATOR_ENABLED: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
    return FEATURE_FLAGS[flag];
}
