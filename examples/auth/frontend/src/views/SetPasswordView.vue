<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePasswordRecovery, usePasswordStrength, useValidation } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const router = useRouter();
const { setPassword, validateToken, isLoading, error, successMessage, clearMessages } = usePasswordRecovery();
const { t } = useI18n();

const tokenValid = ref<boolean | null>(null);
const userEmail = ref<string | null>(null);

// Create schemas with i18n
const { setPasswordSchema } = useValidation(() => ({
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
const { handleSubmit, defineField, errors, values, setFieldValue } = useForm({
    validationSchema: toTypedSchema(setPasswordSchema.value),
});

const [token] = defineField('token');
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

onMounted(async () => {
    const tokenParam = route.query.token as string || '';
    setFieldValue('token', tokenParam);

    if (tokenParam) {
        const result = await validateToken(tokenParam, 'invitation');
        tokenValid.value = result.valid;
        userEmail.value = result.email || null;
    } else {
        tokenValid.value = false;
    }
});

const onSubmit = handleSubmit(async (formValues) => {
    clearMessages();

    try {
        await setPassword(formValues.token, formValues.password);

        setTimeout(() => {
            router.push('/login');
        }, 2000);
    } catch (err) {
        console.error('Set password failed:', err);
    }
});
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card class="w-full max-w-md shadow-xl">
            <template #title>
                <div class="text-center">
                    <i class="pi pi-user-plus text-4xl text-primary-600 mb-3"></i>
                    <h2 class="text-3xl font-bold text-gray-900">Set your password</h2>
                    <p v-if="userEmail" class="mt-2 text-sm text-gray-600">
                        Welcome! Set a password for: <strong>{{ userEmail }}</strong>
                    </p>
                </div>
            </template>

            <template #content>
                <!-- Invalid Token -->
                <div v-if="tokenValid === false">
                    <Message severity="error" :closable="false" class="mb-4">
                        <strong>Invalid or expired invitation link</strong>
                        <p class="mt-1">This invitation link is invalid or has expired.</p>
                        <p class="mt-1">Please contact your administrator.</p>
                    </Message>
                </div>

                <!-- Loading -->
                <div v-else-if="tokenValid === null" class="text-center py-8">
                    <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                    <p class="mt-4 text-sm text-gray-600">Validating invitation...</p>
                </div>

                <!-- Set Password Form -->
                <form v-else @submit="onSubmit" class="space-y-6">
                    <!-- Success Message -->
                    <Message v-if="successMessage" severity="success" :closable="false">
                        {{ successMessage }}
                        <p class="mt-1 text-sm">Redirecting to login...</p>
                    </Message>

                    <!-- Error Message -->
                    <Message v-if="error" severity="error" :closable="false">
                        {{ error }}
                    </Message>

                    <!-- Password -->
                    <div class="flex flex-col gap-2">
                        <label for="password" class="font-semibold text-gray-700">
                            Password <span class="text-red-500">*</span>
                        </label>
                        <Password id="password" v-model="password" toggleMask :feedback="false"
                            placeholder="Enter a strong password" :invalid="!!errors.password" class="w-full"
                            inputClass="w-full" />

                        <!-- Password Strength -->
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

                        <small v-if="errors.password" class="text-red-600">
                            {{ errors.password }}
                        </small>
                    </div>

                    <!-- Confirm Password -->
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

                    <!-- Submit Button -->
                    <Button type="submit" :loading="isLoading" :disabled="!!successMessage"
                        :label="isLoading ? 'Setting password...' : successMessage ? 'Success!' : 'Set password'"
                        icon="pi pi-check" class="w-full" size="large" />
                </form>
            </template>
        </Card>
    </div>
</template>