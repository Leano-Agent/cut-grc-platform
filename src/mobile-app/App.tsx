import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import NetInfo from '@react-native-community/netinfo'
import { enableScreens } from 'react-native-screens'

// Store
import store from './src/store'

// Screens
import SplashScreen from './src/screens/SplashScreen'
import LoginScreen from './src/screens/auth/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import TasksScreen from './src/screens/TasksScreen'
import TaskDetailScreen from './src/screens/TaskDetailScreen'
import DataCollectionScreen from './src/screens/DataCollectionScreen'
import CameraScreen from './src/screens/CameraScreen'
import MapScreen from './src/screens/MapScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import OfflineScreen from './src/screens/OfflineScreen'
import SyncScreen from './src/screens/SyncScreen'

// Services
import { initDatabase } from './src/services/database'
import { initSync } from './src/services/sync'
import { checkPermissions } from './src/services/permissions'

enableScreens()

const Stack = createNativeStackNavigator()

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Check and request permissions
        await checkPermissions()
        
        // Initialize database
        await initDatabase()
        
        // Initialize sync service
        await initSync()
        
        // Monitor network connectivity
        const unsubscribe = NetInfo.addEventListener(state => {
          store.dispatch({
            type: 'network/updateStatus',
            payload: { isConnected: state.isConnected },
          })
        })
        
        return unsubscribe
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }
    
    initializeApp()
  }, [])

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{
                headerShown: false,
                animation: 'fade',
              }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Tasks" component={TasksScreen} />
              <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
              <Stack.Screen name="DataCollection" component={DataCollectionScreen} />
              <Stack.Screen name="Camera" component={CameraScreen} />
              <Stack.Screen name="Map" component={MapScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Offline" component={OfflineScreen} />
              <Stack.Screen name="Sync" component={SyncScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Provider>
  )
}

export default App