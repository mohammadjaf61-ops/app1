import { colors } from '@hypermarket/design-tokens';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_DURATION = 3000;

function ToastItem({ toast, onHide }: { toast: ToastMessage; onHide: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} color={colors.status.success.main} />;
      case 'error':
        return <XCircle size={20} color={colors.status.error.main} />;
      case 'warning':
        return <AlertCircle size={20} color={colors.status.warning.main} />;
      default:
        return <Info size={20} color={colors.status.info.main} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return colors.status.success.light;
      case 'error':
        return colors.status.error.light;
      case 'warning':
        return colors.status.warning.light;
      default:
        return colors.status.info.light;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return colors.status.success.main;
      case 'error':
        return colors.status.error.main;
      case 'warning':
        return colors.status.warning.main;
      default:
        return colors.status.info.main;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      {getIcon()}
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const hideToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onHide={() => hideToast(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: colors.neutral[1000],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    flex: 1,
    marginRight: 12,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'right',
  },
});
