import { ref, watch, type Ref } from "vue";

export function useDebounce<T>(value: Ref<T>, delay: number = 300) {
  const debouncedValue = ref<T>(value.value) as Ref<T>;
  let timeout: NodeJS.Timeout;

  watch(value, (newValue) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return debouncedValue;
}
