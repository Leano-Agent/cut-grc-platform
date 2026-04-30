import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Reducers
import authReducer from './slices/authSlice'
import tasksReducer from './slices/tasksSlice'
import networkReducer from './slices/networkSlice'
import syncReducer from './slices/syncSlice'
import uiReducer from './slices/uiSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  tasks: tasksReducer,
  network: networkReducer,
  sync: syncReducer,
  ui: uiReducer,
})

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'tasks'], // Only persist auth and tasks
  blacklist: ['network', 'sync', 'ui'], // Don't persist these
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

// Types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store