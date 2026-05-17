const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const config = getDefaultConfig(__dirname)

const workspaceRoot = path.resolve(__dirname, '../..')

// Watch shared package source so changes hot-reload
config.watchFolders = [path.resolve(workspaceRoot, 'packages/shared')]

module.exports = withNativeWind(config, { input: './global.css' })
