<script setup lang="ts">
import { usePasswordRecovery, useResetPasswordValidation } from '@sottosviluppo/auth-frontend';
import { PasswordErrorKey } from '@sottosviluppo/core';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { setPassword, validateToken, error, isLoading, successMessage } = usePasswordRecovery();
const token = route.query.token as string;
const isValidToken = ref<boolean | null>(null);

onMounted(async () => {
    if (!token) {
        isValidToken.value = false;
        return;
    }

    const result = await validateToken(token, 'invitation');
    isValidToken.value = result.valid;
});

const setPasswordSchema = useResetPasswordValidation(
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
        [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
        [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
        [PasswordErrorKey.NoLowercase]: t('validation.password.noLowercase'),
        [PasswordErrorKey.NoNumber]: t('validation.password.noNumber'),
        [PasswordErrorKey.NoSpecialChar]: t('validation.password.noSpecialChar'),
        [PasswordErrorKey.ContainsPersonalData]: t('validation.password.containsPersonalData'),
        [PasswordErrorKey.CommonPassword]: t('validation.password.commonPassword'),
    }
);


const { errors, handleSubmit, defineField } = useForm({
    validationSchema: toTypedSchema(setPasswordSchema),
    initialValues: {
        token: token,
    },
});

const [newPassword, newPasswordAttrs] = defineField("newPassword");
const [confirmPassword, confirmPasswordAttrs] = defineField("confirmPassword");

const onSubmit = handleSubmit(async (values) => {
    try {
        await setPassword(token, values.newPassword);
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
                <p>{{ $t('setPassword.validating') }}</p>
            </div>

            <div v-else-if="!isValidToken" class="text-center">
                <div class="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {{ $t('setPassword.invalidToken') }}
                </div>
            </div>
            <div v-if="successMessage" class="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {{ successMessage }}
            </div>
            <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {{ error }}
            </div>
            <div>
                <label for="newPassword" class="block mb-3 font-bold">{{
                    $t("setPassword.newPassword")
                    }}</label>
                <IconField>
                    <InputIcon class="pi pi-key" />
                    <Password id="newPassword" type="password" :placeholder="$t('setPassword.password')"
                        v-model="newPassword" v-bind="newPasswordAttrs" toggle-mask :feedback="true" autocomplete="off"
                        fluid />
                </IconField>
                <div v-if="errors.newPassword" class="font-bold text-red-600">
                    {{ errors.newPassword }}
                </div>
            </div>
            <div class="mt-4">
                <label for="confirmPassword" class="block mb-3 font-bold">{{
                    $t("setPassword.confirmPassword")
                    }}</label>
                <IconField>
                    <InputIcon class="pi pi-key" />
                    <Password id="confirmPassword" type="password" :placeholder="$t('setPassword.confirmPassword')"
                        v-model="confirmPassword" v-bind="confirmPasswordAttrs" toggle-mask :feedback="false"
                        autocomplete="off" fluid />
                </IconField>
                <div v-if="errors.confirmPassword" class="font-bold text-red-600">
                    {{ errors.confirmPassword }}
                </div>
            </div>
            <Button class="mt-8" :disabled="isLoading" type="submit" severity="secondary"
                :label="isLoading ? 'Loading...' : 'Imposta Password'" fluid />
        </form>
    </div>
</template>