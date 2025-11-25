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

const resetPasswordSchema = useResetPasswordValidation(
    {
        token: {
            required: t('validation.token.required'),
        },
        password: {
            minLength: t('validation.password.minLength'),
            notStrong: t('validation.password.notStrong'),
            mismatch: t('validation.password.mismatch'),
        },
    },
    {
        tooShort: t('validation.password.tooShort'),
        noUppercase: t('validation.password.noUppercase'),
        noLowercase: t('validation.password.noLowercase'),
        noNumber: t('validation.password.noNumber'),
        noSpecialChar: t('validation.password.noSpecialChar'),
        containsPersonalData: t('validation.password.containsPersonalData'),
    }
);


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
            <div>
                <label for="newPassword" class="block mb-3 font-bold">{{
                    $t("login.newPassword")
                }}</label>
                <IconField>
                    <InputIcon class="pi pi-key" />
                    <Password id="newPassword" type="password" :placeholder="$t('login.password')" v-model="newPassword"
                        v-bind="newPasswordAttrs" toggle-mask :feedback="true" autocomplete="off" fluid />
                </IconField>
                <div v-if="errors.newPassword" class="font-bold text-red-600">
                    {{ errors.newPassword }}
                </div>
            </div>
            <div class="mt-4">
                <label for="confirmPassword" class="block mb-3 font-bold">{{
                    $t("login.confirmPassword")
                }}</label>
                <IconField>
                    <InputIcon class="pi pi-key" />
                    <Password id="confirmPassword" type="password" :placeholder="$t('login.confirmPassword')"
                        v-model="confirmPassword" v-bind="confirmPasswordAttrs" toggle-mask :feedback="false"
                        autocomplete="off" fluid />
                </IconField>
                <div v-if="errors.confirmPassword" class="font-bold text-red-600">
                    {{ errors.confirmPassword }}
                </div>
            </div>
            <Button class="mt-8" :disabled="isLoading" type="submit" severity="secondary"
                :label="isLoading ? 'Loading...' : 'Login'" fluid />
        </form>
    </div>
</template>