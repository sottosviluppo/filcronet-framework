<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth, usePasswordStrength, useValidation } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { register, isLoading, error, clearError } = useAuth();
const { t } = useI18n();

// Create schemas with i18n
const { registerSchema } = useValidation(() => ({
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
const { handleSubmit, defineField, errors, values } = useForm({
    validationSchema: toTypedSchema(registerSchema.value),
});

const [email] = defineField('email');
const [username] = defineField('username');
const [firstName] = defineField('firstName');
const [lastName] = defineField('lastName');
const [password] = defineField('password');
const [confirmPassword] = defineField('confirmPassword');

// Password strength
const passwordRef = computed(() => ({ value: values.password || '' }));
const {
    strength,
    strengthLabel,
    strengthColor,
    errors: passwordErrors,
    progressValue
} = usePasswordStrength(passwordRef);

const strengthSeverity = computed(() => {
    if (strength.value <= 1) return 'danger';
    if (strength.value === 2) return 'warn';
    if (strength.value === 3) return 'info';
    return 'success';
});

const onSubmit = handleSubmit(async (formValues) => {
    clearError();

    try {
        await register(formValues);
        router.push('/');
    } catch (err) {
        console.error('Registration failed:', err);
    }
});
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card class="w-full max-w-2xl shadow-xl">
            <template #title>
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-900">Create your account</h2>
                    <p class="mt-2 text-sm text-gray-600">Get started by creating your account</p>
                </div>
            </template>

            <template #content>
                <form @submit="onSubmit" class="space-y-6">
                    <Message v-if="error" severity="error" :closable="false">
                        {{ error }}
                    </Message>

                    <div class="flex flex-col gap-2">
                        <label for="email" class="font-semibold text-gray-700">
                            Email address <span class="text-red-500">*</span>
                        </label>
                        <InputText id="email" v-model="email" type="email" placeholder="your.email@example.com"
                            :invalid="!!errors.email" class="w-full" />
                        <small v-if="errors.email" class="text-red-600">{{ errors.email }}</small>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="username" class="font-semibold text-gray-700">Username</label>
                            <InputText id="username" v-model="username" placeholder="username"
                                :invalid="!!errors.username" class="w-full" />
                            <small v-if="errors.username" class="text-red-600">{{ errors.username }}</small>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="firstName" class="font-semibold text-gray-700">First Name</label>
                            <InputText id="firstName" v-model="firstName" placeholder="John" class="w-full" />
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="lastName" class="font-semibold text-gray-700">Last Name</label>
                        <InputText id="lastName" v-model="lastName" placeholder="Doe" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="password" class="font-semibold text-gray-700">
                            Password <span class="text-red-500">*</span>
                        </label>
                        <Password id="password" v-model="password" toggleMask :feedback="false"
                            placeholder="Enter a strong password" :invalid="!!errors.password" class="w-full"
                            inputClass="w-full" />

                        <div v-if="password" class="space-y-2 mt-2">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-600">Password strength:</span>
                                <span :style="{ color: strengthColor }" class="font-semibold">
                                    {{ strengthLabel }}
                                </span>
                            </div>
                            <ProgressBar :value="progressValue" :showValue="false" :severity="strengthSeverity"
                                class="h-2" />

                            <ul v-if="passwordErrors.length" class="space-y-1">
                                <li v-for="(err, idx) in passwordErrors" :key="idx"
                                    class="text-xs text-red-600 flex items-start gap-1">
                                    <i class="pi pi-times-circle mt-0.5"></i>
                                    <span>{{ err }}</span>
                                </li>
                            </ul>
                        </div>

                        <small v-if="errors.password" class="text-red-600">{{ errors.password }}</small>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="confirmPassword" class="font-semibold text-gray-700">
                            Confirm Password <span class="text-red-500">*</span>
                        </label>
                        <Password id="confirmPassword" v-model="confirmPassword" :feedback="false" toggleMask
                            placeholder="Confirm your password" :invalid="!!errors.confirmPassword" class="w-full"
                            inputClass="w-full" />
                        <small v-if="errors.confirmPassword" class="text-red-600">
                            {{ errors.confirmPassword }}
                        </small>
                    </div>

                    <Button type="submit" :loading="isLoading" :label="isLoading ? 'Creating account...' : 'Sign up'"
                        icon="pi pi-user-plus" class="w-full" size="large" />

                    <div class="text-center text-sm">
                        <span class="text-gray-600">Already have an account? </span>
                        <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-700">
                            Sign in
                        </router-link>
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>