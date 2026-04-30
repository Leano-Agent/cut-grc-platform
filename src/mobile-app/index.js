/**
 * @format
 */

import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'

// Import polyfills
import 'react-native-get-random-values'
import 'react-native-url-polyfill/auto'

// Initialize app
AppRegistry.registerComponent(appName, () => App)