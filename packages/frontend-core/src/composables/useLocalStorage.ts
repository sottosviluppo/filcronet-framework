import { ref, watch, type Ref } from "vue";

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const storedValue = localStorage.getItem(key);
  const data = ref<T>(
    storedValue ? JSON.parse(storedValue) : defaultValue
  ) as Ref<T>;

  watch(
    data,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    { deep: true }
  );

  return data;
}
