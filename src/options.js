import Settings from "sketch/settings"

export const options = initOptions()

function initOptions() {
    const defaults = {
        isRowLayout: true,
        padding: 16,
        hasWidthLimit: false,
        maxWidth: 1200,
    }
    for (let option in defaults) {
        let value = eval(Settings.settingForKey(option))
        if (value === undefined) {
            Settings.setSettingForKey(option, defaults[option])
        } else {
            defaults[option] = value
        }
    }
    return defaults
}
