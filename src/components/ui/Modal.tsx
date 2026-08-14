import React from "react";
import { Modal as RNModal, Pressable, ScrollView, Text, View } from "react-native";
import { Icon } from "./Icon";

export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 items-center justify-center bg-black/40 p-6" onPress={onClose}>
        <Pressable className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              {title ? (
                <Text className="text-lg font-bold tracking-tight text-foreground">
                  {title}
                </Text>
              ) : null}
              {description ? (
                <Text className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} className="rounded-lg p-1 active:bg-muted">
              <Icon name="close" size={18} color="#71717A" />
            </Pressable>
          </View>
          {children}
          {footer ? <View className="mt-6 flex-row justify-end gap-2">{footer}</View> : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
