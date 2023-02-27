const os = require('os');

const getPlatform = () => os.platform()

export const isWindowsPlatform = () => getPlatform().toLowerCase().startsWith("win")
