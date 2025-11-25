<script setup lang="ts">
import { useForgotPasswordValidation, usePasswordRecovery } from '@sottosviluppo/auth-frontend';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';

const { forgotPassword, error, isLoading, successMessage } = usePasswordRecovery();
const { t } = useI18n();
const forgotPasswordSchema = useForgotPasswordValidation({
    email: {
        required: t('validation.email.required'),
        invalid: t('validation.email.invalid'),
    },
});

const { errors, handleSubmit, defineField } = useForm({
    validationSchema: toTypedSchema(forgotPasswordSchema),
});
const [email, emailAttrs] = defineField("email");

const onSubmit = handleSubmit(async (values) => {
    try {
        const resetUrl = `${window.location.origin}/reset-password`;
        await forgotPassword(values.email, resetUrl);
    } catch (e) {
        console.error('Forgot password failed', e);
    }
});
</script>

<template>
    <div class="w-[50%] h-[50%]">
        <form @submit.prevent="onSubmit" class="form-container">
            <div v-if="successMessage" class="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {{ successMessage }}
            </div>
            <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {{ error }}
            </div>
            <div>
                <label for="email" class="block mb-3 font-bold">{{
                    $t("login.email")
                    }}</label>
                <IconField>
                    <InputIcon class="pi pi-envelope" />
                    <InputText id="email" autocomplete="off" :placeholder="$t('login.email')" type="email"
                        v-model.trim="email" v-bind="emailAttrs" fluid />
                </IconField>
                <div class="font-bold text-red-600">{{ errors.email }}</div>
            </div>
            <Button :disabled="isLoading" type="submit" severity="secondary"
                :label="isLoading ? 'Loading...' : 'Login'" />
            <div class="mt-4 text-center">
                <router-link to="/login" class="text-blue-600 hover:underline">
                    {{ $t('forgotPassword.backToLogin') }}
                </router-link>
            </div>
        </form>
    </div>
</template>