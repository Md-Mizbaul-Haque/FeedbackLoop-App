import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Icon, type IconName } from "./Icon";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<
  ToastKind,
  { bg: string; icon: IconName; color: string }
> = {
  success: { bg: "bg-emerald-600", icon: "check-circle", color: "#FFFFFF" },
  error: { bg: "bg-rose-600", icon: "alert-circle", color: "#FFFFFF" },
  info: { bg: "bg-neutral-800", icon: "alert-circle", color: "#FFFFFF" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = {
    toast,
    success: useCallback((m: string) => toast("success", m), [toast]),
    error: useCallback((m: string) => toast("error", m), [toast]),
    info: useCallback((m: string) => toast("info", m), [toast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 top-12 z-50 items-center px-4"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const style = KIND_STYLES[item.kind];

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
      className="mb-2 w-full max-w-md"
    >
      <View
        className={`flex-row items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg ${style.bg}`}
      >
        <Icon name={style.icon} size={18} color={style.color} />
        <Text className="flex-1 text-sm font-medium text-white">
          {item.message}
        </Text>
      </View>
    </Animated.View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
