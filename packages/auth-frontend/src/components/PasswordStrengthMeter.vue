<script setup lang="ts">
import { computed } from 'vue';
import { usePasswordStrength } from '../composables';
import type { IPasswordErrorMessages } from '@sottosviluppo/core';

interface Props {
    modelValue: string;
    userContext?: {
        email?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
    };
    errorMessages?: IPasswordErrorMessages;
    showErrors?: boolean;
    showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showErrors: true,
    showLabel: true,
});

const password = computed(() => props.modelValue);

const { strength, strengthLabel, strengthColor, errors, isValid, progressValue } =
    usePasswordStrength(
        password,
        props.userContext,
        {
            errorMessages: props.errorMessages,
        }
    );
</script>

<template>
    <div class="password-strength-meter">
        <div class="strength-bar-container">
            <div class="strength-bar" :style="{
                width: `${progressValue}%`,
                backgroundColor: strengthColor,
            }" />
        </div>

        <div v-if="showLabel" class="strength-label" :style="{ color: strengthColor }">
            {{ strengthLabel }}
        </div>

        <ul v-if="showErrors && errors.length > 0" class="error-list">
            <li v-for="(error, index) in errors" :key="index" class="error-item">
                {{ error }}
            </li>
        </ul>
    </div>
</template>

<style scoped>
.password-strength-meter {
    margin-top: 0.5rem;
}

.strength-bar-container {
    width: 100%;
    height: 0.5rem;
    background-color: #e5e7eb;
    border-radius: 0.25rem;
    overflow: hidden;
}

.strength-bar {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 0.25rem;
}

.strength-label {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.error-list {
    margin-top: 0.5rem;
    padding-left: 1.25rem;
    list-style-type: disc;
}

.error-item {
    font-size: 0.875rem;
    color: #dc2626;
    margin-top: 0.25rem;
}
</style>