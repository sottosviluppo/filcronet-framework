<script setup lang="ts">
import { usePasswordRecovery, useResetPasswordValidation } from '@sottosviluppo/auth-frontend';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { resetPassword, validateToken, error, isLoading, successMessage } = usePasswordRecovery();
const token = route.query.token as string;
const isValidToken = ref<boolean | null>(null);

onMounted(async () => {
    if (!token) {
        isValidToken.value = false;
        return;
    }

    const result = await validateToken(token, 'password_reset');
    isValidToken.value = result.valid;
});

const resetPasswordSchema = useResetPasswordValidation({
    token: {
        required: t('validation.token.required'),
    },
    password: {
        minLength: t('validation.password.minLength'),
        notStrong: t('validation.password.notStrong'),
        mismatch: t('validation.password.mismatch'),
    },
});


const { errors, handleSubmit, defineField } = useForm({
    validationSchema: toTypedSchema(resetPasswordSchema),
    initialValues: {
        token: token,
    },
});

const [newPassword, newPasswordAttrs] = defineField("newPassword");
const [confirmPassword, confirmPasswordAttrs] = defineField("confirmPassword");

const onSubmit = handleSubmit(async (values) => {
    try {
        await resetPassword(token, values.newPassword);
        setTimeout(() => {
            router.push('/login');
        }, 2000);
    } catch (e) {
        console.error('Forgot password failed', e);
    }
});
</script>

<template>
    <div class="w-[50%] h-[50%]">
        <form @submit.prevent="onSubmit" class="form-container">
            <div v-if="isValidToken === null" class="text-center">
                <p>{{ $t('resetPassword.validating') }}</p>
            </div>

            <div v-else-if="!isValidToken" class="text-center">
                <div class="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {{ $t('resetPassword.invalidToken') }}
                </div>
                <router-link to="/forgot-password" class="text-blue-600 hover:underline">
                    {{ $t('resetPassword.requestNewLink') }}
                </router-link>
            </div>
            <div v-if="successMessage" class="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {{ successMessage }}
            </div>
            <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {{ error }}
            </div>
            <Button :disabled="isLoading" type="submit" severity="secondary"
                :label="isLoading ? 'Loading...' : 'Login'" />
        </form>
    </div>
</template>