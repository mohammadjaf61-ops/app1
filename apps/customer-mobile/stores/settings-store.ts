import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const DEFAULT_ADDRESS = 'مجمع الأميرات السكني بلوك 25';

interface SettingsState {
  defaultAddress: string;
  savedName: string;
  savedPhone: string;

  setDefaultAddress: (address: string) => void;
  setSavedName: (name: string) => void;
  setSavedPhone: (phone: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultAddress: DEFAULT_ADDRESS,
      savedName: '',
      savedPhone: '',

      setDefaultAddress: (address) => set({ defaultAddress: address }),
      setSavedName: (name) => set({ savedName: name }),
      setSavedPhone: (phone) => set({ savedPhone: phone }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
