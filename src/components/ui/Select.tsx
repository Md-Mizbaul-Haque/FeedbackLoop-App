import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { cn } from "../../lib/utils";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  className,
}: {
  value: string | null;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          "h-10 flex-row items-center justify-between rounded-xl border border-input bg-card px-3",
          className,
        )}
      >
        <Text
          numberOfLines={1}
          className={cn("flex-1 text-sm", selected ? "text-foreground" : "text-muted-foreground")}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" size={16} color="#71717A" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOpen(false)}
        >
          <Pressable className="rounded-t-2xl bg-card p-4 pb-8">
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-muted" />
            <ScrollView className="max-h-96">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex-row items-center justify-between rounded-xl px-3 py-3",
                      active ? "bg-primary/10" : "active:bg-muted",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm",
                        active ? "font-semibold text-primary" : "text-foreground",
                      )}
                    >
                      {option.label}
                    </Text>
                    {active ? <Icon name="check" size={16} color="#4F46E5" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
