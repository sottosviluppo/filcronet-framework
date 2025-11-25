<script setup lang="ts">
import { usePasswordRecovery, useValidation } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useI18n } from 'vue-i18n';

const { forgotPassword, isLoading, error, successMessage, clearMessages } = usePasswordRecovery();
const { t } = useI18n();

const { forgotPasswordSchema } = useValidation(() => ({
    messages: {
        email: {
            invalid: t('validation.email.invalid'),
            required: t('validation.email.required'),
        },
        password: {
            required: t('validation.password.required'),
            minLength: t('validation.password.minLength'),
            notStrong: t('validation.password.notStrong'),
            containsPersonalData: t('validation.password.containsPersonalData'),
            mismatch: t('validation.password.mismatch'),
        },
        username: {
            invalid: t('validation.username.invalid'),
        },
        token: {
            required: t('validation.token.required'),
        },
    },
    passwordMessages: {
        [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
        [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
        [PasswordErrorKey.NoLowercase]: t('validation.password.noLowercase'),
        [PasswordErrorKey.NoNumber]: t('validation.password.noNumber'),
        [PasswordErrorKey.NoSpecialChar]: t('validation.password.noSpecialChar'),
        [PasswordErrorKey.ContainsPersonalData]: t('validation.password.containsPersonalData'),
        [PasswordErrorKey.CommonPassword]: t('validation.password.commonPassword'),
    },
}));

const { handleSubmit, defineField, errors } = useForm({
    validationSchema: toTypedSchema(forgotPasswordSchema.value),
});

const [email] = defineField('email');

const onSubmit = handleSubmit(async (values) => {
    clearMessages();

    try {
        await forgotPassword(values.email, 'http://localhost:5173/reset-password');
    } catch (err) {
        console.error('Forgot password failed:', err);
    }
});
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card class="w-full max-w-md shadow-xl">
            <template #title>
                <div class="text-center">
                    <i class="pi pi-lock text-4xl text-primary-600 mb-3"></i>
                    <h2 class="text-3xl font-bold text-gray-900">Reset password</h2>
                    <p class="mt-2 text-sm text-gray-600">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>
            </template>

            <template #content>
                <form @submit="onSubmit" class="space-y-6">
                    <Message v-if="successMessage" severity="success" :closable="false">
                        {{ successMessage }}
                    </Message>

                    <Message v-if="error" severity="error" :closable="false">
                        {{ error }}
                    </Message>

                    <div class="flex flex-col gap-2">
                        <label for="email" class="font-semibold text-gray-700">Email address</label>
                        <InputText id="email" v-model="email" type="email" placeholder="your.email@example.com"
                            :invalid="!!errors.email" class="w-full" />
                        <small v-if="errors.email" class="text-red-600">{{ errors.email }}</small>
                    </div>

                    <Button type="submit" :loading="isLoading" :label="isLoading ? 'Sending...' : 'Send reset link'"
                        icon="pi pi-send" class="w-full" size="large" />

                    <div class="text-center">
                        <router-link to="/login"
                            class="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-2">
                            <i class="pi pi-arrow-left"></i>
                            Back to login
                        </router-link>
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>