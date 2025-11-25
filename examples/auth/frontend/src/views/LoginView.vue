<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth, useValidation } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { login, isLoading, error, clearError } = useAuth();
const { t } = useI18n();

// Create schemas with i18n
const { loginSchema } = useValidation(() => ({
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

// Setup VeeValidate
const { handleSubmit, defineField, errors } = useForm({
    validationSchema: toTypedSchema(loginSchema.value),
});

const [email] = defineField('email');
const [password] = defineField('password');

const onSubmit = handleSubmit(async (values) => {
    clearError();

    try {
        await login(values);
        router.push('/');
    } catch (err) {
        console.error('Login failed:', err);
    }
});
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card class="w-full max-w-md shadow-xl">
            <template #title>
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-900">Sign in</h2>
                    <p class="mt-2 text-sm text-gray-600">Welcome back!</p>
                </div>
            </template>

            <template #content>
                <form @submit="onSubmit" class="space-y-6">
                    <Message v-if="error" severity="error" :closable="false">
                        {{ error }}
                    </Message>

                    <div class="flex flex-col gap-2">
                        <label for="email" class="font-semibold text-gray-700">Email address</label>
                        <InputText id="email" v-model="email" type="email" placeholder="Enter your email"
                            :invalid="!!errors.email" class="w-full" autocomplete="email" />
                        <small v-if="errors.email" class="text-red-600">{{ errors.email }}</small>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="password" class="font-semibold text-gray-700">Password</label>
                        <Password id="password" v-model="password" :feedback="false" toggleMask
                            placeholder="Enter your password" :invalid="!!errors.password" class="w-full"
                            inputClass="w-full" autocomplete="current-password" />
                        <small v-if="errors.password" class="text-red-600">{{ errors.password }}</small>
                    </div>

                    <div class="text-right">
                        <router-link to="/forgot-password"
                            class="text-sm font-medium text-primary-600 hover:text-primary-700">
                            Forgot your password?
                        </router-link>
                    </div>

                    <Button type="submit" :loading="isLoading" :label="isLoading ? 'Signing in...' : 'Sign in'"
                        icon="pi pi-sign-in" class="w-full" size="large" />

                    <div class="text-center text-sm">
                        <span class="text-gray-600">Don't have an account? </span>
                        <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-700">
                            Sign up
                        </router-link>
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>